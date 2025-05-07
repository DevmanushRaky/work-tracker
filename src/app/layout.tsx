import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Excellence Tracker Work Tracer",
  description: "Excellence Tracker Work Tracer is your all-in-one platform for tracking attendance, performance, and work progress. Get insights, stay organized, and achieve excellence every month!",
  keywords: [
    "work tracker",
    "excellence tracker",
    "attendance management",
    "performance tracking",
    "leave management",
    "monthly report",
    "daily log",
    "work progress",
    "employee tracker",
    "productivity"
  ],
  openGraph: {
    title: "Excellence Tracker Work Tracer",
    description: "Track your work, attendance, and performance with Excellence Tracker Work Tracer.",
    type: "website",
    url: "https://excellence-work-tracker.netlify.app/",
    siteName: "Excellence Tracker Work Tracer"
  },
  twitter: {
    card: "summary_large_image",
    title: "Excellence Tracker Work Tracer",
    description: "Track your work, attendance, and performance with Excellence Tracker Work Tracer."
  }
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
