import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import TextModel from "../models/TextModel";
import type { DecorationItem } from "../decorations/types";
import type { ExportSnapshot } from "../export/geometryUtils";
import type { CatalogFont } from "../fonts/fontCatalog";
import type { DraggableObject } from "../interaction/types";
import type { PanelSettings } from "../panel/types";
import type { ExtraTextItem } from "../textItems/types";
import type { NamePocketSettings } from "../tolerance/types";

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
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const [selectedObject, setSelectedObject] = useState<DraggableObject | null>(null);
    const [draggingObject, setDraggingObject] = useState<DraggableObject | null>(null);
    const handleDragStateChange = useCallback((object: DraggableObject, dragging: boolean) => {
        if (controlsRef.current) controlsRef.current.enabled = !dragging;
        setDraggingObject(dragging ? object : null);
        if (dragging) setSelectedObject(object);
    }, []);

    return (
        <Canvas
            camera={{ position: [5, 4, 8], fov: 42 }}
            onPointerMissed={() => {
                if (!draggingObject) setSelectedObject(null);
            }}
        >
            <ambientLight intensity={1.6} />
            <directionalLight position={[5, 6, 7]} intensity={2.4} />
            <directionalLight position={[-5, 2, 4]} intensity={0.9} />

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
                decorations={decorations}
                extraTextItems={extraTextItems}
                pocketSettings={pocketSettings}
                showMainName={showMainName}
                selectedObject={selectedObject}
                onSelectObject={setSelectedObject}
                onDragStateChange={handleDragStateChange}
                onInitialPositionChange={onInitialPositionChange}
                onNamePositionChange={onNamePositionChange}
                onDecorationPositionChange={onDecorationPositionChange}
                onExtraTextPositionChange={onExtraTextPositionChange}
                onFontError={onFontError}
                onExportSnapshotChange={onExportSnapshotChange}
            />
            <Grid position={[0, -3.2, 0]} args={[20, 20]} cellSize={0.5} sectionSize={2.5} fadeDistance={18} />
            <OrbitControls
                ref={controlsRef}
                makeDefault
                enableDamping
                enabled={!draggingObject}
            />
        </Canvas>
    );
}
