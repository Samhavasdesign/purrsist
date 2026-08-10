import { NextResponse } from "next/server";
import { runMorningDigestJob } from "@/lib/email/morning-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // Vercel Cron sends this header when CRON_SECRET is configured.
  const cronHeader = request.headers.get("x-vercel-cron-secret");
  if (cronHeader && cronHeader === secret) return true;

  return false;
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runMorningDigestJob();
    const sent = summary.results.filter((r) => r.status === "sent").length;
    const skipped = summary.results.filter((r) => r.status === "skipped").length;
    const errors = summary.results.filter((r) => r.status === "error");

    return NextResponse.json({
      ok: true,
      todayKey: summary.todayKey,
      yesterdayKey: summary.yesterdayKey,
      timezone: summary.timezone,
      sent,
      skipped,
      errors: errors.map((e) => ({
        userId: e.userId,
        reason: e.reason,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Morning digest failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
