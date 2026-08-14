import { useCallback, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { DraggableObject } from "../interaction/types";

export type GeneratorSceneInteraction = {
  selectedObject: DraggableObject | null;
  onSelectObject: (object: DraggableObject) => void;
  onDragStateChange: (object: DraggableObject, dragging: boolean) => void;
};

type Props = {
  children: (interaction: GeneratorSceneInteraction) => ReactNode;
};

export default function GeneratorSceneCanvas({ children }: Props) {
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

      {children({
        selectedObject,
        onSelectObject: setSelectedObject,
        onDragStateChange: handleDragStateChange,
      })}

      <Grid
        position={[0, -3.2, 0]}
        args={[20, 20]}
        cellSize={0.5}
        sectionSize={2.5}
        fadeDistance={18}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        enabled={!draggingObject}
      />
    </Canvas>
  );
}
