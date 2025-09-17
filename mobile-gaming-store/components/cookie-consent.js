// Cookie Consent Banner Component
// Shows once per visit and handles user preferences

class CookieConsent {
  constructor() {
    this.consentKey = 'cookie_consent_given';
    this.init();
  }

  init() {
    // Check if consent was already given in this session
    const consentGiven = sessionStorage.getItem(this.consentKey);
    
    if (!consentGiven) {
      // Show consent banner after a short delay
      setTimeout(() => {
        this.showConsentBanner();
      }, 1000);
    }
  }

  showConsentBanner() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'cookie-consent-overlay';
    overlay.id = 'cookie-consent-overlay';

    // Create banner
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-consent-content">
        <div class="cookie-consent-icon">🍪</div>
        <div class="cookie-consent-text">
          <h3>We use cookies</h3>
          <p>This website uses cookies to enhance your browsing experience, analyze site traffic, and personalize content. By continuing to use our site, you consent to our use of cookies.</p>
        </div>
        <div class="cookie-consent-actions">
          <button class="cookie-consent-btn cookie-consent-reject" onclick="window.cookieConsent.reject()">
            Reject
          </button>
          <button class="cookie-consent-btn cookie-consent-accept" onclick="window.cookieConsent.accept()">
            Accept
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(banner);
    document.body.appendChild(overlay);

    // Add styles
    this.injectStyles();

    // Animate in
    setTimeout(() => {
      overlay.classList.add('show');
    }, 100);
  }

  accept() {
    sessionStorage.setItem(this.consentKey, 'accepted');
    this.hideBanner();
    this.onConsentGiven('accepted');
  }

  reject() {
    sessionStorage.setItem(this.consentKey, 'rejected');
    this.hideBanner();
    this.onConsentGiven('rejected');
  }

  hideBanner() {
    const overlay = document.getElementById('cookie-consent-overlay');
    if (overlay) {
      overlay.classList.add('hide');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  }

  onConsentGiven(choice) {
    console.log(`Cookie consent: ${choice}`);
    
    // You can add additional logic here based on user choice
    if (choice === 'accepted') {
      // Enable analytics, tracking, etc.
      this.enableAnalytics();
    } else {
      // Disable non-essential cookies
      this.disableNonEssentialCookies();
    }
  }

  enableAnalytics() {
    // Enable Google Analytics, Facebook Pixel, etc.
    console.log('Analytics enabled');
  }

  disableNonEssentialCookies() {
    // Disable tracking cookies, analytics, etc.
    console.log('Non-essential cookies disabled');
  }

  injectStyles() {
    if (document.getElementById('cookie-consent-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'cookie-consent-styles';
    styles.textContent = `
      .cookie-consent-overlay {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10000;
        padding: 20px;
        transform: translateY(100%);
        transition: transform 0.3s ease-out;
      }

      .cookie-consent-overlay.show {
        transform: translateY(0);
      }

      .cookie-consent-overlay.hide {
        transform: translateY(100%);
      }

      .cookie-consent-banner {
        max-width: 1200px;
        margin: 0 auto;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: 1px solid #25d366;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }

      .cookie-consent-content {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
      }

      .cookie-consent-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .cookie-consent-text {
        flex: 1;
        color: #fff;
      }

      .cookie-consent-text h3 {
        margin: 0 0 8px 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: #25d366;
      }

      .cookie-consent-text p {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.4;
        color: #ccc;
      }

      .cookie-consent-actions {
        display: flex;
        gap: 12px;
        flex-shrink: 0;
      }

      .cookie-consent-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9rem;
      }

      .cookie-consent-reject {
        background: transparent;
        color: #ff4757;
        border: 1px solid #ff4757;
      }

      .cookie-consent-reject:hover {
        background: #ff4757;
        color: #fff;
      }

      .cookie-consent-accept {
        background: linear-gradient(135deg, #25d366, #128c7e);
        color: #fff;
        border: 1px solid #25d366;
      }

      .cookie-consent-accept:hover {
        background: linear-gradient(135deg, #128c7e, #25d366);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .cookie-consent-overlay {
          padding: 15px;
        }

        .cookie-consent-content {
          flex-direction: column;
          text-align: center;
          gap: 15px;
        }

        .cookie-consent-actions {
          width: 100%;
          justify-content: center;
        }

        .cookie-consent-btn {
          flex: 1;
          max-width: 120px;
        }

        .cookie-consent-text h3 {
          font-size: 1.1rem;
        }

        .cookie-consent-text p {
          font-size: 0.9rem;
        }
      }

      @media (max-width: 480px) {
        .cookie-consent-overlay {
          padding: 10px;
        }

        .cookie-consent-content {
          padding: 15px;
        }

        .cookie-consent-actions {
          flex-direction: column;
          gap: 8px;
        }

        .cookie-consent-btn {
          max-width: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize cookie consent when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.cookieConsent = new CookieConsent();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieConsent;
}
