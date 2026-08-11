"use client";

import Link from "next/link";
import {
  cloneElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from "react";
import styles from "./button.module.css";

type IconElement = ReactElement<{
  size?: 20 | 24;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

type CommonProps = {
  /** Accessible name — required for icon-only controls. */
  label: string;
  icon: IconElement;
  /** Glyph optical size. Hit target stays ≥ 44×44. */
  iconSize?: 20 | 24;
  /**
   * `default` — bordered square tile (chrome / add).
   * `ghost` — borderless square (back / remove).
   */
  tone?: "default" | "ghost";
  /** Selected / current destination for chrome tiles. */
  active?: boolean;
  className?: string;
  disabled?: boolean;
  title?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onMouseDown?: ButtonHTMLAttributes<HTMLButtonElement>["onMouseDown"];
  type?: "button" | "submit" | "reset";
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean;
};

type IconButtonProps =
  | (CommonProps & { href: string })
  | (CommonProps & { href?: undefined });

function classNames({
  tone,
  active,
  className,
}: {
  tone: NonNullable<CommonProps["tone"]>;
  active: boolean;
  className?: string;
}) {
  return [
    styles.root,
    styles.icon,
    tone === "ghost" ? styles.iconGhost : "",
    active ? styles.iconSelected : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Square icon-only control — the `icon` button variant.
 * Prefer this over ad-hoc icon buttons so sizing and states stay consistent.
 */
export function IconButton({
  label,
  icon,
  iconSize = 20,
  tone = "default",
  active = false,
  className,
  disabled,
  title,
  onClick,
  onMouseDown,
  type = "button",
  href,
  "aria-current": ariaCurrent,
}: IconButtonProps) {
  const classes = classNames({ tone, active, className });
  const glyph = cloneElement(icon, {
    size: iconSize,
    className: [styles.iconGlyph, icon.props.className]
      .filter(Boolean)
      .join(" "),
    "aria-hidden": true,
  });

  if (href) {
    if (disabled) {
      return (
        <span
          className={classes}
          aria-label={label}
          aria-disabled="true"
          role="link"
          title={title}
        >
          {glyph}
        </span>
      );
    }

    return (
      <Link
        href={href}
        className={classes}
        aria-label={label}
        aria-current={ariaCurrent}
        title={title}
      >
        {glyph}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {glyph}
    </button>
  );
}
