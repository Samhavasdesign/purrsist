import type { SVGProps } from "react";

/**
 * Shared icon set for Purrsist UI.
 * Optical sizes: 20px regular controls, 24px prominent controls.
 * Action icons (add/remove/check) use stroke (width 2);
 * header marks (paws, settings) use solid fill to match the brand chrome.
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

export function TrashIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function CheckIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/** Small filled star — category header mark. */
export function StarIcon({ title, ...props }: IconProps) {
  return (
    <svg {...solidAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
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

/** Progress / Collection — two solid paw prints on a diagonal. */
export function PawPrintIcon({ title, ...props }: IconProps) {
  return (
    <svg {...solidAttrs(props)}>
      {title ? <title>{title}</title> : null}
      {/* Upper-left paw */}
      <g transform="translate(7.6 6.4) rotate(-24) scale(1.18) translate(-8.95 -7.4)">
        <circle cx="5.1" cy="5.35" r="1.2" />
        <circle cx="7.55" cy="3.85" r="1.2" />
        <circle cx="10.35" cy="3.85" r="1.2" />
        <circle cx="12.8" cy="5.35" r="1.2" />
        <path d="M8.95 6.9c-2.2 0-4 1.4-4 3.25 0 1.7 1.4 2.85 4 2.85s4-1.15 4-2.85c0-1.85-1.8-3.25-4-3.25z" />
      </g>
      {/* Lower-right paw */}
      <g transform="translate(16.4 17.8) rotate(20) scale(1.18) translate(-15.05 -16.4)">
        <circle cx="11.2" cy="14.85" r="1.2" />
        <circle cx="13.65" cy="13.35" r="1.2" />
        <circle cx="16.45" cy="13.35" r="1.2" />
        <circle cx="18.9" cy="14.85" r="1.2" />
        <path d="M15.05 16.4c-2.2 0-4 1.4-4 3.25 0 1.7 1.4 2.85 4 2.85s4-1.15 4-2.85c0-1.85-1.8-3.25-4-3.25z" />
      </g>
    </svg>
  );
}

/** Collection counter — compact cat-head silhouette for the top bar. */
export function CatHeadIcon({ title, ...props }: IconProps) {
  return (
    <svg {...solidAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M8.2 8.4 5.4 3.2c-.3-.55.4-1.05.8-.6L10 7.1c.6-.25 1.3-.4 2-.4.7 0 1.4.15 2 .4l3.8-4.5c.4-.45 1.1.05.8.6l-2.8 5.2c1.55 1.15 2.5 2.95 2.5 5 0 3.55-2.9 6.2-6.3 6.2S5.7 16.75 5.7 13.2c0-2.05.95-3.85 2.5-5z" />
    </svg>
  );
}

/** Settings — solid gear. */
export function SettingsIcon({ title, ...props }: IconProps) {
  return (
    <svg {...solidAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.078 2.25h1.844c.784 0 1.475.507 1.706 1.25l.29.93a1.875 1.875 0 0 0 2.385 1.196l.89-.334a1.875 1.875 0 0 1 2.356.86l.922 1.597a1.875 1.875 0 0 1-.68 2.49l-.78.45a1.875 1.875 0 0 0 0 3.222l.78.45a1.875 1.875 0 0 1 .68 2.49l-.922 1.597a1.875 1.875 0 0 1-2.356.86l-.89-.334a1.875 1.875 0 0 0-2.385 1.196l-.29.93a1.875 1.875 0 0 1-1.706 1.25h-1.844a1.875 1.875 0 0 1-1.706-1.25l-.29-.93a1.875 1.875 0 0 0-2.385-1.196l-.89.334a1.875 1.875 0 0 1-2.356-.86l-.922-1.597a1.875 1.875 0 0 1 .68-2.49l.78-.45a1.875 1.875 0 0 0 0-3.222l-.78-.45a1.875 1.875 0 0 1-.68-2.49l.922-1.597a1.875 1.875 0 0 1 2.356-.86l.89.334a1.875 1.875 0 0 0 2.385-1.196l.29-.93a1.875 1.875 0 0 1 1.706-1.25ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
      />
    </svg>
  );
}
