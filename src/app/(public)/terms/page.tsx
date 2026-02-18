import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Organic SEO",
  description: "Terms of Service for Organic SEO - AI Citation Checker",
};

export default function TermsPage() {
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
            <FileText className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-sm text-gray-500 mt-0.5">Last updated: February 2026</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Organic SEO (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
            <p>Organic SEO is an AI citation checking tool that helps you understand where your website is mentioned in AI-powered search responses from ChatGPT, Perplexity, and Gemini. The Service includes:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>Website analysis and business intelligence powered by AI.</li>
              <li>Long-tail keyword generation based on your business profile.</li>
              <li>Citation/ranking checks across multiple AI search engines.</li>
              <li>Gap analysis with actionable recommendations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>One account per person. Sharing accounts is not permitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Free &amp; Paid Plans</h2>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li><strong>Free Plan:</strong> Limited to 10 lifetime prompt checks. Free users cannot delete prompts to reset their count.</li>
              <li><strong>Paid Plans:</strong> Starter ($49/mo), Professional ($99/mo), and Enterprise ($199/mo) plans offer increased prompt limits as described on our Pricing page.</li>
              <li>Payments are processed through PayPal on a recurring subscription basis.</li>
              <li>You may cancel your subscription at any time through PayPal. Access continues until the end of the current billing period.</li>
              <li>We do not offer refunds for partial billing periods.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>Use the Service to check rankings for websites you do not own or have authorization to analyze.</li>
              <li>Attempt to circumvent usage limits, prompt restrictions, or plan limitations.</li>
              <li>Use automated scripts or bots to access the Service.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
              <li>Use the Service for any illegal or unauthorized purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data &amp; Results Accuracy</h2>
            <ul className="list-disc pl-6 space-y-1.5 mt-2">
              <li>AI citation results are based on real-time queries to third-party AI models. Results may vary between checks as AI models update their responses.</li>
              <li>We do not guarantee the accuracy, completeness, or timeliness of any results.</li>
              <li>Gap analysis and recommendations are AI-generated suggestions, not professional SEO advice.</li>
              <li>Rankings in AI search engines are dynamic and can change at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Intellectual Property</h2>
            <p>The Service, including its design, code, and branding, is owned by Organic SEO. Your analysis results and data belong to you. By using the Service, you grant us a limited license to process your website data solely for the purpose of providing the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Limitation of Liability</h2>
            <p>The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, Organic SEO shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time by contacting support.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Changes to Terms</h2>
            <p>We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms. We will notify users of material changes via email.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Contact</h2>
            <p>For questions about these Terms of Service, contact us at <strong>support@organicseo.app</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
