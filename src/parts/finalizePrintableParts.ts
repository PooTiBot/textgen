import * as THREE from "three";
import type { PrintablePart } from "./PrintablePart";

export type FinalizedPrintableParts = {
  parts: readonly PrintablePart[];
  previewScale: number;
  centerX: number;
  centerY: number;
  centerZ: number;
};

export function finalizePrintableParts(parts: readonly PrintablePart[]): FinalizedPrintableParts {
  if (parts.length === 0) throw new Error("В композиции нет деталей.");

  const compositionBox = new THREE.Box3();
  parts.forEach((part) => {
    part.geometry.computeBoundingBox();
    const bounds = part.geometry.boundingBox;
    if (bounds) compositionBox.union(bounds);
  });

  if (compositionBox.isEmpty()) throw new Error("Не удалось вычислить границы композиции.");
  const compositionSize = compositionBox.getSize(new THREE.Vector3());
  const compositionCenter = compositionBox.getCenter(new THREE.Vector3());
  const previewScale = 4.8 / Math.max(compositionSize.x, compositionSize.y, 1);
  const compositionMatrix = new THREE.Matrix4().makeTranslation(
    -compositionCenter.x,
    -compositionCenter.y,
    0,
  );
  parts.forEach((part) => {
    part.matrix.copy(compositionMatrix);
  });

  return {
    parts,
    previewScale,
    centerX: compositionCenter.x,
    centerY: compositionCenter.y,
    centerZ: compositionCenter.z,
  };
}
