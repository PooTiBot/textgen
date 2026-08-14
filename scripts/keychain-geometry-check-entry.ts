import { unzipSync } from "fflate";
import { parse } from "opentype.js";
import * as THREE from "three";
import { createPartsZipArchive } from "../src/export/exportStl";
import {
  createExportSnapshot,
  createMergedExportGeometry,
  validateExportGeometry,
} from "../src/export/geometryUtils";
import { buildKeychainParts } from "../src/generators/keychain/buildKeychainParts";
import { getKeychainMountWarning } from "../src/generators/keychain/geometry";
import { DEFAULT_KEYCHAIN_SETTINGS } from "../src/generators/keychain/presets";
import type { KeychainSettings } from "../src/generators/keychain/types";

function assertClose(label: string, actual: number, expected: number, tolerance = 0.08) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected} mm, received ${actual} mm.`);
  }
}

function partBox(model: ReturnType<typeof buildKeychainParts>, id: string) {
  const part = model.parts.find((candidate) => candidate.id === id);
  if (!part) throw new Error(`Missing keychain part: ${id}.`);
  part.geometry.computeBoundingBox();
  return part.geometry.boundingBox!;
}

function dispose(model: ReturnType<typeof buildKeychainParts>) {
  model.parts.forEach((part) => part.geometry.dispose());
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
    new THREE.Vector3(x, y, 20),
    new THREE.Vector3(0, 0, -1),
  ).intersectObject(mesh);
  if (hits.length > 0) throw new Error(`${label}: opening is not cut through the base.`);
}

export function runKeychainGeometryCheck(
  regularFontBuffer: ArrayBuffer,
  scriptFontBuffer: ArrayBuffer,
) {
  const regularFont = parse(regularFontBuffer);
  const scriptFont = parse(scriptFontBuffer);
  const shapeModels = (["capsule", "rounded-rectangle", "oval"] as const).map((shape) => {
    const model = buildKeychainParts({
      ...DEFAULT_KEYCHAIN_SETTINGS,
      shape,
      mountType: "hole",
      holeEnabled: false,
      text: "",
    }, regularFont, []);
    const size = partBox(model, "keychain-base").getSize(new THREE.Vector3());
    assertClose(`${shape}/width`, size.x, 70);
    assertClose(`${shape}/height`, size.y, 25);
    assertClose(`${shape}/thickness`, size.z, 3);
    return model;
  });
  const scenarioA = buildKeychainParts(DEFAULT_KEYCHAIN_SETTINGS, regularFont, []);
  const baseA = partBox(scenarioA, "keychain-base");
  const baseSizeA = baseA.getSize(new THREE.Vector3());
  assertClose("Scenario A/base width", baseSizeA.x, 70);
  assertClose("Scenario A/base height", baseSizeA.y, 25);
  assertClose("Scenario A/base thickness", baseSizeA.z, 3);
  assertVerticalOpening(
    scenarioA.parts.find((part) => part.id === "keychain-base")!.geometry,
    DEFAULT_KEYCHAIN_SETTINGS.holeX,
    DEFAULT_KEYCHAIN_SETTINGS.holeY,
    "Scenario A/hole",
  );
  if (getKeychainMountWarning(DEFAULT_KEYCHAIN_SETTINGS)) {
    throw new Error("Scenario A/default hole unexpectedly has a placement warning.");
  }
  const snapshotA = createExportSnapshot(scenarioA.parts);
  assertClose("Scenario A/export width", snapshotA.size.width, 70);
  const mergedA = createMergedExportGeometry(snapshotA.parts);
  validateExportGeometry(mergedA);
  const archiveA = unzipSync(createPartsZipArchive(snapshotA));
  ["keychain-base.stl", "keychain-text.stl"].forEach((fileName) => {
    if (!archiveA[fileName] || archiveA[fileName].length <= 84) {
      throw new Error(`Scenario A/archive is missing ${fileName}.`);
    }
  });

  const scenarioBSettings: KeychainSettings = {
    ...DEFAULT_KEYCHAIN_SETTINGS,
    text: "София",
    textMode: "inlay",
    tolerance: 0.2,
  };
  const scenarioB = buildKeychainParts(scenarioBSettings, regularFont, []);
  if (!scenarioB.pocketCreated) throw new Error("Scenario B/inlay pocket was not created.");
  assertClose(
    "Scenario B/base thickness",
    partBox(scenarioB, "keychain-base").getSize(new THREE.Vector3()).z,
    3,
  );

  const scenarioC = buildKeychainParts({
    ...DEFAULT_KEYCHAIN_SETTINGS,
    text: "Александра",
    textSize: 24,
    autoFit: true,
  }, regularFont, []);
  if (scenarioC.effectiveTextSize >= 24) {
    throw new Error("Scenario C/auto-fit did not reduce a long name.");
  }

  const scenarioD = buildKeychainParts({
    ...DEFAULT_KEYCHAIN_SETTINGS,
    text: "Пример",
    fontId: "pacifico",
  }, scriptFont, []);
  validateExportGeometry(scenarioD.parts.find((part) => part.id === "keychain-text")!.geometry);

  const scenarioESettings: KeychainSettings = {
    ...DEFAULT_KEYCHAIN_SETTINGS,
    mountType: "loop",
    loopSide: "left",
  };
  const scenarioE = buildKeychainParts(scenarioESettings, regularFont, []);
  const loopCenterX = partBox(scenarioE, "keychain-base").min.x + scenarioESettings.loopOuterDiameter / 2;
  assertVerticalOpening(
    scenarioE.parts.find((part) => part.id === "keychain-base")!.geometry,
    loopCenterX,
    0,
    "Scenario E/loop",
  );
  if (partBox(scenarioE, "keychain-base").getSize(new THREE.Vector3()).x <= 70) {
    throw new Error("Scenario E/loop is not attached outside the base.");
  }

  const scenarioF = buildKeychainParts(DEFAULT_KEYCHAIN_SETTINGS, regularFont, [{
    id: "star",
    type: "star",
    x: 20,
    y: 6,
    z: 0,
    size: 6,
    depth: 1.2,
    rotation: 0,
    enabled: true,
  }]);
  if (!scenarioF.parts.some((part) => part.id === "decoration:star")) {
    throw new Error("Scenario F/decoration printable part is missing.");
  }

  const scenarioG = buildKeychainParts(
    DEFAULT_KEYCHAIN_SETTINGS,
    regularFont,
    [],
    [
      { id: "phone", text: "8 900 000-00-00", fontId: "regular", x: 5, y: -6, z: 0, size: 8, depth: 1.2, rotation: 0, enabled: true },
      { id: "date", text: "2026", fontId: "script", x: 10, y: 6, z: 0.5, size: 9, depth: 1, rotation: -5, enabled: true },
    ],
    new Map([
      ["regular", regularFont],
      ["script", scriptFont],
    ]),
  );
  ["extra-text:phone", "extra-text:date"].forEach((id) => {
    if (!scenarioG.parts.some((part) => part.id === id)) {
      throw new Error(`Scenario G/missing keychain extra text part: ${id}.`);
    }
  });
  const archiveG = unzipSync(createPartsZipArchive(createExportSnapshot(scenarioG.parts)));
  ["keychain-extra-text-1.stl", "keychain-extra-text-2.stl"].forEach((fileName) => {
    if (!archiveG[fileName] || archiveG[fileName].length <= 84) {
      throw new Error(`Scenario G/archive is missing ${fileName}.`);
    }
  });

  const invalidHoleWarning = getKeychainMountWarning({
    ...DEFAULT_KEYCHAIN_SETTINGS,
    holeX: -35,
  });
  if (!invalidHoleWarning) throw new Error("Out-of-bounds hole did not produce a warning.");

  const result = {
    width: snapshotA.size.width,
    height: baseSizeA.y,
    thickness: baseSizeA.z,
    effectiveLongNameSize: scenarioC.effectiveTextSize,
    scenarios: 7,
  };
  mergedA.dispose();
  [
    ...shapeModels,
    scenarioA,
    scenarioB,
    scenarioC,
    scenarioD,
    scenarioE,
    scenarioF,
    scenarioG,
  ].forEach(dispose);
  return result;
}
