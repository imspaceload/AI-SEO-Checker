"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* About */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">About</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Organic SEO helps you understand how your website appears in
            AI-powered search responses from ChatGPT, Perplexity, and Gemini.
          </p>
          <p>
            <strong>How it works:</strong> We send your search query to each AI
            model and analyze whether your website is mentioned in their
            response. This helps you understand your visibility in the emerging
            AI search landscape.
          </p>
          <p>
            <strong>Providers:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ChatGPT</strong> - GPT-4o via RapidAPI</li>
            <li><strong>Perplexity</strong> - Sonar model with real-time web search (best for checking current rankings)</li>
            <li><strong>Gemini</strong> - Google&apos;s Gemini model</li>
          </ul>
          <p>
            <strong>Privacy:</strong> Queries are sent from our server to AI
            providers. No personal data is collected or stored on external servers.
          </p>
        </div>
      </div>
    </div>
  );
}
