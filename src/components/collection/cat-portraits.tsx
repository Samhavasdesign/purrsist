import type { SVGProps } from "react";

type PortraitProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const base = {
  viewBox: "0 0 200 200",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Soft sleepy loaf — dumpling energy. */
export function MochiPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...base} {...props}>
      {title ? <title>{title}</title> : null}
      {/* loaf body */}
      <path d="M42 128c4-34 28-58 58-58s54 24 58 58c2 18-10 34-28 38H70c-18-4-30-20-28-38Z" />
      {/* ears */}
      <path d="M68 78c2-16 10-26 18-28 2 10 4 20 4 28" />
      <path d="M114 78c0-10 2-20 4-28 8 2 16 12 18 28" />
      {/* closed sleepy eyes */}
      <path d="M72 112c6 6 14 6 20 0" />
      <path d="M108 112c6 6 14 6 20 0" />
      {/* tiny nose + whiskers */}
      <path d="M98 122c2 2 4 2 6 0" />
      <path d="M74 126h-16M74 132h-14" />
      <path d="M126 126h16M126 132h14" />
      {/* soft paw tuck */}
      <path d="M78 154c4 4 10 4 14 0" />
      <path d="M108 154c4 4 10 4 14 0" />
      {/* dreamy z */}
      <path d="M148 62h12l-12 12h12" strokeWidth="1.3" />
    </svg>
  );
}

/** Curious upright sitter with a little head tilt. */
export function BiscuitPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...base} {...props}>
      {title ? <title>{title}</title> : null}
      {/* body */}
      <path d="M62 168c-4-28 8-54 38-62 30 8 42 34 38 62" />
      {/* chest fluff */}
      <path d="M86 128c6 10 22 10 28 0" strokeWidth="1.3" />
      {/* head (tilted) */}
      <ellipse cx="104" cy="78" rx="36" ry="34" transform="rotate(-8 104 78)" />
      {/* ears */}
      <path d="M78 58c-2-18 6-28 14-30 4 12 6 22 4 30" />
      <path d="M118 52c4-16 12-24 20-24 0 12-2 22-6 30" />
      {/* eyes — one slightly wider */}
      <circle cx="90" cy="76" r="3.2" fill="currentColor" stroke="none" />
      <circle cx="116" cy="72" r="3.8" fill="currentColor" stroke="none" />
      {/* brow quirk */}
      <path d="M82 66c6-4 12-2 16 2" strokeWidth="1.3" />
      {/* nose + smile */}
      <path d="M100 86c2 2 5 2 7 0" />
      <path d="M100 90c4 5 12 5 16 0" strokeWidth="1.3" />
      {/* whiskers */}
      <path d="M72 84H56M74 90H58" />
      <path d="M132 78h16M130 86h18" />
      {/* front paws */}
      <path d="M84 168v-18c0-4 4-8 8-8h4" />
      <path d="M116 168v-18c0-4-4-8-8-8h-4" />
    </svg>
  );
}

/** Long stretchy stretch — pure noodle. */
export function NoodlePortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...base} {...props}>
      {title ? <title>{title}</title> : null}
      {/* stretched body */}
      <path d="M28 118c8-8 22-14 40-16 28-4 52 2 78 18 14 8 22 18 24 28" />
      <path d="M28 118c4 18 18 30 36 32h52c16-2 28-12 32-26" />
      {/* head at the far end */}
      <ellipse cx="158" cy="78" rx="26" ry="24" />
      {/* ears */}
      <path d="M140 62c-2-14 4-22 10-24 2 8 4 16 2 24" />
      <path d="M166 58c2-14 8-20 14-20 0 10-2 16-6 22" />
      {/* sleepy-but-silly eyes */}
      <circle cx="148" cy="76" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="166" cy="74" r="2.6" fill="currentColor" stroke="none" />
      <path d="M154 86c3 3 8 3 11 0" strokeWidth="1.3" />
      {/* long noodle tail curl */}
      <path d="M28 118c-10 8-14 22-6 30 10 10 24 2 28-8" />
      {/* back foot kick */}
      <path d="M56 150c-4 8-2 14 4 16" />
      {/* front paws reaching */}
      <path d="M118 148c8 6 18 8 26 4" />
      <path d="M124 156c10 4 20 2 28-4" />
    </svg>
  );
}

