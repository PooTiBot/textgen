import type * as THREE from "three";

type Props = {
    geometry: THREE.ExtrudeGeometry;
};

export default function DecorationMesh({ geometry }: Props) {
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#ffca6a" roughness={0.4} />
        </mesh>
    );
}
