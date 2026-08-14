import {
  FillRule,
  PointInPolygonResult,
  differenceD,
  pointInPolygonD,
  unionD,
  type PathsD,
} from "clipper2-ts";
import * as THREE from "three";
import { createGeometryFromShapes } from "../../textItems/geometry";
import {
  CLIPPER_PRECISION,
  clipperPathsToShapes,
  shapesToClipperPaths,
} from "../../tolerance/polygonUtils";
import type { KeychainSettings, KeychainShape } from "./types";
import { createPlateOutlineShape } from "../shared/plateGeometry";

export function createKeychainOutlineShape(
  shape: KeychainShape,
  width: number,
  height: number,
  cornerRadius: number,
) {
  return createPlateOutlineShape(shape, width, height, cornerRadius);
}

function createCircleShape(x: number, y: number, radius: number) {
  const shape = new THREE.Shape();
  shape.absarc(x, y, radius, 0, Math.PI * 2, false);
  shape.closePath();
  return shape;
}

export function getLoopCenterX(settings: KeychainSettings) {
  const outerRadius = settings.loopOuterDiameter / 2;
  const wall = Math.max(0.5, (settings.loopOuterDiameter - settings.loopInnerDiameter) / 2);
  const overlap = Math.max(1.5, wall * 0.8);
  const direction = settings.loopSide === "left" ? -1 : 1;
  return direction * (settings.width / 2 + outerRadius - overlap);
}

export function createKeychainBodyPaths(settings: KeychainSettings) {
  const outline = createKeychainOutlineShape(
    settings.shape,
    settings.width,
    settings.height,
    settings.cornerRadius,
  );
  const outlinePaths = shapesToClipperPaths([outline]);
  let bodyPaths = outlinePaths;

  if (settings.mountType === "loop") {
    const centerX = getLoopCenterX(settings);
    const outer = shapesToClipperPaths([
      createCircleShape(centerX, 0, settings.loopOuterDiameter / 2),
    ]);
    bodyPaths = unionD(
      [...bodyPaths, ...outer],
      [],
      FillRule.NonZero,
      CLIPPER_PRECISION,
    );
    const innerRadius = Math.min(
      Math.max(0.25, settings.loopInnerDiameter / 2),
      Math.max(0.25, settings.loopOuterDiameter / 2 - 0.5),
    );
    const inner = shapesToClipperPaths([
      createCircleShape(centerX, 0, innerRadius),
    ]);
    bodyPaths = differenceD(bodyPaths, inner, FillRule.NonZero, CLIPPER_PRECISION);
  } else if (settings.holeEnabled && settings.holeDiameter > 0) {
    const hole = shapesToClipperPaths([
      createCircleShape(settings.holeX, settings.holeY, settings.holeDiameter / 2),
    ]);
    bodyPaths = differenceD(bodyPaths, hole, FillRule.NonZero, CLIPPER_PRECISION);
  }

  return { bodyPaths, outlinePaths };
}

export function createKeychainBaseGeometry(paths: PathsD, thickness: number) {
  const geometry = createGeometryFromShapes(
    clipperPathsToShapes(paths),
    Math.max(0.2, thickness),
    false,
  );
  geometry.computeBoundingBox();
  return geometry;
}

export function getKeychainMountWarning(settings: KeychainSettings) {
  if (settings.mountType === "loop") {
    if (settings.loopInnerDiameter >= settings.loopOuterDiameter) {
      return "Внутренний диаметр ушка должен быть меньше внешнего.";
    }
    if (settings.loopOuterDiameter <= 0 || settings.loopInnerDiameter <= 0) {
      return "Диаметры ушка должны быть больше нуля.";
    }
    return null;
  }

  if (!settings.holeEnabled) return null;
  const outlinePath = createKeychainBodyPaths({ ...settings, holeEnabled: false }).outlinePaths[0];
  const radius = settings.holeDiameter / 2;

  for (let index = 0; index < 32; index += 1) {
    const angle = index * Math.PI * 2 / 32;
    const point = {
      x: settings.holeX + Math.cos(angle) * radius,
      y: settings.holeY + Math.sin(angle) * radius,
    };
    if (
      !outlinePath
      || pointInPolygonD(point, outlinePath, CLIPPER_PRECISION) === PointInPolygonResult.IsOutside
    ) {
      return "Отверстие выходит за край основы. Переместите его или уменьшите диаметр.";
    }
  }

  return null;
}
