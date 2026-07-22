import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CMAExpert – CA/CMA Firm Management",
  description: "Complete practice management platform for CA and CMA firms. Manage clients, services, billing, and documents in one place.",
  keywords: "CA firm management, CMA practice, GST filing, client management, billing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#F0F2F5]`}>
        {children}
        <Toaster position="top-right" richColors expand />
      </body>
    </html>
  );
}
