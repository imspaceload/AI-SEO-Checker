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

function parseJSON(content: string) {
  try {
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse keywords response");
  }
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
            content: `You generate AI search prompts for competitive ranking analysis. These are the EXACT prompts that will be sent to ChatGPT, Perplexity, and Gemini to see which brands they recommend.

The prompts must:
- Sound like a real person asking an AI chatbot for help
- Be specific enough that the AI would mention real brands/products in response
- Target queries where the business SHOULD appear if they're doing AI SEO right
- Cover different stages of the buyer journey (awareness, consideration, decision)

Return ONLY valid JSON in this format:
{
  "keywords": [
    {
      "category": "Category Name",
      "keywords": ["prompt 1", "prompt 2", "prompt 3"]
    }
  ]
}`,
          },
          {
            role: "user",
            content: `Generate search prompts for ranking analysis. I want to know if "${businessName}" shows up when people ask AI chatbots these questions.

BUSINESS CONTEXT:
- Company: ${businessName}
- What they do: ${description}
- Products/Services: ${products.join(", ")}
- Their customer: ${icp.persona}
- Problems they solve: ${icp.painPoints.join(", ")}
- Target countries: ${targetMarket.countries.join(", ")}
- Target industries: ${targetMarket.industries.join(", ")}
- Direct competitors: ${competitors.join(", ")}

Generate 6 categories with 3-4 prompts each:

1. "BEST TOOL" QUERIES - "What's the best [product type] for [specific use case]?" These are high-intent queries where someone is looking for a recommendation.

2. "VERSUS / COMPARISON" QUERIES - "What's better, ${competitors[0] || "Competitor A"} or ${competitors[1] || "Competitor B"}?" and "${businessName} vs [competitor]" type comparisons.

3. "HOW TO / PROBLEM" QUERIES - "How do I [solve specific pain point]?" or "What tool should I use to [task]?" queries where the AI might recommend a product.

4. "RECOMMENDATION" QUERIES - "Can you recommend a [product type] for [specific audience/industry]?" Direct recommendation requests.

5. "ALTERNATIVES" QUERIES - "What are the best alternatives to [competitor]?" or "I'm looking for something like [competitor] but [cheaper/better/different]"

6. "INDUSTRY SPECIFIC" QUERIES - "[Industry] specific questions like "What [product type] do [target market] companies use?" or "Best [product] for [industry] in [country]"

Make them sound natural - like how a real person talks to ChatGPT or Perplexity. Not keyword-stuffed SEO queries, but actual conversational prompts.
Return ONLY the JSON.`,
          },
        ],
        max_tokens: 2500,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || error.detail || `API error (${res.status})`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const keywords = parseJSON(content);

    return NextResponse.json(keywords);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
