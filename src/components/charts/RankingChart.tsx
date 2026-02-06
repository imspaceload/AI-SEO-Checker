"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AIProvider, RankCheck } from "@/types";
import { getProviderName, getProviderColor } from "@/lib/utils";

interface RankingChartProps {
  checks: RankCheck[];
}

export default function RankingChart({ checks }: RankingChartProps) {
  const providers: AIProvider[] = ["chatgpt", "perplexity", "gemini"];

  const data = providers.map((provider) => {
    const results = checks.flatMap((c) =>
      c.results.filter((r) => r.provider === provider)
    );
    return {
      name: getProviderName(provider),
      Ranked: results.filter((r) => r.isRanked).length,
      "Not Ranked": results.filter((r) => !r.isRanked).length,
      fill: getProviderColor(provider),
    };
  });

  if (data.every((d) => d.Ranked === 0 && d["Not Ranked"] === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No data to display yet. Run some rank checks first.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        />
        <Legend />
        <Bar dataKey="Ranked" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Not Ranked" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
