import type { Metadata } from "next";
import localFont from "next/font/local";
import TopPalette from "../src/common/components/TopPalette/TopPalette";
import QueryProvider from "../src/common/providers/QueryProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "AI Coach - Yapay Zeka Destekli Mulakat Hazirligi",
  description:
    "AI Coach ile gercek mulakat deneyimi yasayin. Yapay zeka destekli sorular, anlik geri bildirimler ve kisisellestirilmis oneriler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          <TopPalette />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
