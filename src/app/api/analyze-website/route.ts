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

// Strip HTML tags and extract meaningful text content
function htmlToText(html: string): string {
  // Remove script, style, nav, footer, noscript, svg tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "");

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : "";

  // Extract OG tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : "";
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const ogDesc = ogDescMatch ? ogDescMatch[1].trim() : "";

  // Replace block-level tags with newlines
  text = text
    .replace(/<(h[1-6]|p|div|li|tr|br|hr)[^>]*>/gi, "\n")
    .replace(/<\/(h[1-6]|p|div|li|tr)>/gi, "\n");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "");

  // Clean up whitespace
  text = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Deduplicate consecutive identical lines
  const lines = text.split("\n");
  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }
  text = deduped.join("\n");

  // Prepend structured metadata
  let metadata = "";
  if (title) metadata += `Page Title: ${title}\n`;
  if (ogTitle && ogTitle !== title) metadata += `OG Title: ${ogTitle}\n`;
  if (metaDesc) metadata += `Meta Description: ${metaDesc}\n`;
  if (ogDesc && ogDesc !== metaDesc) metadata += `OG Description: ${ogDesc}\n`;
  if (metadata) metadata += "\n---\n\n";

  return metadata + text;
}

// Crawl a website and return text content
async function crawlWebsite(url: string): Promise<{ text: string; success: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OrganicSEOBot/1.0; +https://organicseo.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Crawl failed for ${url}: HTTP ${res.status}`);
      return { text: "", success: false };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      console.warn(`Crawl skipped for ${url}: not HTML (${contentType})`);
      return { text: "", success: false };
    }

    const html = await res.text();
    const text = htmlToText(html);

    // Truncate to ~6000 chars to fit in AI context window
    const truncated = text.length > 6000
      ? text.substring(0, 6000) + "\n\n[Content truncated...]"
      : text;

    return { text: truncated, success: true };
  } catch (err) {
    console.warn(`Crawl error for ${url}:`, err);
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

    // Step 1: Actually crawl the website to get real content
    const crawl = await crawlWebsite(normalizedUrl);

    // Build prompt based on whether crawl succeeded
    let userPrompt: string;

    if (crawl.success && crawl.text.length > 100) {
      // We have real website content - feed it to the AI
      userPrompt = `Here is the actual content crawled from ${normalizedUrl}:

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
      // Crawl failed - fall back to Perplexity web search
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

    // Step 2: Send crawled content to Perplexity for structured analysis
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
