import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Organic SEO",
  description: "Privacy Policy for Organic SEO - AI Citation Checker",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[80vh] py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-brand-50 rounded-lg">
            <Shield className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mt-0.5">Last updated: February 2026</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
            <p>When you create an account on Organic SEO, we collect:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li><strong>Account information:</strong> Your name, email address, and encrypted password.</li>
              <li><strong>Website data:</strong> The URLs you submit for analysis and the AI-generated results (business profile, keywords, ranking data).</li>
              <li><strong>Usage data:</strong> How many prompt checks you&apos;ve used, your subscription plan, and feature usage patterns.</li>
              <li><strong>Payment data:</strong> If you upgrade to a paid plan, payment processing is handled by PayPal. We store your PayPal subscription ID but never your payment card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>Provide the AI citation checking service — analyzing your website and checking rankings across ChatGPT, Perplexity, and Gemini.</li>
              <li>Send transactional emails (password resets, account confirmations) via Resend.</li>
              <li>Enforce usage limits based on your subscription plan.</li>
              <li>Improve our service and fix bugs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Third-Party Services</h2>
            <p>To provide our service, we share data with these third-party providers:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li><strong>Perplexity AI:</strong> We send your search queries to Perplexity&apos;s Sonar API to check if your website is cited in their responses.</li>
              <li><strong>OpenAI (ChatGPT):</strong> We send queries via RapidAPI to check ChatGPT citations.</li>
              <li><strong>Google (Gemini):</strong> We send queries to Google&apos;s Gemini API for citation checking.</li>
              <li><strong>Firecrawl:</strong> We use Firecrawl to scrape your website content for analysis.</li>
              <li><strong>PayPal:</strong> For subscription payment processing.</li>
              <li><strong>Resend:</strong> For sending transactional emails.</li>
              <li><strong>Vercel:</strong> Our application is hosted on Vercel&apos;s infrastructure.</li>
              <li><strong>Neon (PostgreSQL):</strong> Our database is hosted on Neon&apos;s serverless Postgres platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Data Storage &amp; Security</h2>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>Your passwords are hashed using bcrypt before storage.</li>
              <li>Analysis data (keywords, rankings) is stored in your browser&apos;s localStorage and in our PostgreSQL database.</li>
              <li>All communications are encrypted via HTTPS.</li>
              <li>We do not sell, rent, or share your personal data with third parties for marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Export your data in a portable format.</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at the email address listed below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Cookies &amp; Local Storage</h2>
            <p>We use:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li><strong>Session cookies:</strong> To keep you logged in (managed by NextAuth.js).</li>
              <li><strong>localStorage:</strong> To persist your analysis results in your browser for a faster experience.</li>
            </ul>
            <p className="mt-3">We do not use third-party tracking cookies or analytics trackers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We&apos;ll notify you of significant changes via email or an in-app notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please reach out to us at <strong>support@organicseo.app</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
