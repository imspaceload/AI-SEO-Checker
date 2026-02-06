"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const apiKeyFields = [
  {
    key: "perplexity" as const,
    label: "Perplexity API Key",
    placeholder: "pplx-...",
    description: "Required for Perplexity ranking checks (Sonar model with web search)",
    docsUrl: "https://docs.perplexity.ai/",
    envVar: "PERPLEXITY_API_KEY",
  },
  {
    key: "rapidapi" as const,
    label: "RapidAPI Key",
    placeholder: "Your RapidAPI key...",
    description: "Required for ChatGPT (GPT-4o) ranking checks via RapidAPI",
    docsUrl: "https://rapidapi.com/",
    envVar: "RAPIDAPI_KEY",
  },
  {
    key: "google" as const,
    label: "Google AI API Key (Optional)",
    placeholder: "AI...",
    description: "Optional - enables Gemini ranking checks",
    docsUrl: "https://aistudio.google.com/app/apikey",
    envVar: "GOOGLE_AI_API_KEY",
  },
];

export default function SettingsPage() {
  const { apiKeys, setApiKeys } = useStore();
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKeys(localKeys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleShow = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* API Keys */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg">
              <Key className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                API Keys
              </h3>
              <p className="text-sm text-gray-500">
                Configure your AI provider API keys for ranking checks
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800">
              <strong>Your keys are pre-configured!</strong> Perplexity and RapidAPI
              keys are set via environment variables. You can override them here
              if needed, or add a Google AI key to enable Gemini checks.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You can also set API keys as environment
              variables (<code className="text-xs bg-blue-100 px-1 py-0.5 rounded">.env.local</code>).
              Keys entered here are stored in your browser and will override
              environment variables.
            </p>
          </div>

          {apiKeyFields.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <a
                  href={field.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Get API Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKeys[field.key] ? "text" : "password"}
                  value={localKeys[field.key]}
                  onChange={(e) =>
                    setLocalKeys((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="input pr-10"
                />
                <button
                  onClick={() => toggleShow(field.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys[field.key] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {field.description} &middot; Env: <code className="text-xs">{field.envVar}</code>
              </p>
            </div>
          ))}

          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save API Keys
              </>
            )}
          </button>
        </div>
      </div>

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
            AI SEO Rank Checker helps you understand how your website appears in
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
            <li><strong>Gemini</strong> - Google&apos;s Gemini model (requires separate Google AI API key)</li>
          </ul>
          <p>
            <strong>Privacy:</strong> API keys stored in the browser override
            environment variables. Queries are sent from the server to AI
            providers. No data is collected or stored on external servers.
          </p>
        </div>
      </div>
    </div>
  );
}
