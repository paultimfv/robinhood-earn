import type { Metadata } from "next";
import { Funnel_Display, Funnel_Sans, Geist_Mono } from "next/font/google";
import Nav from "@/components/nav";
import Ask from "@/components/ask";
import "./globals.css";

// Funnel: a display cut for headlines and figures, its text cut for everything else
const display = Funnel_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-display" });
const sans = Funnel_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Robinhood Chain × Earn",
  description: "Self-hosted onchain data on Robinhood Chain and Robinhood Earn",
};

// applied before paint so a saved theme never flashes the other one; ?theme=light|dark forces one (handy for screenshots)
const themeScript = `try{var t=new URLSearchParams(location.search).get("theme")||localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="bg-page text-ink antialiased">
        <Nav />
        {children}
        <footer className="mx-auto mt-16 max-w-6xl border-t-2 border-ink px-4 py-6 text-[12px] text-muted">
          Built by Paul Timofeev from onchain data on Robinhood Chain and Ethereum, refreshed daily. Not investment advice.
        </footer>
        <Ask site="robinhood-earn" title="Robinhood Earn" suggestions={["How much is deposited in Robinhood Earn right now?", "How fast is stablecoin supply on Robinhood Chain growing?", "Where does Earn’s money actually go?"]} />
      </body>
    </html>
  );
}
