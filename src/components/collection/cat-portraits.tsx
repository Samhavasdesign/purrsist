import type { SVGProps } from "react";

type PortraitProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const OUTLINE = "#3f342f";

const baseSvg: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 200 200",
  xmlns: "http://www.w3.org/2000/svg",
};

/** Shared cartoon outline: chunky, rounded, hand-drawn feel. */
const ink = {
  stroke: OUTLINE,
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* -------------------------------------------------------------------------- */

/** Mochi — a pale pink dumpling asleep in a perfect loaf. */
export function MochiPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...baseSvg} {...props}>
      {title ? <title>{title}</title> : null}
      <g {...ink}>
        {/* dreamy Zs */}
        <path
          d="M150 58h14l-14 14h14"
          fill="none"
          stroke="#c9a7b4"
          strokeWidth={2.4}
        />
        <path
          d="M170 42h10l-10 10h10"
          fill="none"
          stroke="#c9a7b4"
          strokeWidth={2.4}
        />
        {/* ears */}
        <path d="M70 80c-4-20 4-30 15-28 3 10 3 20 0 28Z" fill="#fdeef2" />
        <path d="M130 80c4-20-4-30-15-28-3 10-3 20 0 28Z" fill="#fdeef2" />
        <path d="M74 76c-1-9 2-15 8-16" fill="#f7c9d6" stroke="none" />
        <path d="M126 76c1-9-2-15-8-16" fill="#f7c9d6" stroke="none" />
        {/* loaf body — no legs, pure blob */}
        <path d="M40 150c0-46 24-78 60-78s60 32 60 78c0 9-9 14-20 14H60c-11 0-20-5-20-14Z" fill="#fdeef2" />
        {/* tail curled to the front */}
        <path d="M60 164c-17-2-22 15-8 20 10 4 19-3 17-12" fill="#fdeef2" />
        {/* blush */}
        <ellipse cx="72" cy="126" rx="8" ry="4.5" fill="#f7c9d6" stroke="none" opacity="0.85" />
        <ellipse cx="128" cy="126" rx="8" ry="4.5" fill="#f7c9d6" stroke="none" opacity="0.85" />
        {/* closed happy eyes */}
        <path d="M74 112c5 7 14 7 19 0" fill="none" />
        <path d="M107 112c5 7 14 7 19 0" fill="none" />
        {/* nose + tiny mouth */}
        <path d="M96 120h8l-4 5Z" fill="#e59aac" />
        <path d="M100 125c-4 5-9 4-12 1M100 125c4 5 9 4 12 1" fill="none" strokeWidth={2.4} />
        {/* whiskers */}
        <path d="M66 122l-14-3M66 130l-14 1" fill="none" strokeWidth={2} />
        <path d="M134 122l14-3M134 130l14 1" fill="none" strokeWidth={2} />
      </g>
    </svg>
  );
}

/** Biscuit — a buttery orange tabby giving you the full toothless blep. */
export function BiscuitPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...baseSvg} {...props}>
      {title ? <title>{title}</title> : null}
      <g {...ink}>
        {/* curled tail */}
        <path d="M132 158c26 2 34-24 16-33 9 15-1 25-18 22Z" fill="#f0a94b" />
        {/* upright body */}
        <path d="M66 170c-8-50 6-84 34-88 28 4 42 38 34 88Z" fill="#f0a94b" />
        {/* cream chest */}
        <path d="M86 168c-6-34 2-58 14-62 12 4 20 28 14 62Z" fill="#fff3e0" />
        {/* body stripes */}
        <path d="M72 150q12-5 24-3M70 132q14-6 28-3M74 116q11-4 20-2" fill="none" stroke="#d98a2b" strokeWidth={4} />
        {/* front paws */}
        <ellipse cx="86" cy="166" rx="10" ry="8" fill="#fff3e0" />
        <ellipse cx="114" cy="166" rx="10" ry="8" fill="#fff3e0" />
        {/* ears */}
        <path d="M74 54 66 26l30 20Z" fill="#f0a94b" />
        <path d="M126 54 134 26l-30 20Z" fill="#f0a94b" />
        <path d="M78 48 74 32l14 10Z" fill="#f2b79a" stroke="none" />
        <path d="M122 48 126 32l-14 10Z" fill="#f2b79a" stroke="none" />
        {/* head */}
        <circle cx="100" cy="70" r="30" fill="#f0a94b" />
        {/* forehead stripes */}
        <path d="M100 42v14M86 46q5 7 3 15M114 46q-5 7-3 15" fill="none" stroke="#d98a2b" strokeWidth={4} />
        {/* big friendly eyes */}
        <circle cx="88" cy="70" r="6.5" fill="#33291f" stroke="none" />
        <circle cx="112" cy="70" r="6.5" fill="#33291f" stroke="none" />
        <circle cx="90" cy="68" r="2" fill="#fff" stroke="none" />
        <circle cx="114" cy="68" r="2" fill="#fff" stroke="none" />
        {/* muzzle + nose + blep */}
        <path d="M100 78 96 84h8Z" fill="#e07d92" stroke="none" />
        <path d="M100 84c-6 6-14 5-16-1M100 84c6 6 14 5 16-1" fill="none" strokeWidth={2.6} />
        <path d="M95 88c1 10 9 10 10 0Z" fill="#ef8fa0" />
        {/* whiskers */}
        <path d="M70 74l-16-2M70 82l-16 3" fill="none" strokeWidth={2} />
        <path d="M130 74l16-2M130 82l16 3" fill="none" strokeWidth={2} />
        {/* crumbs */}
        <circle cx="70" cy="176" r="2.4" fill="#c98a4b" stroke="none" />
        <circle cx="128" cy="178" r="2" fill="#c98a4b" stroke="none" />
        <circle cx="100" cy="182" r="1.8" fill="#c98a4b" stroke="none" />
      </g>
    </svg>
  );
}

