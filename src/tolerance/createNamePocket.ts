import {
  EndType,
  FillRule,
  JoinType,
  areaPathsD,
  differenceD,
  inflatePathsD,
  intersectD,
  unionD,
  type PathsD,
} from "clipper2-ts";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type * as THREE from "three";
import { createGeometryFromShapes } from "../textItems/geometry";
import { CLIPPER_PRECISION, clipperPathsToShapes } from "./polygonUtils";
import type { NamePocketSettings } from "./types";

export type NamePocketResult = {
  geometry: THREE.BufferGeometry;
  pocketPaths: PathsD;
  pocketArea: number;
  effectiveDepth: number;
};

export function createExpandedNamePaths(namePaths: PathsD, tolerance: number) {
  const unified = unionD(namePaths, [], FillRule.NonZero, CLIPPER_PRECISION);
  if (tolerance <= 0) return unified;

  return unionD(
    inflatePathsD(
      unified,
      tolerance,
      JoinType.Round,
      EndType.Polygon,
      2,
      CLIPPER_PRECISION,
      0.02,
    ),
    [],
    FillRule.NonZero,
    CLIPPER_PRECISION,
  );
}

export function createNamePocket(
  initialPaths: PathsD,
  namePaths: PathsD,
  initialDepth: number,
  settings: NamePocketSettings,
): NamePocketResult | null {
  const effectiveDepth = Math.min(initialDepth, Math.max(0, settings.depth));
  if (!settings.enabled || effectiveDepth <= 0) return null;

  const expandedName = createExpandedNamePaths(namePaths, Math.max(0, settings.tolerance));
  const pocketPaths = intersectD(
    initialPaths,
    expandedName,
    FillRule.EvenOdd,
    CLIPPER_PRECISION,
  );
  if (pocketPaths.length === 0) return null;

  const remainingTopPaths = differenceD(
    initialPaths,
    pocketPaths,
    FillRule.EvenOdd,
    CLIPPER_PRECISION,
  );
  const baseDepth = initialDepth - effectiveDepth;
  const layers = [];

  if (baseDepth > 0.0001) {
    layers.push(createGeometryFromShapes(clipperPathsToShapes(initialPaths), baseDepth, false));
  }

  if (remainingTopPaths.length > 0) {
    const top = createGeometryFromShapes(
      clipperPathsToShapes(remainingTopPaths),
      effectiveDepth,
      false,
    );
    top.translate(0, 0, baseDepth);
    layers.push(top);
  }

  if (layers.length === 0) return null;
  const geometry = layers.length === 1 ? layers[0] : mergeGeometries(layers, false);
  if (!geometry) {
    layers.forEach((layer) => layer.dispose());
    throw new Error("Не удалось построить геометрию посадочного кармана.");
  }

  if (layers.length > 1) layers.forEach((layer) => layer.dispose());
  geometry.computeBoundingBox();

  return {
    geometry,
    pocketPaths,
    pocketArea: Math.abs(areaPathsD(pocketPaths)),
    effectiveDepth,
  };
}
