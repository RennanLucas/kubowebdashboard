import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface EventsSystemProps {
  scrollProgress: number;
}

export function EventsSystem({ scrollProgress }: EventsSystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Event types
  const events = useMemo(() => [
    { name: 'CLICK', color: '#3B82F6', angle: 0 },
    { name: 'PAGEVIEW', color: '#8B5CF6', angle: Math.PI * 0.4 },
    { name: 'SCROLL', color: '#10B981', angle: Math.PI * 0.8 },
    { name: 'SESSION', color: '#F59E0B', angle: Math.PI * 1.2 },
    { name: 'EVENT', color: '#EC4899', angle: Math.PI * 1.6 },
  ], []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Visible during events phase and journey
    if (scrollProgress > 0.7 && scrollProgress <= 0.85) {
      groupRef.current.visible = true;

      // During journey: expand and rotate fast
      const journeyProgress = (scrollProgress - 0.75) / 0.1;
      const expansion = 1 + journeyProgress * 4;
      groupRef.current.scale.setScalar(expansion);
      groupRef.current.rotation.y = time * 3;
      groupRef.current.rotation.x = time * 2;
    } else if (scrollProgress > 0.68 && scrollProgress <= 0.7) {
      // Events phase: normal orbit
      groupRef.current.visible = true;
      groupRef.current.rotation.y = time * 0.5;

      if (groupRef.current.scale.x > 1) {
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1));
      }
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      {events.map((event, i) => (
        <EventBadge
          key={i}
          name={event.name}
          color={event.color}
          angle={event.angle}
          index={i}
        />
      ))}
    </group>
  );
}

interface EventBadgeProps {
  name: string;
  color: string;
  angle: number;
  index: number;
}

function EventBadge({ name, color, angle, index }: EventBadgeProps) {
  const badgeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!badgeRef.current) return;

    const time = clock.getElapsedTime();
    const radius = 3;

    // Orbit position
    badgeRef.current.position.x = Math.cos(angle + time * 0.5) * radius;
    badgeRef.current.position.y = Math.sin(time * 0.3 + index) * 0.5;
    badgeRef.current.position.z = Math.sin(angle + time * 0.5) * radius;

    // Look at camera
    badgeRef.current.lookAt(0, 0, 0);
  });

  return (
    <group ref={badgeRef}>
      {/* Badge background */}
      <RoundedBox args={[0.6, 0.25, 0.05]} radius={0.05}>
        <meshStandardMaterial
          color="#111827"
          transparent
          opacity={0.9}
          metalness={0.3}
          roughness={0.7}
        />
      </RoundedBox>

      {/* Accent border */}
      <RoundedBox args={[0.62, 0.27, 0.04]} radius={0.05}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          wireframe
        />
      </RoundedBox>

      {/* Event name */}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.08}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Glow dot */}
      <mesh position={[-0.25, 0, 0.03]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
