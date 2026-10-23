import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Home page only: headline and card titles use the display face, body copy uses DM Sans.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const dmSans = DM_Sans({
  variable: "--font-home-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Basket",
  description: "Find current grocery discounts near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${bricolage.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden flex flex-col">{children}</body>
    </html>
  );
}
