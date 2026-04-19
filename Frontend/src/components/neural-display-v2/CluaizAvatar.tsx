"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function CluaizAvatar() {

  const bodyRef = useRef<THREE.Mesh>(null);
  const sparkleRef = useRef<THREE.Mesh>(null);

  // Blob geometry create
  const blobGeometry = useMemo(() => {

    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {

      let x = position.getX(i);
      let y = position.getY(i);
      let z = position.getZ(i);

      // horizontal stretch
      x *= 1.35;

      // flatten bottom
      if (y < 0) y *= 0.75;

      // cheeks
      if (Math.abs(x) > 0.55 && y > -0.2 && y < 0.35) {
        x *= 1.18;
      }

      // soften top
      if (y > 0.7) {
        y *= 0.92;
      }

      position.setXYZ(i, x, y, z);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;

  }, []);

  // animation loop
  useFrame((state) => {

    const time = state.clock.getElapsedTime();

    // breathing animation
    if (bodyRef.current) {

      const breath = 1 + Math.sin(time * 1.5) * 0.03;

      bodyRef.current.scale.set(
        1.3 * breath,
        1 * breath,
        1 * breath
      );
    }

    // sparkle rotation
    if (sparkleRef.current) {
      sparkleRef.current.rotation.z += 0.02;
    }

  });

  return (
    <group>

      {/* BODY */}
      {/* <mesh ref={bodyRef} geometry={blobGeometry}> */}
      <mesh  geometry={blobGeometry}>

        <meshPhysicalMaterial
          color="#f4f7ff"
          roughness={0.35}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#6ea8ff"
          emissiveIntensity={0.3}
        />

      </mesh>


      {/* LEFT EYE */}
      <mesh position={[-0.32, 0.05, 0.95]}>

        <sphereGeometry args={[0.13, 32, 32]} />

        <meshPhysicalMaterial
          color="#05070f"
          roughness={0.05}
          metalness={0.6}
          clearcoat={1}
        />

      </mesh>


      {/* RIGHT EYE */}
      <mesh position={[0.32, 0.05, 0.95]}>

        <sphereGeometry args={[0.13, 32, 32]} />

        <meshPhysicalMaterial
          color="#05070f"
          roughness={0.05}
          metalness={0.6}
          clearcoat={1}
        />

      </mesh>


    
    </group>
  );
}