import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  title: "zpluscrm – Connect. Manage. Grow.",
  description: "zpluscrm enterprise practice management platform for professional firms. Manage clients, services, billing, and documents in one place.",
  keywords: "zpluscrm, firm management, CRM practice, client management, billing, CRM",
  icons: {
    icon: [
      { url: "/zplus-icon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/zplus-icon.svg",
    apple: "/zplus-icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased bg-[#F8FAFC]`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors expand />
        </AuthProvider>
      </body>
    </html>
  );
}
