import { NextRequest, NextResponse } from "next/server";
import { AIProvider, CompetitorMention } from "@/types";

interface CompetitorCheckRequest {
  keyword: string;
  websiteUrl: string;
  competitors: string[];
  provider: AIProvider;
  apiKeys: {
    perplexity: string;
    rapidapi: string;
    google: string;
  };
}

function extractCompetitors(
  response: string,
  websiteUrl: string,
  knownCompetitors: string[]
): { competitorsFound: CompetitorMention[]; yourRank: number | null; isYouRanked: boolean } {
  const normalizedResponse = response.toLowerCase();
  const normalizedUrl = websiteUrl.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
  const brandName = normalizedUrl.split(".")[0];

  // Check if user's website is mentioned
  let isYouRanked = false;
  let yourRank: number | null = null;

  if (brandName.length >= 3 && normalizedResponse.includes(brandName)) {
    isYouRanked = true;
    // Try to find position in numbered list
    const lines = response.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().includes(brandName)) {
        const match = line.match(/^[\s]*(\d+)[.)]\s/);
        if (match) {
          yourRank = parseInt(match[1]);
        }
        break;
      }
    }
  }

  // Find competitors mentioned
  const competitorsFound: CompetitorMention[] = [];
  const allToCheck = [...knownCompetitors];

  // Also extract any URLs/brands from numbered lists in the response
  const listPattern = /^\s*(\d+)[.)]\s+\*{0,2}(?:\[)?([^*\]\n]+)/gm;
  let match;
  while ((match = listPattern.exec(response)) !== null) {
    const position = parseInt(match[1]);
    const text = match[2].trim();

    // Check if this is a known competitor
    for (const comp of allToCheck) {
      const compNorm = comp.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
      const compBrand = compNorm.split(".")[0];

      if (
        compBrand.length >= 3 &&
        (text.toLowerCase().includes(compBrand) || text.toLowerCase().includes(compNorm))
      ) {
        if (!competitorsFound.find((c) => c.url === comp)) {
          // Get snippet - the full line
          const lines = response.split("\n");
          let snippet = "";
          for (const line of lines) {
            if (line.toLowerCase().includes(compBrand)) {
              snippet = line.replace(/^\s*\d+[.)]\s+/, "").replace(/\*{1,2}/g, "").trim();
              break;
            }
          }

          competitorsFound.push({
            name: compBrand.charAt(0).toUpperCase() + compBrand.slice(1),
            url: comp,
            position,
            snippet,
          });
        }
      }
    }
  }

  // Also do a simple text search for competitors not found in lists
  for (const comp of allToCheck) {
    const compNorm = comp.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
    const compBrand = compNorm.split(".")[0];

    if (
      compBrand.length >= 3 &&
      normalizedResponse.includes(compBrand) &&
      !competitorsFound.find((c) => c.url === comp)
    ) {
      const sentences = response.split(/[.!?]+/);
      let snippet = "";
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(compBrand)) {
          snippet = sentence.trim();
          break;
        }
      }

      competitorsFound.push({
        name: compBrand.charAt(0).toUpperCase() + compBrand.slice(1),
        url: comp,
        position: null,
        snippet,
      });
    }
  }

  return { competitorsFound, yourRank, isYouRanked };
}

async function queryPerplexity(keyword: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Provide detailed recommendations with specific product/service names, company names, and website URLs. Use numbered lists when recommending multiple options.",
        },
        { role: "user", content: keyword },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || `Perplexity error (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function queryChatGPT(keyword: string, apiKey: string): Promise<string> {
  const res = await fetch(
    "https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host":
          "cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Provide detailed recommendations with specific product/service names, company names, and website URLs. Use numbered lists when recommending multiple options.",
          },
          { role: "user", content: keyword },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || `ChatGPT error (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function queryGemini(keyword: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: keyword }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || `Gemini error (${res.status})`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(request: NextRequest) {
  try {
    const body: CompetitorCheckRequest = await request.json();
    const { keyword, websiteUrl, competitors, provider, apiKeys } = body;

    if (!keyword || !websiteUrl || !provider) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let response = "";

    if (provider === "perplexity") {
      const key = apiKeys?.perplexity || process.env.PERPLEXITY_API_KEY || "";
      if (!key) throw new Error("Perplexity API key not configured");
      response = await queryPerplexity(keyword, key);
    } else if (provider === "chatgpt") {
      const key = apiKeys?.rapidapi || process.env.RAPIDAPI_KEY || "";
      if (!key) throw new Error("RapidAPI key not configured");
      response = await queryChatGPT(keyword, key);
    } else if (provider === "gemini") {
      const key = apiKeys?.google || process.env.GOOGLE_AI_API_KEY || "";
      if (!key) throw new Error("Google AI API key not configured");
      response = await queryGemini(keyword, key);
    }

    const result = extractCompetitors(response, websiteUrl, competitors);

    return NextResponse.json({
      keyword,
      provider,
      response,
      ...result,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
