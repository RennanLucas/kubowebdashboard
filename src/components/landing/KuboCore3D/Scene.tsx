import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { KuboNucleus } from './KuboNucleus';
import { ParticleField } from './ParticleField';
import { Lights } from './Lights';

interface SceneProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

export function Scene({ scrollProgress, mousePosition }: SceneProps) {
  const { camera } = useThree();
  const cameraRef = useRef(camera);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Control camera position based on scroll
  useEffect(() => {
    const cam = cameraRef.current as THREE.PerspectiveCamera;

    // INTRO (0-10%): camera far
    if (scrollProgress < 0.1) {
      cam.position.z = 10;
      cam.position.y = 0;
    }
    // APPROACH (10-20%): camera moves closer
    else if (scrollProgress >= 0.1 && scrollProgress < 0.2) {
      const progress = (scrollProgress - 0.1) / 0.1;
      cam.position.z = 10 - progress * 5; // 10 → 5
    }
    // ROTATION (20-30%): camera orbits slightly
    else if (scrollProgress >= 0.2 && scrollProgress < 0.3) {
      const progress = (scrollProgress - 0.2) / 0.1;
      cam.position.z = 5;
      cam.position.x = Math.sin(progress * Math.PI * 0.5) * 2;
      cam.position.y = Math.sin(progress * Math.PI) * 1;
    }
    // OPEN (30-40%): camera stays close
    else if (scrollProgress >= 0.3 && scrollProgress < 0.4) {
      cam.position.z = 5;
      cam.position.x = 2;
      cam.position.y = 1;
    }
    // VISITORS/GEO/PAGES (40-70%): camera steady
    else if (scrollProgress >= 0.4 && scrollProgress < 0.7) {
      cam.position.z = 5;
      cam.position.x = 0;
      cam.position.y = 0;
    }
    // JOURNEY (75-85%): camera enters nucleus
    else if (scrollProgress >= 0.75 && scrollProgress < 0.85) {
      const progress = (scrollProgress - 0.75) / 0.1;
      cam.position.z = 5 - progress * 8; // Move forward into nucleus
      cam.position.y = progress * 2; // Rise up
      cam.fov = 50 + progress * 30; // Widen FOV for dramatic effect
      cam.updateProjectionMatrix();
    }
    // REORG (85-95%): camera exits
    else if (scrollProgress >= 0.85 && scrollProgress < 0.95) {
      const progress = (scrollProgress - 0.85) / 0.1;
      cam.position.z = -3 + progress * 8; // Pull back
      cam.position.y = 2 - progress * 2;
      cam.fov = 80 - progress * 30; // Return FOV to normal
      cam.updateProjectionMatrix();
    }
    // DASHBOARD (95-100%): camera far again
    else if (scrollProgress >= 0.95) {
      cam.position.z = 5;
      cam.position.y = 0;
      cam.position.x = 0;
      cam.fov = 50;
      cam.updateProjectionMatrix();
    }

    // Always look at center
    cam.lookAt(0, 0, 0);
  }, [scrollProgress]);

  // Determine particle count based on device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const particleCount = isMobile ? 500 : 3000;

  return (
    <>
      <Lights />

      <KuboNucleus
        scrollProgress={scrollProgress}
        mousePosition={mousePosition}
      />

      <ParticleField
        count={particleCount}
        scrollProgress={scrollProgress}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={['#000000', 10, 50]} />
    </>
  );
}
