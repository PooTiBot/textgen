import type * as THREE from "three";

function getBoundingBox(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) throw new Error("Не удалось вычислить границы 3D-геометрии.");
  return box;
}

export function getGeometryDepth(geometry: THREE.BufferGeometry) {
  const box = getBoundingBox(geometry);
  return box.max.z - box.min.z;
}

export function placeGeometryBackAt(geometry: THREE.BufferGeometry, backZ: number) {
  const box = getBoundingBox(geometry);
  geometry.translate(0, 0, backZ - box.min.z);
  geometry.computeBoundingBox();
  return geometry.boundingBox!.min.z;
}

export function placeGeometryFrontAt(geometry: THREE.BufferGeometry, frontZ: number) {
  const box = getBoundingBox(geometry);
  geometry.translate(0, 0, frontZ - box.max.z);
  geometry.computeBoundingBox();
  return geometry.boundingBox!.max.z;
}
