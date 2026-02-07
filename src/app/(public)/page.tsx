import Link from "next/link";
import {
  Search,
  BarChart3,
  Eye,
  TrendingUp,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  Bot,
  Sparkles,
  FileSearch,
} from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-6">
              <Bot className="w-4 h-4" />
              AI-Powered Citation Tracking
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Is Your Brand Cited in{" "}
              <span className="text-brand-700">AI Search Results?</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Organic SEO is the AI citation checker that reveals exactly where
              your website appears in ChatGPT, Perplexity, and Gemini responses.
              Monitor your visibility in the new era of AI-driven search.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
              >
                Start Checking Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="btn-secondary text-base px-8 py-3.5"
              >
                See How It Works
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Works with 3 AI engines
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Results in seconds
              </span>
            </div>
          </div>

          {/* Mockup Preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50 overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-4 text-xs text-gray-400">
                  organicseo.ai/dashboard
                </span>
              </div>
              <div className="p-8 grid grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium">
                    ChatGPT
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    #2
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    Cited in response
                  </p>
                </div>
                <div className="bg-cyan-50 rounded-xl p-5 border border-cyan-100">
                  <p className="text-xs text-cyan-600 font-medium">
                    Perplexity
                  </p>
                  <p className="text-2xl font-bold text-cyan-700 mt-1">#1</p>
                  <p className="text-xs text-cyan-500 mt-1">
                    Top source cited
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium">Gemini</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">#3</p>
                  <p className="text-xs text-blue-500 mt-1">
                    Mentioned in answer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                What is an AI Citation Checker?
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                As AI-powered search engines like ChatGPT, Perplexity, and
                Gemini replace traditional search, being <strong>cited</strong>{" "}
                in their responses is the new &ldquo;Page 1 ranking.&rdquo;
              </p>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                Organic SEO&apos;s AI citation checker automatically queries
                multiple AI models with your target keywords and analyzes
                whether your brand, website, or product is mentioned in the
                generated responses. It goes beyond traditional SEO to give you
                visibility into the <strong>Answer Engine Optimization (AEO)</strong>{" "}
                landscape.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "See if AI models recommend your brand",
                  "Track your position across ChatGPT, Perplexity & Gemini",
                  "Identify competitors who appear instead of you",
                  "Generate long-tail keyword prompts to monitor",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-8 border border-brand-100">
              <div className="space-y-5">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">User prompt:</p>
                  <p className="text-sm text-gray-800 font-medium">
                    &ldquo;What are the best AI SEO tools for small businesses?&rdquo;
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">AI Response:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Here are some top AI SEO tools... <strong>1.</strong>{" "}
                    <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-semibold">
                      YourBrand.com
                    </span>{" "}
                    &ndash; Offers comprehensive AI-powered... <strong>2.</strong>{" "}
                    CompetitorA &ndash; Known for...
                  </p>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    Your brand is cited at position #1
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need for AI Search Visibility
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Organic SEO gives you a complete toolkit to track, analyze, and
              improve how your brand appears in AI-generated search results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Multi-Model Citation Check",
                description:
                  "Query ChatGPT, Perplexity, and Gemini simultaneously to see where your brand is cited across all major AI search engines.",
              },
              {
                icon: Sparkles,
                title: "Smart Website Analysis",
                description:
                  "Enter your URL and our AI automatically identifies your ICP, competitors, target market, and generates relevant long-tail keywords.",
              },
              {
                icon: FileSearch,
                title: "Long-Tail Keyword Generation",
                description:
                  "AI-generated conversational search prompts across 6 categories: best tool, comparison, how-to, recommendation, alternatives, and industry-specific.",
              },
              {
                icon: BarChart3,
                title: "Competitor Ranking Dashboard",
                description:
                  "See exactly which competitors are being recommended by AI models for your target keywords, with position tracking.",
              },
              {
                icon: Eye,
                title: "Citation Monitoring",
                description:
                  "Track your AI search visibility over time. Know when you gain or lose citations across different AI models.",
              },
              {
                icon: Zap,
                title: "Quick Check Mode",
                description:
                  "Run instant spot-checks for any query across AI models. Perfect for testing new content or checking competitor visibility.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-brand-200 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              How Organic SEO Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to uncover your AI search visibility
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Enter Your Website",
                description:
                  "Paste your website URL and our AI crawls your site to understand your business, products, ICP, and competitive landscape.",
              },
              {
                step: "02",
                title: "AI Generates Keywords",
                description:
                  "We generate dozens of conversational long-tail keywords that real people use when asking AI models for recommendations.",
              },
              {
                step: "03",
                title: "See Who Ranks",
                description:
                  "Each keyword is queried across ChatGPT, Perplexity, and Gemini. See exactly who gets cited — you or your competitors.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-700 text-white text-2xl font-bold mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AEO vs SEO Comparison ── */}
      <section id="aeo-vs-seo" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              AEO vs SEO: Why AI Citations Matter
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Traditional SEO optimizes for search engine result pages. Answer
              Engine Optimization (AEO) ensures your brand is cited when AI
              models generate answers. Both are critical for visibility in 2025
              and beyond.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional SEO */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Traditional SEO
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Optimizes for Google, Bing result pages",
                  "Focuses on blue link rankings (positions 1-10)",
                  "Relies on backlinks, keywords, technical SEO",
                  "Users click through to your website",
                  "Measured by impressions, CTR, traffic",
                  "Content optimized for crawlers",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AEO */}
            <div className="bg-white rounded-2xl p-8 border-2 border-brand-200 relative">
              <span className="absolute -top-3 left-8 bg-brand-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                The Future
              </span>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Answer Engine Optimization (AEO)
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Optimizes for ChatGPT, Perplexity, Gemini responses",
                  "Focuses on being cited/recommended in AI answers",
                  "Relies on authority, clarity, structured content",
                  "AI recommends your brand directly to users",
                  "Measured by citations, mentions, position in answers",
                  "Content optimized for AI understanding",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <CheckCircle2 className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { stat: "40%", label: "of Gen Z use AI for search" },
              { stat: "65%", label: "of queries answered without clicks" },
              { stat: "3x", label: "growth in AI search usage YoY" },
              { stat: "#1", label: "priority for forward-thinking brands" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl font-bold text-brand-700">
                  {item.stat}
                </p>
                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 md:py-28 bg-brand-700">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Start Tracking Your AI Search Visibility
          </h2>
          <p className="mt-4 text-lg text-brand-100 max-w-2xl mx-auto">
            Don&apos;t let competitors dominate AI search results. Use Organic
            SEO&apos;s AI citation checker to understand where your brand stands
            and how to improve.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-brand-700 px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-brand-50 transition-all shadow-lg flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="text-white border border-white/30 px-8 py-3.5 rounded-lg font-medium text-base hover:bg-white/10 transition-all"
            >
              Log In to Dashboard
            </Link>
          </div>
          <p className="mt-6 text-sm text-brand-200">
            Free to start &middot; No credit card required &middot; 10 free
            prompt checks
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-block text-sm text-brand-200 hover:text-white underline underline-offset-4"
          >
            View all pricing plans
          </Link>
        </div>
      </section>
    </>
  );
}
