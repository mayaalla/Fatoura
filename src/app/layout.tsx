// For adding custom fonts with other frameworks, see:
// https://tailwindcss.com/docs/font-family
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fatoura",
  description: "Authentication and Invoicing App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
            <html lang="en" className={cn("font-sans", geist.variable)}>
        <body className={`${geist.variable} ${fontMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>

  );
}