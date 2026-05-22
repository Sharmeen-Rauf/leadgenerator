import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"]
});

const spaceMono = Space_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: "PitchRadar AI | Tactical Lead Command Center",
  description: "Advanced AI-powered lead generation and business intelligence agent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} dark`}>
      <body className="min-h-screen bg-[#0A0E1A] text-[#F0F2F5] selection:bg-[#00D4FF]/30 font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
