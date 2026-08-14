import * as THREE from "three";
import type { DecorationItem, DecorationType } from "./types";

function createStarShape(size: number) {
    const shape = new THREE.Shape();
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.45;

    for (let index = 0; index < 10; index += 1) {
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        const angle = Math.PI / 2 + index * Math.PI / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }

    shape.closePath();
    return shape;
}

function createHeartShape(size: number) {
    const shape = new THREE.Shape();
    const half = size / 2;

    shape.moveTo(0, -half);
    shape.bezierCurveTo(-half * 1.05, -half * 0.35, -half * 1.08, half * 0.72, 0, half * 0.35);
    shape.bezierCurveTo(half * 1.08, half * 0.72, half * 1.05, -half * 0.35, 0, -half);
    shape.closePath();
    return shape;
}

function createButterflyShape(size: number) {
    const shape = new THREE.Shape();
    const half = size / 2;

    shape.moveTo(0, half * 0.12);
    shape.bezierCurveTo(-half * 0.2, half * 0.55, -half * 0.55, half * 1.02, -half, half * 0.72);
    shape.bezierCurveTo(-half * 1.12, half * 0.16, -half * 0.62, -half * 0.08, -half * 0.32, -half * 0.02);
    shape.bezierCurveTo(-half * 0.82, -half * 0.54, -half * 0.42, -half * 0.96, 0, -half * 0.36);
    shape.bezierCurveTo(half * 0.42, -half * 0.96, half * 0.82, -half * 0.54, half * 0.32, -half * 0.02);
    shape.bezierCurveTo(half * 0.62, -half * 0.08, half * 1.12, half * 0.16, half, half * 0.72);
    shape.bezierCurveTo(half * 0.55, half * 1.02, half * 0.2, half * 0.55, 0, half * 0.12);
    shape.closePath();
    return shape;
}

function createCloudShape(size: number) {
    const shape = new THREE.Shape();
    const half = size / 2;

    shape.moveTo(-half * 0.82, -half * 0.38);
    shape.bezierCurveTo(-half * 1.15, -half * 0.32, -half * 1.12, half * 0.15, -half * 0.77, half * 0.2);
    shape.bezierCurveTo(-half * 0.72, half * 0.63, -half * 0.18, half * 0.8, half * 0.08, half * 0.48);
    shape.bezierCurveTo(half * 0.38, half * 0.88, half * 0.95, half * 0.58, half * 0.84, half * 0.2);
    shape.bezierCurveTo(half * 1.18, half * 0.08, half * 1.08, -half * 0.38, half * 0.73, -half * 0.4);
    shape.lineTo(-half * 0.82, -half * 0.38);
    shape.closePath();
    return shape;
}

function createMoonShape(size: number) {
    const shape = new THREE.Shape();
    const radius = size / 2;
    const hole = new THREE.Path();

    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    hole.absarc(radius * 0.36, radius * 0.04, radius * 0.62, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
}

function createCrownShape(size: number) {
    const shape = new THREE.Shape();
    const half = size / 2;

    shape.moveTo(-half, -half * 0.5);
    shape.lineTo(-half * 0.88, half * 0.65);
    shape.lineTo(-half * 0.38, half * 0.14);
    shape.lineTo(0, half * 0.82);
    shape.lineTo(half * 0.38, half * 0.14);
    shape.lineTo(half * 0.88, half * 0.65);
    shape.lineTo(half, -half * 0.5);
    shape.closePath();
    return shape;
}

function createDecorationShape(type: DecorationType, size: number) {
    switch (type) {
        case "star": return createStarShape(size);
        case "heart": return createHeartShape(size);
        case "butterfly": return createButterflyShape(size);
        case "cloud": return createCloudShape(size);
        case "moon": return createMoonShape(size);
        case "crown": return createCrownShape(size);
    }
}

export function createDecorationGeometry(item: DecorationItem) {
    const bevel = Math.min(item.depth * 0.1, item.size * 0.025);
    const extrusionDepth = Math.max(0.01, item.depth - bevel * 2);
    const geometry = new THREE.ExtrudeGeometry(
        createDecorationShape(item.type, item.size),
        {
            depth: extrusionDepth,
            bevelEnabled: true,
            bevelThickness: bevel,
            bevelSize: bevel,
            bevelSegments: 2,
            curveSegments: 16,
        },
    );

    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    geometry.translate(
        -(bounds.min.x + bounds.max.x) / 2,
        -(bounds.min.y + bounds.max.y) / 2,
        0,
    );
    geometry.rotateZ(THREE.MathUtils.degToRad(item.rotation));
    geometry.translate(item.x, item.y, item.z);
    geometry.computeBoundingBox();
    return geometry;
}
