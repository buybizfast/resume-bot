import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, DM_Mono } from "next/font/google";
import Script from "next/script";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Resume Bot - Optimize Your Resume for ATS",
  description: "AI-powered resume optimization tool. Get real-time ATS scoring, tailored cover letters, job scam detection, and career tips.",
  verification: {
    google: "f9E_4pOPuHIEUAoWIl327YyyiZ4OlT-DKDNaHo0VikM",
  },
  openGraph: {
    title: "Resume Bot - Optimize Your Resume for ATS",
    description: "AI-powered resume optimization tool. Get real-time ATS scoring, tailored cover letters, job scam detection, and career tips.",
    url: "https://resumebots.co",
    siteName: "Resume Bot",
    images: [{ url: "https://resumebots.co/jacqbots-logo.png", width: 512, height: 512 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Resume Bot - Optimize Your Resume for ATS",
    description: "AI-powered resume optimization tool. Get real-time ATS scoring, tailored cover letters, job scam detection, and career tips.",
    images: ["https://resumebots.co/jacqbots-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-94CVDCHKHZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-94CVDCHKHZ');
          `}
        </Script>
      </head>
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
