import { NextRequest, NextResponse } from "next/server";

interface AnalyzeRequest {
  url: string;
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
    throw new Error("Failed to parse AI response as JSON");
  }
}

// Scrape a website using Firecrawl REST API and return markdown content
async function scrapeWithFirecrawl(url: string): Promise<{ text: string; success: boolean }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn("FIRECRAWL_API_KEY not set, skipping crawl");
    return { text: "", success: false };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`Firecrawl scrape failed for ${url}: ${res.status}`, err);
      return { text: "", success: false };
    }

    const result = await res.json();

    if (!result.success) {
      console.warn(`Firecrawl scrape failed for ${url}:`, result.error);
      return { text: "", success: false };
    }

    const markdown = result.data?.markdown || "";
    // Truncate to ~8000 chars to fit in AI context window
    const truncated = markdown.length > 8000
      ? markdown.substring(0, 8000) + "\n\n[Content truncated...]"
      : markdown;

    return { text: truncated, success: true };
  } catch (err) {
    console.warn(`Firecrawl error for ${url}:`, err);
    return { text: "", success: false };
  }
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

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Step 1: Scrape the website using Firecrawl
    const crawl = await scrapeWithFirecrawl(normalizedUrl);

    // Build prompt based on whether scrape succeeded
    let userPrompt: string;

    if (crawl.success && crawl.text.length > 100) {
      userPrompt = `Here is the actual content scraped from ${normalizedUrl}:

--- START OF WEBSITE CONTENT ---
${crawl.text}
--- END OF WEBSITE CONTENT ---

Based on the ACTUAL website content above:

1. What is the business name and what do they do?
2. What specific products or services do they sell?
3. Who is their ideal customer? Look at the language and tone - who is it written for?
4. What pain points does their product solve? Look at headlines and value propositions.
5. What countries/regions do they target? What industries?
6. Who are their 6-8 direct competitors? Companies that sell similar things to similar customers. Use your web knowledge to find real competitors.

Return ONLY the JSON.`;
    } else {
      userPrompt = `Go to this website and analyze it thoroughly: ${normalizedUrl}

Read through the website content - their homepage, product descriptions, about page, pricing if available. Based on what you actually find on the site:

1. What is the business name and what do they do?
2. What specific products or services do they sell?
3. Who is their ideal customer? Look at the language and tone of the website - who is it written for?
4. What pain points does their product solve? Look at their headlines and value propositions.
5. What countries/regions do they target? What industries?
6. Who are their 6-8 direct competitors? Companies that sell similar things to similar customers.

Return ONLY the JSON.`;
    }

    // Step 2: Send scraped content to Perplexity for structured analysis
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
            content: `You are a business intelligence analyst. You will analyze a website based on its actual content${crawl.success ? " (provided to you)" : ""}. Do not guess or make things up - base your analysis on real content.

Return ONLY a valid JSON object with this exact structure:
{
  "businessName": "The actual company/brand name from the website",
  "description": "A clear paragraph describing what this business actually does, based on their website content",
  "products": ["actual product/service 1 from their site", "product/service 2", "product/service 3"],
  "icp": {
    "persona": "Based on the website's messaging and tone, who are they clearly selling to?",
    "painPoints": ["specific problem 1 their product solves", "problem 2", "problem 3"],
    "demographics": "Job titles, company sizes, or customer types their website is speaking to"
  },
  "targetMarket": {
    "countries": ["Countries they operate in or target based on the site"],
    "industries": ["Industry 1 they serve", "Industry 2"]
  },
  "competitors": ["competitor1.com", "competitor2.com", "competitor3.com", "competitor4.com", "competitor5.com", "competitor6.com", "competitor7.com", "competitor8.com"]
}

IMPORTANT RULES:
- Products: List ONLY what you can confirm from the website content.
- ICP: Look at who their copy is written for.
- Pain points: What problems does their product solve?
- Target market: Check for language, currency, regional mentions.
- Competitors: Find 6-8 DIRECT competitors with actual domain names.

Return ONLY the JSON. No explanation, no markdown.`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 2500,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || error.detail || `Perplexity API error (${res.status})`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const analysis = parseJSON(content);

    return NextResponse.json({
      analysis,
      crawled: crawl.success,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
