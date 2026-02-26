import { NextRequest, NextResponse } from "next/server";
import { AIProvider, RankCheckResult } from "@/types";
import { requireAuth, rateLimit } from "@/lib/api-auth";

interface CheckRequest {
  query: string;
  website: string;
  providers: AIProvider[];
  apiKeys: {
    perplexity: string;
    rapidapi: string;
    google: string;
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function buildPrompt(query: string): string {
  return `Please answer the following question thoroughly. Include specific product names, company names, and website URLs where relevant. Be comprehensive in your recommendations.\n\nQuestion: ${query}`;
}

function analyzeResponse(
  response: string,
  website: string
): { isRanked: boolean; position: number | null; snippet: string } {
  const normalizedResponse = response.toLowerCase();
  const normalizedWebsite = website
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/\/$/, "");

  // Check for website mention in various forms
  const patterns = [
    normalizedWebsite,
    normalizedWebsite.split(".")[0], // brand name (e.g., "notion" from "notion.so")
  ];

  let isRanked = false;
  let position: number | null = null;

  for (const pattern of patterns) {
    if (pattern.length >= 3 && normalizedResponse.includes(pattern)) {
      isRanked = true;
      break;
    }
  }

  // Try to determine position by looking at numbered lists
  if (isRanked) {
    const lines = response.split("\n");
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (patterns.some((p) => p.length >= 3 && lowerLine.includes(p))) {
        const match = line.match(/^[\s]*(\d+)[.)]\s/);
        if (match) {
          position = parseInt(match[1]);
        }
        break;
      }
    }
  }

  // Extract a relevant snippet
  let snippet = "";
  if (isRanked) {
    const sentences = response.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (patterns.some((p) => p.length >= 3 && sentence.toLowerCase().includes(p))) {
        snippet = sentence.trim() + ".";
        break;
      }
    }
  } else {
    snippet = "Website not mentioned in the AI response.";
  }

  return { isRanked, position, snippet };
}

// ChatGPT via RapidAPI
async function checkChatGPT(
  query: string,
  website: string,
  apiKey: string
): Promise<RankCheckResult> {
  const key = apiKey || process.env.RAPIDAPI_KEY;
  if (!key) {
    return {
      id: generateId(),
      query,
      website,
      provider: "chatgpt",
      isRanked: false,
      position: null,
      snippet: "RapidAPI key not configured.",
      response: "Error: No RapidAPI key provided for ChatGPT.",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(
      "https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host":
            "cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com",
          "x-rapidapi-key": key,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. When answering questions about products, services, or tools, be specific and include website URLs, company names, and brand names where relevant.",
            },
            { role: "user", content: buildPrompt(query) },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.error?.message || error.message || `ChatGPT API error (${res.status})`
      );
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content || "";
    const analysis = analyzeResponse(response, website);

    return {
      id: generateId(),
      query,
      website,
      provider: "chatgpt",
      isRanked: analysis.isRanked,
      position: analysis.position,
      snippet: analysis.snippet,
      response,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      id: generateId(),
      query,
      website,
      provider: "chatgpt",
      isRanked: false,
      position: null,
      snippet: `Error: ${message}`,
      response: `Failed to check ChatGPT: ${message}`,
      checkedAt: new Date().toISOString(),
    };
  }
}

// Perplexity AI (great for search-based ranking since it does real-time web search)
async function checkPerplexity(
  query: string,
  website: string,
  apiKey: string
): Promise<RankCheckResult> {
  const key = apiKey || process.env.PERPLEXITY_API_KEY;
  if (!key) {
    return {
      id: generateId(),
      query,
      website,
      provider: "perplexity",
      isRanked: false,
      position: null,
      snippet: "Perplexity API key not configured.",
      response: "Error: No API key provided for Perplexity.",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. When answering questions about products, services, or tools, be specific and include website URLs, company names, and brand names where relevant. Provide comprehensive recommendations with real sources.",
          },
          { role: "user", content: buildPrompt(query) },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.error?.message || error.detail || `Perplexity API error (${res.status})`
      );
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content || "";
    const analysis = analyzeResponse(response, website);

    return {
      id: generateId(),
      query,
      website,
      provider: "perplexity",
      isRanked: analysis.isRanked,
      position: analysis.position,
      snippet: analysis.snippet,
      response,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      id: generateId(),
      query,
      website,
      provider: "perplexity",
      isRanked: false,
      position: null,
      snippet: `Error: ${message}`,
      response: `Failed to check Perplexity: ${message}`,
      checkedAt: new Date().toISOString(),
    };
  }
}

// Gemini (optional - needs Google AI API key)
async function checkGemini(
  query: string,
  website: string,
  apiKey: string
): Promise<RankCheckResult> {
  const key = apiKey || process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return {
      id: generateId(),
      query,
      website,
      provider: "gemini",
      isRanked: false,
      position: null,
      snippet: "Google AI API key not configured. Add one in Settings to enable Gemini checks.",
      response: "Error: No API key provided for Gemini. Get one free at https://aistudio.google.com/app/apikey",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(query) }] }],
          generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Gemini API error");
    }

    const data = await res.json();
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const analysis = analyzeResponse(response, website);

    return {
      id: generateId(),
      query,
      website,
      provider: "gemini",
      isRanked: analysis.isRanked,
      position: analysis.position,
      snippet: analysis.snippet,
      response,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      id: generateId(),
      query,
      website,
      provider: "gemini",
      isRanked: false,
      position: null,
      snippet: `Error: ${message}`,
      response: `Failed to check Gemini: ${message}`,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 30, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body: CheckRequest = await request.json();
    const { query, website, providers, apiKeys } = body;

    if (!query || !website || !providers || providers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: query, website, and providers" },
        { status: 400 }
      );
    }

    const checkFunctions: Record<
      AIProvider,
      (q: string, w: string, k: string) => Promise<RankCheckResult>
    > = {
      chatgpt: checkChatGPT,
      perplexity: checkPerplexity,
      gemini: checkGemini,
    };

    const keyMap: Record<AIProvider, string> = {
      chatgpt: apiKeys?.rapidapi || "",
      perplexity: apiKeys?.perplexity || "",
      gemini: apiKeys?.google || "",
    };

    // Run all checks in parallel
    const results = await Promise.all(
      providers.map((provider) =>
        checkFunctions[provider](query, website, keyMap[provider])
      )
    );

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
