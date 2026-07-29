import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Scouting 3.0 — Captación y Valoración de Talento Semiprofesional",
  description: "Modelo de scouting táctico y valorización de talentos para fútbol semiprofesional (Segunda y Tercera RFEF) — TFM INEFC Lleida – UdL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.className} dark h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
