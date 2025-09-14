import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PerformanceMonitor from '../components/PerformanceMonitor';
import ClientInitializer from '../components/ClientInitializer';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'GeoHash坐标转换工具 - 在线经纬度转换器',
    template: '%s | GeoHash坐标转换工具'
  },
  description: '专业的在线GeoHash到经纬度坐标转换工具，支持百度09和GPS84坐标系批量转换，快速准确，完全免费',
  keywords: [
    'geohash', 
    '坐标转换', 
    '百度坐标', 
    'GPS坐标', 
    '经纬度', 
    'BD09', 
    'WGS84', 
    '批量转换',
    '在线工具'
  ],
  authors: [{ name: 'GeoHash Converter Team' }],
  creator: 'GeoHash Converter',
  publisher: 'GeoHash Converter',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    title: 'GeoHash坐标转换工具 - 在线经纬度转换器',
    description: '专业的在线GeoHash到经纬度坐标转换工具，支持百度09和GPS84坐标系批量转换',
    siteName: 'GeoHash坐标转换工具',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeoHash坐标转换工具',
    description: '专业的在线GeoHash到经纬度坐标转换工具',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'GeoHash坐标转换工具',
              description: '专业的在线GeoHash到经纬度坐标转换工具',
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              applicationCategory: 'UtilityApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CNY',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <PerformanceMonitor />
        <ClientInitializer />
        {children}
      </body>
    </html>
  );
}