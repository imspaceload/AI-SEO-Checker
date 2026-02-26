import { NextRequest, NextResponse } from "next/server";
import { requireAuth, rateLimit } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(ip, 30, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { keyword, websiteUrl, businessName, rankingSummary } = await request.json();

    if (!keyword || !websiteUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json({ error: "Perplexity API key not configured" }, { status: 500 });
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
            content: `You are an SEO strategist giving friendly, actionable advice. Be conversational and direct — like you're talking to a business owner over coffee. Keep it practical, not jargon-heavy. Use short paragraphs.`,
          },
          {
            role: "user",
            content: `My website is ${websiteUrl}${businessName ? ` (${businessName})` : ""}.

For the search query: "${keyword}"

Here's where I stand across AI search engines:
${rankingSummary}

In 3-4 short paragraphs, tell me:
1. Why are my competitors showing up instead of me? What are they doing right?
2. What specific content or changes should I make to start ranking for this query?
3. What quick wins can I get in the next 30 days?

Be specific to my business and this exact query. Don't be generic.`,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || `Perplexity error (${res.status})`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "Unable to generate analysis.";

    return NextResponse.json({ analysis: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
