import GeneratorSceneCanvas from "../../components/GeneratorSceneCanvas";
import type { DecorationItem } from "../../decorations/types";
import type { ExportSnapshot } from "../../export/geometryUtils";
import LedSignModel from "./LedSignModel";
import type { LedSignSettings } from "./types";

type Props = {
  settings: LedSignSettings;
  decorations: readonly DecorationItem[];
  onTextPositionChange: (x: number, y: number) => void;
  onDecorationPositionChange: (id: string, x: number, y: number) => void;
  onFontError: (message: string | null) => void;
  onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
  onEffectiveTextSizeChange: (size: number | null) => void;
};

export default function LedSignScene(props: Props) {
  return (
    <GeneratorSceneCanvas>
      {({ selectedObject, onSelectObject, onDragStateChange }) => (
        <LedSignModel
          {...props}
          selectedObject={selectedObject}
          onSelectObject={onSelectObject}
          onDragStateChange={onDragStateChange}
        />
      )}
    </GeneratorSceneCanvas>
  );
}
