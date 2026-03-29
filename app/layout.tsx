import type { Metadata } from "next";
import "./globals.css";
import "./manifesto.css";

export const metadata: Metadata = {
  title: "LearnSignal",
  description:
    "LearnSignal is a training platform built around putting the PM inside the decision before revealing the answer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
