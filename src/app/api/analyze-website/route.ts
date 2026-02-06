import { NextRequest, NextResponse } from "next/server";

interface AnalyzeRequest {
  url: string;
  apiKeys: {
    perplexity: string;
    rapidapi: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { url, apiKeys } = body;

    if (!url) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }

    const perplexityKey = apiKeys?.perplexity || process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json(
        { error: "Perplexity API key is required for website analysis" },
        { status: 400 }
      );
    }

    // Use Perplexity Sonar (web search) to analyze the website
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
            content: `You are a business analyst. Analyze websites and return ONLY valid JSON, no markdown, no explanation. Return this exact JSON structure:
{
  "businessName": "Company Name",
  "description": "One paragraph about what the business does",
  "products": ["product1", "product2", "product3"],
  "icp": {
    "persona": "Description of ideal customer",
    "painPoints": ["pain1", "pain2", "pain3"],
    "demographics": "Age, role, company size etc"
  },
  "targetMarket": {
    "countries": ["Country1", "Country2"],
    "industries": ["Industry1", "Industry2"]
  },
  "competitors": ["competitor1.com", "competitor2.com", "competitor3.com", "competitor4.com", "competitor5.com"]
}`,
          },
          {
            role: "user",
            content: `Analyze this website thoroughly: ${url}

Find out:
1. What does this business do? What products/services do they sell?
2. Who is their ideal customer profile (ICP)? What pain points do they solve?
3. What is their target market - which countries and industries?
4. Who are their top 5-8 competitors (include website domains)?

Return ONLY the JSON object, nothing else.`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || error.detail || `Perplexity API error (${res.status})`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from response - handle markdown code blocks
    let analysis;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
