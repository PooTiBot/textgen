import { useState } from "react";
import RangeNumberControl from "../components/RangeNumberControl";
import { FONT_CATALOG } from "../fonts/fontCatalog";
import type { ExtraTextItem } from "./types";

type Props = {
    items: readonly ExtraTextItem[];
    onAdd: () => string;
    onUpdate: (id: string, patch: Partial<ExtraTextItem>) => void;
    onRemove: (id: string) => void;
};

export default function ExtraTextControls({ items, onAdd, onUpdate, onRemove }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const addItem = () => {
        setExpandedId(onAdd());
    };

    const removeItem = (id: string) => {
        onRemove(id);
        if (expandedId === id) setExpandedId(null);
    };

    return (
        <section className="collection-controls" aria-labelledby="extra-text-title">
            <div className="collection-controls-title-row">
                <div>
                    <span className="panel-controls-kicker">Extra Text</span>
                    <h2 id="extra-text-title">Дополнительный текст</h2>
                </div>
                <button className="collection-add-button" type="button" onClick={addItem}>
                    + Добавить текст
                </button>
            </div>

            {items.length === 0 ? (
                <p className="collection-empty">Добавьте рост, вес, дату, время или подпись.</p>
            ) : (
                <div className="item-editor-list">
                    {items.map((item, index) => {
                        const expanded = item.id === expandedId;
                        const title = item.text.trim() || "Пустой текст";
                        return (
                            <article className={`item-editor ${item.enabled ? "" : "is-disabled"}`} key={item.id}>
                                <div className="item-editor-header">
                                    <button
                                        type="button"
                                        className="item-editor-summary"
                                        aria-expanded={expanded}
                                        onClick={() => setExpandedId(expanded ? null : item.id)}
                                    >
                                        <span className="item-editor-index">{index + 1}</span>
                                        <span className="item-editor-title">{title}</span>
                                        <span className="item-editor-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
                                    </button>
                                    <label className="item-enabled-toggle" title="Включить текст">
                                        <input
                                            type="checkbox"
                                            checked={item.enabled}
                                            onChange={(event) => onUpdate(item.id, { enabled: event.target.checked })}
                                        />
                                        <span className="sr-only">Включить дополнительный текст {index + 1}</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="item-delete-button"
                                        aria-label={`Удалить дополнительный текст ${index + 1}`}
                                        onClick={() => removeItem(item.id)}
                                    >
                                        ×
                                    </button>
                                </div>

                                {expanded && (
                                    <div className="item-editor-body">
                                        <label className="item-text-control">
                                            Текст
                                            <input
                                                type="text"
                                                value={item.text}
                                                disabled={!item.enabled}
                                                onChange={(event) => onUpdate(item.id, { text: event.target.value })}
                                            />
                                        </label>
                                        <label className="select-control">
                                            Шрифт
                                            <select
                                                value={item.fontId}
                                                disabled={!item.enabled}
                                                onChange={(event) => onUpdate(item.id, { fontId: event.target.value })}
                                            >
                                                {FONT_CATALOG.map((font) => (
                                                    <option key={font.id} value={font.id}>{font.name} · {font.categories[0]}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <RangeNumberControl id={`${item.id}-x`} label="Положение X" value={item.x} min={-300} max={300} disabled={!item.enabled} onChange={(x) => onUpdate(item.id, { x })} />
                                        <RangeNumberControl id={`${item.id}-y`} label="Положение Y" value={item.y} min={-300} max={300} disabled={!item.enabled} onChange={(y) => onUpdate(item.id, { y })} />
                                        <RangeNumberControl id={`${item.id}-z`} label="Смещение по Z, мм" value={item.z} min={-20} max={50} step={0.5} disabled={!item.enabled} onChange={(z) => onUpdate(item.id, { z })} />
                                        <RangeNumberControl id={`${item.id}-size`} label="Размер" value={item.size} min={8} max={100} disabled={!item.enabled} onChange={(size) => onUpdate(item.id, { size })} />
                                        <RangeNumberControl id={`${item.id}-depth`} label="Толщина, мм" value={item.depth} min={0.5} max={20} step={0.5} disabled={!item.enabled} onChange={(depth) => onUpdate(item.id, { depth })} />
                                        <RangeNumberControl id={`${item.id}-rotation`} label="Поворот, °" value={item.rotation} min={-180} max={180} disabled={!item.enabled} onChange={(rotation) => onUpdate(item.id, { rotation })} />
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
