import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Пазарен Поглед AI",
  description: "Пазарен анализ на вашите продукти, задвижван от AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="fixed inset-0 -z-10 h-full w-full bg-background">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <div className="absolute inset-0 -z-20 h-full w-full bg-background opacity-20 blur-3xl">
                <div className="color-tunnel absolute inset-0">
                    <div className="color-tunnel-ring"></div>
                    <div className="color-tunnel-ring"></div>
                    <div className="color-tunnel-ring"></div>
                    <div className="color-tunnel-ring"></div>
                </div>
            </div>
        </div>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
