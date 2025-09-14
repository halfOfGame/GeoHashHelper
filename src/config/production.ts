// Production environment configuration
export const productionConfig = {
  // Performance budgets
  budgets: {
    javascript: 250 * 1024, // 250KB
    css: 50 * 1024, // 50KB
    images: 500 * 1024, // 500KB
    fonts: 100 * 1024, // 100KB
  },

  // Cache strategies
  cache: {
    staticAssets: 31536000, // 1 year
    apiResponses: 300, // 5 minutes
    htmlPages: 3600, // 1 hour
  },

  // Lazy loading thresholds
  lazyLoading: {
    rootMargin: '50px 0px',
    threshold: 0.1,
    imageQuality: 80,
  },

  // Bundle splitting configuration
  bundleSplitting: {
    chunks: {
      vendor: ['react', 'react-dom'],
      common: ['./src/lib'],
      async: true,
    },
  },

  // SEO configuration
  seo: {
    defaultTitle: 'GeoHash坐标转换工具 - 在线经纬度转换器',
    titleTemplate: '%s | GeoHash坐标转换工具',
    defaultDescription: '专业的在线GeoHash到经纬度坐标转换工具，支持百度09和GPS84坐标系批量转换，快速准确，完全免费',
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
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      siteName: 'GeoHash坐标转换工具',
    },
  },

  // Performance monitoring
  monitoring: {
    enableWebVitals: true,
    enableMemoryMonitoring: true,
    enableBundleAnalysis: process.env.NODE_ENV === 'development',
    reportingEndpoint: process.env.ANALYTICS_ENDPOINT,
  },

  // Feature flags
  features: {
    serviceWorker: true,
    lazyComponents: true,
    imageOptimization: true,
    bundleAnalysis: process.env.NODE_ENV === 'development',
    performanceMonitoring: true,
  },
};

export default productionConfig;