import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CBA App",
  description: "Christbaum Abhol-Aktion",
  manifest: "/manifest.json",
  themeColor: "#166534",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CBA App",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <div style={{ paddingTop: '64px' }}>
          {children}
        </div>
        <Navbar />
        <ToastProvider />
      </body>
    </html>
  );
}
