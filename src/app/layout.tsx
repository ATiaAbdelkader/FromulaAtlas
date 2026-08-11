import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Cairo supports both Latin and Arabic glyphs, so the entire app
// (English UI + Arabic UI + scientific names + numerals) renders in one
// consistent family. Weights 200-1000 are available.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "latin-ext", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Formula Atlas — Your AI-powered agronomy platform",
  description: "500 agronomic formulas, 91 interactive tools, AI agronomist, satellite NDVI maps, irrigation programs, marketplace, community, and predictive alerts.",
  keywords: ["agriculture", "agronomy", "formulas", "metrics", "crop", "livestock", "sustainability", "farm economics"],
  authors: [{ name: "Formula Atlas" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistMono.variable} font-cairo antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
