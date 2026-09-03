import type { SVGProps } from "react";
import styles from "./purrsist-logo.module.css";
import {
  PURRSIST_WORDMARK_FILL,
  PURRSIST_WORDMARK_PATH,
  PURRSIST_WORDMARK_VIEWBOX,
} from "./purrsist-wordmark";

type Props = {
  /** Extra classes — typically a height override from the host surface. */
  className?: string;
  /** Hide from assistive tech when a parent already names the control. */
  decorative?: boolean;
} & Omit<
  SVGProps<SVGSVGElement>,
  "viewBox" | "xmlns" | "role" | "aria-hidden" | "aria-label"
>;

export function PurrsistLogo({
  className,
  decorative = false,
  ...rest
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={PURRSIST_WORDMARK_VIEWBOX}
      fill={PURRSIST_WORDMARK_FILL}
      className={[styles.logo, className].filter(Boolean).join(" ")}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Purrsist"}
      {...rest}
    >
      <path fillRule="evenodd" d={PURRSIST_WORDMARK_PATH} />
    </svg>
  );
}
