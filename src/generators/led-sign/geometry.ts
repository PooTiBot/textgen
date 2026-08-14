import {
  FillRule,
  differenceD,
  getBoundsPathsD,
  type PathsD,
} from "clipper2-ts";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createGeometryFromShapes } from "../../textItems/geometry";
import {
  CLIPPER_PRECISION,
  clipperPathsToShapes,
  offsetClipperPaths,
  shapesToClipperPaths,
  transformClipperPaths,
} from "../../tolerance/polygonUtils";
import type { LedSignSettings } from "./types";

export type LedLetterContours = {
  outerGroups: PathsD[];
  innerGroups: PathsD[];
  capGroups: PathsD[];
  outerPaths: PathsD;
  innerPaths: PathsD;
  capPaths: PathsD;
  wallPaths: PathsD;
  seatPaths: PathsD;
};

function flatten(groups: PathsD[]) {
  return groups.flatMap((paths) => paths);
}

function createCirclePaths(x: number, y: number, diameter: number) {
  const circle = new THREE.Shape();
  circle.absarc(x, y, Math.max(0.25, diameter / 2), 0, Math.PI * 2, false);
  circle.closePath();
  return shapesToClipperPaths([circle]);
}

function extrudePaths(paths: PathsD, depth: number) {
  return createGeometryFromShapes(
    clipperPathsToShapes(paths),
    Math.max(0.1, depth),
    false,
  );
}

export function centerLedTextShapes(
  shapes: readonly THREE.Shape[],
  textX: number,
  textY: number,
) {
  const rawPaths = shapesToClipperPaths(shapes);
  const bounds = getBoundsPathsD(rawPaths);
  const translateX = -(bounds.left + bounds.right) / 2 + textX;
  const translateY = -(bounds.top + bounds.bottom) / 2 + textY;
  return {
    translateX,
    translateY,
    paths: transformClipperPaths(rawPaths, translateX, translateY),
  };
}

export function createLedLetterContours(
  shapes: readonly THREE.Shape[],
  settings: LedSignSettings,
): LedLetterContours {
  const centered = centerLedTextShapes(shapes, settings.textX, settings.textY);
  const centeredShapeGroups = settings.letterMode === "joined"
    ? [centered.paths]
    : shapes.map((shape) => {
      const paths = shapesToClipperPaths([shape]);
      return transformClipperPaths(paths, centered.translateX, centered.translateY);
    });
  const outerGroups = centeredShapeGroups.map((paths) => (
    offsetClipperPaths(paths, Math.max(0, settings.shellOffset))
  ));
  const innerGroups = outerGroups.map((paths) => (
    offsetClipperPaths(paths, -Math.max(0.4, settings.wallThickness))
  ));
  const capGroups = innerGroups.map((paths) => {
    const inset = Math.max(0, settings.capTolerance + settings.capInset);
    const caps = offsetClipperPaths(paths, -inset);
    return caps.length > 0 ? caps : paths;
  });
  const wallGroups = outerGroups.map((paths, index) => differenceD(
    paths,
    innerGroups[index],
    FillRule.NonZero,
    CLIPPER_PRECISION,
  ));
  const seatWidth = Math.max(0.8, Math.min(2.5, settings.wallThickness));
  const seatGroups = settings.capSeatEnabled
    ? innerGroups.map((paths, index) => {
      const seatInner = offsetClipperPaths(capGroups[index], -seatWidth);
      return differenceD(
        paths,
        seatInner,
        FillRule.NonZero,
        CLIPPER_PRECISION,
      );
    })
    : [];

  return {
    outerGroups,
    innerGroups,
    capGroups,
    outerPaths: flatten(outerGroups),
    innerPaths: flatten(innerGroups),
    capPaths: flatten(capGroups),
    wallPaths: flatten(wallGroups),
    seatPaths: flatten(seatGroups),
  };
}

export function createLedBaseGeometry(
  contours: LedLetterContours,
  settings: LedSignSettings,
) {
  let paths = contours.outerPaths;
  if (settings.wireHoleEnabled) {
    paths = differenceD(
      paths,
      createCirclePaths(settings.wireHoleX, settings.wireHoleY, settings.wireHoleDiameter),
      FillRule.NonZero,
      CLIPPER_PRECISION,
    );
  }
  const geometry = extrudePaths(paths, settings.baseThickness);
  geometry.computeBoundingBox();
  return geometry;
}

export function createLedWallsGeometry(
  contours: LedLetterContours,
  settings: LedSignSettings,
) {
  const layers: THREE.BufferGeometry[] = [];
  const walls = extrudePaths(contours.wallPaths, settings.wallHeight);
  walls.translate(0, 0, settings.baseThickness);
  layers.push(walls);

  if (settings.capSeatEnabled && contours.seatPaths.length > 0) {
    const seatDepth = Math.min(
      settings.wallHeight - settings.capThickness,
      Math.max(0.2, settings.capSeatDepth),
    );
    if (seatDepth > 0.1) {
      const seat = extrudePaths(contours.seatPaths, seatDepth);
      seat.translate(
        0,
        0,
        settings.baseThickness + settings.wallHeight - settings.capThickness - seatDepth,
      );
      layers.push(seat);
    }
  }

  const geometry = layers.length === 1 ? layers[0] : mergeGeometries(layers, false);
  if (!geometry) {
    layers.forEach((layer) => layer.dispose());
    throw new Error("Не удалось построить стенки световых букв.");
  }
  if (layers.length > 1) layers.forEach((layer) => layer.dispose());
  geometry.computeBoundingBox();
  return geometry;
}

export function createLedCapsGeometry(
  contours: LedLetterContours,
  settings: LedSignSettings,
) {
  const geometry = extrudePaths(contours.capPaths, settings.capThickness);
  geometry.translate(
    0,
    0,
    settings.baseThickness + settings.wallHeight - settings.capThickness,
  );
  geometry.computeBoundingBox();
  return geometry;
}
