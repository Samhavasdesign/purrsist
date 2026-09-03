import styles from "./how-it-works.module.css";

export default function HowPurrsistWorksPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Product walkthrough</p>
        <h1 className={styles.title}>How Purrsist works</h1>
        <p className={styles.subtitle}>
          Purrsist is a calm place to get things out of your head. You capture a
          thought and tap how much it matters; the app sorts it for you and drops
          it onto today or into the backlog. This page traces that path end to
          end.
        </p>
      </header>

      <div className={styles.sections}>
        <section className={styles.section} aria-labelledby="loop-at-a-glance">
          <h2 id="loop-at-a-glance" className={styles.sectionTitle}>
            The loop at a glance
          </h2>
          <p className={styles.sectionNote}>
            One capture travels down the spine of the diagram. Purrsist does the
            middle step automatically, then the item lands in one of three
            places.
          </p>

          <div className={styles.figure}>
            <div
              className={styles.flow}
              role="group"
              aria-label="How a capture moves through Purrsist: open the app, capture a thought and tap its colour, Purrsist sorts it automatically, then it lands on Today, waits in Backlog, or sits in Upcoming until its date."
            >
              <div className={styles.flowNode}>
                <h3>Open Purrsist</h3>
                <p>Today&#8217;s list is created for you.</p>
              </div>

              <span className={styles.flowArrow} aria-hidden="true" />

              <div className={styles.flowNode}>
                <h3>Capture a thought</h3>
                <p>
                  Tap a colour &#8212; big deal / matters / eventually &#8212; then
                  type. Colour is importance, not a deadline.
                </p>
                <span className={styles.flowDots}>
                  <i style={{ background: "var(--hiw-red)" }} />
                  <i style={{ background: "var(--hiw-yellow)" }} />
                  <i style={{ background: "var(--hiw-green)" }} />
                </span>
              </div>

              <span className={styles.flowArrow} aria-hidden="true" />

              <div className={`${styles.flowNode} ${styles.flowNodeAuto}`}>
                <span className={styles.flowKicker}>Runs automatically</span>
                <h3>Purrsist sorts it</h3>
                <p>
                  Labels it (task, errand, reminder, shopping), decides whether it
                  belongs on today, and pulls out a date if the words name one.
                </p>
              </div>

              <span className={styles.flowArrow} aria-hidden="true" />

              <div className={styles.flowBranches}>
                <div className={styles.flowNode}>
                  <h3>On Today</h3>
                  <p>Fills Must-Do, Should-Dos or Quick Wins by colour.</p>
                </div>
                <div className={styles.flowNode}>
                  <h3>In Backlog</h3>
                  <p>Undated captures and overflow, ready to fix or promote.</p>
                </div>
                <div className={styles.flowNode}>
                  <h3>Upcoming</h3>
                  <p>Held under a future date until that morning.</p>
                </div>
              </div>

              <div className={styles.flowLoops}>
                <p>
                  <span className={styles.flowLoopLabel}>Promote</span> &#8212; move a
                  Backlog item onto a day you choose.
                </p>
                <p>
                  <span
                    className={`${styles.flowLoopLabel} ${styles.flowLoopLabelAuto}`}
                  >
                    On its date
                  </span>{" "}
                  &#8212; an Upcoming item moves itself onto Today and appears in the
                  Morning Digest.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.legend}>
            <div>
              <span className={styles.lgLine} /> A step in the main flow
            </div>
            <div>
              <span className={`${styles.lgLine} ${styles.lgLineDash}`} /> Purrsist
              runs it for you
            </div>
            <div>
              <span className={styles.lgDots}>
                <i style={{ background: "var(--hiw-red)" }} />
                <i style={{ background: "var(--hiw-yellow)" }} />
                <i style={{ background: "var(--hiw-green)" }} />
              </span>
              Red &#8594; Must-Do &#183; Yellow &#8594; Should-Do &#183; Green &#8594; Quick
              Win
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="step-by-step">
          <h2 id="step-by-step" className={styles.sectionTitle}>
            Step by step
          </h2>
          <p className={styles.sectionNote}>
            The same journey, in the order a person actually meets it.
          </p>

          <ol className={styles.steps}>
            <li>
              <div className={styles.stepBody}>
                <h3>Get in</h3>
                <p>
                  From the landing page, <span className={styles.tap}>Try it</span>{" "}
                  starts an anonymous session straight on the Today screen &#8212; no
                  sign-up. People can also create an account or sign in.
                </p>
                <p>
                  A trial can be converted later: <strong>Save an account</strong>{" "}
                  from Settings keeps everything captured so far. Ending the trial
                  without saving clears the session.
                </p>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Capture</h3>
                <p>
                  The Quick Add bar sits at the top of Today. Tap one colour, type
                  the thought, hit <span className={styles.tap}>Add</span>. Colour is
                  about how much it matters, not when it&#8217;s due &#8212; a future
                  interview can still be red.
                </p>
                <ul className={styles.stepList}>
                  <li>
                    <span className={`${styles.tap} ${styles.tapR}`}>Red</span> &#8212;
                    big deal
                  </li>
                  <li>
                    <span className={`${styles.tap} ${styles.tapY}`}>Yellow</span>{" "}
                    &#8212; it matters
                  </li>
                  <li>
                    <span className={`${styles.tap} ${styles.tapG}`}>Green</span>{" "}
                    &#8212; eventually, or just don&#8217;t forget it
                  </li>
                </ul>
                <p>
                  A &#8220;not for today&#8221; checkbox sends the capture straight to
                  the backlog.
                </p>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Automatic sort</h3>
                <p>
                  In the background, Purrsist labels the item (task, errand,
                  reminder, or shopping), decides whether it belongs on today, and
                  extracts a target date when the text names one &#8212; &#8220;renew
                  passport on the 15th.&#8221; Capture never waits on this; if the
                  step fails, the item still saves.
                </p>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Land on Today</h3>
                <p>
                  Red fills the single <strong>Must-Do</strong>, yellow the two{" "}
                  <strong>Should-Dos</strong>, green the three{" "}
                  <strong>Quick Wins</strong>. If a section is already full, the
                  item still lands as an extra row.
                </p>
                <p>
                  Today also carries <strong>Habits</strong> (daily check-offs that
                  stick around) and the <strong>Daily Reminder</strong> (a free-text
                  note rewritten each day). Rows can be ticked off, dragged to
                  reorder, or added to.
                </p>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Or wait in the Backlog</h3>
                <p>
                  Anything not placed on today lives here: undated captures,
                  overflow, and future-dated items under <strong>Upcoming</strong>.
                  Review whenever &#8212; correct the colour or label, promote an
                  item onto a chosen day, tick it off in place, or archive it.
                  Capture stays fast; organising happens later.
                </p>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Scheduled items come due</h3>
                <p>
                  On its target date an Upcoming item tries to land on Today
                  automatically and appears in that morning&#8217;s digest. Until
                  then it just sits under its date, out of the way.
                </p>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Email keeps the loop honest</h3>
                <p>
                  Email is the reliable channel &#8212; push can fail quietly, so
                  nothing time-sensitive leans on it alone.
                </p>
                <ul className={styles.stepList}>
                  <li>
                    <strong>Morning Digest</strong> &#8212; once each morning: closes
                    out yesterday, nudges you on today&#8217;s empty slots.
                  </li>
                  <li>
                    <strong>Weekly Recap</strong> &#8212; Sunday: a plain list of what
                    got done that week.
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <div className={styles.stepBody}>
                <h3>Consistency earns a cat</h3>
                <p>
                  Any interaction counts as showing up &#8212; even just capturing.
                  Show up 6 or 7 days in a Monday&#8211;Sunday week and you rescue a
                  new stray, kept permanently in <strong>Collection</strong>. Five
                  days or fewer: no cat that week, nothing lost, no penalty.
                </p>
                <p>
                  Habits grow the same gentle way &#8212; add one by hand, or accept a
                  suggestion after you&#8217;ve captured the same thing a few times.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="two-systems">
          <h2 id="two-systems" className={styles.sectionTitle}>
            Two systems running alongside
          </h2>
          <p className={styles.sectionNote}>
            The daily loop is the product. These run on their own cadence and pull
            people back into it.
          </p>
          <div className={styles.panels}>
            <div className={styles.panel}>
              <h3>Email cadence</h3>
              <ul className={styles.cadence}>
                <li>
                  <span className={styles.pill}>Each morning</span>
                  <p>
                    <strong>Morning Digest.</strong> Closes yesterday and points at
                    today&#8217;s empty Must-Do / Should-Do / Quick Win slots. Sent
                    once.
                  </p>
                </li>
                <li>
                  <span className={styles.pill}>Sunday</span>
                  <p>
                    <strong>Weekly Recap.</strong> A flat list of everything
                    completed in the Mon&#8211;Sun week. No scores, no streak.
                  </p>
                </li>
              </ul>
            </div>
            <div className={styles.panel}>
              <h3>Weekly Stray Cat Rescue</h3>
              <ul className={styles.cadence}>
                <li>
                  <span className={styles.pill}>6&#8211;7 days</span>
                  <p>
                    <strong>Rescue.</strong> Any interaction on a day counts. Hit 6
                    or 7 in a Mon&#8211;Sun week and a new stray joins Collection for
                    good.
                  </p>
                </li>
                <li>
                  <span className={styles.pill}>&#8804; 5 days</span>
                  <p>
                    <strong>Quiet week.</strong> No cat, but nothing is taken away
                    and nothing is flagged. The reward is additive only.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="life-of-an-item">
          <h2 id="life-of-an-item" className={styles.sectionTitle}>
            The life of a single item
          </h2>
          <p className={styles.sectionNote}>
            Every capture moves through this. Most paths are short.
          </p>
          <div className={styles.track}>
            <span className={`${styles.chip} ${styles.chipStart}`}>Captured</span>
            <span className={styles.arrow}>&#8594;</span>
            <span className={`${styles.chip} ${styles.chipRest}`}>Sorted</span>
            <span className={styles.arrow}>&#8594;</span>
            <span className={styles.chip}>On Today</span>
            <span className={styles.arrow}>/</span>
            <span className={styles.chip}>In Backlog</span>
            <span className={styles.arrow}>/</span>
            <span className={styles.chip}>Upcoming</span>
            <span className={styles.arrow}>&#8594;</span>
            <span className={`${styles.chip} ${styles.chipDone}`}>Done</span>
            <span className={styles.arrow}>or</span>
            <span className={`${styles.chip} ${styles.chipRest}`}>Archived</span>
            <span className={styles.branch}>
              Backlog &#8594; Today by promoting &#183; Upcoming &#8594; Today
              automatically on its date &#183; Today &#8594; Backlog if it&#8217;s not
              happening
            </span>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>
          <strong>Anonymous vs. account.</strong> The entire flow above works in an
          unsaved trial. The only thing an account changes is durability &#8212;
          captures, habits, rescued cats, and history persist across devices and
          survive signing out. Conversion is a single form in Settings and never
          interrupts capture.
        </p>
      </footer>
    </main>
  );
}
