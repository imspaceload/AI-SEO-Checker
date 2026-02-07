import Link from "next/link";
import { Activity } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "AI Citation Checker", href: "/#features" },
    { label: "AEO vs SEO", href: "/#aeo-vs-seo" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "#" },
  ],
  Resources: [
    { label: "What is AEO?", href: "#" },
    { label: "AI SEO Guide", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                Organic SEO
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              The AI citation checker that shows you exactly where your brand appears
              in ChatGPT, Perplexity, and Gemini responses.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Organic SEO. All rights reserved.
          </p>
          <p className="text-xs">
            AI Citation Checker &mdash; Track your brand visibility across AI search engines
          </p>
        </div>
      </div>
    </footer>
  );
}
