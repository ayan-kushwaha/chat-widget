"use client";

import { useRef } from "react";
import * as THREE from "three";

export default function CluaizAvatar() {

  const bodyRef = useRef<THREE.Mesh>(null);

  return (
    <group>

      {/* BODY */}
      <mesh ref={bodyRef} scale={[1.45,1.0,0.85]}>

        {/* blob geometry */}
        <sphereGeometry args={[1,128,128]} />

        <meshStandardMaterial
          color="#f5f8ff"
          roughness={0.35}
          metalness={0.05}
          emissive="#6ea8ff"
          emissiveIntensity={0.25}
        />

      </mesh>

      {/* LEFT EYE */}
      <mesh position={[-0.38,0.08,0.88]}>
        <sphereGeometry args={[0.14,32,32]} />
        <meshPhysicalMaterial
          color="#06080f"
          roughness={0.1}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* RIGHT EYE */}
      <mesh position={[0.38,0.08,0.88]}>
        <sphereGeometry args={[0.14,32,32]} />
        <meshPhysicalMaterial
          color="#06080f"
          roughness={0.1}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* SPARKLE */}
      <mesh position={[0.9,0.7,0.3]}>
        <octahedronGeometry args={[0.1]} />
        <meshStandardMaterial
          color="white"
          emissive="white"
          emissiveIntensity={3}
        />
      </mesh>

    </group>
  );
}