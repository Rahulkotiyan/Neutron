// Advanced Service Worker Registration and Management
class CacheManager {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.updateNotificationShown = false; // Track if update notification was already shown
    this.initialize().catch(err => {
      // Silently handle initialization errors
    });
  }

  // Initialize the cache manager
  async initialize() {
    this.setupEventListeners();
    await this.registerServiceWorker();
  }

  // Register service worker with update detection
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        
        // Check for updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration.installing;
          
          newWorker.addEventListener('statechange', () => {
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Only show notification if we haven't already
              this.showUpdateNotification();
            }
          });
        });
        
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  // Setup event listeners for online/offline
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Show update notification
  showUpdateNotification() {
    // Prevent showing notification multiple times
    if (this.updateNotificationShown) {
      return;
    }
    
    this.updateNotificationShown = true;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version is available. Click to refresh.',
        icon: '/favicon.ico',
        tag: 'app-update'
      }).onclick = () => {
        window.location.reload();
      };
    } else {
      // Fallback: show browser alert or custom UI
      if (confirm('A new version is available. Would you like to refresh?')) {
        window.location.reload();
      }
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Sync offline data when back online
  async syncOfflineData() {
    if ('serviceWorker' in navigator && this.swRegistration) {
      try {
        // Trigger background sync
        await this.swRegistration.sync.register('background-sync');
      } catch (error) {
        // Background sync failed
      }
    }
  }

  // Clear all caches
  async clearAllCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  // Get detailed cache size and statistics
  async getCacheStats() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const stats = {
          totalSize: 0,
          totalEntries: 0,
          caches: {}
        };
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          let cacheSize = 0;
          
          for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              cacheSize += blob.size;
            }
          }
          
          stats.caches[name] = {
            size: cacheSize,
            entries: keys.length,
            formattedSize: this.formatBytes(cacheSize)
          };
          
          stats.totalSize += cacheSize;
          stats.totalEntries += keys.length;
        }
        
        stats.formattedTotalSize = this.formatBytes(stats.totalSize);
        return stats;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if page is cached
  async isPageCached(url) {
    if ('caches' in window) {
      try {
        const cache = await caches.open('neutron-static-v1');
        return await cache.match(url) !== undefined;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  // Force refresh specific resource
  async forceRefresh(url) {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => 
            caches.open(name).then(cache => cache.delete(url))
          )
        );
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  // Force clear all service workers and cache
  async forceClear() {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }

      // Reset notification flag
      this.updateNotificationShown = false;

      return true;
    } catch (error) {
      return false;
    }
  }

  // Get cache health metrics
  async getCacheHealth() {
    const stats = await this.getCacheStats();
    if (!stats) return null;
    
    const health = {
      status: 'healthy',
      warnings: [],
      recommendations: []
    };
    
    // Check cache size
    if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
      health.warnings.push('Cache size exceeds 100MB');
      health.recommendations.push('Consider clearing old cache entries');
    }
    
    // Check cache age (simplified - would need timestamps for real implementation)
    if (stats.totalEntries > 1000) {
      health.warnings.push('High number of cache entries');
      health.recommendations.push('Consider implementing cache expiration');
    }
    
    if (health.warnings.length > 0) {
      health.status = 'warning';
    }
    
    return health;
  }

  // Optimize cache - remove old/unused entries
  async optimizeCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let optimized = 0;
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          // Remove entries older than 30 days (simplified)
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const responseDate = new Date(dateHeader).getTime();
                if (responseDate < thirtyDaysAgo) {
                  await cache.delete(request);
                  optimized++;
                }
              }
            }
          }
        }
        
        return optimized;
      } catch (error) {
        return 0;
      }
    }
    return 0;
  }

  // Get current status
  getStatus() {
    return {
      isRegistered: !!this.swRegistration,
      isOnline: this.isOnline,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsNotifications: 'Notification' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype
    };
  }
}

// Create global instance
const cacheManager = new CacheManager();

// Export for use in components
export default cacheManager;

// Auto-register service worker when module loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Service worker is already registered in constructor, no need to call again
    });
  } else {
    // Service worker is already registered in constructor, no need to call again
  }
}
