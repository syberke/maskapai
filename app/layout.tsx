import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; //  1. Import komponen Navbar yang sudah dibuat

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mitra Perjalanan Udara RENGGO",
  description: "Mitra perjalanan udara terpercaya yang menghubungkan Anda dengan berbagai maskapai dan destinasi melalui layanan pemesanan yang cepat, aman, dan profesional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {/* 2. Selipkan Navbar di sini agar muncul di semua halaman */}
        <Navbar /> 
        
        {/* 3. Main wrapper agar konten children fleksibel mengisi sisa ruang */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}