import { useState } from "react";
import { downloadBinaryStl, downloadPartsZip } from "./exportStl";
import type { ExportSnapshot } from "./geometryUtils";

type Props = {
  modelName: string;
  snapshot: ExportSnapshot | null;
  fileNamePrefix?: string;
};

function formatMillimeters(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export default function ExportControls({ modelName, snapshot, fileNamePrefix }: Props) {
  const [exportError, setExportError] = useState<string | null>(null);
  const hasConnectionWarning = Boolean(snapshot?.disconnectedPartIds.length);

  const download = () => {
    if (!snapshot) return;

    try {
      downloadBinaryStl(snapshot, modelName, fileNamePrefix);
      setExportError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка экспорта";
      setExportError(message);
    }
  };

  const downloadParts = () => {
    if (!snapshot) return;

    try {
      downloadPartsZip(snapshot, modelName, fileNamePrefix);
      setExportError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка экспорта";
      setExportError(message);
    }
  };

  return (
    <section className="export-controls" aria-labelledby="export-controls-title">
      <div className="export-controls-title-row">
        <div>
          <span className="panel-controls-kicker">STL · millimeters</span>
          <h2 id="export-controls-title">Экспорт</h2>
        </div>
        <span className="export-part-count">
          {snapshot ? `${snapshot.partCount} частей` : "Подготовка…"}
        </span>
      </div>

      <div className="export-size-card">
        <span>Размер модели</span>
        <strong>
          {snapshot
            ? `${formatMillimeters(snapshot.size.width)} × ${formatMillimeters(snapshot.size.height)} × ${formatMillimeters(snapshot.size.depth)} мм`
            : "— × — × — мм"}
        </strong>
      </div>

      {hasConnectionWarning && (
        <div className="export-warning" role="status">
          Некоторые элементы могут не соединяться с панелью и напечататься отдельно.
        </div>
      )}

      {exportError && <div className="export-error" role="alert">{exportError}</div>}

      <button
        className="export-download-button"
        type="button"
        disabled={!snapshot}
        onClick={download}
      >
        Скачать STL
      </button>
      <button
        className="export-parts-button"
        type="button"
        disabled={!snapshot}
        onClick={downloadParts}
      >
        Скачать детали отдельно
      </button>
      <p className="export-note">Binary STL в миллиметрах. Отдельные детали скачиваются одним ZIP.</p>
    </section>
  );
}
