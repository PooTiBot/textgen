import * as THREE from "three";
import type { PanelShape } from "./types";

type PanelDimensions = {
  width: number;
  height: number;
};

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

function drawPanelContour(path: THREE.Path, shape: PanelShape, width: number, height: number) {
  switch (shape) {
    case "rectangle": drawRectangle(path, width, height); break;
    case "rounded-rectangle": drawRoundedRectangle(path, width, height); break;
    case "oval":
      path.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false, 0);
      path.closePath();
      break;
  }
}

function makePanelShape(shape: PanelShape, width: number, height: number) {
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
  const ovalFitScale = shape === "oval" ? Math.SQRT2 : 1;

  return {
    width: paddedWidth * ovalFitScale,
    height: paddedHeight * ovalFitScale,
  };
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
  const geometry = new THREE.ExtrudeGeometry(makePanelShape(shape, faceWidth, faceHeight), {
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
  const outer = makePanelShape(shape, width, height);
  const inner = new THREE.Path();
  drawPanelContour(
    inner,
    shape,
    Math.max(0.5, width - safeFrameWidth * 2),
    Math.max(0.5, height - safeFrameWidth * 2),
  );
  outer.holes.push(inner);

  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth: frameDepth,
    bevelEnabled: false,
    curveSegments: 32,
  });
  geometry.computeBoundingBox();
  return geometry;
}
