import { useState } from "react";
import RangeNumberControl from "../components/RangeNumberControl";
import {
    DECORATION_TYPES,
    DECORATION_TYPE_LABELS,
    type DecorationItem,
    type DecorationType,
} from "./types";

type Props = {
    items: readonly DecorationItem[];
    onAdd: () => string;
    onUpdate: (id: string, patch: Partial<DecorationItem>) => void;
    onRemove: (id: string) => void;
};

export default function DecorationControls({ items, onAdd, onUpdate, onRemove }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const addItem = () => {
        setExpandedId(onAdd());
    };

    const removeItem = (id: string) => {
        onRemove(id);
        if (expandedId === id) setExpandedId(null);
    };

    return (
        <section className="collection-controls" aria-labelledby="decorations-title">
            <div className="collection-controls-title-row">
                <div>
                    <span className="panel-controls-kicker">Decorations</span>
                    <h2 id="decorations-title">Декоративные элементы</h2>
                </div>
                <button className="collection-add-button" type="button" onClick={addItem}>
                    + Добавить элемент
                </button>
            </div>

            {items.length === 0 ? (
                <p className="collection-empty">Добавьте звезду, сердце или другую фигуру на панель.</p>
            ) : (
                <div className="item-editor-list">
                    {items.map((item, index) => {
                        const expanded = item.id === expandedId;
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
                                        <span>{DECORATION_TYPE_LABELS[item.type]}</span>
                                        <span className="item-editor-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
                                    </button>
                                    <label className="item-enabled-toggle" title="Включить элемент">
                                        <input
                                            type="checkbox"
                                            checked={item.enabled}
                                            onChange={(event) => onUpdate(item.id, { enabled: event.target.checked })}
                                        />
                                        <span className="sr-only">Включить декоративный элемент {index + 1}</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="item-delete-button"
                                        aria-label={`Удалить декоративный элемент ${index + 1}`}
                                        onClick={() => removeItem(item.id)}
                                    >
                                        ×
                                    </button>
                                </div>

                                {expanded && (
                                    <div className="item-editor-body">
                                        <label className="select-control">
                                            Тип элемента
                                            <select
                                                value={item.type}
                                                disabled={!item.enabled}
                                                onChange={(event) => onUpdate(item.id, { type: event.target.value as DecorationType })}
                                            >
                                                {DECORATION_TYPES.map((type) => (
                                                    <option key={type} value={type}>{DECORATION_TYPE_LABELS[type]}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <RangeNumberControl id={`${item.id}-x`} label="Положение X" value={item.x} min={-300} max={300} disabled={!item.enabled} onChange={(x) => onUpdate(item.id, { x })} />
                                        <RangeNumberControl id={`${item.id}-y`} label="Положение Y" value={item.y} min={-300} max={300} disabled={!item.enabled} onChange={(y) => onUpdate(item.id, { y })} />
                                        <RangeNumberControl id={`${item.id}-z`} label="Положение Z" value={item.z} min={-20} max={50} disabled={!item.enabled} onChange={(z) => onUpdate(item.id, { z })} />
                                        <RangeNumberControl id={`${item.id}-size`} label="Размер" value={item.size} min={10} max={140} disabled={!item.enabled} onChange={(size) => onUpdate(item.id, { size })} />
                                        <RangeNumberControl id={`${item.id}-depth`} label="Толщина" value={item.depth} min={1} max={30} disabled={!item.enabled} onChange={(depth) => onUpdate(item.id, { depth })} />
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
