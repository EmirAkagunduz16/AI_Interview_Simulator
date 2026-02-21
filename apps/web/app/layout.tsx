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
  title: "AI Coach - Yapay Zeka Destekli Mülakat Hazırlığı",
  description:
    "AI Coach ile gerçek mülakat deneyimi yaşayın. Yapay zeka destekli sorular, anlık geri bildirimler ve kişiselleştirilmiş öneriler.",
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
