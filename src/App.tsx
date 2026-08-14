import { useState } from "react";
import "./index.css";
import KeychainGenerator from "./generators/keychain/KeychainGenerator";
import NameplateGenerator from "./generators/nameplate/NameplateGenerator";
import LedSignGenerator from "./generators/led-sign/LedSignGenerator";
import { GENERATORS, type GeneratorId } from "./generators/types";

export default function App() {
  const [generatorId, setGeneratorId] = useState<GeneratorId>("nameplate");

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>TextGen3D</h1>
          <span>Конструктор моделей для 3D-печати</span>
        </div>
        <nav className="generator-switcher" aria-label="Выбор генератора">
          {GENERATORS.map((generator) => (
            <button
              type="button"
              key={generator.id}
              className={generatorId === generator.id ? "is-active" : ""}
              aria-pressed={generatorId === generator.id}
              title={generator.description}
              onClick={() => setGeneratorId(generator.id)}
            >
              {generator.name}
            </button>
          ))}
        </nav>
      </header>

      {generatorId === "nameplate" && <NameplateGenerator />}
      {generatorId === "keychain" && <KeychainGenerator />}
      {generatorId === "led-sign" && <LedSignGenerator />}
    </div>
  );
}
