import { useEffect, useMemo, useRef, useState } from "react";
import type { Font } from "opentype.js";
import type * as THREE from "three";
import type { DecorationItem } from "../../decorations/types";
import { createExportSnapshot, type ExportSnapshot } from "../../export/geometryUtils";
import { getCatalogFont } from "../../fonts/fontCatalog";
import type { DraggableObject } from "../../interaction/types";
import PrintablePartMesh, { type PrintablePartDragTarget } from "../../parts/PrintablePartMesh";
import { loadFont } from "../../utils/loadFont";
import { buildLedSignParts } from "./buildLedSignParts";
import type { LedSignSettings } from "./types";

type Props = {
  settings: LedSignSettings;
  decorations: readonly DecorationItem[];
  selectedObject: DraggableObject | null;
  onSelectObject: (object: DraggableObject) => void;
  onDragStateChange: (object: DraggableObject, dragging: boolean) => void;
  onTextPositionChange: (x: number, y: number) => void;
  onDecorationPositionChange: (id: string, x: number, y: number) => void;
  onFontError: (message: string | null) => void;
  onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
  onEffectiveTextSizeChange: (size: number | null) => void;
};

export default function LedSignModel({
  settings,
  decorations,
  selectedObject,
  onSelectObject,
  onDragStateChange,
  onTextPositionChange,
  onDecorationPositionChange,
  onFontError,
  onExportSnapshotChange,
  onEffectiveTextSizeChange,
}: Props) {
  const [font, setFont] = useState<Font | null>(null);
  const [frozenPreviewTransform, setFrozenPreviewTransform] = useState<{
    scale: number;
    centerX: number;
    centerY: number;
    centerZ: number;
  } | null>(null);
  const coordinateRootRef = useRef<THREE.Group>(null);
  const catalogFont = getCatalogFont(settings.fontId);

  useEffect(() => {
    let cancelled = false;
    setFont(null);
    onFontError(null);
    loadFont(catalogFont.file).then((loadedFont) => {
      if (!cancelled) setFont(loadedFont);
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
  }, [catalogFont.file, onFontError]);

  const model = useMemo(() => {
    if (!font) return null;
    const built = buildLedSignParts(settings, font, decorations);
    return { ...built, exportSnapshot: createExportSnapshot(built.parts) };
  }, [decorations, font, settings]);

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
  const textDragTarget: PrintablePartDragTarget = {
    object: { id: "led-walls", kind: "ledText" },
    position: { x: settings.textX, y: settings.textY },
    bounds: { minX: -180, maxX: 180, minY: -90, maxY: 90 },
    onPositionChange: onTextPositionChange,
  };
  const getDragTarget = (partId: string): PrintablePartDragTarget | null => {
    if (partId === "led-base" || partId === "led-walls" || partId === "led-caps") {
      return textDragTarget;
    }

    if (partId.startsWith("decoration:")) {
      const id = partId.slice("decoration:".length);
      const item = decorations.find((decoration) => decoration.id === id);
      return item ? {
        object: { id: partId, kind: "decoration" },
        position: { x: item.x, y: item.y },
        bounds: { minX: -250, maxX: 250, minY: -125, maxY: 125 },
        onPositionChange: (x, y) => onDecorationPositionChange(id, x, y),
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
        position={[-previewTransform.centerX, -previewTransform.centerY, -previewTransform.centerZ]}
      >
        {model.parts.map((part) => (
          <PrintablePartMesh
            key={part.id}
            part={part}
            selected={selectedObject?.id === part.id || selectedObject?.id === "led-walls"}
            coordinateRoot={coordinateRootRef}
            dragTarget={getDragTarget(part.id)}
            previewOffsetZ={part.type === "ledBase"
              ? -settings.explodedView
              : part.type === "ledCaps" ? settings.explodedView : 0}
            onSelect={onSelectObject}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </group>
    </group>
  );
}
