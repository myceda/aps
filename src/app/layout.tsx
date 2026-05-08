import type { Metadata } from "next";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "APS Academic Planning Support",
  description: "Curriculum-based academic planning and transcript analysis"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
