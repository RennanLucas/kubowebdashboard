import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface DataOrbitalsProps {
  scrollProgress: number;
}

export function DataOrbitals({ scrollProgress }: DataOrbitalsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Define orbital data elements
  const dataElements = useMemo(() => [
    { label: '1,284', sublabel: 'Visitors', angle: 0, radius: 3.5, color: '#3B82F6' },
    { label: '847', sublabel: 'Pageviews', angle: Math.PI * 0.5, radius: 3.8, color: '#8B5CF6' },
    { label: '67%', sublabel: 'Mobile', angle: Math.PI, radius: 3.6, color: '#EC4899' },
    { label: '12', sublabel: 'Events', angle: Math.PI * 1.5, radius: 3.7, color: '#10B981' },
  ], []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Determine visibility based on scroll
    let visible = true;
    let speed = 1;

    if (scrollProgress < 0.1) {
      // INTRO: slow orbit
      visible = true;
      speed = 0.5;
    } else if (scrollProgress > 0.1 && scrollProgress <= 0.3) {
      // APPROACH/ROTATION: accelerate
      visible = true;
      speed = 1 + (scrollProgress - 0.1) * 5;
    } else if (scrollProgress > 0.3 && scrollProgress <= 0.4) {
      // OPEN: start fading
      visible = true;
      speed = 2;
    } else if (scrollProgress > 0.4 && scrollProgress <= 0.7) {
      // VISITORS/GEO/PAGES: hidden (transforming into visualizations)
      visible = false;
    } else if (scrollProgress > 0.7 && scrollProgress <= 0.85) {
      // JOURNEY: fragments rushing
      visible = true;
      speed = 10;
    } else {
      // REORG/DASHBOARD: fade out
      visible = false;
    }

    groupRef.current.visible = visible;
    groupRef.current.rotation.y = time * speed * 0.2;

    // Journey phase: expand outward
    if (scrollProgress > 0.7 && scrollProgress <= 0.85) {
      const expansion = (scrollProgress - 0.7) / 0.15;
      groupRef.current.scale.setScalar(1 + expansion * 3);
    } else if (groupRef.current.scale.x > 1) {
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1));
    }
  });

  return (
    <group ref={groupRef}>
      {dataElements.map((elem, i) => (
        <DataCard
          key={i}
          label={elem.label}
          sublabel={elem.sublabel}
          angle={elem.angle}
          radius={elem.radius}
          color={elem.color}
        />
      ))}
    </group>
  );
}

interface DataCardProps {
  label: string;
  sublabel: string;
  angle: number;
  radius: number;
  color: string;
}

function DataCard({ label, sublabel, angle, radius, color }: DataCardProps) {
  const cardRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!cardRef.current) return;

    // Position in orbit
    cardRef.current.position.x = Math.cos(angle) * radius;
    cardRef.current.position.z = Math.sin(angle) * radius;
    cardRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5 + angle) * 0.3;

    // Always face camera
    cardRef.current.lookAt(0, 0, 0);
  });

  return (
    <group ref={cardRef}>
      {/* Card background */}
      <RoundedBox args={[0.8, 0.4, 0.05]} radius={0.05}>
        <meshStandardMaterial
          color="#1F2937"
          transparent
          opacity={0.8}
          metalness={0.2}
          roughness={0.8}
        />
      </RoundedBox>

      {/* Main label */}
      <Text
        position={[0, 0.08, 0.03]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {label}
      </Text>

      {/* Sublabel */}
      <Text
        position={[0, -0.08, 0.03]}
        fontSize={0.06}
        color="#9CA3AF"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {sublabel}
      </Text>

      {/* Accent dot */}
      <mesh position={[0, 0, 0.026]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
