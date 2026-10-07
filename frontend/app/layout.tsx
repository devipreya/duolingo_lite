import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/UserContext";

export const metadata: Metadata = { title: "Duolingo Lite" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body><UserProvider>{children}</UserProvider></body>
    </html>
  );
}
