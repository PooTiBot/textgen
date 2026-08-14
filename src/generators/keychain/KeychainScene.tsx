import type { DecorationItem } from "../../decorations/types";
import type { ExportSnapshot } from "../../export/geometryUtils";
import GeneratorSceneCanvas from "../../components/GeneratorSceneCanvas";
import KeychainModel from "./KeychainModel";
import type { KeychainSettings } from "./types";
import type { ExtraTextItem } from "../../textItems/types";

type Props = {
  settings: KeychainSettings;
  decorations: readonly DecorationItem[];
  extraTextItems: readonly ExtraTextItem[];
  onTextPositionChange: (x: number, y: number) => void;
  onDecorationPositionChange: (id: string, x: number, y: number) => void;
  onExtraTextPositionChange: (id: string, x: number, y: number) => void;
  onFontError: (message: string | null) => void;
  onExportSnapshotChange: (snapshot: ExportSnapshot | null) => void;
  onEffectiveTextSizeChange: (size: number | null) => void;
};

export default function KeychainScene(props: Props) {
  return (
    <GeneratorSceneCanvas>
      {({ selectedObject, onSelectObject, onDragStateChange }) => (
        <KeychainModel
          {...props}
          selectedObject={selectedObject}
          onSelectObject={onSelectObject}
          onDragStateChange={onDragStateChange}
        />
      )}
    </GeneratorSceneCanvas>
  );
}
