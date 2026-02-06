import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "AI SEO Rank Checker",
  description: "Check if your website is ranked in ChatGPT, Claude, and Gemini AI responses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-64">
            <TopBar />
            <main className="p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
