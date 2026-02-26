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
- Each keyword MUST include a search intent classification

Search intent types:
- "informational" = User wants to learn something ("How does X work?", "What is X?")
- "commercial" = User is researching before buying ("Best X for Y", "X vs Y comparison")
- "transactional" = User is ready to buy/sign up ("Buy X", "X pricing", "X free trial")
- "navigational" = User looking for a specific brand/product ("X login", "X website")

Return ONLY valid JSON in this format:
{
  "keywords": [
    {
      "category": "Category Name",
      "keywords": [
        { "keyword": "prompt text here", "intent": "commercial" },
        { "keyword": "another prompt", "intent": "informational" }
      ]
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

Generate 6 categories with 3-4 prompts each. IMPORTANT: Do NOT include "${businessName}" or the company name inside any prompt text. These prompts must be GENERIC so we can test if AI naturally recommends the brand without being asked about it directly.

1. "BEST TOOL" QUERIES (intent: commercial) - "What's the best [product type] for [specific use case]?" High-intent queries where someone wants a recommendation. Do NOT mention any specific brand.

2. "VERSUS / COMPARISON" QUERIES (intent: commercial) - Compare competitors: "${competitors[0] || "Competitor A"} vs ${competitors[1] || "Competitor B"}" but also generic like "best [product] compared". OK to mention competitors but NOT "${businessName}".

3. "HOW TO / PROBLEM" QUERIES (intent: informational) - "How do I [solve specific pain point]?" or "What tool should I use to [task]?" Problem-focused queries where AI might recommend products.

4. "RECOMMENDATION" QUERIES (intent: transactional) - "Can you recommend a [product type] for [specific audience/industry]?" Direct recommendation requests.

5. "ALTERNATIVES" QUERIES (intent: commercial) - "What are the best alternatives to [competitor]?" or "I'm looking for something like [competitor] but [cheaper/better/different]"

6. "INDUSTRY SPECIFIC" QUERIES (intent: informational) - "[Industry] specific: "What [product type] do [target market] companies use?" or "Best [product] for [industry] in [country]"

CRITICAL RULES:
- Do NOT include "${businessName}" in any prompt text. We want to see if AI mentions the brand organically.
- Each keyword must be a JSON object with "keyword" and "intent" fields.
- Make them sound natural - like how a real person talks to ChatGPT or Perplexity.
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
