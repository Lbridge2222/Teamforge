import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/shared/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TeamForge — Organisational Design & Team Effectiveness",
  description:
    "Model your team structure, map activities to roles, plan career progressions, and run live diagnostics — grounded in six published management frameworks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
