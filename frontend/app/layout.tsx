import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EduFlow AI — AI-Powered Admission CRM",
  description:
    "Automate student admissions, WhatsApp follow-ups, and counselor workflows with AI. Scale your education consultancy 3x without adding headcount.",
  keywords: "education CRM, admission automation, WhatsApp CRM, student leads, AI counseling",
  openGraph: {
    title: "EduFlow AI",
    description: "AI-Powered WhatsApp CRM for Education Consultancies",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
