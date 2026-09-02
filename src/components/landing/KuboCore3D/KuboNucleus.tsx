import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface KuboNucleusProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

export function KuboNucleus({ scrollProgress, mousePosition }: KuboNucleusProps) {
  const nucleusRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Orbital rings data
  const orbitalRings = useMemo(() => [
    { radius: 1.5, rotation: 0, speed: 0.0005 },
    { radius: 2.0, rotation: Math.PI / 4, speed: -0.0003 },
    { radius: 2.5, rotation: Math.PI / 2, speed: 0.0004 },
  ], []);

  // Animate nucleus
  useFrame((state) => {
    if (!nucleusRef.current || !coreRef.current) return;

    const time = state.clock.getElapsedTime();

    // Mouse interaction - nucleus follows cursor slightly
    const targetRotationY = mousePosition.x * 0.3;
    const targetRotationX = -mousePosition.y * 0.3;

    nucleusRef.current.rotation.y = THREE.MathUtils.lerp(
      nucleusRef.current.rotation.y,
      targetRotationY,
      0.05
    );
    nucleusRef.current.rotation.x = THREE.MathUtils.lerp(
      nucleusRef.current.rotation.x,
      targetRotationX,
      0.05
    );

    // Core gentle pulse
    const pulseScale = 1 + Math.sin(time * 0.5) * 0.05;
    coreRef.current.scale.setScalar(pulseScale);

    // Scroll-based transformations
    // APPROACH phase (10-20%): grow nucleus
    if (scrollProgress >= 0.1 && scrollProgress < 0.2) {
      const progress = (scrollProgress - 0.1) / 0.1;
      const scale = 1 + progress * 0.5;
      nucleusRef.current.scale.setScalar(scale);
    }

    // OPEN phase (30-40%): separate layers
    if (scrollProgress >= 0.3 && scrollProgress < 0.4) {
      const progress = (scrollProgress - 0.3) / 0.1;
      nucleusRef.current.children.forEach((child, i) => {
        if (child !== coreRef.current) {
          const offset = (i + 1) * 0.5 * progress;
          child.position.z = offset;
        }
      });
    }

    // JOURNEY phase (75-85%): spin faster
    if (scrollProgress >= 0.75 && scrollProgress < 0.85) {
      const progress = (scrollProgress - 0.75) / 0.1;
      nucleusRef.current.rotation.y += 0.02 * progress;
      nucleusRef.current.rotation.z += 0.01 * progress;
    }

    // DASHBOARD phase (95-100%): fade out
    if (scrollProgress >= 0.95) {
      const progress = (scrollProgress - 0.95) / 0.05;
      const opacity = 1 - progress;
      nucleusRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if ('opacity' in mat) mat.opacity = opacity;
            });
          } else if ('opacity' in child.material) {
            child.material.opacity = opacity;
          }
        }
      });
    }
  });

  return (
    <group ref={nucleusRef}>
      {/* Core sphere - metallic purple */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#6C3CE1"
          metalness={0.8}
          roughness={0.2}
          emissive="#6C3CE1"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Orbital rings */}
      {orbitalRings.map((ring, i) => (
        <mesh
          key={i}
          rotation={[Math.PI / 2, 0, ring.rotation]}
        >
          <torusGeometry args={[ring.radius, 0.02, 16, 100]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}

      {/* Inner glow sphere */}
      <mesh scale={1.05}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#6C3CE1"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
