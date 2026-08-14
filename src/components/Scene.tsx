import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import TextModel from "../models/TextModel";
import type { DecorationItem } from "../decorations/types";
import type { ExportSnapshot } from "../export/geometryUtils";
import type { CatalogFont } from "../fonts/fontCatalog";
import type { PanelSettings } from "../panel/types";
import type { ExtraTextItem } from "../textItems/types";
import type { NamePocketSettings } from "../tolerance/types";

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

export default function Scene({
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
    return (
        <Canvas camera={{ position: [5, 4, 8], fov: 42 }}>
            <ambientLight intensity={1.6} />
            <directionalLight position={[5, 6, 7]} intensity={2.4} />
            <directionalLight position={[-5, 2, 4]} intensity={0.9} />

            <TextModel
                text={text}
                depth={depth}
                initialFont={initialFont}
                nameFont={nameFont}
                initialSize={initialSize}
                nameSize={nameSize}
                initialOffsetX={initialOffsetX}
                initialOffsetY={initialOffsetY}
                nameOffsetX={nameOffsetX}
                nameOffsetY={nameOffsetY}
                panelSettings={panelSettings}
                decorations={decorations}
                extraTextItems={extraTextItems}
                pocketSettings={pocketSettings}
                showMainName={showMainName}
                onFontError={onFontError}
                onExportSnapshotChange={onExportSnapshotChange}
            />
            <Grid position={[0, -3.2, 0]} args={[20, 20]} cellSize={0.5} sectionSize={2.5} fadeDistance={18} />
            <OrbitControls makeDefault enableDamping />
        </Canvas>
    );
}
