import {
  FillRule,
  PointInPolygonResult,
  areaD,
  pointInPolygonD,
  unionD,
  type PathD,
  type PathsD,
} from "clipper2-ts";
import * as THREE from "three";

export const CLIPPER_PRECISION = 4;
const MIN_PATH_AREA = 0.0001;

function removeDuplicateEndPoint(path: PathD) {
  if (path.length < 2) return path;
  const first = path[0];
  const last = path[path.length - 1];
  return first.x === last.x && first.y === last.y ? path.slice(0, -1) : path;
}

function normalizeOrientation(path: PathD, positive: boolean) {
  const isPositive = areaD(path) > 0;
  return isPositive === positive ? path : [...path].reverse();
}

function curvePathToClipperPath(path: THREE.CurvePath<THREE.Vector2>, positive: boolean) {
  const points = removeDuplicateEndPoint(
    path.getPoints(18).map((point) => ({ x: point.x, y: point.y })),
  );

  return normalizeOrientation(points, positive);
}

export function shapesToClipperPaths(shapes: readonly THREE.Shape[]) {
  const paths: PathsD = [];

  for (const shape of shapes) {
    const outer = curvePathToClipperPath(shape, true);
    if (outer.length >= 3 && Math.abs(areaD(outer)) > MIN_PATH_AREA) paths.push(outer);

    for (const hole of shape.holes) {
      const holePath = curvePathToClipperPath(hole, false);
      if (holePath.length >= 3 && Math.abs(areaD(holePath)) > MIN_PATH_AREA) paths.push(holePath);
    }
  }

  return unionD(paths, [], FillRule.NonZero, CLIPPER_PRECISION);
}

export function transformClipperPaths(
  paths: PathsD,
  x: number,
  y: number,
  rotationDegrees = 0,
) {
  const angle = THREE.MathUtils.degToRad(rotationDegrees);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return paths.map((path) => path.map((point) => ({
    x: point.x * cosine - point.y * sine + x,
    y: point.x * sine + point.y * cosine + y,
  })));
}

function createThreePath(path: PathD, asShape: true): THREE.Shape;
function createThreePath(path: PathD, asShape: false): THREE.Path;
function createThreePath(path: PathD, asShape: boolean) {
  const result = asShape ? new THREE.Shape() : new THREE.Path();
  result.moveTo(path[0].x, path[0].y);
  for (let index = 1; index < path.length; index += 1) {
    result.lineTo(path[index].x, path[index].y);
  }
  result.closePath();
  return result;
}

type PathRecord = {
  path: PathD;
  area: number;
  parent: number | null;
  depth: number;
};

export function clipperPathsToShapes(paths: PathsD) {
  const records: PathRecord[] = paths
    .filter((path) => path.length >= 3 && Math.abs(areaD(path)) > MIN_PATH_AREA)
    .map((path) => ({ path, area: Math.abs(areaD(path)), parent: null, depth: 0 }));

  for (let childIndex = 0; childIndex < records.length; childIndex += 1) {
    let parentIndex: number | null = null;
    let parentArea = Number.POSITIVE_INFINITY;
    const sample = records[childIndex].path[0];

    for (let candidateIndex = 0; candidateIndex < records.length; candidateIndex += 1) {
      if (candidateIndex === childIndex || records[candidateIndex].area <= records[childIndex].area) continue;
      const containment = pointInPolygonD(sample, records[candidateIndex].path, CLIPPER_PRECISION);

      if (containment !== PointInPolygonResult.IsOutside && records[candidateIndex].area < parentArea) {
        parentIndex = candidateIndex;
        parentArea = records[candidateIndex].area;
      }
    }

    records[childIndex].parent = parentIndex;
  }

  const getDepth = (index: number): number => {
    const parent = records[index].parent;
    return parent === null ? 0 : getDepth(parent) + 1;
  };
  records.forEach((record, index) => {
    record.depth = getDepth(index);
  });

  const shapes = new Map<number, THREE.Shape>();
  records.forEach((record, index) => {
    if (record.depth % 2 === 0) shapes.set(index, createThreePath(record.path, true));
  });

  records.forEach((record) => {
    if (record.depth % 2 === 0) return;
    let outerIndex = record.parent;
    while (outerIndex !== null && records[outerIndex].depth % 2 !== 0) {
      outerIndex = records[outerIndex].parent;
    }
    if (outerIndex !== null) shapes.get(outerIndex)?.holes.push(createThreePath(record.path, false));
  });

  return Array.from(shapes.values());
}
