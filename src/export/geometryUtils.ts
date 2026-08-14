import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { PrintablePart } from "../parts/PrintablePart";

export type ModelSize = {
  width: number;
  height: number;
  depth: number;
};

export type ExportSnapshot = {
  parts: readonly PrintablePart[];
  bounds: THREE.Box3;
  size: ModelSize;
  partCount: number;
  disconnectedPartIds: readonly string[];
};

const CONTACT_TOLERANCE_MM = 1;

export function createPartExportGeometry(part: PrintablePart) {
  const source = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
  const position = source.getAttribute("position");

  if (!position || position.count === 0) {
    source.dispose();
    throw new Error(`Деталь «${part.name}» не содержит треугольников.`);
  }

  const clone = new THREE.BufferGeometry();
  clone.setAttribute("position", position.clone());
  clone.applyMatrix4(part.matrix);
  clone.computeBoundingBox();
  source.dispose();
  validateExportGeometry(clone);
  return clone;
}

function boxesTouch(first: THREE.Box3, second: THREE.Box3) {
  return first.min.x <= second.max.x + CONTACT_TOLERANCE_MM
    && first.max.x + CONTACT_TOLERANCE_MM >= second.min.x
    && first.min.y <= second.max.y + CONTACT_TOLERANCE_MM
    && first.max.y + CONTACT_TOLERANCE_MM >= second.min.y
    && first.min.z <= second.max.z + CONTACT_TOLERANCE_MM
    && first.max.z + CONTACT_TOLERANCE_MM >= second.min.z;
}

function findDisconnectedParts(
  parts: readonly PrintablePart[],
  boxes: ReadonlyMap<string, THREE.Box3>,
) {
  const panel = parts.find((part) => (
    part.type === "backPanel" || part.type === "keychainBase" || part.type === "ledWalls"
  ));
  if (!panel) return [];

  const connected = new Set([panel.id]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const candidate of parts) {
      if (connected.has(candidate.id)) continue;
      const candidateBox = boxes.get(candidate.id)!;
      const touchesConnectedPart = parts.some((part) => (
        connected.has(part.id) && boxesTouch(candidateBox, boxes.get(part.id)!)
      ));

      if (touchesConnectedPart) {
        connected.add(candidate.id);
        changed = true;
      }
    }
  }

  return parts
    .filter((part) => part.id !== panel.id && !connected.has(part.id))
    .map((part) => part.id);
}

export function validateExportGeometry(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");

  if (!position || position.count < 3) {
    throw new Error("Экспортируемая геометрия пуста.");
  }

  for (let index = 0; index < position.count; index += 1) {
    if (
      !Number.isFinite(position.getX(index))
      || !Number.isFinite(position.getY(index))
      || !Number.isFinite(position.getZ(index))
    ) {
      throw new Error("Геометрия содержит некорректные координаты.");
    }
  }

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;

  if (!bounds || bounds.isEmpty()) {
    throw new Error("Не удалось вычислить границы экспортируемой модели.");
  }

  const values = [
    bounds.min.x,
    bounds.min.y,
    bounds.min.z,
    bounds.max.x,
    bounds.max.y,
    bounds.max.z,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error("Границы модели содержат некорректные значения.");
  }

  return bounds.clone();
}

export function createMergedExportGeometry(parts: readonly PrintablePart[]) {
  const activeParts = parts.filter((part) => part.enabled);
  if (activeParts.length === 0) throw new Error("В композиции нет элементов для экспорта.");

  const geometries = activeParts.map(createPartExportGeometry);
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());

  if (!merged) throw new Error("Не удалось объединить части модели для STL.");
  validateExportGeometry(merged);
  return merged;
}

export function createExportSnapshot(parts: readonly PrintablePart[]): ExportSnapshot {
  const activeParts = parts.filter((part) => part.enabled);
  if (activeParts.length === 0) throw new Error("В композиции нет элементов для экспорта.");

  const boxes = new Map<string, THREE.Box3>();
  const bounds = new THREE.Box3();

  activeParts.forEach((part) => {
    const geometry = createPartExportGeometry(part);
    const partBounds = geometry.boundingBox!.clone();
    boxes.set(part.id, partBounds);
    bounds.union(partBounds);
    geometry.dispose();
  });

  const sizeVector = bounds.getSize(new THREE.Vector3());
  return {
    parts: activeParts,
    bounds,
    size: {
      width: sizeVector.x,
      height: sizeVector.y,
      depth: sizeVector.z,
    },
    partCount: activeParts.length,
    disconnectedPartIds: findDisconnectedParts(activeParts, boxes),
  };
}
