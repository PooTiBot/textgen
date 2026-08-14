import { areaPathsD, getBoundsPathsD } from "clipper2-ts";
import { unzipSync } from "fflate";
import { parse, type Font } from "opentype.js";
import * as THREE from "three";
import { createPartsZipArchive } from "../src/export/exportStl";
import {
  createExportSnapshot,
  createMergedExportGeometry,
  validateExportGeometry,
} from "../src/export/geometryUtils";
import { buildLedSignParts } from "../src/generators/led-sign/buildLedSignParts";
import { createLedLetterContours } from "../src/generators/led-sign/geometry";
import { DEFAULT_LED_SIGN_SETTINGS } from "../src/generators/led-sign/presets";
import type { LedSignSettings } from "../src/generators/led-sign/types";
import { createTextShapes } from "../src/textItems/geometry";

function assertClose(label: string, actual: number, expected: number, tolerance = 0.1) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected} mm, received ${actual} mm.`);
  }
}

function partGeometry(model: ReturnType<typeof buildLedSignParts>, id: string) {
  const part = model.parts.find((candidate) => candidate.id === id);
  if (!part) throw new Error(`Missing LED printable part: ${id}.`);
  return part.geometry;
}

function partSize(model: ReturnType<typeof buildLedSignParts>, id: string) {
  const geometry = partGeometry(model, id);
  geometry.computeBoundingBox();
  return geometry.boundingBox!.getSize(new THREE.Vector3());
}

function dispose(model: ReturnType<typeof buildLedSignParts>) {
  model.parts.forEach((part) => part.geometry.dispose());
}

function build(font: Font, patch: Partial<LedSignSettings> = {}) {
  return buildLedSignParts({
    ...DEFAULT_LED_SIGN_SETTINGS,
    wireHoleEnabled: false,
    ...patch,
  }, font, []);
}

function contours(font: Font, patch: Partial<LedSignSettings>) {
  const settings = { ...DEFAULT_LED_SIGN_SETTINGS, wireHoleEnabled: false, ...patch };
  const shapes = createTextShapes(font, settings.text, settings.textSize, settings.letterSpacing);
  return createLedLetterContours(shapes, settings);
}

function assertChannelLetterParts(
  label: string,
  model: ReturnType<typeof buildLedSignParts>,
) {
  ["led-base", "led-walls", "led-caps"].forEach((id) => {
    validateExportGeometry(partGeometry(model, id));
  });
  assertClose(`${label}/base thickness`, partSize(model, "led-base").z, 2);
  assertClose(`${label}/wall height`, partSize(model, "led-walls").z, 15);
  assertClose(`${label}/cap thickness`, partSize(model, "led-caps").z, 1);
  if (!model.capFits) throw new Error(`${label}: cap does not fit its cavity.`);
}

function assertVerticalOpening(
  geometry: THREE.BufferGeometry,
  x: number,
  y: number,
  label: string,
) {
  const mesh = new THREE.Mesh(geometry);
  mesh.updateMatrixWorld(true);
  const hits = new THREE.Raycaster(
    new THREE.Vector3(x, y, 50),
    new THREE.Vector3(0, 0, -1),
  ).intersectObject(mesh);
  if (hits.length > 0) throw new Error(`${label}: glyph counter is filled.`);
}

export function runLedSignGeometryCheck(
  russoBuffer: ArrayBuffer,
  comfortaaBuffer: ArrayBuffer,
  pacificoBuffer: ArrayBuffer,
) {
  const russo = parse(russoBuffer);
  const comfortaa = parse(comfortaaBuffer);
  const pacifico = parse(pacificoBuffer);
  const models: ReturnType<typeof buildLedSignParts>[] = [];
  const scenarios = [
    { label: "Пример/Russo One", text: "Пример", font: russo, fontId: "russo-one" },
    { label: "София/Comfortaa", text: "София", font: comfortaa, fontId: "comfortaa" },
    { label: "CRAFT/Russo One", text: "CRAFT", font: russo, fontId: "russo-one" },
    { label: "Ёжик/Russo One", text: "Ёжик", font: russo, fontId: "russo-one" },
    { label: "Pacifico", text: "Мастерская", font: pacifico, fontId: "pacifico", shellOffset: 5 },
  ];

  scenarios.forEach((scenario) => {
    const model = build(scenario.font, scenario);
    models.push(model);
    assertChannelLetterParts(scenario.label, model);
    const channelContours = contours(scenario.font, scenario);
    const outerArea = Math.abs(areaPathsD(channelContours.outerPaths));
    const wallArea = Math.abs(areaPathsD(channelContours.wallPaths));
    if (channelContours.innerPaths.length === 0 || wallArea <= 0 || wallArea >= outerArea) {
      throw new Error(`${scenario.label}: walls are not a hollow contour.`);
    }
  });

  const glyphHole = build(russo, { text: "О", textSize: 80, autoFit: false });
  models.push(glyphHole);
  assertVerticalOpening(partGeometry(glyphHole, "led-base"), 0, 0, "О/base");
  assertVerticalOpening(partGeometry(glyphHole, "led-caps"), 0, 0, "О/cap");

  const noTolerance = contours(russo, { text: "П", textSize: 80, autoFit: false, capTolerance: 0 });
  const tolerance = contours(russo, { text: "П", textSize: 80, autoFit: false, capTolerance: 0.4 });
  const noToleranceBounds = getBoundsPathsD(noTolerance.capPaths);
  const toleranceBounds = getBoundsPathsD(tolerance.capPaths);
  const widthReduction = (noToleranceBounds.right - noToleranceBounds.left)
    - (toleranceBounds.right - toleranceBounds.left);
  assertClose("cap tolerance contour reduction", widthReduction, 0.8, 0.08);

  const shellZero = contours(russo, { text: "П", textSize: 80, autoFit: false, shellOffset: 0 });
  const shellTwo = contours(russo, { text: "П", textSize: 80, autoFit: false, shellOffset: 2 });
  const zeroBounds = getBoundsPathsD(shellZero.outerPaths);
  const twoBounds = getBoundsPathsD(shellTwo.outerPaths);
  assertClose(
    "shell offset width growth",
    (twoBounds.right - twoBounds.left) - (zeroBounds.right - zeroBounds.left),
    4,
    0.08,
  );

  const joined = build(comfortaa, { text: "София", letterMode: "joined", shellOffset: 4 });
  models.push(joined);
  assertChannelLetterParts("joined word", joined);

  const longText = build(russo, {
    text: "Мастерская Александра",
    textSize: 90,
    maxWidth: 180,
    maxHeight: 70,
    autoFit: true,
  });
  models.push(longText);
  if (longText.effectiveTextSize >= 90) throw new Error("LED auto-fit did not reduce a long word.");

  const decorated = buildLedSignParts(DEFAULT_LED_SIGN_SETTINGS, russo, [{
    id: "star",
    type: "star",
    x: 70,
    y: 22,
    z: 0,
    size: 18,
    depth: 3,
    rotation: 0,
    enabled: true,
  }]);
  models.push(decorated);
  if (!decorated.parts.some((part) => part.id === "decoration:star")) {
    throw new Error("LED decoration printable part is missing.");
  }

  const exportModel = models[0];
  const snapshot = createExportSnapshot(exportModel.parts);
  const merged = createMergedExportGeometry(snapshot.parts);
  validateExportGeometry(merged);
  const archive = unzipSync(createPartsZipArchive(snapshot));
  ["led-base.stl", "led-walls.stl", "led-caps.stl"].forEach((fileName) => {
    if (!archive[fileName] || archive[fileName].byteLength <= 84) {
      throw new Error(`LED parts archive is missing ${fileName}.`);
    }
  });

  const exploded = build(russo, { text: "Пример", explodedView: 30 });
  models.push(exploded);
  const explodedSnapshot = createExportSnapshot(exploded.parts);
  assertClose("exploded preview/export width", explodedSnapshot.size.width, snapshot.size.width);
  assertClose("exploded preview/export depth", explodedSnapshot.size.depth, snapshot.size.depth);

  const result = {
    width: snapshot.size.width,
    height: snapshot.size.height,
    depth: snapshot.size.depth,
    longTextSize: longText.effectiveTextSize,
    scenarios: scenarios.length + 6,
    parts: snapshot.partCount,
  };
  merged.dispose();
  models.forEach(dispose);
  return result;
}
