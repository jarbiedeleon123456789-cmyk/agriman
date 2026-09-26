import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SmoothScroll } from "@/components/motion";
import { OriginCursorProvider, BackgroundGlowPattern } from "@/components/originkit";

export const metadata: Metadata = {
  title: "AgriShare — MAO Baco, Oriental Mindoro",
  description:
    "AgriShare is the web-based agricultural resource-sharing and scheduling platform of the Municipal Agriculture Office of Baco, Oriental Mindoro.",
  applicationName: "AgriShare",
  keywords: ["AgriShare", "MAO Baco", "agriculture", "harvester scheduling", "Oriental Mindoro"],
};

export const viewport: Viewport = {
  themeColor: "#0A1F14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f7f2] text-slate-900 antialiased">
        <OriginCursorProvider>
          <SmoothScroll>{children}</SmoothScroll>
          <BackgroundGlowPattern />
          <div className="grain-fixed" aria-hidden />
        </OriginCursorProvider>
      </body>
    </html>
  );
}
