import type { DailyItemKind, UncheckedItem } from "@/lib/types/database";
import { KIND_LABELS_PLURAL } from "@/lib/types/database";

export type DigestDueReminder = {
  text: string;
  target_date: string;
};

export type MorningDigestData = {
  /** The recipient's local date, YYYY-MM-DD. */
  todayKey: string;
  /** Unchecked tasks from the user's latest day — what carries into today. */
  stillOpen: UncheckedItem[];
  /** The most recently written Daily Reminder note, if any. */
  latestDailyReminder: string | null;
  /** Date-triggered backlog items whose date has arrived. */
  dueReminders: DigestDueReminder[];
  /** Where "Enter Today's To-Dos" opens. */
  appUrl: string;
  /** Signed, login-free "Turn off these emails" page. */
  unsubscribeUrl: string;
};

const KIND_ORDER: DailyItemKind[] = ["must_do", "should_do", "quick_win"];

/**
 * Hex versions of the dashboard section-heading colors (--*-fg in tokens.css,
 * light mode). Email clients can't read CSS variables.
 */
const KIND_COLOR: Record<DailyItemKind, string> = {
  must_do: "#7f4440",
  should_do: "#7f5f32",
  quick_win: "#4f6951",
};

const COLOR = {
  background: "#faf9f6",
  surface: "#ffffff",
  foreground: "#2a2530",
  muted: "#696370",
  border: "#e5e0d7",
};

function kindOf(item: UncheckedItem): DailyItemKind {
  if (item.source === "extra") return item.kind;
  if (item.slot === "must_do") return "must_do";
  return item.slot.startsWith("should_do") ? "should_do" : "quick_win";
}

function groupByKind(items: UncheckedItem[]) {
  return KIND_ORDER.map((kind) => ({
    kind,
    items: items.filter((item) => kindOf(item) === kind),
  })).filter((group) => group.items.length > 0);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDueDate(targetDate: string, todayKey: string): string {
  if (targetDate >= todayKey) return "";
  const [y, m, d] = targetDate.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return ` (was due ${label})`;
}

function dashboardUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/dashboard`;
}

/** PNG, since Gmail and Outlook don't render SVG. 3x of the 96×30 display size. */
function logoUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/email/purrsist-logo.png`;
}

function settingsUrl(appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/settings`;
}

function buildSubject(data: MorningDigestData): string {
  const count = data.stillOpen.length;
  if (count === 0) return "Still on your list · Fresh start today";
  return `Still on your list · ${count} ${count === 1 ? "task" : "tasks"}`;
}

function buildText(data: MorningDigestData): string {
  const lines: string[] = ["Good morning. Here's what's still on your list.", ""];

  if (data.stillOpen.length === 0) {
    lines.push("Nothing carried over from yesterday. Fresh start.");
  } else {
    for (const group of groupByKind(data.stillOpen)) {
      lines.push(KIND_LABELS_PLURAL[group.kind]);
      for (const item of group.items) lines.push(`  • ${item.text}`);
      lines.push("");
    }
  }

  if (data.dueReminders.length > 0 || data.latestDailyReminder) {
    lines.push("Reminders");
    for (const reminder of data.dueReminders) {
      lines.push(
        `  • ${reminder.text}${formatDueDate(reminder.target_date, data.todayKey)}`,
      );
    }
    if (data.latestDailyReminder) {
      lines.push(`  • ${data.latestDailyReminder}`);
    }
    lines.push("");
  }

  lines.push(`Enter Today's To-Dos: ${dashboardUrl(data.appUrl)}`);
  lines.push("");
  lines.push("— Purrsist");
  lines.push("");
  lines.push(
    "You're getting this because morning emails are on for your Purrsist account.",
  );
  lines.push(`Turn them off: ${data.unsubscribeUrl}`);
  lines.push(`Or change it in Account settings: ${settingsUrl(data.appUrl)}`);
  return lines.join("\n");
}

function sectionHeading(label: string, color: string): string {
  return `<p style="margin:24px 0 8px;font-size:13px;font-weight:600;letter-spacing:0.02em;color:${color};">${escapeHtml(label)}</p>`;
}

function itemRow(text: string, dotColor: string, note = ""): string {
  return `<tr>
  <td width="18" valign="top" style="padding:7px 0 7px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-top:6px;"></span></td>
  <td style="padding:6px 0;font-size:16px;line-height:1.45;color:${COLOR.foreground};">${escapeHtml(text)}${note ? `<span style="color:${COLOR.muted};font-size:14px;">${escapeHtml(note)}</span>` : ""}</td>
</tr>`;
}

function buildHtml(data: MorningDigestData): string {
  const parts: string[] = [];

  if (data.stillOpen.length === 0) {
    parts.push(
      `<p style="margin:16px 0 0;font-size:16px;line-height:1.5;color:${COLOR.muted};">Nothing carried over from yesterday. Fresh start.</p>`,
    );
  } else {
    for (const group of groupByKind(data.stillOpen)) {
      const color = KIND_COLOR[group.kind];
      parts.push(sectionHeading(KIND_LABELS_PLURAL[group.kind], color));
      parts.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${group.items
          .map((item) => itemRow(item.text, color))
          .join("")}</table>`,
      );
    }
  }

  if (data.dueReminders.length > 0 || data.latestDailyReminder) {
    parts.push(sectionHeading("Reminders", COLOR.muted));
    const rows = data.dueReminders.map((reminder) =>
      itemRow(
        reminder.text,
        COLOR.muted,
        formatDueDate(reminder.target_date, data.todayKey),
      ),
    );
    if (data.latestDailyReminder) {
      rows.push(itemRow(data.latestDailyReminder, COLOR.muted));
    }
    parts.push(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>`,
    );
  }

  const href = escapeHtml(dashboardUrl(data.appUrl));

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(buildSubject(data))}</title></head>
<body style="margin:0;padding:0;background:${COLOR.background};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.background};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:16px;">
<tr><td style="padding:28px 28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<a href="${escapeHtml(dashboardUrl(data.appUrl))}" style="display:inline-block;text-decoration:none;"><img src="${escapeHtml(logoUrl(data.appUrl))}" width="96" height="30" alt="Purrsist" style="display:block;width:96px;height:30px;border:0;outline:none;color:#5b63a6;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;"></a>
<h1 style="margin:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;line-height:1.25;color:${COLOR.foreground};">Still on your list</h1>
<p style="margin:6px 0 0;font-size:15px;line-height:1.5;color:${COLOR.muted};">Good morning. Here's what carried over.</p>
${parts.join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td style="border-radius:12px;background:${COLOR.foreground};">
<a href="${href}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:600;color:${COLOR.surface};text-decoration:none;border-radius:12px;">Enter Today's To-Dos</a>
</td></tr></table>
</td></tr>
</table>
<p style="margin:16px 0 0;max-width:480px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${COLOR.muted};">You're getting this because morning emails are on for your Purrsist account.<br><a href="${escapeHtml(data.unsubscribeUrl)}" style="color:${COLOR.muted};text-decoration:underline;">Turn off these emails</a> &middot; <a href="${escapeHtml(settingsUrl(data.appUrl))}" style="color:${COLOR.muted};text-decoration:underline;">Account settings</a></p>
</td></tr>
</table>
</body>
</html>`;
}

/** "Still on your list" — carried-over tasks and reminders, sent at 7am local. */
export function buildMorningDigestEmail(data: MorningDigestData): {
  subject: string;
  text: string;
  html: string;
} {
  return {
    subject: buildSubject(data),
    text: buildText(data),
    html: buildHtml(data),
  };
}
