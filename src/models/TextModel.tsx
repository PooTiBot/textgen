import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { Font } from "opentype.js";
import { loadFont } from "../utils/loadFont";

function fontPathToShapes(font: Font, text: string, size: number) {
    const path = font.getPath(text, 0, 0, size);
    const shapePath = new THREE.ShapePath();

    for (const command of path.commands) {
        switch (command.type) {
            case "M": shapePath.moveTo(command.x, -command.y); break;
            case "L": shapePath.lineTo(command.x, -command.y); break;
            case "C":
                shapePath.bezierCurveTo(command.x1, -command.y1, command.x2, -command.y2, command.x, -command.y);
                break;
            case "Q":
                shapePath.quadraticCurveTo(command.x1, -command.y1, command.x, -command.y);
                break;
            case "Z": shapePath.currentPath?.closePath(); break;
        }
    }

    return shapePath.toShapes();
}

function makeGeometry(font: Font, text: string, size: number, depth: number) {
    const shapes = fontPathToShapes(font, text, size);
    const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: true,
        bevelThickness: Math.min(1.2, depth * 0.12),
        bevelSize: 0.8,
        bevelSegments: 3,
        curveSegments: 12,
    });
    geometry.computeBoundingBox();
    return geometry;
}

type Props = {
    text: string;
    depth: number;
};

export default function TextModel({ text, depth }: Props) {
    const [font, setFont] = useState<Font | null>(null);

    useEffect(() => {
        loadFont().then(setFont).catch(console.error);
    }, []);

    const model = useMemo(() => {
        if (!font || !text.trim()) return null;

        const clean = text.trim();
        const initial = clean[0].toUpperCase();
        const big = makeGeometry(font, initial, 150, depth);
        const small = makeGeometry(font, clean, 52, depth + 0.8);

        big.computeBoundingBox();
        small.computeBoundingBox();
        const bb = big.boundingBox!;
        const sb = small.boundingBox!;

        const bigWidth = bb.max.x - bb.min.x;
        const bigHeight = bb.max.y - bb.min.y;
        const smallWidth = sb.max.x - sb.min.x;
        const smallHeight = sb.max.y - sb.min.y;

        big.translate(-bb.min.x, -(bb.min.y + bb.max.y) / 2, 0);
        small.translate(
            bigWidth * 0.34 - sb.min.x,
            -(sb.min.y + sb.max.y) / 2,
            depth * 0.18,
        );

        const groupWidth = Math.max(bigWidth, bigWidth * 0.34 + smallWidth);
        const scale = 4.8 / Math.max(groupWidth, bigHeight, smallHeight);

        return { big, small, scale, centerX: groupWidth / 2 };
    }, [font, text, depth]);

    useEffect(() => {
        return () => {
            model?.big.dispose();
            model?.small.dispose();
        };
    }, [model]);

    if (!model) return null;

    return (
        <group scale={model.scale} position={[-model.centerX * model.scale, 0, 0]}>
            <mesh geometry={model.big}>
                <meshStandardMaterial color="#64b5f6" roughness={0.42} />
            </mesh>
            <mesh geometry={model.small}>
                <meshStandardMaterial color="#f5f7fa" roughness={0.38} />
            </mesh>
        </group>
    );
}
