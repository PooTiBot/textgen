import TextModel from "../models/TextModel";
import type { DecorationItem } from "../decorations/types";
import type { ExportSnapshot } from "../export/geometryUtils";
import type { CatalogFont } from "../fonts/fontCatalog";
import type { PanelSettings } from "../panel/types";
import type { PhotoWindowSettings } from "../photoWindow/types";
import type { ExtraTextItem } from "../textItems/types";
import type { NamePocketSettings } from "../tolerance/types";
import GeneratorSceneCanvas from "./GeneratorSceneCanvas";

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
    photoWindowSettings: PhotoWindowSettings;
    decorations: readonly DecorationItem[];
    extraTextItems: readonly ExtraTextItem[];
    pocketSettings: NamePocketSettings;
    showMainName: boolean;
    onInitialPositionChange: (x: number, y: number) => void;
    onNamePositionChange: (x: number, y: number) => void;
    onDecorationPositionChange: (id: string, x: number, y: number) => void;
    onExtraTextPositionChange: (id: string, x: number, y: number) => void;
    onFontError: (message: string | null) => void;
    onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
};

export default function Scene({
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
    photoWindowSettings,
    decorations,
    extraTextItems,
    pocketSettings,
    showMainName,
    onInitialPositionChange,
    onNamePositionChange,
    onDecorationPositionChange,
    onExtraTextPositionChange,
    onFontError,
    onExportSnapshotChange,
}: Props) {
    return (
        <GeneratorSceneCanvas>
            {({ selectedObject, onSelectObject, onDragStateChange }) => (
                <TextModel
                    initialText={initialText}
                    text={text}
                    initialDepth={initialDepth}
                    nameDepth={nameDepth}
                    initialFont={initialFont}
                    nameFont={nameFont}
                    initialSize={initialSize}
                    nameSize={nameSize}
                    initialOffsetX={initialOffsetX}
                    initialOffsetY={initialOffsetY}
                    nameOffsetX={nameOffsetX}
                    nameOffsetY={nameOffsetY}
                    panelSettings={panelSettings}
                    photoWindowSettings={photoWindowSettings}
                    decorations={decorations}
                    extraTextItems={extraTextItems}
                    pocketSettings={pocketSettings}
                    showMainName={showMainName}
                    selectedObject={selectedObject}
                    onSelectObject={onSelectObject}
                    onDragStateChange={onDragStateChange}
                    onInitialPositionChange={onInitialPositionChange}
                    onNamePositionChange={onNamePositionChange}
                    onDecorationPositionChange={onDecorationPositionChange}
                    onExtraTextPositionChange={onExtraTextPositionChange}
                    onFontError={onFontError}
                    onExportSnapshotChange={onExportSnapshotChange}
                />
            )}
        </GeneratorSceneCanvas>
    );
}
