import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI 数据分析助手 | 健身房经营管理智能平台",
  description: "专为健身房设计的 AI 数据分析平台，支持会员管理、教练业绩、销售分析、预测分析等功能。让数据驱动您的健身事业增长。",
  keywords: ["健身房", "数据分析", "AI", "会员管理", "教练管理", "销售分析", "预测分析"],
  authors: [{ name: "AI Data Analyst" }],
  openGraph: {
    title: "AI 数据分析助手 | 健身房经营管理智能平台",
    description: "专为健身房设计的 AI 数据分析平台",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
