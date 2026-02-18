import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resident Directory",
  description:
    "A retro-themed resident directory with role-based access, approvals workflow, and admin dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
