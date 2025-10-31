class AnalyticsDashboard {
  constructor() {
    this.analyticsData = {
      visitors: 0,
      pageViews: 0,
      conversions: 0,
      revenue: 0,
      cartAbandonment: 0,
      topProducts: [],
      userBehavior: {},
      realTimeData: []
    };
    this.charts = {};
    this.updateInterval = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadAnalyticsData();
    this.initializeCharts();
    this.startRealTimeUpdates();
    this.generateInsights();
  }

  setupEventListeners() {
    const filters = document.querySelectorAll('.analytics-filter');
    filters.forEach(filter => {
      filter.addEventListener('click', () => {
        this.switchTimeframe(filter.dataset.timeframe);
      });
    });
  }

  async loadAnalyticsData() {
    // Simulate loading analytics data
    this.analyticsData = {
      visitors: this.generateRandomNumber(1500, 2500),
      pageViews: this.generateRandomNumber(5000, 8000),
      conversions: this.generateRandomNumber(50, 150),
      revenue: this.generateRandomNumber(5000, 15000),
      cartAbandonment: this.generateRandomNumber(20, 40),
      topProducts: this.generateTopProducts(),
      userBehavior: this.generateUserBehavior(),
      realTimeData: this.generateRealTimeData()
    };

    this.updateDashboard();
  }

  generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateTopProducts() {
    const products = [
      { name: 'Gaming Controller Pro', views: 1250, sales: 89 },
      { name: 'Mobile Cooling Fan', views: 980, sales: 67 },
      { name: 'Gaming Headset', views: 756, sales: 45 },
      { name: 'Phone Mount', views: 634, sales: 38 },
      { name: 'Thumb Grips', views: 521, sales: 29 }
    ];
    return products.sort((a, b) => b.views - a.views);
  }

  generateUserBehavior() {
    return {
      avgSessionDuration: this.generateRandomNumber(3, 8),
      bounceRate: this.generateRandomNumber(25, 45),
      pagesPerSession: this.generateRandomNumber(2, 6),
      mobileUsers: this.generateRandomNumber(60, 80),
      returningUsers: this.generateRandomNumber(20, 40)
    };
  }

  generateRealTimeData() {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        visitors: this.generateRandomNumber(10, 50),
        pageViews: this.generateRandomNumber(30, 100),
        conversions: this.generateRandomNumber(1, 5)
      });
    }
    return data;
  }

  updateDashboard() {
    // Update main metrics
    document.getElementById('visitors-count').textContent = this.analyticsData.visitors.toLocaleString();
    document.getElementById('pageviews-count').textContent = this.analyticsData.pageViews.toLocaleString();
    document.getElementById('conversions-count').textContent = this.analyticsData.conversions.toLocaleString();
    document.getElementById('revenue-count').textContent = `$${this.analyticsData.revenue.toLocaleString()}`;

    // Update change indicators
    this.updateChangeIndicators();
    
    // Update charts
    this.updateCharts();
    
    // Update insights
    this.updateInsights();
  }

  updateChangeIndicators() {
    const changes = [
      { element: 'visitors-change', value: this.generateRandomNumber(-15, 25) },
      { element: 'pageviews-change', value: this.generateRandomNumber(-10, 30) },
      { element: 'conversions-change', value: this.generateRandomNumber(-20, 40) },
      { element: 'revenue-change', value: this.generateRandomNumber(-25, 35) }
    ];

    changes.forEach(change => {
      const element = document.getElementById(change.element);
      if (element) {
        const isPositive = change.value > 0;
        const isNegative = change.value < 0;
        
        element.textContent = `${isPositive ? '+' : ''}${change.value}%`;
        element.className = `analytics-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`;
        
        const icon = element.querySelector('i');
        if (icon) {
          icon.className = isPositive ? 'fas fa-arrow-up' : isNegative ? 'fas fa-arrow-down' : 'fas fa-minus';
        }
      }
    });
  }

  initializeCharts() {
    this.createVisitorChart();
    this.createRevenueChart();
    this.createTopProductsChart();
    this.createUserBehaviorChart();
  }

  createVisitorChart() {
    const ctx = document.getElementById('visitors-chart');
    if (!ctx) return;

    this.charts.visitors = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.analyticsData.realTimeData.map(d => d.time),
        datasets: [{
          label: 'Visitors',
          data: this.analyticsData.realTimeData.map(d => d.visitors),
          borderColor: '#25d366',
          backgroundColor: 'rgba(37, 211, 102, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ccc'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ccc'
            }
          }
        }
      }
    });
  }

  createRevenueChart() {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const revenueData = this.analyticsData.realTimeData.map(d => 
      this.generateRandomNumber(100, 500)
    );

    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.analyticsData.realTimeData.map(d => d.time),
        datasets: [{
          label: 'Revenue',
          data: revenueData,
          backgroundColor: 'rgba(37, 211, 102, 0.8)',
          borderColor: '#25d366',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ccc',
              callback: function(value) {
                return '$' + value;
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ccc'
            }
          }
        }
      }
    });
  }

  createTopProductsChart() {
    const ctx = document.getElementById('top-products-chart');
    if (!ctx) return;

    this.charts.topProducts = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.analyticsData.topProducts.map(p => p.name),
        datasets: [{
          data: this.analyticsData.topProducts.map(p => p.views),
          backgroundColor: [
            '#25d366',
            '#128c7e',
            '#0f3460',
            '#1a1a2e',
            '#16213e'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ccc',
              padding: 20
            }
          }
        }
      }
    });
  }

  createUserBehaviorChart() {
    const ctx = document.getElementById('user-behavior-chart');
    if (!ctx) return;

    this.charts.userBehavior = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Session Duration', 'Pages/Session', 'Mobile Users', 'Returning Users', 'Bounce Rate'],
        datasets: [{
          label: 'Current',
          data: [
            this.analyticsData.userBehavior.avgSessionDuration,
            this.analyticsData.userBehavior.pagesPerSession,
            this.analyticsData.userBehavior.mobileUsers,
            this.analyticsData.userBehavior.returningUsers,
            100 - this.analyticsData.userBehavior.bounceRate
          ],
          borderColor: '#25d366',
          backgroundColor: 'rgba(37, 211, 102, 0.2)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#ccc',
              backdropColor: 'transparent'
            },
            pointLabels: {
              color: '#ccc'
            }
          }
        }
      }
    });
  }

  updateCharts() {
    // Update real-time data
    this.analyticsData.realTimeData.shift();
    this.analyticsData.realTimeData.push({
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      visitors: this.generateRandomNumber(10, 50),
      pageViews: this.generateRandomNumber(30, 100),
      conversions: this.generateRandomNumber(1, 5)
    });

    // Update visitor chart
    if (this.charts.visitors) {
      this.charts.visitors.data.labels = this.analyticsData.realTimeData.map(d => d.time);
      this.charts.visitors.data.datasets[0].data = this.analyticsData.realTimeData.map(d => d.visitors);
      this.charts.visitors.update('none');
    }

    // Update revenue chart
    if (this.charts.revenue) {
      const revenueData = this.analyticsData.realTimeData.map(d => 
        this.generateRandomNumber(100, 500)
      );
      this.charts.revenue.data.datasets[0].data = revenueData;
      this.charts.revenue.update('none');
    }
  }

  generateInsights() {
    const insights = [
      {
        icon: 'fas fa-arrow-up',
        text: `Visitor traffic increased by ${this.generateRandomNumber(10, 25)}% this week`
      },
      {
        icon: 'fas fa-mobile-alt',
        text: `${this.analyticsData.userBehavior.mobileUsers}% of users are on mobile devices`
      },
      {
        icon: 'fas fa-shopping-cart',
        text: `Cart abandonment rate is ${this.analyticsData.cartAbandonment}% - consider retargeting`
      },
      {
        icon: 'fas fa-clock',
        text: `Average session duration is ${this.analyticsData.userBehavior.avgSessionDuration} minutes`
      },
      {
        icon: 'fas fa-star',
        text: `${this.analyticsData.topProducts[0].name} is your top-performing product`
      },
      {
        icon: 'fas fa-users',
        text: `${this.analyticsData.userBehavior.returningUsers}% of visitors are returning users`
      }
    ];

    const insightsContainer = document.querySelector('.insights-list');
    if (insightsContainer) {
      insightsContainer.innerHTML = insights.map(insight => `
        <div class="insight-item">
          <div class="insight-icon">
            <i class="${insight.icon}"></i>
          </div>
          <div class="insight-text">${insight.text}</div>
        </div>
      `).join('');
    }
  }

  updateInsights() {
    // Update insights periodically
    setTimeout(() => {
      this.generateInsights();
    }, 30000);
  }

  switchTimeframe(timeframe) {
    // Update active filter
    document.querySelectorAll('.analytics-filter').forEach(filter => {
      filter.classList.remove('active');
    });
    document.querySelector(`[data-timeframe="${timeframe}"]`).classList.add('active');

    // Update data based on timeframe
    this.loadAnalyticsData();
  }

  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateCharts();
      this.updateChangeIndicators();
    }, 5000); // Update every 5 seconds
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.analyticsDashboard = new AnalyticsDashboard();
});
