import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Tu agenda personal — captura, organiza y sabe qué hacer hoy.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Agenda",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
