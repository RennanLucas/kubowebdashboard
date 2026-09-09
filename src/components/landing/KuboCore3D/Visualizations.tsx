import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface VisualizationsProps {
  scrollProgress: number;
}

export function Visualizations({ scrollProgress }: VisualizationsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Determine current visualization state
  let state = 'hidden';
  if (scrollProgress > 0.4 && scrollProgress <= 0.5) state = 'visitors-chart';
  else if (scrollProgress > 0.5 && scrollProgress <= 0.6) state = 'geo-map';
  else if (scrollProgress > 0.6 && scrollProgress <= 0.7) state = 'pages-list';

  useFrame(() => {
    if (!groupRef.current) return;

    // Fade in/out based on state
    if (state === 'hidden') {
      groupRef.current.visible = false;
    } else {
      groupRef.current.visible = true;
    }
  });

  return (
    <group ref={groupRef}>
      {state === 'visitors-chart' && <VisitorsChart scrollProgress={scrollProgress} />}
      {state === 'geo-map' && <GeoMap scrollProgress={scrollProgress} />}
      {state === 'pages-list' && <PagesList scrollProgress={scrollProgress} />}
    </group>
  );
}

// VISITORS CHART
function VisitorsChart({ scrollProgress }: { scrollProgress: number }) {
  const linesRef = useRef<THREE.Group>(null);

  // Chart data points
  const chartData = useMemo(() => [
    0.3, 0.5, 0.4, 0.8, 0.6, 0.9, 1.0, 0.7, 0.85, 0.95
  ], []);

  const points = useMemo(() => {
    return chartData.map((value, i) => {
      const x = (i - chartData.length / 2) * 0.4;
      const y = value * 2 - 1;
      return new THREE.Vector3(x, y, 0);
    });
  }, [chartData]);

  useFrame(() => {
    if (!linesRef.current) return;

    // Animate drawing progress
    const drawProgress = Math.min(1, (scrollProgress - 0.4) / 0.05);
    linesRef.current.scale.x = drawProgress;
  });

  return (
    <group ref={linesRef} position={[0, 0, 2]}>
      {/* Chart line */}
      <Line
        points={points}
        color="#3B82F6"
        lineWidth={3}
        transparent
        opacity={0.8}
      />

      {/* Data points */}
      {points.map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#3B82F6"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Line
          key={`grid-${i}`}
          points={[
            new THREE.Vector3(-2, i * 0.5 - 1, 0),
            new THREE.Vector3(2, i * 0.5 - 1, 0)
          ]}
          color="#374151"
          lineWidth={1}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  );
}

// GEO MAP (transforms from chart)
function GeoMap({ scrollProgress }: { scrollProgress: number }) {
  const mapRef = useRef<THREE.Group>(null);

  // Geographic points
  const geoPoints = useMemo(() => [
    { x: -1.5, y: 0.8, z: 0, city: 'São Paulo', value: 234 },
    { x: -0.8, y: 1.2, z: 0, city: 'New York', value: 189 },
    { x: 1.2, y: 0.9, z: 0, city: 'London', value: 156 },
    { x: 0.3, y: -0.5, z: 0, city: 'Tokyo', value: 98 },
    { x: -0.2, y: 0.2, z: 0, city: 'Berlin', value: 76 },
  ], []);

  useFrame(() => {
    if (!mapRef.current) return;

    // Morph progress from chart to map
    const morphProgress = Math.min(1, (scrollProgress - 0.5) / 0.05);
    mapRef.current.scale.setScalar(0.5 + morphProgress * 0.5);
  });

  return (
    <group ref={mapRef} position={[0, 0, 2]}>
      {/* World map outline (simplified) */}
      <mesh>
        <planeGeometry args={[4, 2.5]} />
        <meshBasicMaterial
          color="#1F2937"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Geographic points */}
      {geoPoints.map((point, i) => (
        <group key={i} position={[point.x, point.y, point.z]}>
          {/* Point marker */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#10B981"
              emissive="#10B981"
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Ripple effect */}
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 32]} />
            <meshBasicMaterial
              color="#10B981"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Connecting line to center */}
          <Line
            points={[
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(-point.x * 0.5, -point.y * 0.5, 0)
            ]}
            color="#10B981"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        </group>
      ))}
    </group>
  );
}

// PAGES LIST (transforms from map)
function PagesList({ scrollProgress }: { scrollProgress: number }) {
  const listRef = useRef<THREE.Group>(null);

  const pages = useMemo(() => [
    { path: '/pricing', views: 1284, color: '#8B5CF6' },
    { path: '/features', views: 847, color: '#3B82F6' },
    { path: '/about', views: 623, color: '#10B981' },
    { path: '/blog', views: 412, color: '#F59E0B' },
  ], []);

  useFrame(() => {
    if (!listRef.current) return;

    // Transform from map to list
    const transformProgress = Math.min(1, (scrollProgress - 0.6) / 0.05);
    listRef.current.position.z = 2 + transformProgress * 0.5;
  });

  return (
    <group ref={listRef} position={[0, 0, 2]}>
      {pages.map((page, i) => (
        <group key={i} position={[0, 1.5 - i * 0.8, 0]}>
          {/* Page bar */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[page.views / 500, 0.2, 0.1]} />
            <meshStandardMaterial
              color={page.color}
              emissive={page.color}
              emissiveIntensity={0.2}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Page label */}
          <Text
            position={[-1.8, 0, 0.1]}
            fontSize={0.15}
            color="#E5E7EB"
            anchorX="left"
            anchorY="middle"
          >
            {page.path}
          </Text>

          {/* Views count */}
          <Text
            position={[1.8, 0, 0.1]}
            fontSize={0.12}
            color="#9CA3AF"
            anchorX="right"
            anchorY="middle"
          >
            {page.views}
          </Text>
        </group>
      ))}
    </group>
  );
}
