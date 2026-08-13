import * as THREE from "three";

export default function TestShape() {
    const shape = new THREE.Shape();

    shape.moveTo(-1, -1);
    shape.lineTo(1, -1);
    shape.lineTo(1, 1);
    shape.lineTo(0, 1.7);
    shape.lineTo(-1, 1);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.05,
        bevelSegments: 4,
    });

    geometry.center();

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#4aa8ff" />
        </mesh>
    );
}