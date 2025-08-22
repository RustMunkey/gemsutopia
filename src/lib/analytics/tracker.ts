// Custom Analytics Tracker - No Google Analytics Required!
// This tracks everything we need for the dashboard

interface AnalyticsEvent {
  event_type: string;
  session_id: string;
  user_id?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  country?: string;
  screen_resolution?: string;
  viewport_size?: string;
  timestamp?: string;
  event_data?: any;
  is_test_session?: boolean;
}

class AnalyticsTracker {
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: number;
  private lastActivityTime: number;
  private pageStartTime: number;
  private isTestSession: boolean;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.pageStartTime = Date.now();
    this.isTestSession = this.detectTestSession();
    
    this.initializeTracking();
  }

  private getOrCreateSessionId(): string {
    const existing = localStorage.getItem('analytics_session_id');
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    const lastActivity = localStorage.getItem('analytics_last_activity');
    
    if (existing && lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceLastActivity < sessionTimeout) {
        return existing;
      }
    }
    
    // Create new session
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('analytics_session_id', newSessionId);
    return newSessionId;
  }

  private detectTestSession(): boolean {
    // Detect if this is a test session based on environment
    if (typeof window !== 'undefined') {
      // Check if running on localhost
      if (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('localhost')) {
        return true;
      }
      
      // Check for dev/staging domains
      if (window.location.hostname.includes('dev') || 
          window.location.hostname.includes('staging') ||
          window.location.hostname.includes('test')) {
        return true;
      }
    }
    
    return false;
  }

  private detectDevice(): { deviceType: string; browser: string; os: string } {
    if (typeof window === 'undefined') {
      return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
    }

    const userAgent = navigator.userAgent;
    
    // Device type detection
    let deviceType = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    // Browser detection
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // OS detection
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return { deviceType, browser, os };
  }

  private getScreenInfo(): { screenResolution: string; viewportSize: string } {
    if (typeof window === 'undefined') {
      return { screenResolution: '', viewportSize: '' };
    }

    const screenResolution = `${screen.width}x${screen.height}`;
    const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    
    return { screenResolution, viewportSize };
  }

  private detectTrafficSource(): string {
    if (typeof window === 'undefined') return 'direct';
    
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    
    try {
      const referrerDomain = new URL(referrer).hostname;
      const currentDomain = window.location.hostname;
      
      if (referrerDomain === currentDomain) return 'internal';
      
      // Common search engines
      if (referrerDomain.includes('google')) return 'google';
      if (referrerDomain.includes('bing')) return 'bing';
      if (referrerDomain.includes('yahoo')) return 'yahoo';
      if (referrerDomain.includes('duckduckgo')) return 'duckduckgo';
      
      // Social media
      if (referrerDomain.includes('facebook')) return 'facebook';
      if (referrerDomain.includes('twitter')) return 'twitter';
      if (referrerDomain.includes('instagram')) return 'instagram';
      if (referrerDomain.includes('linkedin')) return 'linkedin';
      if (referrerDomain.includes('reddit')) return 'reddit';
      if (referrerDomain.includes('pinterest')) return 'pinterest';
      
      // Other referrals
      return 'referral';
    } catch {
      return 'unknown';
    }
  }

  private async sendEvent(event: Omit<AnalyticsEvent, 'session_id' | 'timestamp' | 'is_test_session'>): Promise<void> {
    try {
      const { deviceType, browser, os } = this.detectDevice();
      const { screenResolution, viewportSize } = this.getScreenInfo();
      
      const fullEvent: AnalyticsEvent = {
        ...event,
        session_id: this.sessionId,
        user_id: this.userId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        device_type: deviceType,
        browser,
        os,
        screen_resolution: screenResolution,
        viewport_size: viewportSize,
        timestamp: new Date().toISOString(),
        is_test_session: this.isTestSession
      };

      // Update last activity
      this.lastActivityTime = Date.now();
      localStorage.setItem('analytics_last_activity', this.lastActivityTime.toString());

      // Send to API
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEvent),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Public tracking methods
  async trackPageView(page?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const pageUrl = page || window.location.pathname + window.location.search;
    const pageTitle = document.title;
    const referrer = document.referrer;
    const trafficSource = this.detectTrafficSource();
    
    await this.sendEvent({
      event_type: 'page_view',
      page_url: pageUrl,
      page_title: pageTitle,
      referrer,
      event_data: {
        traffic_source: trafficSource,
        page_load_time: Date.now() - this.pageStartTime
      }
    });
  }

  async trackEvent(eventType: string, eventData?: any): Promise<void> {
    await this.sendEvent({
      event_type: eventType,
      page_url: typeof window !== 'undefined' ? window.location.pathname : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      event_data: eventData
    });
  }

  async trackCartAdd(productId: string, productName: string, price: number, quantity: number = 1): Promise<void> {
    await this.trackEvent('cart_add', {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
      cart_value: price * quantity
    });
  }

  async trackCartRemove(productId: string, productName: string): Promise<void> {
    await this.trackEvent('cart_remove', {
      product_id: productId,
      product_name: productName
    });
  }

  async trackCheckoutStart(cartValue: number, itemCount: number): Promise<void> {
    await this.trackEvent('checkout_start', {
      cart_value: cartValue,
      item_count: itemCount
    });
  }

  async trackCheckoutComplete(orderId: string, orderValue: number): Promise<void> {
    await this.trackEvent('checkout_complete', {
      order_id: orderId,
      order_value: orderValue,
      conversion: true
    });
  }

  async trackProductView(productId: string, productName: string, price: number): Promise<void> {
    await this.trackEvent('product_view', {
      product_id: productId,
      product_name: productName,
      price
    });
  }

  async trackSearch(searchTerm: string, resultCount: number): Promise<void> {
    await this.trackEvent('search', {
      search_term: searchTerm,
      result_count: resultCount
    });
  }

  // Session management
  setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('analytics_user_id', userId);
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  private initializeTracking(): void {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackEvent('page_hidden', {
          time_on_page: Date.now() - this.pageStartTime,
          session_duration: this.getSessionDuration()
        });
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', {
        time_on_page: Date.now() - this.pageStartTime,
        session_duration: this.getSessionDuration()
      });
    });

    // Update activity timestamp on user interaction
    ['click', 'scroll', 'keypress', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
        localStorage.setItem('analytics_last_activity', this.lastActivityTime.toString());
      }, { passive: true });
    });
  }
}

// Export singleton instance
export const analytics = typeof window !== 'undefined' ? new AnalyticsTracker() : null;
export default analytics;