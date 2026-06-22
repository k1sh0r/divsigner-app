import type { ProviderConfig } from "../providers/types";
import { PROVIDERS } from "../providers/config";
import { getCompletionUrl } from "../providers/config";
import { needsRelay, relayFetch } from "../providers/relay";
import { buildRequestBody } from "../providers/adapter";

/** Pure: strip a wrapping ```markdown / ``` fence the model sometimes returns. */
export function stripMarkdownFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return (m && m[1] !== undefined ? m[1] : t).trim();
}

export async function extractDesignMdFromUrl(
  url: string,
  config: ProviderConfig,
): Promise<string> {
  // Fetch the page via the raw HTML scrape proxy.
  let scrapedContent: string;
  try {
    const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
    scrapedContent = await res.text();
  } catch {
    throw new Error(
      "Couldn't reach the page. Visit the URL, copy its content, and paste it in below.",
    );
  }

  // Now send the scraped content to the LLM to distill a design.md
  const def = PROVIDERS[config.providerId];
  const completionUrl = getCompletionUrl(config);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (def.format === "anthropic") {
    headers["x-api-key"] = config.apiKey;
    headers["anthropic-version"] = "2023-06-01";
    if (def.anthropicHeader) {
      const parts = def.anthropicHeader.split(": ");
      if (parts[0] && parts[1]) headers[parts[0]] = parts[1];
    }
  } else {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const doFetch = needsRelay(config.providerId)
    ? (u: string, init: RequestInit) =>
        relayFetch(u, config.apiKey, { ...init, headers })
    : (u: string, init: RequestInit) =>
        fetch(u, { ...init, headers });

  const systemPrompt = `You are a design system analyst. Extract the visual design language from the provided content and produce a concise design.md.

Output ONLY valid markdown with these sections (include only what you can determine from the content):
- # [Style Name]
- ## Colors (hex values with usage context)
- ## Typography (font families, weights, scale)
- ## Spacing & Layout (padding, margins, grid, border-radius)
- ## Design Language (overall aesthetic, key patterns, mood)

Be specific with hex colors and font names. Keep it concise (under 1000 words). Do NOT include any commentary outside the markdown.`;

  const userPrompt = `Analyze this content and produce a design.md capturing its visual design language:

URL: ${url}

Content:
${scrapedContent.slice(0, 50000)}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const body = buildRequestBody(config, messages, false);

  try {
    const response = await doFetch(completionUrl, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Provider returned ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const json = await response.json();

    let text = "";

    if (def.format === "anthropic") {
      const content = json.content ?? [];
      for (const block of content) {
        if (block.type === "text") text += block.text ?? "";
      }
    } else {
      const choice = json.choices?.[0];
      text = choice?.message?.content ?? "";
    }

    if (!text.trim()) {
      throw new Error(
        "The model returned an empty response. Please paste or upload your design.md directly."
      );
    }

    return stripMarkdownFence(text);
  } catch (err) {
    if (err instanceof Error && err.message.includes("paste or upload")) {
      throw err;
    }
    throw new Error(
      `Failed to extract design from URL: ${err instanceof Error ? err.message : "Unknown error"}. ` +
      "Please paste or upload your design.md directly."
    );
  }
}