/** Noodle — a grey cat who has achieved a fully boneless state. */
export function NoodlePortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...baseSvg} {...props}>
      {title ? <title>{title}</title> : null}
      <g {...ink}>
        {/* absurdly long capsule body */}
        <path d="M18 118c0-15 14-24 34-24h96c20 0 34 12 34 30s-13 30-33 30H52c-20 0-34-13-34-36Z" fill="#9aa4ad" />
        {/* pale belly */}
        <path d="M40 142c0-13 10-20 26-20h74c14 0 22 9 20 20Z" fill="#e9edf0" />
        {/* tail drooping off the right end */}
        <path d="M182 124c13 4 17 27 4 37-7 5-14 0-12-9 6 1 10-4 8-10" fill="#9aa4ad" />
        {/* back legs, splayed and dangling at the left */}
        <path d="M42 150c-5 16-1 27 8 28M60 150c-3 18 3 29 12 29" fill="none" strokeWidth={7} />
        <ellipse cx="50" cy="180" rx="7" ry="5" fill="#e9edf0" />
        <ellipse cx="73" cy="181" rx="7" ry="5" fill="#e9edf0" />
        {/* front paws hanging in the middle */}
        <path d="M100 150v18M116 150v18" fill="none" strokeWidth={7} />
        <ellipse cx="100" cy="170" rx="7" ry="5" fill="#e9edf0" />
        <ellipse cx="116" cy="170" rx="7" ry="5" fill="#e9edf0" />
        {/* small head at the far right */}
        <circle cx="158" cy="100" r="22" fill="#9aa4ad" />
        <path d="M144 84 140 62l20 16Z" fill="#9aa4ad" />
        <path d="M172 84 176 62l-18 16Z" fill="#9aa4ad" />
        {/* half-asleep eyes */}
        <path d="M146 98c4 4 10 4 13 0M164 96c4 4 9 4 12 0" fill="none" strokeWidth={2.6} />
        {/* tiny tongue blep */}
        <path d="M150 108c1 8 6 8 7 0Z" fill="#ef8fa0" />
        <path d="M140 104l-12-2M141 110l-12 2" fill="none" strokeWidth={2} />
      </g>
    </svg>
  );
}

