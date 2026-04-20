import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParkPGH — Pittsburgh Parking Authority",
  description:
    "Manage your garage lease, make payments, and stay informed — all from your phone. A modern portal for Pittsburgh Parking Authority lease holders.",
  keywords: [
    "Pittsburgh Parking",
    "PPA",
    "garage lease",
    "parking payment",
    "Pittsburgh Parking Authority",
  ],
  openGraph: {
    title: "ParkPGH — Pittsburgh Parking Authority",
    description:
      "Manage your garage lease, make payments, and stay informed.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B2A4A",
};

import { DemoSwitcher } from "@/components/demo-switcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body>
        {children}
        <DemoSwitcher />
      </body>
    </html>
  );
}
