import { useEffect, useMemo, useRef, useState } from "react";
import type { Font } from "opentype.js";
import type * as THREE from "three";
import type { DecorationItem } from "../../decorations/types";
import { createExportSnapshot, type ExportSnapshot } from "../../export/geometryUtils";
import { getCatalogFont } from "../../fonts/fontCatalog";
import type { DraggableObject } from "../../interaction/types";
import PrintablePartMesh, { type PrintablePartDragTarget } from "../../parts/PrintablePartMesh";
import { loadFont } from "../../utils/loadFont";
import type { ExtraTextItem } from "../../textItems/types";
import { buildKeychainParts } from "./buildKeychainParts";
import type { KeychainSettings } from "./types";

type Props = {
  settings: KeychainSettings;
  decorations: readonly DecorationItem[];
  extraTextItems: readonly ExtraTextItem[];
  selectedObject: DraggableObject | null;
  onSelectObject: (object: DraggableObject) => void;
  onDragStateChange: (object: DraggableObject, dragging: boolean) => void;
  onTextPositionChange: (x: number, y: number) => void;
  onDecorationPositionChange: (id: string, x: number, y: number) => void;
  onExtraTextPositionChange: (id: string, x: number, y: number) => void;
  onFontError: (message: string | null) => void;
  onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
  onEffectiveTextSizeChange: (size: number | null) => void;
};

export default function KeychainModel({
  settings,
  decorations,
  extraTextItems,
  selectedObject,
  onSelectObject,
  onDragStateChange,
  onTextPositionChange,
  onDecorationPositionChange,
  onExtraTextPositionChange,
  onFontError,
  onExportSnapshotChange,
  onEffectiveTextSizeChange,
}: Props) {
  const [fonts, setFonts] = useState<{
    main: Font;
    extra: ReadonlyMap<string, Font>;
  } | null>(null);
  const [frozenPreviewTransform, setFrozenPreviewTransform] = useState<{
    scale: number;
    centerX: number;
    centerY: number;
    centerZ: number;
  } | null>(null);
  const coordinateRootRef = useRef<THREE.Group>(null);
  const catalogFont = getCatalogFont(settings.fontId);
  const extraFontIdsKey = useMemo(() => (
    Array.from(new Set(extraTextItems.map((item) => item.fontId))).sort().join("|")
  ), [extraTextItems]);

  useEffect(() => {
    let cancelled = false;
    setFonts(null);
    onFontError(null);

    const extraFontIds = extraFontIdsKey ? extraFontIdsKey.split("|") : [];
    Promise.all([
      loadFont(catalogFont.file),
      ...extraFontIds.map((fontId) => loadFont(getCatalogFont(fontId).file)),
    ]).then(([main, ...loadedExtraFonts]) => {
      if (!cancelled) {
        setFonts({
          main,
          extra: new Map(extraFontIds.map((fontId, index) => [fontId, loadedExtraFonts[index]])),
        });
      }
    }).catch((error: unknown) => {
      console.error(error);
      if (!cancelled) {
        const message = error instanceof Error ? error.message : "Неизвестная ошибка";
        onFontError(`Не удалось загрузить локальный шрифт: ${message}`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [catalogFont.file, extraFontIdsKey, onFontError]);

  const model = useMemo(() => {
    if (!fonts) return null;
    const built = buildKeychainParts(settings, fonts.main, decorations, extraTextItems, fonts.extra);
    return { ...built, exportSnapshot: createExportSnapshot(built.parts) };
  }, [decorations, extraTextItems, fonts, settings]);

  useEffect(() => {
    onExportSnapshotChange(model?.exportSnapshot ?? null);
    onEffectiveTextSizeChange(model?.effectiveTextSize ?? null);
  }, [model, onEffectiveTextSizeChange, onExportSnapshotChange]);

  useEffect(() => () => {
    model?.parts.forEach((part) => part.geometry.dispose());
  }, [model]);

  if (!model) return null;

  const handleDragStart = (object: DraggableObject) => {
    setFrozenPreviewTransform((current) => current ?? {
      scale: model.previewScale,
      centerX: model.centerX,
      centerY: model.centerY,
      centerZ: model.centerZ,
    });
    onDragStateChange(object, true);
  };

  const handleDragEnd = (object: DraggableObject) => {
    setFrozenPreviewTransform(null);
    onDragStateChange(object, false);
  };

  const getDragTarget = (partId: string): PrintablePartDragTarget | null => {
    if (partId === "keychain-text") {
      return {
        object: { id: partId, kind: "keychainText" },
        position: { x: settings.textX, y: settings.textY },
        bounds: { minX: -50, maxX: 50, minY: -25, maxY: 25 },
        onPositionChange: onTextPositionChange,
      };
    }

    if (partId.startsWith("decoration:")) {
      const id = partId.slice("decoration:".length);
      const item = decorations.find((decoration) => decoration.id === id);
      return item ? {
        object: { id: partId, kind: "decoration" },
        position: { x: item.x, y: item.y },
        bounds: { minX: -100, maxX: 100, minY: -50, maxY: 50 },
        onPositionChange: (x, y) => onDecorationPositionChange(id, x, y),
      } : null;
    }

    if (partId.startsWith("extra-text:")) {
      const id = partId.slice("extra-text:".length);
      const item = extraTextItems.find((extraText) => extraText.id === id);
      return item ? {
        object: { id: partId, kind: "extraText" },
        position: { x: item.x, y: item.y },
        bounds: { minX: -100, maxX: 100, minY: -50, maxY: 50 },
        onPositionChange: (x, y) => onExtraTextPositionChange(id, x, y),
      } : null;
    }

    return null;
  };
  const previewTransform = frozenPreviewTransform ?? {
    scale: model.previewScale,
    centerX: model.centerX,
    centerY: model.centerY,
    centerZ: model.centerZ,
  };

  return (
    <group scale={previewTransform.scale}>
      <group
        ref={coordinateRootRef}
        position={[
          -previewTransform.centerX,
          -previewTransform.centerY,
          -previewTransform.centerZ,
        ]}
      >
        {model.parts.map((part) => (
          <PrintablePartMesh
            key={part.id}
            part={part}
            selected={selectedObject?.id === part.id}
            coordinateRoot={coordinateRootRef}
            dragTarget={getDragTarget(part.id)}
            onSelect={onSelectObject}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </group>
    </group>
  );
}
