import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EmbalaFest - Sistema de Gestão",
  description:
    "Sistema de gestão para lojas de embalagens e materiais para festas",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logos/logo-icon.png" />
        <link rel="apple-touch-icon" href="/logos/logo-icon.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
import "./globals.css";
