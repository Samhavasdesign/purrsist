import styles from "./auth-form.module.css";

type Props = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** Sign-up checkbox for the 7am "Still on your list" email. On by default. */
export function DigestOptIn({ id, checked, onChange }: Props) {
  return (
    <label className={styles.optIn} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>Send me a 7am email with what&apos;s still on my list</span>
    </label>
  );
}
