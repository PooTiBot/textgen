import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import TextModel from "../models/TextModel";

type Props = {
    text: string;
    depth: number;
};

export default function Scene({ text, depth }: Props) {
    return (
        <Canvas camera={{ position: [5, 4, 8], fov: 42 }}>
            <ambientLight intensity={1.6} />
            <directionalLight position={[5, 6, 7]} intensity={2.4} />
            <directionalLight position={[-5, 2, 4]} intensity={0.9} />

            <TextModel text={text} depth={depth} />
            <Grid position={[0, -3.2, 0]} args={[20, 20]} cellSize={0.5} sectionSize={2.5} fadeDistance={18} />
            <OrbitControls makeDefault enableDamping />
        </Canvas>
    );
}
