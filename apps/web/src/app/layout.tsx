import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";

export const metadata: Metadata = {
  title: "WasteNot — AI Intelligence Layer",
  description:
    "Always-on multi-agent RAG intelligence layer for AI-powered ad optimization. Continuously scans, reasons, and recommends to eliminate wasted ad spend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main
            className="flex-1 ml-[260px] transition-all duration-300"
            style={{ background: "var(--color-bg-primary)" }}
          >
            <div className="max-w-[1400px] mx-auto px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