/** Mischief incarnate — batting at a dangling thing. */
export function PicklesPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...base} {...props}>
      {title ? <title>{title}</title> : null}
      {/* crouched body */}
      <path d="M48 140c6-22 24-36 48-38 22 2 40 16 46 36 4 14-4 28-18 32H68c-14-4-24-16-20-30Z" />
      {/* head low / hunting */}
      <ellipse cx="128" cy="96" rx="30" ry="28" />
      {/* ears — one folded */}
      <path d="M108 78c-4-16 2-26 10-28 4 10 6 18 4 28" />
      <path d="M140 74c8-4 18-2 22 8-8 4-14 10-18 18" />
      {/* scheming eyes */}
      <path d="M118 92c4-2 8-1 10 2" />
      <circle cx="138" cy="94" r="3.4" fill="currentColor" stroke="none" />
      {/* smirk */}
      <path d="M128 108c6 2 12 0 14-4" strokeWidth="1.3" />
      {/* whiskers */}
      <path d="M108 100H92M110 108H94" />
      <path d="M152 98h14M150 106h16" />
      {/* raised batting paw */}
      <path d="M150 120c18-20 28-24 38-22" />
      <path d="M184 96c2-2 6-2 8 2 0 4-4 6-8 4" />
      {/* dangling string/toy */}
      <path d="M172 42v28" strokeWidth="1.3" strokeDasharray="2 3" />
      <circle cx="172" cy="74" r="4.5" />
      {/* planted paws */}
      <path d="M72 158c2 6 8 8 14 6" />
      <path d="M98 160c2 6 8 8 14 6" />
    </svg>
  );
}

/** Cozy content loaf — slightly warm and flattened. */
export function ToastPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...base} {...props}>
      {title ? <title>{title}</title> : null}
      {/* toast-loaf silhouette */}
      <path d="M40 132c2-28 26-48 60-48s58 20 60 48c2 22-14 36-32 38H72c-18-2-34-16-32-38Z" />
      {/* subtle toast ridges */}
      <path d="M58 118c18-8 66-8 84 0" strokeWidth="1.2" />
      <path d="M64 132c16-6 56-6 72 0" strokeWidth="1.2" />
      {/* ears */}
      <path d="M72 92c0-16 8-26 16-28 2 10 2 20 0 28" />
      <path d="M112 92c-2-10-2-20 0-28 8 2 16 12 16 28" />
      {/* content half-lidded eyes */}
      <path d="M78 118c5 3 12 3 17 0" />
      <path d="M105 118c5 3 12 3 17 0" />
      {/* nose */}
      <path d="M96 128c2 2 5 2 7 0" />
      {/* whiskers */}
      <path d="M74 126H58M76 132H60" />
      <path d="M126 126h16M124 132h16" />
      {/* tiny steam curl (warm toast) */}
      <path d="M148 58c6-8 2-14-2-16 8-2 12-10 6-16" strokeWidth="1.3" />
    </svg>
  );
}

/** Tiny alert bean — big eyes, little body. */
export function BeanPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...base} {...props}>
      {title ? <title>{title}</title> : null}
      {/* small bean body */}
      <ellipse cx="100" cy="132" rx="34" ry="28" />
      {/* oversized head */}
      <circle cx="100" cy="88" r="36" />
      {/* tall alert ears */}
      <path d="M74 66c-2-22 8-34 18-36 2 14 2 26-2 36" />
      <path d="M110 66c-4-12-4-24-2-36 10 2 20 14 18 36" />
      {/* huge curious eyes */}
      <circle cx="86" cy="88" r="8" />
      <circle cx="114" cy="88" r="8" />
      <circle cx="88" cy="90" r="2.8" fill="currentColor" stroke="none" />
      <circle cx="116" cy="90" r="2.8" fill="currentColor" stroke="none" />
      {/* tiny nose + open mouth o */}
      <path d="M97 102c2 2 4 2 6 0" />
      <circle cx="100" cy="110" r="3.2" />
      {/* whiskers */}
      <path d="M68 92H52M70 100H54" />
      <path d="M132 92h16M130 100h16" />
      {/* little stick legs */}
      <path d="M84 158v14" />
      <path d="M116 158v14" />
      <path d="M78 172h12" />
      <path d="M110 172h12" />
      {/* question-mark tail */}
      <path d="M132 140c14 2 20 12 16 22-4 8-14 8-16 2 6 0 10-4 8-8" />
    </svg>
  );
}

const PORTRAITS = {
  Mochi: MochiPortrait,
  Biscuit: BiscuitPortrait,
  Noodle: NoodlePortrait,
  Pickles: PicklesPortrait,
  Toast: ToastPortrait,
  Bean: BeanPortrait,
} as const;

export type CatPortraitName = keyof typeof PORTRAITS;

export function CatPortrait({
  name,
  className,
  title,
}: {
  name: string;
  className?: string;
  /** Accessible name when the portrait is meaningful content (e.g. detail dialog). */
  title?: string;
}) {
  const Portrait = PORTRAITS[name as CatPortraitName] ?? BeanPortrait;
  return (
    <Portrait
      className={className}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    />
  );
}
