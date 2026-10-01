import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { fn } from "storybook/test";
import { SortableTodoRow, TodoRow, type TodoRowProps } from "./todo-row";
import styles from "./daily-dashboard.module.css";

type Tone = "red" | "yellow" | "green";

/** Wraps rows in the same section chrome the Today module uses. */
function Module({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: 560 }}>
      <section className={`${styles.section} ${styles[`section_${tone}`]}`}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>{title}</h2>
          </div>
        </div>
        <ul className={styles.slotList}>{children}</ul>
      </section>
    </div>
  );
}

/** Keeps text/done in local state so the row behaves like it does on Today. */
function StatefulRow(props: TodoRowProps & { sortable?: boolean }) {
  const [text, setText] = useState(props.text);
  const [done, setDone] = useState(props.done);
  const rowProps: TodoRowProps = {
    ...props,
    text,
    done,
    isEmpty: !text.trim(),
    onTextChange: (next) => {
      setText(next);
      props.onTextChange(next);
    },
    onToggle: (checked) => {
      setDone(checked);
      props.onToggle(checked);
    },
  };
  if (!props.sortable) return <TodoRow {...rowProps} />;
  return (
    <DndContext>
      <SortableContext items={["row"]} strategy={verticalListSortingStrategy}>
        <SortableTodoRow {...rowProps} id="row" />
      </SortableContext>
    </DndContext>
  );
}

const meta = {
  title: "Today/TodoRow",
  component: StatefulRow,
  args: {
    text: "Send the quarterly report to Dana",
    done: false,
    carry: 0,
    isEmpty: false,
    isSaving: false,
    editable: true,
    checkboxDisabled: false,
    checkboxLabel: "Mark Must-Do done",
    placeholder: "Type here...",
    inputLabel: "Must-Do",
    removeDisabled: false,
    sortable: true,
    onToggle: fn(),
    onTextChange: fn(),
    onTextBlur: fn(),
    onRemove: fn(),
  },
  decorators: [
    (Story, ctx) => (
      <Module tone={(ctx.parameters.tone as Tone) ?? "red"} title="Must-Dos">
        <Story />
      </Module>
    ),
  ],
} satisfies Meta<typeof StatefulRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Empty: Story = {
  args: { text: "", isEmpty: true, sortable: false },
};

export const Done: Story = { args: { done: true } };

export const Carried: Story = {
  args: { carry: 3 },
  parameters: { tone: "yellow" },
};

export const Saving: Story = { args: { isSaving: true } };

export const LongText: Story = {
  args: {
    text: "Clean out the garage shelves before the weekend so there's room for the bikes, and drop the old paint cans at the recycling center on the way",
  },
  parameters: { tone: "green" },
};

export const ReadOnly: Story = {
  name: "Read-only (past day)",
  args: { editable: false, checkboxDisabled: true, done: true },
};
