import { areaPathsD, getBoundsPathsD, type PathsD } from "clipper2-ts";
import { parse, type Font } from "opentype.js";
import { createNamePocket, createExpandedNamePaths } from "../src/tolerance/createNamePocket";
import { shapesToClipperPaths, transformClipperPaths } from "../src/tolerance/polygonUtils";
import { createGeometryFromShapes, createTextShapes } from "../src/textItems/geometry";
import { validateExportGeometry } from "../src/export/geometryUtils";

const TEXTS = ["Сергей", "София", "Александр", "Ёжик"];
const TOLERANCES = [0, 0.2, 0.4, 1, 2, 3];

function placeTextPaths(font: Font, text: string) {
  const initialShapes = createTextShapes(font, Array.from(text)[0], 120);
  const nameShapes = createTextShapes(font, text, 42);
  const initialGeometry = createGeometryFromShapes(initialShapes, 8, false);
  const nameGeometry = createGeometryFromShapes(nameShapes, 8, false);
  const initialBox = initialGeometry.boundingBox!;
  const nameBox = nameGeometry.boundingBox!;
  const initialWidth = initialBox.max.x - initialBox.min.x;
  const initialX = -initialBox.min.x;
  const initialY = -(initialBox.min.y + initialBox.max.y) / 2;
  const nameX = initialWidth * 0.05 - nameBox.min.x;
  const nameY = -(nameBox.min.y + nameBox.max.y) / 2;
  initialGeometry.dispose();
  nameGeometry.dispose();

  return {
    initialPaths: transformClipperPaths(shapesToClipperPaths(initialShapes), initialX, initialY),
    namePaths: transformClipperPaths(shapesToClipperPaths(nameShapes), nameX, nameY),
  };
}

function solidArea(paths: PathsD) {
  return Math.abs(areaPathsD(paths));
}

export function runToleranceGeometryCheck(fontBuffers: Record<string, ArrayBuffer>) {
  let caseCount = 0;
  let vertexCount = 0;

  for (const [fontName, buffer] of Object.entries(fontBuffers)) {
    const font = parse(buffer);

    for (const text of TEXTS) {
      const { initialPaths, namePaths } = placeTextPaths(font, text);
      const basePaths = createExpandedNamePaths(namePaths, 0);
      const baseBounds = getBoundsPathsD(basePaths);
      let previousArea = solidArea(basePaths);

      for (const tolerance of TOLERANCES) {
        const expanded = createExpandedNamePaths(namePaths, tolerance);
        const expandedArea = solidArea(expanded);
        const expandedBounds = getBoundsPathsD(expanded);

        if (expandedArea + 0.001 < previousArea) {
          throw new Error(`${fontName}/${text}: offset area decreased at ${tolerance} mm.`);
        }

        if (tolerance > 0 && (
          expandedBounds.left > baseBounds.left - tolerance * 0.7
          || expandedBounds.right < baseBounds.right + tolerance * 0.7
          || expandedBounds.top > baseBounds.top - tolerance * 0.7
          || expandedBounds.bottom < baseBounds.bottom + tolerance * 0.7
        )) {
          throw new Error(`${fontName}/${text}: offset did not expand uniformly at ${tolerance} mm.`);
        }

        const pocket = createNamePocket(initialPaths, namePaths, 8, {
          enabled: true,
          tolerance,
          depth: 2,
        });

        if (!pocket) {
          const initialBounds = getBoundsPathsD(initialPaths);
          const nameBounds = getBoundsPathsD(namePaths);
          throw new Error(
            `${fontName}/${text}: pocket intersection is empty; initial=${JSON.stringify(initialBounds)}, name=${JSON.stringify(nameBounds)}, paths=${initialPaths.length}/${namePaths.length}.`,
          );
        }
        validateExportGeometry(pocket.geometry);
        vertexCount += pocket.geometry.getAttribute("position").count;
        pocket.geometry.dispose();
        previousArea = expandedArea;
        caseCount += 1;
      }
    }
  }

  return { caseCount, vertexCount };
}
