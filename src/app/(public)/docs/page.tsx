import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Globe,
  Search,
  Sparkles,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Zap,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Documentation | Organic SEO",
  description: "Learn how Organic SEO works - AI Citation Checker documentation",
};

const steps = [
  {
    icon: Globe,
    title: "1. Enter Your Website URL",
    description:
      "Start by entering your website URL. Our AI will crawl your site using Firecrawl to understand your business, products, and target audience.",
  },
  {
    icon: Search,
    title: "2. Review Your Business Profile",
    description:
      "We use AI to identify your business name, products/services, ideal customer profile (ICP), target market, pain points, and direct competitors.",
  },
  {
    icon: Sparkles,
    title: "3. Generate Long-Tail Keywords",
    description:
      "Based on your business profile, we generate targeted long-tail keywords — the exact prompts your ideal customers would type into AI search engines.",
  },
  {
    icon: TrendingUp,
    title: "4. Check AI Rankings",
    description:
      "We check each keyword across Perplexity, ChatGPT, and Gemini to see if your website is cited in their responses. You get a Yes/No for each provider.",
  },
  {
    icon: Lightbulb,
    title: "5. Get Gap Analysis",
    description:
      "Click any keyword to see who is ranking instead of you, and get AI-powered recommendations on how to start getting cited for that query.",
  },
];

const faqs = [
  {
    q: "What is AI citation checking?",
    a: "AI citation checking tells you whether your website is mentioned when someone asks an AI search engine (like ChatGPT, Perplexity, or Gemini) a question related to your business. Unlike traditional SEO which focuses on Google results, this focuses on AI-generated answers.",
  },
  {
    q: "How is this different from traditional SEO tools?",
    a: "Traditional SEO tools check your Google search rankings. Organic SEO checks if AI models mention your brand when answering questions. This is called Answer Engine Optimization (AEO) — the next frontier of search visibility.",
  },
  {
    q: "How many keywords can I check?",
    a: "Free users can check up to 10 keywords. Paid plans offer 100, 500, or unlimited keyword checks per month depending on your plan.",
  },
  {
    q: "Which AI models do you check?",
    a: "We currently check three major AI search engines: Perplexity (Sonar model with real-time web search), ChatGPT (GPT-4o), and Google Gemini.",
  },
  {
    q: "How accurate are the results?",
    a: "Results are based on real-time queries to each AI model. Since AI responses can vary between queries, we recommend checking periodically to track your citation trends over time.",
  },
  {
    q: "What is the gap analysis?",
    a: "When you click on any keyword, we generate a personalized analysis explaining why competitors rank instead of you and provide specific, actionable steps to start getting cited for that query.",
  },
  {
    q: "Can I analyze any website?",
    a: "You can analyze any publicly accessible website. The system works best with websites that have clear product/service descriptions and content.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Go to the Pricing page and select a plan. Payment is handled through PayPal subscriptions. You can cancel anytime.",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-[80vh] py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-50 rounded-lg">
            <BookOpen className="w-6 h-6 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
        </div>
        <p className="text-gray-500 mb-12 max-w-2xl">
          Learn how Organic SEO helps you track and improve your brand visibility across AI-powered search engines like ChatGPT, Perplexity, and Gemini.
        </p>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.title} className="flex gap-4 p-5 bg-white border border-gray-200 rounded-xl">
                <div className="p-2.5 bg-brand-50 rounded-lg h-fit shrink-0">
                  <step.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Plans Overview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Free</h3>
              </div>
              <p className="text-sm text-gray-600">10 lifetime prompt checks. Perfect for trying out the tool.</p>
            </div>
            <div className="p-5 bg-brand-50 border border-brand-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <h3 className="font-semibold text-gray-900">Starter — $49/mo</h3>
              </div>
              <p className="text-sm text-gray-600">100 prompt checks per month. Best for small businesses.</p>
            </div>
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Professional — $99/mo</h3>
              </div>
              <p className="text-sm text-gray-600">500 prompt checks per month. For growing businesses and agencies.</p>
            </div>
            <div className="p-5 bg-gray-900 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-white" />
                <h3 className="font-semibold text-white">Enterprise — $199/mo</h3>
              </div>
              <p className="text-sm text-gray-400">Unlimited prompt checks. For large teams and agencies.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-5 bg-white border border-gray-200 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="p-8 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-xl text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to check your AI rankings?</h2>
          <p className="text-sm text-gray-600 mb-5">
            Start with 10 free checks — no credit card required.
          </p>
          <Link
            href="/signup"
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
