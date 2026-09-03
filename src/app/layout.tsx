import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { CALCULATOR_COUNT, FORMULA_COUNT, INTERACTIVE_TOOL_COUNT } from "@/lib/catalog-stats";

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
  description: `${FORMULA_COUNT} agronomic formulas, ${INTERACTIVE_TOOL_COUNT} interactive tools, ${CALCULATOR_COUNT} free calculators, AI agronomist, satellite NDVI maps, irrigation programs, marketplace, community, and predictive alerts.`,
  keywords: ["agriculture", "agronomy", "formulas", "metrics", "crop", "livestock", "sustainability", "farm economics"],
  authors: [{ name: "Formula Atlas" }],
  manifest: "/manifest.json",
  themeColor: "#059669",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FormulaAtlas",
  },
};

// Register service worker for PWA offline support
const SW_SCRIPT = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </head>
      <body
        className={`${cairo.variable} ${geistMono.variable} font-cairo antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
