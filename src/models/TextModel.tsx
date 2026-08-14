import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import type { Font } from "opentype.js";
import type { DecorationItem } from "../decorations/types";
import { createExportSnapshot, type ExportSnapshot } from "../export/geometryUtils";
import { getCatalogFont, type CatalogFont } from "../fonts/fontCatalog";
import type { DraggableObject } from "../interaction/types";
import {
    buildPrintableParts,
    type CompositionFonts,
} from "../parts/buildPrintableParts";
import PrintablePartMesh, { type PrintablePartDragTarget } from "../parts/PrintablePartMesh";
import type { PanelSettings } from "../panel/types";
import type { ExtraTextItem } from "../textItems/types";
import type { NamePocketSettings } from "../tolerance/types";
import { loadFont } from "../utils/loadFont";

type Props = {
    initialText: string;
    text: string;
    initialDepth: number;
    nameDepth: number;
    initialFont: CatalogFont;
    nameFont: CatalogFont;
    initialSize: number;
    nameSize: number;
    initialOffsetX: number;
    initialOffsetY: number;
    nameOffsetX: number;
    nameOffsetY: number;
    panelSettings: PanelSettings;
    decorations: readonly DecorationItem[];
    extraTextItems: readonly ExtraTextItem[];
    pocketSettings: NamePocketSettings;
    showMainName: boolean;
    selectedObject: DraggableObject | null;
    onSelectObject: (object: DraggableObject) => void;
    onDragStateChange: (object: DraggableObject, dragging: boolean) => void;
    onInitialPositionChange: (x: number, y: number) => void;
    onNamePositionChange: (x: number, y: number) => void;
    onDecorationPositionChange: (id: string, x: number, y: number) => void;
    onExtraTextPositionChange: (id: string, x: number, y: number) => void;
    onFontError: (message: string | null) => void;
    onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
};

type LoadedFonts = CompositionFonts & {
    initial: Font;
    name: Font;
};

export default function TextModel({
    initialText,
    text,
    initialDepth,
    nameDepth,
    initialFont,
    nameFont,
    initialSize,
    nameSize,
    initialOffsetX,
    initialOffsetY,
    nameOffsetX,
    nameOffsetY,
    panelSettings,
    decorations,
    extraTextItems,
    pocketSettings,
    showMainName,
    selectedObject,
    onSelectObject,
    onDragStateChange,
    onInitialPositionChange,
    onNamePositionChange,
    onDecorationPositionChange,
    onExtraTextPositionChange,
    onFontError,
    onExportSnapshotChange,
}: Props) {
    const [fonts, setFonts] = useState<LoadedFonts | null>(null);
    const [frozenPreviewTransform, setFrozenPreviewTransform] = useState<{
        scale: number;
        centerX: number;
        centerY: number;
        centerZ: number;
    } | null>(null);
    const coordinateRootRef = useRef<THREE.Group>(null);
    const extraFontIdsKey = useMemo(() => (
        Array.from(new Set(extraTextItems.map((item) => item.fontId))).sort().join("|")
    ), [extraTextItems]);

    useEffect(() => {
        let cancelled = false;
        const extraFontIds = extraFontIdsKey ? extraFontIdsKey.split("|") : [];

        setFonts(null);
        onFontError(null);

        Promise.all([
            loadFont(initialFont.file),
            loadFont(nameFont.file),
            ...extraFontIds.map((fontId) => loadFont(getCatalogFont(fontId).file)),
        ]).then(([loadedInitialFont, loadedNameFont, ...loadedExtraFonts]) => {
            if (!cancelled) {
                setFonts({
                    initial: loadedInitialFont,
                    name: loadedNameFont,
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
    }, [extraFontIdsKey, initialFont.file, nameFont.file, onFontError]);

    const model = useMemo(() => {
        if (!fonts || !text.trim()) return null;

        const built = buildPrintableParts({
            initialText,
            text,
            initialDepth,
            nameDepth,
            initialSize,
            nameSize,
            initialOffsetX,
            initialOffsetY,
            nameOffsetX,
            nameOffsetY,
            panelSettings,
            decorations,
            extraTextItems,
            pocketSettings,
            showMainName,
            fonts,
        });

        return {
            ...built,
            exportSnapshot: createExportSnapshot(built.parts),
        };
    }, [
        fonts,
        initialText,
        text,
        initialDepth,
        nameDepth,
        initialSize,
        nameSize,
        initialOffsetX,
        initialOffsetY,
        nameOffsetX,
        nameOffsetY,
        panelSettings,
        decorations,
        extraTextItems,
        pocketSettings,
        showMainName,
    ]);

    useEffect(() => {
        onExportSnapshotChange(model?.exportSnapshot ?? null);
    }, [model, onExportSnapshotChange]);

    useEffect(() => {
        return () => {
            model?.parts.forEach((part) => part.geometry.dispose());
        };
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
        if (partId === "initial") {
            return {
                object: { id: partId, kind: "initialLetter" },
                position: { x: initialOffsetX, y: initialOffsetY },
                bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
                onPositionChange: onInitialPositionChange,
            };
        }

        if (partId === "name") {
            return {
                object: { id: partId, kind: "mainName" },
                position: { x: nameOffsetX, y: nameOffsetY },
                bounds: { minX: -150, maxX: 150, minY: -150, maxY: 150 },
                onPositionChange: onNamePositionChange,
            };
        }

        if (partId.startsWith("decoration:")) {
            const id = partId.slice("decoration:".length);
            const item = decorations.find((decoration) => decoration.id === id);
            return item ? {
                object: { id: partId, kind: "decoration" },
                position: { x: item.x, y: item.y },
                bounds: { minX: -300, maxX: 300, minY: -300, maxY: 300 },
                onPositionChange: (x, y) => onDecorationPositionChange(id, x, y),
            } : null;
        }

        if (partId.startsWith("extra-text:")) {
            const id = partId.slice("extra-text:".length);
            const item = extraTextItems.find((extraText) => extraText.id === id);
            return item ? {
                object: { id: partId, kind: "extraText" },
                position: { x: item.x, y: item.y },
                bounds: { minX: -300, maxX: 300, minY: -300, maxY: 300 },
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
