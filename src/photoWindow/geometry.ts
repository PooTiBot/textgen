import { FillRule, differenceD, type PathsD } from "clipper2-ts";
import * as THREE from "three";
import { createPanelGeometry, createPanelShape } from "../panel/geometry";
import type { PanelShape } from "../panel/types";
import { createGeometryFromShapes } from "../textItems/geometry";
import { createNamePocket } from "../tolerance/createNamePocket";
import {
  CLIPPER_PRECISION,
  clipperPathsToShapes,
  shapesToClipperPaths,
  transformClipperPaths,
} from "../tolerance/polygonUtils";
import type { PhotoWindowSettings } from "./types";

function drawRoundedRectangle(
  path: THREE.Path,
  width: number,
  height: number,
  cornerRadius: number,
) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = Math.min(Math.max(0, cornerRadius), halfWidth, halfHeight);
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

export function createPhotoWindowShape(
  settings: PhotoWindowSettings,
  additionalWidth = 0,
  additionalHeight = 0,
) {
  const width = Math.max(1, settings.width + additionalWidth);
  const height = Math.max(1, settings.height + additionalHeight);
  const shape = new THREE.Shape();

  if (settings.shape === "oval") {
    shape.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false, 0);
    shape.closePath();
  } else if (settings.shape === "rounded-rectangle") {
    drawRoundedRectangle(
      shape,
      width,
      height,
      settings.cornerRadius + Math.max(additionalWidth, additionalHeight) / 2,
    );
  } else {
    drawRoundedRectangle(shape, width, height, 0);
  }
  return shape;
}

export function getPhotoWindowPaths(
  settings: PhotoWindowSettings,
  localX: number,
  localY: number,
) {
  const mountingPadding = Math.max(0, settings.padding) * 2;
  return transformClipperPaths(
    shapesToClipperPaths([
      createPhotoWindowShape(settings, mountingPadding, mountingPadding),
    ]),
    localX,
    localY,
  );
}

function extrudePaths(paths: PathsD, depth: number) {
  const geometry = createGeometryFromShapes(
    clipperPathsToShapes(paths),
    Math.max(0.05, depth),
    false,
  );
  geometry.computeBoundingBox();
  return geometry;
}

export function createPanelWithPhotoWindowGeometry(
  panelShape: PanelShape,
  panelWidth: number,
  panelHeight: number,
  panelThickness: number,
  settings: PhotoWindowSettings,
  localX: number,
  localY: number,
) {
  if (!settings.enabled || settings.mode === "frame-only") {
    return createPanelGeometry(panelShape, panelWidth, panelHeight, panelThickness);
  }

  const panelPaths = shapesToClipperPaths([
    createPanelShape(panelShape, panelWidth, panelHeight),
  ]);
  const windowPaths = getPhotoWindowPaths(settings, localX, localY);

  if (settings.mode === "cutout") {
    return extrudePaths(
      differenceD(panelPaths, windowPaths, FillRule.NonZero, CLIPPER_PRECISION),
      panelThickness,
    );
  }

  return createNamePocket(panelPaths, windowPaths, panelThickness, {
    enabled: true,
    tolerance: 0,
    depth: Math.min(panelThickness, Math.max(0.1, settings.recessDepth)),
  })?.geometry ?? extrudePaths(panelPaths, panelThickness);
}

export function createPhotoInnerFrameGeometry(settings: PhotoWindowSettings) {
  const useExplicitFrame = settings.innerFrameEnabled;
  if (!useExplicitFrame && settings.mode !== "frame-only") return null;
  const frameWidth = useExplicitFrame
    ? Math.max(0.5, settings.innerFrameWidth)
    : Math.max(1, settings.padding || 2);
  const frameDepth = useExplicitFrame
    ? settings.innerFrameDepth
    : settings.depth;
  const padding = Math.max(0, settings.padding) * 2;
  const outerPaths = shapesToClipperPaths([
    createPhotoWindowShape(settings, padding + frameWidth * 2, padding + frameWidth * 2),
  ]);
  const innerPaths = shapesToClipperPaths([
    createPhotoWindowShape(settings, padding, padding),
  ]);
  return extrudePaths(
    differenceD(outerPaths, innerPaths, FillRule.NonZero, CLIPPER_PRECISION),
    Math.max(0.2, frameDepth),
  );
}

export function getPhotoWindowOuterBounds(settings: PhotoWindowSettings) {
  const extra = Math.max(0, settings.padding)
    + (settings.innerFrameEnabled ? Math.max(0, settings.innerFrameWidth) : 0);
  return new THREE.Box3(
    new THREE.Vector3(settings.x - settings.width / 2 - extra, settings.y - settings.height / 2 - extra, 0),
    new THREE.Vector3(settings.x + settings.width / 2 + extra, settings.y + settings.height / 2 + extra, 0),
  );
}
