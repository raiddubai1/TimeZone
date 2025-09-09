import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/navigation";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TimeZone - Effortless Time Zone Conversions & Global Scheduling",
  description: "TimeZone provides effortless time zone conversions and global scheduling tools for professionals and travelers worldwide.",
  keywords: ["TimeZone", "time zone", "conversion", "scheduling", "global", "clock", "world time"],
  authors: [{ name: "TimeZone Team" }],
  openGraph: {
    title: "TimeZone - Effortless Time Zone Conversions & Global Scheduling",
    description: "TimeZone provides effortless time zone conversions and global scheduling tools for professionals and travelers worldwide.",
    url: "https://timezone.app",
    siteName: "TimeZone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TimeZone - Effortless Time Zone Conversions & Global Scheduling",
    description: "TimeZone provides effortless time zone conversions and global scheduling tools for professionals and travelers worldwide.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <Providers>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
