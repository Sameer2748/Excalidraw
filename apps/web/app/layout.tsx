import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "../context/ThemeContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Excalidraw by Sam",
  description: "Draw Shape and store your geometry and notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </ThemeProvider>
      </body>
    </html>
  );
}
