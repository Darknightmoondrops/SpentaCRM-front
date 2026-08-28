import type { Metadata, Viewport } from "next";
import { productConfig } from "@/config/product";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: productConfig.name,
    template: `%s · ${productConfig.name}`,
  },
  description: "A focused CRM for B2B companies to manage relationships, opportunities, delivery and follow-up.",
  applicationName: productConfig.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
