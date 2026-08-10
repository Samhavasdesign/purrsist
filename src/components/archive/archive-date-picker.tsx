"use client";

import { useRouter } from "next/navigation";
import type { ArchiveDateOption } from "@/lib/daily/archive";
import { formatArchiveDate } from "@/lib/daily/entry-rules";
import styles from "./archive-date-picker.module.css";

type Props = {
  dates: ArchiveDateOption[];
  selectedDate: string | null;
};

export function ArchiveDatePicker({ dates, selectedDate }: Props) {
  const router = useRouter();

  if (dates.length === 0) {
    return (
      <p className={styles.empty}>
        No past days yet. As days lock, they&apos;ll show up here.
      </p>
    );
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="archive-date">
        Browse a past day
      </label>
      <select
        id="archive-date"
        className={styles.select}
        value={selectedDate ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          if (!value) {
            router.push("/archive");
            return;
          }
          router.push(`/archive?date=${value}`);
        }}
      >
        <option value="">Select a date…</option>
        {dates.map((option) => (
          <option key={option.date} value={option.date}>
            {formatArchiveDate(option.date)}
            {option.must_do_done ? " · Win" : ""}
          </option>
        ))}
      </select>

      <ul className={styles.recent}>
        {dates.slice(0, 7).map((option) => {
          const active = option.date === selectedDate;
          return (
            <li key={option.date}>
              <button
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                onClick={() => router.push(`/archive?date=${option.date}`)}
              >
                <span>{formatArchiveDate(option.date)}</span>
                {option.must_do_done ? (
                  <span className={styles.winMark}>Win</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
