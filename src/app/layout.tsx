import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  title: "CRMExpert – Enterprise CRM",
  description: "Enterprise practice management platform for professional firms. Manage clients, services, billing, and documents in one place.",
  keywords: "firm management, CRM practice, GST filing, client management, billing, CRM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('scrollRestoration' in window.history) {
                  window.history.scrollRestoration = 'manual';
                }
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var registration of registrations) {
                      registration.unregister();
                    }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased bg-[#F8FAFC]`}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors expand />
        </AuthProvider>
      </body>
    </html>
  );
}
