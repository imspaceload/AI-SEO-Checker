import { NextRequest, NextResponse } from "next/server";

interface KeywordRequest {
  businessName: string;
  description: string;
  products: string[];
  icp: {
    persona: string;
    painPoints: string[];
  };
  targetMarket: {
    countries: string[];
    industries: string[];
  };
  competitors: string[];
  apiKeys: {
    perplexity: string;
    rapidapi: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: KeywordRequest = await request.json();
    const { businessName, description, products, icp, targetMarket, competitors, apiKeys } = body;

    const perplexityKey = apiKeys?.perplexity || process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json(
        { error: "Perplexity API key is required" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are an AI SEO expert specializing in generative engine optimization (GEO). You understand how AI models like ChatGPT, Perplexity, and Gemini recommend products and services. Generate long-tail keywords/prompts that real users would ask AI chatbots. Return ONLY valid JSON, no markdown.

Return this JSON structure:
{
  "keywords": [
    {
      "category": "Category Name",
      "keywords": ["long tail keyword 1", "long tail keyword 2", "long tail keyword 3"]
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Generate long-tail keywords/prompts for this business. These should be queries that real people would type into ChatGPT, Perplexity, or Gemini.

Business: ${businessName}
Description: ${description}
Products/Services: ${products.join(", ")}
Ideal Customer: ${icp.persona}
Pain Points: ${icp.painPoints.join(", ")}
Target Markets: ${targetMarket.countries.join(", ")}
Industries: ${targetMarket.industries.join(", ")}
Known Competitors: ${competitors.join(", ")}

Generate 5-6 categories with 3-4 long-tail keywords each. Categories should include:
1. "Best [product] for [use case]" queries
2. "[Product] vs [competitor]" comparison queries
3. "How to [solve pain point]" queries
4. Industry-specific recommendation queries
5. Location/market specific queries
6. Problem-solution queries

Make keywords natural - the way people actually ask AI chatbots for recommendations.
Return ONLY the JSON object.`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || error.detail || `API error (${res.status})`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    let keywords;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      keywords = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse keywords response");
      }
    }

    return NextResponse.json(keywords);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
