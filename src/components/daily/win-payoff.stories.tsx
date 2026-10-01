import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WinPayoff, type WinPayoffVariant } from "./win-payoff";

function Replayable({ variant }: { variant: WinPayoffVariant }) {
  const [run, setRun] = useState(0);
  const [active, setActive] = useState(true);
  return (
    <div style={{ minHeight: 360 }}>
      <Button
        variant="secondary"
        onClick={() => {
          setActive(false);
          setRun((n) => n + 1);
          requestAnimationFrame(() => setActive(true));
        }}
      >
        Replay
      </Button>
      <WinPayoff key={run} active={active} variant={variant} onDone={() => setActive(false)} />
    </div>
  );
}

const meta = {
  title: "Today/WinPayoff",
  component: Replayable,
  parameters: { layout: "fullscreen" },
  args: { variant: "module" },
  argTypes: { variant: { control: "inline-radio", options: ["module", "sheet"] } },
} satisfies Meta<typeof Replayable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModuleComplete: Story = {};

export const SheetComplete: Story = { args: { variant: "sheet" } };

