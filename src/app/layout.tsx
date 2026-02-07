import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Organic SEO – AI Citation Checker | Track Your Brand in AI Search",
    template: "%s | Organic SEO",
  },
  description:
    "Check if your website is cited in ChatGPT, Perplexity, and Gemini responses. Organic SEO's AI citation checker helps you monitor and improve your AI search visibility.",
  keywords: [
    "AI citation checker",
    "AI SEO",
    "AEO",
    "AI search optimization",
    "ChatGPT ranking",
    "Perplexity ranking",
    "Gemini ranking",
    "AI search visibility",
    "answer engine optimization",
    "generative engine optimization",
  ],
  openGraph: {
    title: "Organic SEO – AI Citation Checker",
    description:
      "Track where your brand appears in AI-generated search responses from ChatGPT, Perplexity, and Gemini.",
    type: "website",
    siteName: "Organic SEO",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
