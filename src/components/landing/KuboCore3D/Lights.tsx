export function Lights() {
  return (
    <>
      {/* Ambient light - soft base illumination */}
      <ambientLight intensity={0.2} />

      {/* Main directional light - key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        color="#ffffff"
      />

      {/* Rim light - creates depth */}
      <directionalLight
        position={[-5, -5, -5]}
        intensity={0.3}
        color="#6C3CE1"
      />

      {/* Point light near nucleus - purple glow */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.8}
        color="#6C3CE1"
        distance={10}
        decay={2}
      />

      {/* Accent lights */}
      <pointLight
        position={[3, 3, 3]}
        intensity={0.3}
        color="#ffffff"
        distance={8}
      />
      <pointLight
        position={[-3, -3, 3]}
        intensity={0.3}
        color="#8B5CF6"
        distance={8}
      />
    </>
  );
}