/** Pickles — a tuxedo cat mid-crime, sweeping the jar off the shelf. */
export function PicklesPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...baseSvg} {...props}>
      {title ? <title>{title}</title> : null}
      <g {...ink}>
        {/* the doomed pickle jar, already tipping */}
        <g transform="rotate(20 164 42)">
          <path d="M150 24h26a5 5 0 0 1 5 5v27a8 8 0 0 1-8 8h-20a8 8 0 0 1-8-8V29a5 5 0 0 1 5-5Z" fill="#cfe3b8" />
          <path d="M148 16h30v9h-30Z" fill="#7fae52" />
          <ellipse cx="163" cy="38" rx="6" ry="3.5" fill="#a7c96a" stroke="none" />
          <ellipse cx="167" cy="50" rx="6" ry="3.5" fill="#a7c96a" stroke="none" />
        </g>
        {/* motion scuffs */}
        <path d="M138 30l-9-6M140 46l-11-3" fill="none" strokeWidth={2.4} />
        {/* lashing tail */}
        <path d="M60 168c-22 0-30-21-18-34 3 14 13 20 22 15Z" fill="#2b2b30" />
        {/* body, tilted into the swipe */}
        <path d="M58 172c-10-40 0-78 34-88 20 6 32 24 36 46 4 24-8 42-26 44Z" fill="#2b2b30" />
        {/* white bib */}
        <path d="M84 170c-8-32-2-58 12-66 12 12 16 38 12 66Z" fill="#f7f7f5" />
        <ellipse cx="86" cy="168" rx="9" ry="7" fill="#f7f7f5" />
        {/* raised paw, reaching for the shelf */}
        <path d="M126 100c22-18 40-30 54-32" fill="none" strokeWidth={8} />
        <ellipse cx="182" cy="66" rx="9" ry="7" fill="#f7f7f5" />
        {/* head, tilted up at the jar */}
        <circle cx="102" cy="74" r="26" fill="#2b2b30" />
        <path d="M88 78a14 12 0 0 0 28 0c-6 12-22 12-28 0Z" fill="#f7f7f5" />
        {/* ears */}
        <path d="M86 56 78 30l26 22Z" fill="#2b2b30" />
        <path d="M122 54 132 30l-22 22Z" fill="#2b2b30" />
        {/* wide, scheming eyes looking up */}
        <circle cx="92" cy="72" r="7" fill="#f4d03f" stroke="none" />
        <circle cx="114" cy="70" r="7" fill="#f4d03f" stroke="none" />
        <circle cx="92" cy="69" r="3.4" fill="#1c1c20" stroke="none" />
        <circle cx="114" cy="67" r="3.4" fill="#1c1c20" stroke="none" />
        <path d="M84 60q7-4 14-1M108 58q7-3 13 1" fill="none" strokeWidth={2.4} />
        {/* nose + tiny fangs */}
        <path d="M100 82 96 87h8Z" fill="#e88" stroke="none" />
        <path d="M95 90l2 5 2-5M105 90l-2 5-2-5" fill="#fff" strokeWidth={1.6} />
        <path d="M72 78l-16-3M72 86l-16 2" fill="none" strokeWidth={2} />
        <path d="M132 76l14-3" fill="none" strokeWidth={2} />
      </g>
    </svg>
  );
}

/** Toast — a warm tan cat launched out of the toaster, deeply startled. */
export function ToastPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...baseSvg} {...props}>
      {title ? <title>{title}</title> : null}
      <g {...ink}>
        {/* steam curls */}
        <path d="M62 44c7-8-4-14 2-24M138 44c7-8-4-14 2-24" fill="none" stroke="#c9ced2" strokeWidth={2.6} />
        {/* cat body springing up out of the slot */}
        <path d="M70 140c-6-46 4-78 30-82s36 36 30 82Z" fill="#c98a4b" />
        {/* ears */}
        <path d="M76 58 70 34l26 20Z" fill="#c98a4b" />
        <path d="M124 58 130 34l-26 20Z" fill="#c98a4b" />
        <path d="M80 52 76 38l12 10Z" fill="#e8b58c" stroke="none" />
        <path d="M120 52 124 38l-12 10Z" fill="#e8b58c" stroke="none" />
        {/* head */}
        <circle cx="100" cy="72" r="28" fill="#c98a4b" />
        {/* melting butter pat, sliding off the head */}
        <path d="M86 34h26l-6 13H80Z" fill="#f5d76e" stroke="#e0be4a" />
        <path d="M82 47c-3 7-2 13 3 16" fill="none" stroke="#e0be4a" strokeWidth={2.4} />
        {/* startled eyes */}
        <circle cx="88" cy="72" r="7.5" fill="#fff" stroke={OUTLINE} strokeWidth={2.6} />
        <circle cx="112" cy="72" r="7.5" fill="#fff" stroke={OUTLINE} strokeWidth={2.6} />
        <circle cx="88" cy="73" r="3.6" fill="#33291f" stroke="none" />
        <circle cx="112" cy="73" r="3.6" fill="#33291f" stroke="none" />
        {/* raised brows */}
        <path d="M78 56q8-6 16-3M106 53q8-3 16 3" fill="none" strokeWidth={2.6} />
        {/* tiny gasping mouth */}
        <ellipse cx="100" cy="88" rx="4" ry="5.5" fill="#7a4a2b" stroke="none" />
        <path d="M100 80 97 84h6Z" fill="#e07d92" stroke="none" />
        {/* whiskers */}
        <path d="M70 78l-15-2M70 86l-15 3" fill="none" strokeWidth={2} />
        <path d="M130 78l15-2M130 86l15 3" fill="none" strokeWidth={2} />
        {/* the toaster, drawn over the cat's lower half */}
        <path d="M40 126h120a10 10 0 0 1 10 10v36a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6v-36a10 10 0 0 1 10-10Z" fill="#d9dde0" />
        <path d="M66 130q34-11 68 0" fill="none" strokeWidth={2.6} />
        <path d="M44 150h60" fill="none" stroke="#b9bfc4" strokeWidth={2.4} />
        {/* lever + knob on the side */}
        <path d="M170 140v12" fill="none" strokeWidth={5} />
        <circle cx="150" cy="164" r="5" fill="#b9bfc4" />
        {/* stray crumbs */}
        <circle cx="52" cy="186" r="2.2" fill="#a9711f" stroke="none" />
        <circle cx="120" cy="188" r="2" fill="#a9711f" stroke="none" />
      </g>
    </svg>
  );
}

