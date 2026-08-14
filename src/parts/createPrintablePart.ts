import * as THREE from "three";
import type { PrintablePart } from "./PrintablePart";

export function createPrintablePart(
  id: string,
  type: PrintablePart["type"],
  name: string,
  fileName: string,
  geometry: THREE.BufferGeometry,
  previewVisible = true,
): PrintablePart {
  return {
    id,
    type,
    name,
    fileName,
    geometry,
    matrix: new THREE.Matrix4(),
    enabled: true,
    previewVisible,
  };
}
