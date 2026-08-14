import type { PrintablePart, PrintablePartType } from "./PrintablePart";

type Props = {
  part: PrintablePart;
};

const PART_COLORS: Record<PrintablePartType, string> = {
  backPanel: "#31495d",
  panelFrame: "#e0ad62",
  initialLetter: "#64b5f6",
  mainName: "#f5f7fa",
  decoration: "#ffca6a",
  extraText: "#e6f2ff",
};

export default function PrintablePartMesh({ part }: Props) {
  if (!part.enabled || !part.previewVisible) return null;

  return (
    <mesh geometry={part.geometry}>
      <meshStandardMaterial
        color={PART_COLORS[part.type]}
        roughness={part.type === "backPanel" ? 0.48 : 0.4}
        metalness={part.type === "backPanel" ? 0.04 : 0}
      />
    </mesh>
  );
}
