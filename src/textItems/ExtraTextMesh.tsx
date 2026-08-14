import type * as THREE from "three";

type Props = {
    geometry: THREE.ExtrudeGeometry;
};

export default function ExtraTextMesh({ geometry }: Props) {
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#e6f2ff" roughness={0.38} />
        </mesh>
    );
}
