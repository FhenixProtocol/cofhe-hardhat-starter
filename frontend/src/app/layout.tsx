import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoFHE - Confidential Finance for Everyone",
  description:
    "Private, composable vaults with fully homomorphic encryption. Your financial data stays yours.",
  keywords: ["DeFi", "FHE", "privacy", "confidential", "vault", "ethereum"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}