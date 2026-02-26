import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { businessName, description, products, url, rankingResults } = await request.json();

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Build a summary of current ranking status
    const rankedKeywords = rankingResults
      ?.filter((r: { isYouRanked: boolean }) => r.isYouRanked)
      .map((r: { keyword: string }) => r.keyword) || [];
    const notRankedKeywords = rankingResults
      ?.filter((r: { isYouRanked: boolean }) => !r.isYouRanked)
      .map((r: { keyword: string }) => r.keyword) || [];

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
            content: `You are an expert AI SEO consultant. You help businesses get cited and recommended by AI chatbots (ChatGPT, Perplexity, Gemini). Your advice must be specific, actionable, and based on what actually makes AI models cite websites.

Return ONLY valid JSON in this exact format:
{
  "contentQueries": [
    {
      "query": "The exact search query/question to target",
      "intent": "informational" | "commercial" | "transactional",
      "contentType": "blog" | "landing-page" | "comparison" | "guide" | "faq" | "case-study",
      "title": "Suggested content title",
      "why": "Brief explanation of why this query matters"
    }
  ],
  "quickWins": [
    "Actionable tip 1",
    "Actionable tip 2"
  ],
  "contentGaps": [
    "Gap description 1",
    "Gap description 2"
  ]
}`,
          },
          {
            role: "user",
            content: `Analyze this business and generate content suggestions to help them get cited by AI chatbots.

BUSINESS:
- Name: ${businessName}
- URL: ${url}
- What they do: ${description}
- Products/Services: ${(products || []).join(", ")}

CURRENT AI RANKING STATUS:
- Queries where they ARE cited (${rankedKeywords.length}): ${rankedKeywords.slice(0, 5).join("; ") || "None"}
- Queries where they are NOT cited (${notRankedKeywords.length}): ${notRankedKeywords.slice(0, 8).join("; ") || "None"}

Based on this, generate:
1. "contentQueries" - 8-10 specific search queries this business should create content for. These should be REALISTIC queries that people actually ask AI chatbots. Focus on queries where the business is NOT currently ranking but SHOULD be. Include the intent type and what kind of content to create.

2. "quickWins" - 3-4 immediate actionable things they can do to start getting cited (e.g., "Add structured FAQ schema", "Create a comparison page vs [competitor]")

3. "contentGaps" - 3-4 specific content gaps that are causing them to not be cited

Return ONLY the JSON.`,
          },
        ],
        max_tokens: 2500,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || `API error (${res.status})`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let suggestions;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse suggestions response");
      }
    }

    return NextResponse.json(suggestions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
