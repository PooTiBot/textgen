import { useState } from "react";
import "./index.css";
import Scene from "./components/Scene";

function App() {
  const [text, setText] = useState("Сергей");
  const [depth, setDepth] = useState(12);

  return (
    <div className="app">
      <header className="header">
        <h1>TextGen3D</h1>
        <span>Генератор 3D-имён с кириллицей</span>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <h2>Имя</h2>
          <label>
            Текст
            <input
              value={text}
              maxLength={24}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Сергей"
            />
          </label>

          <label>
            Толщина: <b>{depth} мм</b>
            <input
              type="range"
              min="4"
              max="30"
              step="1"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </label>

          <div className="hint">
            Первая буква — крупная, полное имя — поверх неё. Можно крутить модель мышкой и приближать колёсиком.
          </div>
        </aside>

        <section className="viewport">
          <Scene text={text || "А"} depth={depth} />
        </section>
      </main>
    </div>
  );
}

export default App;
