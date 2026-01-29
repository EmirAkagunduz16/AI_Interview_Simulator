import type { Metadata } from "next";
import localFont from "next/font/local";
import TopPalette from "../src/common/components/TopPalette/TopPalette";
import ReduxProvider from "../src/common/providers/ReduxProvider";
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
  title: "HappierWork - AI Interview Coach",
  description: "Your AI-powered interview preparation assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ReduxProvider>
          <TopPalette />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
