import type { Metadata, Viewport } from "next";
import { Pwa } from "@/components/pwa";
import "./globals.css";
export const metadata: Metadata = {
  title: "Weight Log · Roohan Amin",
  description: "A private, simple place for your daily weight check-in.",
  applicationName: "Weight Log",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Weight Log",
  },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f7f2",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <Pwa />
      </body>
    </html>
  );
}
