import dash from "@/components/daily/daily-dashboard.module.css";
import styles from "./today-preview.module.css";

/**
 * A cropped, non-interactive preview of the real Today screen, composed for
 * the landing hero. It reuses the actual daily-dashboard styles so it stays
 * visually identical to the product — every row here is a disabled control,
 * and the whole mock is exposed to assistive tech as a single labelled image.
 */

function PreviewRow({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <li className={dash.slotRow}>
      <input
        type="checkbox"
        className={dash.checkbox}
        checked={done}
        disabled
        readOnly
        tabIndex={-1}
      />
      <div className={dash.slotFields}>
        <input
          type="text"
          className={`${dash.slotInput} ${done ? dash.slotDone : ""}`}
          value={text}
          disabled
          readOnly
          tabIndex={-1}
        />
      </div>
    </li>
  );
}

export function TodayPreview() {
  return (
    <figure className={styles.figure}>
      <div className={styles.clip}>
        <div
          className={styles.mock}
          role="img"
          aria-label="The Purrsist Today screen: one Must-Do, two Should-Dos, and Quick Wins, each on its own colour-coded card, with completed items checked off."
        >
          <div className={`${dash.section} ${dash.section_red}`}>
            <div className={dash.sectionHead}>
              <div className={dash.sectionTitleRow}>
                <div className={dash.sectionTitleCluster}>
                  <div className={dash.sectionTitleMain}>
                    <h3 className={dash.sectionTitle}>Must-Dos</h3>
                    <p className={dash.sectionHint}>Hot tickets.</p>
                  </div>
                </div>
              </div>
            </div>
            <ul className={dash.slotList}>
              <PreviewRow text="Send the quarterly report" />
            </ul>
          </div>

          <div className={`${dash.section} ${dash.section_yellow}`}>
            <div className={dash.sectionHead}>
              <div className={dash.sectionTitleRow}>
                <div className={dash.sectionTitleCluster}>
                  <div className={dash.sectionTitleMain}>
                    <h3 className={dash.sectionTitle}>Should-Dos</h3>
                    <p className={dash.sectionHint}>Medium urgency.</p>
                  </div>
                </div>
              </div>
            </div>
            <ul className={dash.slotList}>
              <PreviewRow text="Book the dentist" />
              <PreviewRow text="Reply to Dana about the offsite" done />
            </ul>
          </div>

          <div className={`${dash.section} ${dash.section_green}`}>
            <div className={dash.sectionHead}>
              <div className={dash.sectionTitleRow}>
                <div className={dash.sectionTitleCluster}>
                  <div className={dash.sectionTitleMain}>
                    <h3 className={dash.sectionTitle}>Quick Wins</h3>
                    <p className={dash.sectionHint}>Small stuff, done fast.</p>
                  </div>
                </div>
              </div>
            </div>
            <ul className={dash.slotList}>
              <PreviewRow text="Water the plants" />
              <PreviewRow text="Clear the download folder" />
            </ul>
          </div>
        </div>
      </div>
      <span className={styles.fade} aria-hidden="true" />
    </figure>
  );
}
