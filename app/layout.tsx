import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/auth/AuthProvider';
const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Scouting 3.0 — Captación y Valoración de Talento Semiprofesional",
  description: "Modelo de scouting táctico y valorización de talentos para fútbol semiprofesional (Segunda y Tercera RFEF)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-emerald-500/30 selection:text-emerald-200`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
