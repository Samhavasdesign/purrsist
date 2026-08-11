"use client";

import styles from "./view-tabs.module.css";

export type ViewTabOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: readonly ViewTabOption<T>[];
  ariaLabel: string;
  onChange: (value: T) => void;
};

export function ViewTabs<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: Props<T>) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`${styles.tab} ${selected ? styles.tabActive : ""}`}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
