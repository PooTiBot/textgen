import type { RefObject } from "react";
import type * as THREE from "three";
import useDraggableXY from "../interaction/useDraggableXY";
import type {
  DraggableObject,
  XYBounds,
  XYPosition,
} from "../interaction/types";
import type { PrintablePart, PrintablePartType } from "./PrintablePart";

export type PrintablePartDragTarget = {
  object: DraggableObject;
  position: XYPosition;
  bounds: XYBounds;
  onPositionChange: (x: number, y: number) => void;
};

type Props = {
  part: PrintablePart;
  selected: boolean;
  coordinateRoot: RefObject<THREE.Group | null>;
  dragTarget: PrintablePartDragTarget | null;
  onSelect: (object: DraggableObject) => void;
  onDragStart: (object: DraggableObject) => void;
  onDragEnd: (object: DraggableObject) => void;
  previewOffsetZ?: number;
};

const PART_COLORS: Record<PrintablePartType, string> = {
  backPanel: "#31495d",
  panelFrame: "#e0ad62",
  initialLetter: "#64b5f6",
  mainName: "#f5f7fa",
  keychainBase: "#31495d",
  keychainText: "#f5f7fa",
  ledBase: "#e0ad62",
  ledWalls: "#3fb984",
  ledCaps: "#f5f7fa",
  photoFrame: "#e0ad62",
  decoration: "#ffca6a",
  extraText: "#e6f2ff",
};

export default function PrintablePartMesh({
  part,
  selected,
  coordinateRoot,
  dragTarget,
  onSelect,
  onDragStart,
  onDragEnd,
  previewOffsetZ = 0,
}: Props) {
  const dragHandlers = useDraggableXY({
    enabled: Boolean(dragTarget),
    object: dragTarget?.object ?? { id: part.id, kind: "decoration" },
    position: dragTarget?.position ?? { x: 0, y: 0 },
    bounds: dragTarget?.bounds ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    coordinateRoot,
    onPositionChange: dragTarget?.onPositionChange ?? (() => undefined),
    onSelect,
    onDragStart,
    onDragEnd,
  });

  if (!part.enabled || !part.previewVisible) return null;

  return (
    <mesh
      geometry={part.geometry}
      position-z={previewOffsetZ}
      {...(dragTarget ? dragHandlers : {})}
    >
      <meshStandardMaterial
        color={PART_COLORS[part.type]}
        emissive={selected ? PART_COLORS[part.type] : "#000000"}
        emissiveIntensity={selected ? 0.2 : 0}
        roughness={part.type === "backPanel" || part.type === "keychainBase" || part.type === "ledWalls" ? 0.48 : 0.4}
        metalness={part.type === "backPanel" || part.type === "keychainBase" || part.type === "ledWalls" ? 0.04 : 0}
      />
    </mesh>
  );
}
