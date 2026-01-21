import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SmartNews - Content Curation Platform",
  description: "Curate, monetize, and share your content expertise with SmartNews",
  keywords: ["content curation", "newsletter", "creator economy", "content monetization"],
  authors: [{ name: "SmartNews" }],
  icons: {
    icon: [
      { url: "/logo/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/logo/favicon/favicon.ico",
    apple: "/logo/favicon/apple-touch-icon.png",
  },
  manifest: "/logo/favicon/site.webmanifest",
  openGraph: {
    title: "SmartNews - Content Curation Platform",
    description: "Curate, monetize, and share your content expertise",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
