"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useLayoutEffect, useRef, type CSSProperties } from "react";
import { CloseIcon, GripIcon } from "@/components/icons/icons";
import { IconButton } from "@/components/ui/icon-button";
import styles from "./daily-dashboard.module.css";

export type TodoRowProps = {
  text: string;
  done: boolean;
  carry: number;
  isEmpty: boolean;
  isSaving: boolean;
  editable: boolean;
  checkboxDisabled: boolean;
  checkboxLabel: string;
  placeholder: string;
  inputLabel: string;
  registerInputNode?: (node: HTMLTextAreaElement | null) => void;
  onToggle: (checked: boolean) => void;
  onTextChange: (text: string) => void;
  onTextBlur: (text: string) => void;
  onRemove: () => void;
  removeDisabled: boolean;
};

/** Static row — used for empty placeholder slots, which aren't draggable. */
export function TodoRow(props: TodoRowProps) {
  const { isEmpty, editable } = props;
  return (
    <li className={`${styles.slotRow} ${isEmpty && editable ? styles.slotEmpty : ""}`}>
      <TodoRowContent {...props} />
    </li>
  );
}

/**
 * Draggable row — used for every filled item, whether or not there's
 * currently anything else to reorder against. Always using this component
 * (never swapping to a plain, non-sortable one) keeps the element type
 * stable as a section's item count crosses 1 <-> 2+; swapping component
 * types for the same row remounts it and drops focus mid-edit.
 */
export function SortableTodoRow(
  props: TodoRowProps & { id: string; dragDisabled?: boolean },
) {
  const { id, editable, checkboxLabel, dragDisabled = false } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editable || dragDisabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.92 : 1,
    zIndex: isDragging ? 1 : undefined,
    position: "relative",
  };

  const handleLabel = `Reorder ${checkboxLabel.replace(/^Mark /, "").replace(/ done$/, "")}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.slotRow} ${isDragging ? styles.slotDragging : ""}`}
    >
      {editable && !dragDisabled ? (
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={styles.dragHandle}
          aria-label={handleLabel}
          {...attributes}
          {...listeners}
        >
          <GripIcon size={20} className={styles.dragHandleIcon} />
        </button>
      ) : null}
      <TodoRowContent {...props} />
    </li>
  );
}

function TodoRowContent({
  done,
  checkboxDisabled,
  checkboxLabel,
  onToggle,
  registerInputNode,
  text,
  placeholder,
  editable,
  inputLabel,
  onTextChange,
  onTextBlur,
  carry,
  isSaving,
  onRemove,
  removeDisabled,
}: TodoRowProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Re-fit whenever the text changes from outside this row (drag reorder,
  // server sync, clear) — onChange alone misses those.
  useLayoutEffect(() => {
    resize(inputRef.current);
  }, [text, resize]);

  const setRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inputRef.current = node;
      registerInputNode?.(node);
      resize(node);
    },
    [registerInputNode, resize],
  );

  return (
    <>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={done}
        disabled={checkboxDisabled}
        aria-label={checkboxLabel}
        onChange={(event) => onToggle(event.target.checked)}
      />
      <div className={styles.slotFields}>
        <textarea
          ref={setRef}
          className={`${styles.slotInput} ${styles.slotTextarea} ${done ? styles.slotDone : ""}`}
          rows={1}
          value={text}
          placeholder={placeholder}
          disabled={!editable}
          readOnly={!editable}
          aria-label={inputLabel}
          onChange={(event) => {
            onTextChange(event.target.value);
            resize(event.currentTarget);
          }}
          onBlur={(event) => onTextBlur(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        {carry > 0 ? (
          <p className={styles.carryHint}>
            Carried {carry} day{carry === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
      {isSaving ? (
        <span className={styles.savingSpinner} role="status" aria-label="Saving" />
      ) : null}
      {editable ? (
        <IconButton
          label="Remove task"
          icon={<CloseIcon />}
          iconSize={20}
          tone="ghost"
          className={styles.clearBtn}
          onClick={onRemove}
          disabled={removeDisabled}
          title="Remove task"
        />
      ) : null}
    </>
  );
}
