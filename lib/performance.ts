// Performance monitoring utility for ioty-studio

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

interface PerformanceData {
  url: string;
  timestamp: number;
  userAgent: string;
  metrics: PerformanceMetrics;
  errors: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceData[] = [];
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;
    
    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.trackPageLoad();
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // First Contentful Paint
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          this.recordMetric('firstContentfulPaint', fcp.startTime);
        }
      }).observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer failed:', e);
    }

    // Largest Contentful Paint
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric('largestContentfulPaint', lastEntry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer failed:', e);
    }

    // Layout Shift
    try {
      new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        this.recordMetric('cumulativeLayoutShift', cls);
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer failed:', e);
    }

    // First Input Delay
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('firstInputDelay', entry.processingStart - entry.startTime);
        }
      }).observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observer failed:', e);
    }
  }

  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.recordError(`JavaScript Error: ${event.message} at ${event.filename}:${event.lineno}`);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(`Unhandled Promise Rejection: ${event.reason}`);
    });
  }

  private trackPageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.recordMetric('pageLoadTime', navigation.loadEventEnd - navigation.loadEventStart);
          this.recordMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.recordMetric('timeToInteractive', navigation.domInteractive - navigation.fetchStart);
        }
      }, 0);
    });
  }

  private recordMetric(metricName: keyof PerformanceMetrics, value: number): void {
    const currentData = this.getCurrentPerformanceData();
    if (currentData) {
      currentData.metrics[metricName] = value;
    }
  }

  private recordError(error: string): void {
    const currentData = this.getCurrentPerformanceData();
    if (currentData) {
      currentData.errors.push(error);
    }
  }

  private getCurrentPerformanceData(): PerformanceData | null {
    if (this.metrics.length === 0) {
      this.metrics.push({
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        metrics: {
          pageLoadTime: 0,
          domContentLoaded: 0,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          firstInputDelay: 0,
          timeToInteractive: 0,
        },
        errors: [],
      });
    }
    return this.metrics[this.metrics.length - 1];
  }

  getMetrics(): PerformanceData[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Send metrics to analytics or monitoring service
  async sendMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // In production, send to your analytics service
      // For now, just log to console
      console.log('Performance Metrics:', this.metrics);
      
      // Example: Send to Firebase Analytics
      // if (typeof window !== 'undefined' && (window as any).gtag) {
      //   this.metrics.forEach(data => {
      //     (window as any).gtag('event', 'performance', {
      //       page_load_time: data.metrics.pageLoadTime,
      //       dom_content_loaded: data.metrics.domContentLoaded,
      //       first_contentful_paint: data.metrics.firstContentfulPaint,
      //       largest_contentful_paint: data.metrics.largestContentfulPaint,
      //       cumulative_layout_shift: data.metrics.cumulativeLayoutShift,
      //       first_input_delay: data.metrics.firstInputDelay,
      //       time_to_interactive: data.metrics.timeToInteractive,
      //       error_count: data.errors.length,
      //     });
      //   });
      // }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  // Check if performance is acceptable
  isPerformanceAcceptable(): boolean {
    const currentData = this.getCurrentPerformanceData();
    if (!currentData) return true;

    const { metrics } = currentData;
    
    // Performance thresholds (in milliseconds)
    const thresholds = {
      pageLoadTime: 3000,
      domContentLoaded: 1500,
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
      timeToInteractive: 3500,
    };

    return (
      metrics.pageLoadTime <= thresholds.pageLoadTime &&
      metrics.domContentLoaded <= thresholds.domContentLoaded &&
      metrics.firstContentfulPaint <= thresholds.firstContentfulPaint &&
      metrics.largestContentfulPaint <= thresholds.largestContentfulPaint &&
      metrics.cumulativeLayoutShift <= thresholds.cumulativeLayoutShift &&
      metrics.firstInputDelay <= thresholds.firstInputDelay &&
      metrics.timeToInteractive <= thresholds.timeToInteractive
    );
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export function startPerformanceMonitoring(): void {
  performanceMonitor.startMonitoring();
}

export function getPerformanceMetrics(): PerformanceData[] {
  return performanceMonitor.getMetrics();
}

export function isPerformanceAcceptable(): boolean {
  return performanceMonitor.isPerformanceAcceptable();
}

// Auto-start monitoring in browser
if (typeof window !== 'undefined') {
  startPerformanceMonitoring();
} 