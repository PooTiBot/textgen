import { useEffect, useId, useState } from "react";
import {
  FONT_CATALOG,
  FONT_CATEGORIES,
  getCatalogFont,
  getCatalogFontFamily,
  type FontPrintability,
} from "../fonts/fontCatalog";

type Props = {
  label: string;
  value: string;
  previewText: string;
  mode: "bigLetter" | "name";
  onChange: (fontId: string) => void;
};

const PRINTABILITY_LABELS: Record<FontPrintability, string> = {
  good: "Хорош для печати",
  medium: "Средний",
  thin: "Тонкий",
};

export default function FontPicker({ label, value, previewText, mode, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const selectedFont = getCatalogFont(value);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="control-group font-picker-control">
      <span className="control-label">{label}</span>
      <button
        type="button"
        className="font-picker-trigger"
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <span
          className={`font-picker-trigger-preview ${mode === "bigLetter" ? "is-letter" : ""}`}
          style={{ fontFamily: getCatalogFontFamily(selectedFont.id) }}
        >
          {previewText}
        </span>
        <span className="font-picker-trigger-info">
          <strong>{selectedFont.name}</strong>
          <small>{selectedFont.categories.join(" · ")}</small>
        </span>
        <span className="font-picker-trigger-action">Выбрать</span>
      </button>

      {isOpen && (
        <div className="font-modal-backdrop">
          <button
            type="button"
            className="font-modal-dismiss"
            aria-label="Закрыть выбор шрифта"
            onClick={() => setIsOpen(false)}
          />
          <section className="font-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="font-modal-header">
              <div>
                <span className="font-modal-kicker">Локальная библиотека</span>
                <h2 id={titleId}>{label}</h2>
              </div>
              <button type="button" className="font-modal-close" onClick={() => setIsOpen(false)}>
                <span aria-hidden="true">×</span>
                <span className="sr-only">Закрыть</span>
              </button>
            </header>

            <div className="font-modal-content">
              {FONT_CATEGORIES.map((category) => {
                const fonts = FONT_CATALOG.filter(
                  (font) => font.categories[0] === category,
                );
                if (fonts.length === 0) return null;

                return (
                  <section className="font-category" key={category}>
                    <h3>{category}</h3>
                    <div className="font-card-grid">
                      {fonts.map((font) => {
                        const isSelected = font.id === selectedFont.id;
                        const isRecommended = mode === "bigLetter"
                          ? font.recommendedForBigLetter
                          : font.recommendedForName;

                        return (
                          <button
                            type="button"
                            key={font.id}
                            className={[
                              "font-card",
                              isSelected ? "is-selected" : "",
                              font.categories.includes("Рукописные")
                              || font.categories.includes("Каллиграфические")
                                ? "is-script"
                                : "",
                            ].filter(Boolean).join(" ")}
                            aria-pressed={isSelected}
                            onClick={() => {
                              onChange(font.id);
                              setIsOpen(false);
                            }}
                          >
                            <span
                              className={`font-card-preview ${mode === "bigLetter" ? "is-letter" : ""}`}
                              style={{ fontFamily: getCatalogFontFamily(font.id) }}
                            >
                              {previewText}
                            </span>
                            <span className="font-card-name">{font.name}</span>
                            <span className="font-card-categories">
                              {font.categories.join(" · ")}
                            </span>
                            <span className="font-card-meta">
                              <span className={`printability printability-${font.printability}`}>
                                {PRINTABILITY_LABELS[font.printability]}
                              </span>
                              {isRecommended && <span className="recommended-mark">Рекомендуем</span>}
                            </span>
                            {font.printability === "thin" && (
                              <span className="font-card-warning">
                                Тонкие линии могут хуже печататься на FDM
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
