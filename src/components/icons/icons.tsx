import type { SVGProps } from "react";

/**
 * Shared icon set for Purrsist UI.
 * Optical sizes: 20px regular controls, 24px prominent controls.
 * Action and chrome icons (add, remove, back, info) use stroke (width 2);
 * the drag grip uses solid fill; the cat head mixes both.
 */
export const ICON_STROKE = 2;

export type IconProps = Omit<
  SVGProps<SVGSVGElement>,
  "width" | "height" | "viewBox" | "strokeWidth"
> & {
  size?: 20 | 24;
  title?: string;
};

function baseAttrs({
  size = 20,
  title,
  ...rest
}: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: ICON_STROKE,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": title ? undefined : true,
    role: title ? "img" : undefined,
    ...rest,
  };
}

function solidAttrs({
  size = 20,
  title,
  ...rest
}: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "none",
    "aria-hidden": title ? undefined : true,
    role: title ? "img" : undefined,
    ...rest,
  };
}

export function ChevronLeftIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function PlusIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/** Drag handle — two columns of dots ("grip") for reorderable rows. */
export function GripIcon({ title, ...props }: IconProps) {
  return (
    <svg {...solidAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

/** Collection counter — outlined cat face with whiskers for the top bar. */
export function CatHeadIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M8.6 5.1C7.2 5.1 5.4 4.3 4.8 3.4c-.3-.4-.9-.2-.9.3l.2 4.4C3.3 9.5 2.9 11.1 2.9 12.7c0 4.2 4 7.7 9.1 7.7s9.1-3.5 9.1-7.7c0-1.6-.4-3.2-1.2-4.6l.2-4.4c0-.5-.6-.7-.9-.3-.6.9-2.4 1.7-3.8 1.7-1.1-.4-2.2-.6-3.4-.6s-2.3.2-3.4.6z" />
      <path d="M6 12.4 1.6 11.4M5.8 14 1.4 14M6 15.6 1.8 16.8" />
      <path d="M18 12.4 22.4 11.4M18.2 14 22.6 14M18 15.6 22.2 16.8" />
      <path d="M12 17c-.5.6-1.3.6-1.8 0M12 17c.5.6 1.3.6 1.8 0" />
      <ellipse cx="9.3" cy="12" rx="1.15" ry="1.7" fill="currentColor" stroke="none" />
      <ellipse cx="14.7" cy="12" rx="1.15" ry="1.7" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="15.2" rx="1" ry="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Info / About — outlined circle with an "i". */
export function InfoIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 11v5" />
      <path d="M12 7.75h.01" />
    </svg>
  );
}

/** AI marker — a four-point sparkle with a small companion, for things Claude worked out. */
export function SparkleIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M10 3.5c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6z" />
      <path d="M18 14.5c.25 1.6 1 2.35 2.5 2.5-1.5.15-2.25.9-2.5 2.5-.25-1.6-1-2.35-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5z" />
    </svg>
  );
}

/** Show password — an eye. */
export function EyeIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

/** Hide password — an eye with a slash. */
export function EyeOffIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M2.5 12S6 5.5 12 5.5c1.3 0 2.5.3 3.5.8M21.5 12S18 18.5 12 18.5c-1.3 0-2.5-.3-3.5-.8" />
      <path d="M9.9 9.9a2.75 2.75 0 0 0 4.2 3.6" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

/** Success — a check in a circle. */
export function CheckCircleIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9.25" />
      <path d="M8 12.25l2.75 2.75L16 9.5" />
    </svg>
  );
}
