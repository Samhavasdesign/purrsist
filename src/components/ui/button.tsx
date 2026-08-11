"use client";

import Link from "next/link";
import {
  type ButtonHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { PlusIcon } from "@/components/icons/icons";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "category" | "nav";
export type CategoryTone = "red" | "yellow" | "green";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  title?: string;
  /**
   * When true, applies the selected companion style:
   * category → category-selected, nav → nav-selected.
   */
  selected?: boolean;
  /** Required when variant is "category". */
  category?: CategoryTone;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  onMouseDown?: ButtonHTMLAttributes<HTMLButtonElement>["onMouseDown"];
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
  "aria-pressed"?: boolean | "true" | "false";
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean;
};

function classNames({
  variant,
  selected,
  category,
  className,
}: {
  variant: ButtonVariant;
  selected: boolean;
  category?: CategoryTone;
  className?: string;
}) {
  const parts = [styles.root, styles[variant]];

  if (variant === "category" && category) {
    parts.push(styles[`category_${category}`]);
    if (selected) parts.push(styles.categorySelected);
  }

  if (variant === "nav" && selected) {
    parts.push(styles.navSelected);
  }

  if (className) parts.push(className);
  return parts.join(" ");
}

export function Button({
  children,
  variant = "primary",
  selected = false,
  category,
  className,
  disabled,
  title,
  onClick,
  onMouseDown,
  type = "button",
  href,
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
  "aria-current": ariaCurrent,
}: ButtonProps) {
  if (variant === "category" && !category) {
    throw new Error('Button variant "category" requires a category tone.');
  }

  const classes = classNames({ variant, selected, category, className });

  const content =
    variant === "category" ? (
      <>
        <PlusIcon size={20} className={styles.categoryIcon} />
        <span>{children}</span>
      </>
    ) : (
      children
    );

  if (href) {
    if (disabled) {
      return (
        <span
          className={classes}
          aria-label={ariaLabel}
          aria-disabled="true"
          role="link"
          title={title}
        >
          {content}
        </span>
      );
    }

    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
        title={title}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-current={ariaCurrent}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      {content}
    </button>
  );
}
