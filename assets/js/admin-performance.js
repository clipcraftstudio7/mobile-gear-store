class AdminPerformanceOptimizer {
  constructor() {
    this.performanceData = {
      pageLoadTime: 0,
      imageOptimization: 0,
      cacheEfficiency: 0,
      databaseQueries: 0,
      memoryUsage: 0,
      cdnStatus: 'active',
      compressionEnabled: true,
      lazyLoadingEnabled: true
    };
    this.optimizationTasks = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.measurePerformance();
    this.updatePerformanceDisplay();
    this.startPerformanceMonitoring();
    this.generateOptimizationSuggestions();
  }

  setupEventListeners() {
    // Performance optimization buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('performance-btn')) {
        const action = e.target.dataset.action;
        this.handleOptimizationAction(action);
      }
    });

    // Auto-optimization toggle
    const autoOptimizeToggle = document.getElementById('auto-optimize-toggle');
    if (autoOptimizeToggle) {
      autoOptimizeToggle.addEventListener('change', (e) => {
        this.toggleAutoOptimization(e.target.checked);
      });
    }
  }

  async measurePerformance() {
    // Measure page load time
    this.performanceData.pageLoadTime = this.getPageLoadTime();
    
    // Measure image optimization
    this.performanceData.imageOptimization = this.measureImageOptimization();
    
    // Measure cache efficiency
    this.performanceData.cacheEfficiency = this.measureCacheEfficiency();
    
    // Simulate database performance
    this.performanceData.databaseQueries = this.generateRandomNumber(50, 200);
    
    // Simulate memory usage
    this.performanceData.memoryUsage = this.generateRandomNumber(20, 80);
    
    // Check CDN status
    this.performanceData.cdnStatus = await this.checkCDNStatus();
  }

  getPageLoadTime() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      return timing.loadEventEnd - timing.navigationStart;
    }
    return this.generateRandomNumber(800, 2000);
  }

  measureImageOptimization() {
    const images = document.querySelectorAll('img');
    let optimizedCount = 0;
    let totalSize = 0;
    
    images.forEach(img => {
      if (img.complete) {
        totalSize += img.naturalWidth * img.naturalHeight;
        if (img.naturalWidth <= 800 && img.naturalHeight <= 600) {
          optimizedCount++;
        }
      }
    });
    
    return images.length > 0 ? (optimizedCount / images.length) * 100 : 85;
  }

  measureCacheEfficiency() {
    // Simulate cache hit rate
    return this.generateRandomNumber(70, 95);
  }

  async checkCDNStatus() {
    // Simulate CDN status check
    return Math.random() > 0.1 ? 'active' : 'inactive';
  }

  generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  updatePerformanceDisplay() {
    // Update performance metrics
    this.updateMetric('page-load-time', `${this.performanceData.pageLoadTime}ms`);
    this.updateMetric('image-optimization', `${Math.round(this.performanceData.imageOptimization)}%`);
    this.updateMetric('cache-efficiency', `${Math.round(this.performanceData.cacheEfficiency)}%`);
    this.updateMetric('database-queries', this.performanceData.databaseQueries);
    this.updateMetric('memory-usage', `${this.performanceData.memoryUsage}%`);
    
    // Update status indicators
    this.updateStatusIndicators();
    
    // Update progress bars
    this.updateProgressBars();
  }

  updateMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }

  updateStatusIndicators() {
    const indicators = {
      'page-load-status': this.getPerformanceStatus(this.performanceData.pageLoadTime, 1500, 2000),
      'image-optimization-status': this.getPerformanceStatus(this.performanceData.imageOptimization, 80, 90),
      'cache-efficiency-status': this.getPerformanceStatus(this.performanceData.cacheEfficiency, 85, 95),
      'database-status': this.getPerformanceStatus(this.performanceData.databaseQueries, 100, 150, true),
      'memory-status': this.getPerformanceStatus(this.performanceData.memoryUsage, 60, 80, true),
      'cdn-status': this.performanceData.cdnStatus === 'active' ? 'optimized' : 'critical'
    };

    Object.entries(indicators).forEach(([elementId, status]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.className = `status-indicator ${status}`;
        const textElement = element.nextElementSibling;
        if (textElement) {
          textElement.className = `status-text ${status}`;
          textElement.textContent = this.getStatusText(status);
        }
      }
    });
  }

  getPerformanceStatus(value, warningThreshold, criticalThreshold, reverse = false) {
    if (reverse) {
      if (value <= warningThreshold) return 'optimized';
      if (value <= criticalThreshold) return 'warning';
      return 'critical';
    } else {
      if (value >= warningThreshold) return 'optimized';
      if (value >= criticalThreshold) return 'warning';
      return 'critical';
    }
  }

  getStatusText(status) {
    const statusTexts = {
      optimized: 'Optimized',
      warning: 'Needs Attention',
      critical: 'Critical'
    };
    return statusTexts[status] || 'Unknown';
  }

  updateProgressBars() {
    const progressBars = [
      { id: 'overall-performance', value: this.calculateOverallPerformance() },
      { id: 'optimization-progress', value: this.calculateOptimizationProgress() }
    ];

    progressBars.forEach(bar => {
      const element = document.getElementById(bar.id);
      if (element) {
        element.style.width = `${bar.value}%`;
      }
      
      const percentageElement = document.querySelector(`[data-progress="${bar.id}"]`);
      if (percentageElement) {
        percentageElement.textContent = `${Math.round(bar.value)}%`;
      }
    });
  }

  calculateOverallPerformance() {
    const metrics = [
      this.performanceData.pageLoadTime <= 1500 ? 100 : Math.max(0, 100 - (this.performanceData.pageLoadTime - 1500) / 10),
      this.performanceData.imageOptimization,
      this.performanceData.cacheEfficiency,
      this.performanceData.databaseQueries <= 100 ? 100 : Math.max(0, 100 - (this.performanceData.databaseQueries - 100) / 2),
      this.performanceData.memoryUsage <= 60 ? 100 : Math.max(0, 100 - (this.performanceData.memoryUsage - 60) / 2),
      this.performanceData.cdnStatus === 'active' ? 100 : 50
    ];
    
    return Math.round(metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length);
  }

  calculateOptimizationProgress() {
    const optimizations = [
      this.performanceData.compressionEnabled,
      this.performanceData.lazyLoadingEnabled,
      this.performanceData.cdnStatus === 'active',
      this.performanceData.imageOptimization >= 80,
      this.performanceData.cacheEfficiency >= 85
    ];
    
    return Math.round((optimizations.filter(Boolean).length / optimizations.length) * 100);
  }

  handleOptimizationAction(action) {
    switch (action) {
      case 'optimize-images':
        this.optimizeImages();
        break;
      case 'clear-cache':
        this.clearCache();
        break;
      case 'optimize-database':
        this.optimizeDatabase();
        break;
      case 'enable-cdn':
        this.enableCDN();
        break;
      case 'compress-assets':
        this.compressAssets();
        break;
      case 'enable-lazy-loading':
        this.enableLazyLoading();
        break;
      case 'run-full-optimization':
        this.runFullOptimization();
        break;
    }
  }

  async optimizeImages() {
    this.showOptimizationProgress('Optimizing images...');
    
    // Simulate image optimization
    await this.simulateOptimization(3000);
    
    this.performanceData.imageOptimization = Math.min(100, this.performanceData.imageOptimization + 15);
    this.updatePerformanceDisplay();
    this.showOptimizationComplete('Images optimized successfully!');
  }

  async clearCache() {
    this.showOptimizationProgress('Clearing cache...');
    
    // Simulate cache clearing
    await this.simulateOptimization(2000);
    
    this.performanceData.cacheEfficiency = Math.min(100, this.performanceData.cacheEfficiency + 10);
    this.updatePerformanceDisplay();
    this.showOptimizationComplete('Cache cleared successfully!');
  }

  async optimizeDatabase() {
    this.showOptimizationProgress('Optimizing database...');
    
    // Simulate database optimization
    await this.simulateOptimization(5000);
    
    this.performanceData.databaseQueries = Math.max(50, this.performanceData.databaseQueries - 30);
    this.updatePerformanceDisplay();
    this.showOptimizationComplete('Database optimized successfully!');
  }

  async enableCDN() {
    this.showOptimizationProgress('Enabling CDN...');
    
    // Simulate CDN activation
    await this.simulateOptimization(4000);
    
    this.performanceData.cdnStatus = 'active';
    this.updatePerformanceDisplay();
    this.showOptimizationComplete('CDN enabled successfully!');
  }

  async compressAssets() {
    this.showOptimizationProgress('Compressing assets...');
    
    // Simulate asset compression
    await this.simulateOptimization(3500);
    
    this.performanceData.compressionEnabled = true;
    this.updatePerformanceDisplay();
    this.showOptimizationComplete('Assets compressed successfully!');
  }

  async enableLazyLoading() {
    this.showOptimizationProgress('Enabling lazy loading...');
    
    // Simulate lazy loading implementation
    await this.simulateOptimization(2500);
    
    this.performanceData.lazyLoadingEnabled = true;
    this.updatePerformanceDisplay();
    this.showOptimizationComplete('Lazy loading enabled successfully!');
  }

  async runFullOptimization() {
    this.showOptimizationProgress('Running full optimization...');
    
    // Run all optimizations
    await this.optimizeImages();
    await this.clearCache();
    await this.optimizeDatabase();
    await this.enableCDN();
    await this.compressAssets();
    await this.enableLazyLoading();
    
    this.showOptimizationComplete('Full optimization completed successfully!');
  }

  async simulateOptimization(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  showOptimizationProgress(message) {
    const progressElement = document.getElementById('optimization-progress-message');
    if (progressElement) {
      progressElement.textContent = message;
      progressElement.style.display = 'block';
    }
  }

  showOptimizationComplete(message) {
    const progressElement = document.getElementById('optimization-progress-message');
    if (progressElement) {
      progressElement.textContent = message;
      progressElement.style.color = '#25d366';
      
      setTimeout(() => {
        progressElement.style.display = 'none';
      }, 3000);
    }
  }

  toggleAutoOptimization(enabled) {
    if (enabled) {
      this.startAutoOptimization();
    } else {
      this.stopAutoOptimization();
    }
  }

  startAutoOptimization() {
    this.autoOptimizationInterval = setInterval(() => {
      this.runAutoOptimization();
    }, 300000); // Every 5 minutes
  }

  stopAutoOptimization() {
    if (this.autoOptimizationInterval) {
      clearInterval(this.autoOptimizationInterval);
    }
  }

  async runAutoOptimization() {
    // Check if optimization is needed
    if (this.calculateOverallPerformance() < 80) {
      await this.runFullOptimization();
    }
  }

  startPerformanceMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.measurePerformance();
      this.updatePerformanceDisplay();
    }, 60000); // Every minute
  }

  generateOptimizationSuggestions() {
    const suggestions = [];
    
    if (this.performanceData.pageLoadTime > 1500) {
      suggestions.push('Consider optimizing page load time');
    }
    
    if (this.performanceData.imageOptimization < 80) {
      suggestions.push('Optimize images for better performance');
    }
    
    if (this.performanceData.cacheEfficiency < 85) {
      suggestions.push('Improve cache efficiency');
    }
    
    if (this.performanceData.databaseQueries > 150) {
      suggestions.push('Optimize database queries');
    }
    
    if (this.performanceData.memoryUsage > 70) {
      suggestions.push('Monitor memory usage');
    }
    
    if (this.performanceData.cdnStatus !== 'active') {
      suggestions.push('Enable CDN for better performance');
    }

    this.updateOptimizationSuggestions(suggestions);
  }

  updateOptimizationSuggestions(suggestions) {
    const container = document.querySelector('.optimization-suggestions');
    if (container) {
      container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item">
          <i class="fas fa-lightbulb"></i>
          <span>${suggestion}</span>
        </div>
      `).join('');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.adminPerformanceOptimizer = new AdminPerformanceOptimizer();
});