/** Bean — a very small black cat, all eyes, showing off every toe bean. */
export function BeanPortrait({ title, ...props }: PortraitProps) {
  return (
    <svg {...baseSvg} {...props}>
      {title ? <title>{title}</title> : null}
      <g {...ink}>
        {/* startled sweat drop */}
        <path d="M134 62c4 6 4 11 0 14-4-3-4-8 0-14Z" fill="#bcd8e6" stroke="#8fb8c9" strokeWidth={2} />
        {/* tiny tail curl */}
        <path d="M124 150c15 1 21-10 16-21" fill="none" strokeWidth={5} />
        {/* small jellybean body */}
        <path d="M74 150c-3-30 10-44 26-44s29 14 26 44c-1 10-12 15-26 15s-25-5-26-15Z" fill="#26232b" />
        <path d="M88 150c-2-24 4-36 12-38 8 2 14 14 12 38Z" fill="#413c47" />
        {/* four paws up, toe beans out */}
        {[
          [86, 150],
          [114, 150],
          [82, 164],
          [118, 164],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx="9" ry="7.5" fill="#26232b" />
            <ellipse cx={cx} cy={cy + 1.5} rx="4" ry="3" fill="#f2a9be" stroke="none" />
            <circle cx={cx - 4} cy={cy - 3} r="1.6" fill="#f2a9be" stroke="none" />
            <circle cx={cx} cy={cy - 4.5} r="1.6" fill="#f2a9be" stroke="none" />
            <circle cx={cx + 4} cy={cy - 3} r="1.6" fill="#f2a9be" stroke="none" />
          </g>
        ))}
        {/* oversized head */}
        <circle cx="100" cy="80" r="34" fill="#26232b" />
        {/* tall ears */}
        <path d="M74 60 62 24l34 28Z" fill="#26232b" />
        <path d="M126 60 138 24l-34 28Z" fill="#26232b" />
        <path d="M78 52 72 34l16 14Z" fill="#f2a9be" stroke="none" />
        <path d="M122 52 128 34l-16 14Z" fill="#f2a9be" stroke="none" />
        {/* enormous eyes */}
        <ellipse cx="86" cy="82" rx="11" ry="13" fill="#bfe3c9" stroke={OUTLINE} strokeWidth={2.6} />
        <ellipse cx="114" cy="82" rx="11" ry="13" fill="#bfe3c9" stroke={OUTLINE} strokeWidth={2.6} />
        <ellipse cx="86" cy="84" rx="7" ry="9.5" fill="#1c1c20" stroke="none" />
        <ellipse cx="114" cy="84" rx="7" ry="9.5" fill="#1c1c20" stroke="none" />
        <circle cx="83" cy="79" r="2.4" fill="#fff" stroke="none" />
        <circle cx="111" cy="79" r="2.4" fill="#fff" stroke="none" />
        <circle cx="89" cy="88" r="1.4" fill="#fff" stroke="none" />
        <circle cx="117" cy="88" r="1.4" fill="#fff" stroke="none" />
        {/* nose + :3 mouth */}
        <path d="M100 96 96 100h8Z" fill="#f2a9be" stroke="none" />
        <path d="M100 100v3M100 103c-3 4-8 3-10 0M100 103c3 4 8 3 10 0" fill="none" strokeWidth={2.2} />
        {/* whiskers */}
        <path d="M70 92l-14-3M70 100l-14 2" fill="none" strokeWidth={2} />
        <path d="M130 92l14-3M130 100l14 2" fill="none" strokeWidth={2} />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

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
