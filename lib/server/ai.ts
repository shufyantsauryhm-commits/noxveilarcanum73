export type StructuredSchema = Record<string, unknown>;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
};

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function configuredModel(): string {
  return process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

function normalizeSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeSchema);

  if (!value || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, current] of Object.entries(source)) {
    result[key] =
      key === "type" && typeof current === "string"
        ? current.toUpperCase()
        : normalizeSchema(current);
  }

  return result;
}

function extractText(json: GeminiResponse): string {
  const parts = json.candidates?.[0]?.content?.parts ?? [];

  const text = parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error(
      `Gemini tidak mengembalikan output text. Finish reason: ${
        json.candidates?.[0]?.finishReason ?? "unknown"
      }`,
    );
  }

  return text;
}

export async function runStructuredAi<T>(args: {
  schemaName: string;
  schema: StructuredSchema;
  system: string;
  input: string;
}): Promise<{ data: T; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
  }

  const model = configuredModel();

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
}, 60000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: args.system,
              },
            ],
          },

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: args.input,
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: normalizeSchema(args.schema),
          },
        }),

        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Gemini HTTP ${response.status}: ${body.slice(0, 1000)}`,
      );
    }

    const json = (await response.json()) as GeminiResponse;

    const text = extractText(json);

    try {
      return {
        data: JSON.parse(text) as T,
        model,
      };
    } catch {
      throw new Error(
        `Gemini mengembalikan JSON tidak valid: ${text.slice(0, 1000)}`,
      );
    }
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "Gemini analysis timeout setelah 30 detik.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}