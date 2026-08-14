import { useEffect, useMemo, useState } from "react";
import type { Font } from "opentype.js";
import type { DecorationItem } from "../decorations/types";
import { createExportSnapshot, type ExportSnapshot } from "../export/geometryUtils";
import { getCatalogFont, type CatalogFont } from "../fonts/fontCatalog";
import {
    buildPrintableParts,
    type CompositionFonts,
} from "../parts/buildPrintableParts";
import PrintablePartMesh from "../parts/PrintablePartMesh";
import type { PanelSettings } from "../panel/types";
import type { ExtraTextItem } from "../textItems/types";
import type { NamePocketSettings } from "../tolerance/types";
import { loadFont } from "../utils/loadFont";

type Props = {
    text: string;
    depth: number;
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
    onFontError: (message: string | null) => void;
    onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
};

type LoadedFonts = CompositionFonts & {
    initial: Font;
    name: Font;
};

export default function TextModel({
    text,
    depth,
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
    onFontError,
    onExportSnapshotChange,
}: Props) {
    const [fonts, setFonts] = useState<LoadedFonts | null>(null);
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
            text,
            depth,
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
        text,
        depth,
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

    return (
        <group scale={model.previewScale}>
            <group position={[-model.centerX, -model.centerY, 0]}>
                {model.parts.map((part) => <PrintablePartMesh key={part.id} part={part} />)}
            </group>
        </group>
    );
}
