// Production optimization utilities

// Image optimization helper
export const optimizeImage = (src: string, width?: number, quality?: number): string => {
  if (process.env.NODE_ENV !== 'production') return src;
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (quality) params.set('q', quality.toString());
  
  return `${src}?${params.toString()}`;
};

// Resource hints helper
export const addResourceHints = () => {
  if (typeof window === 'undefined') return;

  const head = document.head;

  // DNS prefetch for external domains
  const dnsPrefetchDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    head.appendChild(link);
  });

  // Preconnect to critical domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    if (domain.includes('gstatic')) {
      link.crossOrigin = 'anonymous';
    }
    head.appendChild(link);
  });
};

// Critical CSS inlining helper
export const inlineCriticalCSS = (css: string) => {
  if (typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
};

// Lazy loading intersection observer
export const createLazyLoadObserver = (callback: (entry: IntersectionObserverEntry) => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback);
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.1,
    }
  );
};

// Bundle size analyzer helper (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // This would integrate with webpack-bundle-analyzer
  console.log('Bundle analysis available at: http://localhost:8888');
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;

  // Check bundle size budget
  const budgets = {
    javascript: 250 * 1024, // 250KB
    css: 50 * 1024, // 50KB
    images: 500 * 1024, // 500KB
  };

  // This is a simplified check - in production you'd use more sophisticated tools
  const scripts = document.querySelectorAll('script[src]');
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  
  console.log(`Loaded ${scripts.length} scripts and ${stylesheets.length} stylesheets`);
  
  // You could implement actual size checking here
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined' || !('performance' in window)) return;

  const memory = (performance as any).memory;
  if (memory) {
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    console.log('Memory usage:', memoryInfo);
    
    // Alert if memory usage is high
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    if (usagePercentage > 80) {
      console.warn('High memory usage detected:', usagePercentage.toFixed(2) + '%');
    }
  }
};

export default {
  optimizeImage,
  addResourceHints,
  inlineCriticalCSS,
  createLazyLoadObserver,
  analyzeBundleSize,
  checkPerformanceBudget,
  monitorMemoryUsage,
};