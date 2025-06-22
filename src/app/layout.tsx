import type { Metadata } from "next";
import { Inter, Roboto_Mono, Sarabun } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"] });
const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["400", "700"], variable: "--font-sarabun" });

export const metadata: Metadata = {
  title: "ENKKU Voting System",
  description: "ระบบโหวต ENKKU",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body
        className={`${inter.variable} ${robotoMono.variable} ${sarabun.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
