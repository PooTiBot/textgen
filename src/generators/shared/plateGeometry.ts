import * as THREE from "three";

export type PlateShape = "rectangle" | "rounded-rectangle" | "oval" | "capsule";

function drawRectangle(path: THREE.Path, width: number, height: number) {
  path.moveTo(-width / 2, -height / 2);
  path.lineTo(width / 2, -height / 2);
  path.lineTo(width / 2, height / 2);
  path.lineTo(-width / 2, height / 2);
  path.closePath();
}

function drawRoundedRectangle(
  path: THREE.Path,
  width: number,
  height: number,
  requestedRadius: number,
) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.min(Math.max(0, requestedRadius), halfWidth, halfHeight);

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

export function createPlateOutlineShape(
  shape: PlateShape,
  width: number,
  height: number,
  cornerRadius: number,
) {
  const result = new THREE.Shape();

  if (shape === "oval") {
    result.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false, 0);
    result.closePath();
  } else if (shape === "rectangle") {
    drawRectangle(result, width, height);
  } else {
    drawRoundedRectangle(
      result,
      width,
      height,
      shape === "capsule" ? Math.min(width, height) / 2 : cornerRadius,
    );
  }

  return result;
}
