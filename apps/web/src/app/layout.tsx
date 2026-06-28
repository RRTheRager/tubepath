import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubePath — YouTube Analytics & Growth",
  description: "Analytics, AI coaching, and inspiration pipelines for YouTube creators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
