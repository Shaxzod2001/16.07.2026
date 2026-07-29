import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Profi.uz — Ishonchli mutaxassislar",
  description:
    "O'zbekistondagi eng yaxshi mutaxassislarni toping: santexnik, elektrik, repetitor, go'zallik ustasi va boshqalar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} Profi.uz — O&apos;zbekiston uchun xizmatlar platformasi</span>
            <span>Toshkent, O&apos;zbekiston</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
