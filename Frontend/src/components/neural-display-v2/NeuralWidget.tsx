"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ContactShadows } from "@react-three/drei";
import CluaizAvatar from "./CluaizAvatar";

export default function NeuralWidget() {

  return (

    <div style={{ width: "100%", height: "100%", background: "transparent" }}>

      <Canvas
        camera={{ position: [0,0.05,4], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
      >

        {/* LIGHTING */}

        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5,4,5]}
          intensity={1}
        />

        <pointLight
          position={[0,2,3]}
          intensity={1.2}
          color="#8ec5ff"
        />

        <Suspense fallback={null}>

          <CluaizAvatar />

          <ContactShadows
            position={[0,-1.1,0]}
            opacity={0.3}
            scale={3}
            blur={2.5}
            far={2}
          />

        </Suspense>

      </Canvas>

    </div>

  );
}