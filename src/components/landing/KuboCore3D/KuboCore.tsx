import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface KuboCoreProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

export function KuboCore({ scrollProgress, mousePosition }: KuboCoreProps) {
  const coreGroupRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Animate based on time and scroll
  useFrame(({ clock }) => {
    if (!coreGroupRef.current) return;

    const time = clock.getElapsedTime();

    // Determine current section
    let phase = 'intro'; // 0-0.1
    if (scrollProgress > 0.1 && scrollProgress <= 0.2) phase = 'approach';
    else if (scrollProgress > 0.2 && scrollProgress <= 0.3) phase = 'rotation';
    else if (scrollProgress > 0.3 && scrollProgress <= 0.4) phase = 'open';
    else if (scrollProgress > 0.4 && scrollProgress <= 0.5) phase = 'visitors';
    else if (scrollProgress > 0.5 && scrollProgress <= 0.6) phase = 'geo';
    else if (scrollProgress > 0.6 && scrollProgress <= 0.7) phase = 'pages';
    else if (scrollProgress > 0.7 && scrollProgress <= 0.85) phase = 'journey';
    else if (scrollProgress > 0.85 && scrollProgress <= 0.95) phase = 'reorg';
    else if (scrollProgress > 0.95) phase = 'dashboard';

    // Mouse interaction (subtle tilt)
    const targetRotX = mousePosition.y * 0.1;
    const targetRotY = mousePosition.x * 0.1;
    coreGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      coreGroupRef.current.rotation.x,
      targetRotX,
      0.05
    );
    coreGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      coreGroupRef.current.rotation.y,
      targetRotY,
      0.05
    );

    // Inner core pulse
    if (innerCoreRef.current) {
      const pulse = Math.sin(time * 0.8) * 0.03 + 1;
      innerCoreRef.current.scale.setScalar(pulse);
    }

    // Ring rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.3;
      ring1Ref.current.rotation.y = time * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -time * 0.25;
      ring2Ref.current.rotation.z = time * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = time * 0.35;
      ring3Ref.current.rotation.z = -time * 0.2;
    }

    // Phase-specific animations
    if (phase === 'open' || phase === 'visitors') {
      // Layers separate
      const separation = THREE.MathUtils.lerp(0, 2, (scrollProgress - 0.3) / 0.1);
      if (ring1Ref.current) ring1Ref.current.position.z = separation * 0.5;
      if (ring2Ref.current) ring2Ref.current.position.z = separation;
      if (ring3Ref.current) ring3Ref.current.position.z = separation * 1.5;
    } else {
      // Reset positions
      if (ring1Ref.current) ring1Ref.current.position.z = THREE.MathUtils.lerp(ring1Ref.current.position.z, 0, 0.1);
      if (ring2Ref.current) ring2Ref.current.position.z = THREE.MathUtils.lerp(ring2Ref.current.position.z, 0, 0.1);
      if (ring3Ref.current) ring3Ref.current.position.z = THREE.MathUtils.lerp(ring3Ref.current.position.z, 0, 0.1);
    }

    // Fade out during dashboard phase
    if (phase === 'dashboard') {
      const fadeProgress = (scrollProgress - 0.95) / 0.05;
      coreGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(1, 0, fadeProgress));
    } else if (coreGroupRef.current.scale.x < 1) {
      coreGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(coreGroupRef.current.scale.x, 1, 0.1));
    }

    // Glow intensity
    if (glowRef.current && glowRef.current.material) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(time * 0.5) * 0.05;
    }
  });

  return (
    <group ref={coreGroupRef}>
      {/* Inner glow sphere (backside material) */}
      <Sphere ref={glowRef} args={[1.2, 32, 32]}>
        <meshBasicMaterial
          color="#6C3CE1"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Core nucleus - icosahedron */}
      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color="#6C3CE1"
          metalness={0.8}
          roughness={0.2}
          emissive="#6C3CE1"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Orbital ring 1 */}
      <Torus ref={ring1Ref} args={[1.5, 0.02, 16, 100]}>
        <meshStandardMaterial
          color="#8B5CF6"
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </Torus>

      {/* Orbital ring 2 */}
      <Torus ref={ring2Ref} args={[2.0, 0.025, 16, 100]}>
        <meshStandardMaterial
          color="#A78BFA"
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={0.5}
        />
      </Torus>

      {/* Orbital ring 3 */}
      <Torus ref={ring3Ref} args={[2.5, 0.03, 16, 100]}>
        <meshStandardMaterial
          color="#C4B5FD"
          metalness={0.5}
          roughness={0.5}
          transparent
          opacity={0.4}
        />
      </Torus>
    </group>
  );
}
