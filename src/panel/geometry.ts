import * as THREE from "three";
import type { PanelShape } from "./types";

type PanelDimensions = { width: number; height: number };

function drawRectangle(path: THREE.Path, width: number, height: number) {
  path.moveTo(-width / 2, -height / 2);
  path.lineTo(width / 2, -height / 2);
  path.lineTo(width / 2, height / 2);
  path.lineTo(-width / 2, height / 2);
  path.closePath();
}

function drawRoundedRectangle(path: THREE.Path, width: number, height: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.min(width, height) * 0.12;
  path.moveTo(-halfWidth + radius, -halfHeight);
  path.lineTo(halfWidth - radius, -halfHeight);
  path.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  path.lineTo(halfWidth, halfHeight - radius);
  path.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  path.lineTo(-halfWidth + radius, halfHeight);
  path.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  path.lineTo(-halfWidth, -halfHeight + radius);
  path.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
  path.closePath();
}

export function drawPanelContour(
  path: THREE.Path,
  shape: PanelShape,
  width: number,
  height: number,
) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  switch (shape) {
    case "rectangle": drawRectangle(path, width, height); break;
    case "rounded-rectangle": drawRoundedRectangle(path, width, height); break;
    case "oval":
      path.absellipse(0, 0, halfWidth, halfHeight, 0, Math.PI * 2, false, 0);
      path.closePath();
      break;
    case "cloud":
      path.moveTo(-halfWidth * 0.76, -halfHeight * 0.68);
      path.bezierCurveTo(-halfWidth, -halfHeight * 0.68, -halfWidth, -halfHeight * 0.22, -halfWidth * 0.82, -halfHeight * 0.08);
      path.bezierCurveTo(-halfWidth, halfHeight * 0.2, -halfWidth * 0.78, halfHeight * 0.58, -halfWidth * 0.53, halfHeight * 0.51);
      path.bezierCurveTo(-halfWidth * 0.42, halfHeight, -halfWidth * 0.05, halfHeight, halfWidth * 0.05, halfHeight * 0.72);
      path.bezierCurveTo(halfWidth * 0.31, halfHeight, halfWidth * 0.66, halfHeight * 0.82, halfWidth * 0.63, halfHeight * 0.52);
      path.bezierCurveTo(halfWidth, halfHeight * 0.6, halfWidth, halfHeight * 0.1, halfWidth * 0.8, -halfHeight * 0.03);
      path.bezierCurveTo(halfWidth, -halfHeight * 0.35, halfWidth * 0.72, -halfHeight * 0.72, halfWidth * 0.48, -halfHeight * 0.65);
      path.bezierCurveTo(halfWidth * 0.2, -halfHeight, -halfWidth * 0.5, -halfHeight, -halfWidth * 0.76, -halfHeight * 0.68);
      path.closePath();
      break;
    case "plaque": {
      const notchX = halfWidth * 0.12;
      const notchY = halfHeight * 0.2;
      path.moveTo(-halfWidth + notchX, -halfHeight);
      path.lineTo(halfWidth - notchX, -halfHeight);
      path.quadraticCurveTo(halfWidth, -halfHeight, halfWidth - notchX * 0.3, -halfHeight + notchY);
      path.quadraticCurveTo(halfWidth * 0.82, -halfHeight * 0.2, halfWidth, 0);
      path.quadraticCurveTo(halfWidth * 0.82, halfHeight * 0.2, halfWidth - notchX * 0.3, halfHeight - notchY);
      path.quadraticCurveTo(halfWidth, halfHeight, halfWidth - notchX, halfHeight);
      path.lineTo(-halfWidth + notchX, halfHeight);
      path.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth + notchX * 0.3, halfHeight - notchY);
      path.quadraticCurveTo(-halfWidth * 0.82, halfHeight * 0.2, -halfWidth, 0);
      path.quadraticCurveTo(-halfWidth * 0.82, -halfHeight * 0.2, -halfWidth + notchX * 0.3, -halfHeight + notchY);
      path.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + notchX, -halfHeight);
      path.closePath();
      break;
    }
    case "arch": {
      const shoulderY = -halfHeight * 0.05;
      path.moveTo(-halfWidth, -halfHeight);
      path.lineTo(halfWidth, -halfHeight);
      path.lineTo(halfWidth, shoulderY);
      path.bezierCurveTo(halfWidth, halfHeight * 0.5, halfWidth * 0.5, halfHeight, 0, halfHeight);
      path.bezierCurveTo(-halfWidth * 0.5, halfHeight, -halfWidth, halfHeight * 0.5, -halfWidth, shoulderY);
      path.closePath();
      break;
    }
    case "hexagon":
      path.moveTo(-halfWidth * 0.72, -halfHeight);
      path.lineTo(halfWidth * 0.72, -halfHeight);
      path.lineTo(halfWidth, 0);
      path.lineTo(halfWidth * 0.72, halfHeight);
      path.lineTo(-halfWidth * 0.72, halfHeight);
      path.lineTo(-halfWidth, 0);
      path.closePath();
      break;
  }
}

export function createPanelShape(shape: PanelShape, width: number, height: number) {
  const result = new THREE.Shape();
  drawPanelContour(result, shape, width, height);
  return result;
}

export function getAutoPanelDimensions(
  shape: PanelShape,
  contentWidth: number,
  contentHeight: number,
  padding: number,
): PanelDimensions {
  const paddedWidth = Math.max(20, contentWidth + padding * 2);
  const paddedHeight = Math.max(20, contentHeight + padding * 2);
  const fit = shape === "oval"
    ? { width: Math.SQRT2, height: Math.SQRT2 }
    : shape === "cloud"
      ? { width: 1.28, height: 1.3 }
      : shape === "plaque"
        ? { width: 1.18, height: 1.12 }
        : shape === "arch"
          ? { width: 1.15, height: 1.3 }
          : shape === "hexagon"
            ? { width: 1.22, height: 1.08 }
            : { width: 1, height: 1 };
  return { width: paddedWidth * fit.width, height: paddedHeight * fit.height };
}

export function createPanelGeometry(
  shape: PanelShape,
  width: number,
  height: number,
  thickness: number,
) {
  const bevelSize = Math.min(1.5, thickness * 0.15, width * 0.02, height * 0.02);
  const extrusionDepth = Math.max(0.01, thickness - bevelSize * 2);
  const faceWidth = Math.max(1, width - bevelSize * 2);
  const faceHeight = Math.max(1, height - bevelSize * 2);
  const geometry = new THREE.ExtrudeGeometry(createPanelShape(shape, faceWidth, faceHeight), {
    depth: extrusionDepth,
    bevelEnabled: bevelSize > 0,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 3,
    curveSegments: 32,
  });
  geometry.computeBoundingBox();
  return geometry;
}

export function createPanelFrameGeometry(
  shape: PanelShape,
  width: number,
  height: number,
  frameWidth: number,
  frameDepth: number,
) {
  const safeFrameWidth = Math.min(
    Math.max(0.5, frameWidth),
    Math.max(0.5, (Math.min(width, height) - 1) / 2),
  );
  const outer = createPanelShape(shape, width, height);
  const inner = new THREE.Path();
  drawPanelContour(inner, shape, Math.max(0.5, width - safeFrameWidth * 2), Math.max(0.5, height - safeFrameWidth * 2));
  outer.holes.push(inner);
  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth: frameDepth,
    bevelEnabled: false,
    curveSegments: 32,
  });
  geometry.computeBoundingBox();
  return geometry;
}
