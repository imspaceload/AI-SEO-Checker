import { NextRequest, NextResponse } from "next/server";
import { scrapeWebsite } from "@/lib/scraper";

interface AnalyzeRequest {
  url: string;
  apiKeys: {
    perplexity: string;
    rapidapi: string;
  };
}

function parseJSON(content: string) {
  // Try direct parse
  try {
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    // Try to extract JSON object from text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response as JSON");
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

    // STEP 1: Actually scrape the website to get real content
    let scraped;
    try {
      scraped = await scrapeWebsite(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not fetch website";
      return NextResponse.json(
        { error: `Could not access the website: ${msg}. Make sure the URL is correct and the site is accessible.` },
        { status: 400 }
      );
    }

    // Build a rich context from the actual scraped data
    const websiteContext = `
WEBSITE URL: ${scraped.url}
PAGE TITLE: ${scraped.title}
META DESCRIPTION: ${scraped.metaDescription}
META KEYWORDS: ${scraped.metaKeywords}
OG TITLE: ${scraped.ogTitle}
OG DESCRIPTION: ${scraped.ogDescription}

HEADINGS ON THE PAGE:
${scraped.headings.map((h) => `[${h.tag}] ${h.text}`).join("\n")}

ACTUAL PAGE CONTENT (first 5000 chars):
${scraped.bodyText}

SCHEMA/STRUCTURED DATA:
${scraped.schemaData || "None found"}

EXTERNAL LINKS FOUND ON PAGE:
${scraped.links.slice(0, 15).join("\n")}
`.trim();

    // STEP 2: Feed the REAL scraped content to AI for analysis
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
            content: `You are a business intelligence analyst specializing in competitive analysis. You will receive the ACTUAL scraped content from a website. Based on this real data, analyze the business and return ONLY valid JSON.

You must return this exact JSON structure:
{
  "businessName": "Company Name",
  "description": "One paragraph about what this business does based on their actual website content",
  "products": ["product/service 1", "product/service 2", "product/service 3"],
  "icp": {
    "persona": "Based on the website copy and messaging, describe who they're selling to",
    "painPoints": ["pain point 1 they address", "pain point 2", "pain point 3"],
    "demographics": "Job titles, company sizes, industries their copy targets"
  },
  "targetMarket": {
    "countries": ["Country1", "Country2"],
    "industries": ["Industry1", "Industry2", "Industry3"]
  },
  "competitors": ["competitor1.com", "competitor2.com", "competitor3.com", "competitor4.com", "competitor5.com", "competitor6.com"]
}

RULES:
- Extract products/services ONLY from what you can actually see on the page content
- Guess the ICP based on the language, tone, pricing signals, and who the copy is speaking to
- For target market, look at language, currency, mentioned regions in the content
- For competitors, use your knowledge to find 5-8 direct competitors in the same space - include their actual domain names
- Return ONLY the JSON, no other text`,
          },
          {
            role: "user",
            content: `Here is the actual scraped content from the website. Analyze it:

${websiteContext}

Based on this REAL website data, extract the business info, guess their ICP, identify their target market, and find their competitors. Return ONLY JSON.`,
          },
        ],
        max_tokens: 2000,
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

    // Return both the analysis and the scraped data so the frontend knows what was captured
    return NextResponse.json({
      analysis,
      scraped: {
        title: scraped.title,
        metaDescription: scraped.metaDescription,
        headingsCount: scraped.headings.length,
        contentLength: scraped.bodyText.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
