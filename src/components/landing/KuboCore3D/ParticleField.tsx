import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  scrollProgress: number;
}

export function ParticleField({ count = 3000, scrollProgress }: ParticleFieldProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Generate particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random position in a large sphere
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random velocities for animation
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { positions, velocities };
  }, [count]);

  // Animate particles
  useFrame((state) => {
    if (!particlesRef.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = particlesRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;

    // JOURNEY phase (75-85%): particles rush towards camera
    if (scrollProgress >= 0.75 && scrollProgress < 0.85) {
      const progress = (scrollProgress - 0.75) / 0.1;

      for (let i = 0; i < count; i++) {
        // Pull particles towards camera (negative Z)
        positions[i * 3 + 2] -= progress * 2;

        // Wrap particles that go behind camera
        if (positions[i * 3 + 2] < -10) {
          positions[i * 3 + 2] = 50;
        }
      }
    } else {
      // Normal gentle drift
      for (let i = 0; i < count; i++) {
        positions[i * 3] += particles.velocities[i * 3];
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2];

        // Keep particles within bounds
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);

        if (distance > 50) {
          positions[i * 3] *= 0.98;
          positions[i * 3 + 1] *= 0.98;
          positions[i * 3 + 2] *= 0.98;
        }
      }
    }

    geometry.attributes.position.needsUpdate = true;

    // Rotate entire field slowly
    particlesRef.current.rotation.y = time * 0.05;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
