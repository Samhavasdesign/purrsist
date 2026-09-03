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

/** Settings — outlined gear. */
export function SettingsIcon({ title, ...props }: IconProps) {
  return (
    <svg {...baseAttrs(props)}>
      {title ? <title>{title}</title> : null}
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
