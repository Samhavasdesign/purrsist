import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { isDateKey } from "@/lib/dates/parse-due-date";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Asks Claude for the date a note names, for wording `parseDueDate` doesn't
 * cover ("end of the month", "the 15th"). Returns null without a key, on any
 * error, or for a date before today — never blocks saving the note.
 */
export async function aiDueDate(
  text: string,
  todayKey: string,
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const [y, m, d] = todayKey.split("-").map(Number);
  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

  try {
    const client = new Anthropic();
    const response = await client.messages.parse(
      {
        model: "claude-haiku-4-5",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Today is ${weekday}, ${todayKey}. A user jotted this note in their to-do backlog:

${JSON.stringify(text)}

If the note says when it should be done or remembered, give that calendar date as YYYY-MM-DD (today or later). If it names no date, or only a vague time like "soon", give an empty string.`,
          },
        ],
        output_config: {
          format: jsonSchemaOutputFormat({
            type: "object",
            properties: { date: { type: "string" } },
            required: ["date"],
            additionalProperties: false,
          }),
        },
      },
      { timeout: 8_000, maxRetries: 1 },
    );

    const date = response.parsed_output?.date;
    return isDateKey(date) && date >= todayKey ? date : null;
  } catch {
    return null;
  }
}
