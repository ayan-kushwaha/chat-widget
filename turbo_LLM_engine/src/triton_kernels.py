import torch
import triton
import triton.language as tl

@triton.autotune(
    configs=[
        triton.Config({'BLOCK_SIZE_M': 128, 'BLOCK_SIZE_N': 128, 'BLOCK_SIZE_K': 32, 'GROUP_SIZE_M': 8}, num_stages=3, num_warps=8),
        triton.Config({'BLOCK_SIZE_M': 64, 'BLOCK_SIZE_N': 64, 'BLOCK_SIZE_K': 32, 'GROUP_SIZE_M': 8}, num_stages=4, num_warps=4),
    ],
    key=['M', 'N', 'K'],
)
@triton.jit
def awq_gemm_kernel(
    # Pointers to matrices
    a_ptr, b_ptr, c_ptr,
    scales_ptr, zeros_ptr,
    # Matrix dimensions
    M, N, K,
    # Strides
    stride_am, stride_ak,
    stride_bn, stride_bk,
    stride_cm, stride_cn,
    # Meta-parameters
    BLOCK_SIZE_M: tl.constexpr, BLOCK_SIZE_N: tl.constexpr, BLOCK_SIZE_K: tl.constexpr,
    GROUP_SIZE_M: tl.constexpr,
):
    """
    Fused AWQ GEMM Kernel:
    A: [M, K] (FP16)
    B: [K/8, N] (Packed INT32) -> [K, N] (INT4)
    C: [M, N] (FP16)
    """
    pid = tl.program_id(0)
    num_pid_m = tl.cdiv(M, BLOCK_SIZE_M)
    num_pid_n = tl.cdiv(N, BLOCK_SIZE_N)
    pid_m = pid % num_pid_m
    pid_n = (pid // num_pid_m) % num_pid_n

    # Tiling logic
    offs_am = (pid_m * BLOCK_SIZE_M + tl.arange(0, BLOCK_SIZE_M)) % M
    offs_bn = (pid_n * BLOCK_SIZE_N + tl.arange(0, BLOCK_SIZE_N)) % N
    offs_k = tl.arange(0, BLOCK_SIZE_K)
    a_ptrs = a_ptr + (offs_am[:, None] * stride_am + offs_k[None, :] * stride_ak)
    b_ptrs = b_ptr + ((offs_k[:, None] // 8) * stride_bk + offs_bn[None, :] * stride_bn)

    accumulator = tl.zeros((BLOCK_SIZE_M, BLOCK_SIZE_N), dtype=tl.float32)
    for k in range(0, tl.cdiv(K, BLOCK_SIZE_K)):
        a = tl.load(a_ptrs)
        b_packed = tl.load(b_ptrs)
        
        # Dequantization logic (Fused)
        # AWQ: 8 elements per int32
        shift = (offs_k % 8) * 4
        b_unpacked = (b_packed >> shift[:, None]) & 0xF
        
        # Load scales and zeros
        # Simplified: one scale per column for this block
        scale = tl.load(scales_ptr + offs_bn)
        zero = tl.load(zeros_ptr + offs_bn)
        
        b = (b_unpacked.to(tl.float16) - zero.to(tl.float16)) * scale.to(tl.float16)
        
        accumulator += tl.dot(a, b)
        a_ptrs += BLOCK_SIZE_K * stride_ak
        b_ptrs += (BLOCK_SIZE_K // 8) * stride_bk

    c = accumulator.to(tl.float16)
    
    # Store result
    offs_cm = pid_m * BLOCK_SIZE_M + tl.arange(0, BLOCK_SIZE_M)
    offs_cn = pid_n * BLOCK_SIZE_N + tl.arange(0, BLOCK_SIZE_N)
    c_ptrs = c_ptr + stride_cm * offs_cm[:, None] + stride_cn * offs_cn[None, :]
    tl.store(c_ptrs, c)

def triton_awq_matmul(a, b_packed, scales, zeros):
    M, K = a.shape
    _, N = b_packed.shape
    K_orig = K # Original K before packing
    
    c = torch.empty((M, N), device=a.device, dtype=torch.float16)
    
    grid = lambda META: (
        triton.cdiv(M, META['BLOCK_SIZE_M']) * triton.cdiv(N, META['BLOCK_SIZE_N']),
    )

    awq_gemm_kernel[grid](
        a, b_packed, c,
        scales, zeros,
        M, N, K,
        a.stride(0), a.stride(1),
        b_packed.stride(1), b_packed.stride(0), # Row-major pack
        c.stride(0), c.stride(1)
    )
    return c
