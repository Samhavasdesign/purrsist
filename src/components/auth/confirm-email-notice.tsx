import { CheckCircleIcon } from "@/components/icons";
import styles from "./auth-form.module.css";

type ConfirmEmailNoticeProps = {
  email: string;
  children?: React.ReactNode;
};

/** Shown after sign-up when the user still has to click the emailed link. */
export function ConfirmEmailNotice({ email, children }: ConfirmEmailNoticeProps) {
  return (
    <div className={styles.notice} role="status">
      <CheckCircleIcon size={24} className={styles.noticeIcon} />
      <div>
        <p className={styles.noticeTitle}>Check your email</p>
        <p className={styles.noticeBody}>
          We sent a confirmation link to <strong>{email}</strong>.{" "}
          {children ?? "Open it to finish creating your account, then sign in."}
        </p>
      </div>
    </div>
  );
}
