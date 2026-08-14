import type * as THREE from "three";

type Props = {
  geometry: THREE.ExtrudeGeometry;
};

export default function BackPanel({ geometry }: Props) {
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#31495d" roughness={0.48} metalness={0.04} />
    </mesh>
  );
}
