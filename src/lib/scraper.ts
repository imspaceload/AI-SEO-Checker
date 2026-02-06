import * as cheerio from "cheerio";

export interface ScrapedWebsite {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  headings: { tag: string; text: string }[];
  bodyText: string;
  links: string[];
  schemaData: string;
}

export async function scrapeWebsite(inputUrl: string): Promise<ScrapedWebsite> {
  // Normalize URL
  let url = inputUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch website: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer for cleaner text
  $("script, style, noscript, iframe, svg, nav, footer, header").remove();

  // Extract meta info
  const title = $("title").text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || "";
  const metaKeywords =
    $('meta[name="keywords"]').attr("content")?.trim() || "";
  const ogTitle =
    $('meta[property="og:title"]').attr("content")?.trim() || "";
  const ogDescription =
    $('meta[property="og:description"]').attr("content")?.trim() || "";

  // Extract headings
  const headings: { tag: string; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length > 0 && text.length < 200) {
      headings.push({ tag: el.tagName, text });
    }
  });

  // Extract main body text (limit to keep it manageable)
  const bodyText = $("main, article, [role='main'], .content, #content, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  // Extract links (for competitor/partner detection)
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("http") && !href.includes(url.replace(/https?:\/\/(www\.)?/, ""))) {
      links.push(href);
    }
  });

  // Extract JSON-LD schema data
  let schemaData = "";
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).html()?.trim();
    if (text) {
      schemaData += text + "\n";
    }
  });

  return {
    url,
    title,
    metaDescription,
    metaKeywords,
    ogTitle,
    ogDescription,
    headings: headings.slice(0, 20),
    bodyText,
    links: Array.from(new Set(links)).slice(0, 30),
    schemaData: schemaData.slice(0, 2000),
  };
}
