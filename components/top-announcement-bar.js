(function () {
  if (window.__announcementBarLoaded) return;
  window.__announcementBarLoaded = true;

  const MESSAGES = [
    { icon: 'fas fa-shipping-fast', text: 'Free shipping on eligible orders' },
    { icon: 'fas fa-store', text: 'Local delivery available in select areas' },
    { icon: 'fas fa-tags', text: 'Price adjustments within 7 days' },
  ];

  function injectStyles() {
    if (document.getElementById('announcement-bar-styles')) return;
    const css = `
      .announcement-bar{position:fixed;top:0;left:0;width:100%;z-index:1002;background:#0f1113;color:#e5e7eb;border-bottom:1px solid #1f2937}
      .announcement-bar__inner{max-width:1400px;margin:0 auto;padding:8px 16px;display:flex;align-items:center;gap:12px;overflow:hidden;position:relative;padding-right:120px}
      .announcement-bar__track{display:flex;gap:28px;white-space:nowrap;animation:ab-scroll 30s linear infinite}
      .announcement-bar__item{display:inline-flex;align-items:center;gap:8px;color:#cbd5e1;font-weight:600;font-size:.9rem}
      .announcement-bar__item i{color:#25d366}
      .announcement-bar__close{margin-left:auto;background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:14px}
      .announcement-bar__close:hover{color:#e5e7eb}
      .announcement-affiliate-cta{position:absolute;right:44px;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;text-decoration:none;font-weight:800;font-size:.85rem;background:linear-gradient(135deg,#25d366,#128c7e);color:#0b0f0c;border:1px solid rgba(37,211,102,.35);box-shadow:0 6px 18px rgba(37,211,102,.25);transition:transform .2s ease, box-shadow .2s ease, opacity .2s ease}
      .announcement-affiliate-cta:hover{transform:translateY(-50%) translateY(-1px);box-shadow:0 10px 24px rgba(37,211,102,.35);opacity:.95}
      .announcement-affiliate-cta i{color:#0b0f0c}
      @media (max-width:768px){
        .announcement-bar__inner{padding:6px 12px}
        .announcement-bar__item{font-size:.8rem}
        .announcement-affiliate-cta{right:36px;padding:5px 10px;font-size:.8rem}
        .announcement-bar__inner{padding-right:100px}
      }
      @media (max-width:480px){
        .announcement-affiliate-cta{right:34px;padding:4px 8px;font-size:.0.8rem}
        .announcement-affiliate-cta span{display:none}
        .announcement-affiliate-cta i{margin:0}
        .announcement-bar__inner{padding-right:80px}
      }
      @keyframes ab-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    `;
    const style = document.createElement('style');
    style.id = 'announcement-bar-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createBar() {
    const bar = document.createElement('div');
    bar.className = 'announcement-bar';
    bar.id = 'announcement-bar';

    const inner = document.createElement('div');
    inner.className = 'announcement-bar__inner';

    const track = document.createElement('div');
    track.className = 'announcement-bar__track';

    // Duplicate messages to allow seamless scroll
    const renderItems = (into) => {
      MESSAGES.forEach((m) => {
        const item = document.createElement('div');
        item.className = 'announcement-bar__item';
        item.innerHTML = `<i class="${m.icon}"></i><span>${m.text}</span>`;
        into.appendChild(item);
      });
    };

    renderItems(track);
    renderItems(track);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'announcement-bar__close';
    closeBtn.setAttribute('aria-label', 'Close announcement');
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
      removeBar();
    });

    // Affiliate CTA (top-right, before the close button)
    const affiliateCta = document.createElement('a');
    affiliateCta.href = 'affiliate.html';
    affiliateCta.className = 'announcement-affiliate-cta';
    affiliateCta.innerHTML = '<i class="fas fa-handshake"></i><span style="margin-left:6px;">Affiliate</span>';
    affiliateCta.setAttribute('target', '_blank');
    affiliateCta.setAttribute('rel', 'noopener');

    inner.appendChild(track);
    inner.appendChild(affiliateCta);
    inner.appendChild(closeBtn);
    bar.appendChild(inner);
    return bar;
  }

  function adjustNavbarOffset() {
    const bar = document.getElementById('announcement-bar');
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (bar) {
      const h = bar.getBoundingClientRect().height;
      navbar.style.top = h + 'px';
    } else {
      navbar.style.top = '0px';
    }
  }

  function addBar() {
    injectStyles();
    const existing = document.getElementById('announcement-bar');
    if (existing) return;
    const bar = createBar();
    document.body.insertBefore(bar, document.body.firstChild);
    // Wait for layout, then adjust
    requestAnimationFrame(adjustNavbarOffset);
    window.addEventListener('resize', adjustNavbarOffset);
  }

  function removeBar() {
    const bar = document.getElementById('announcement-bar');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    window.removeEventListener('resize', adjustNavbarOffset);
    adjustNavbarOffset();
  }

  // Expose minimal API
  window.announcementBar = {
    show: addBar,
    hide: removeBar,
    setMessages: function (msgs) {
      if (Array.isArray(msgs) && msgs.length) {
        while (MESSAGES.length) MESSAGES.pop();
        msgs.forEach((m) => MESSAGES.push(m));
        const bar = document.getElementById('announcement-bar');
        if (bar) {
          // Re-render track
          const track = bar.querySelector('.announcement-bar__track');
          if (track) {
            track.innerHTML = '';
            MESSAGES.forEach((m) => {
              const item = document.createElement('div');
              item.className = 'announcement-bar__item';
              item.innerHTML = `<i class="${m.icon}"></i><span>${m.text}</span>`;
              track.appendChild(item);
            });
            // duplicate for seamless scroll
            MESSAGES.forEach((m) => {
              const item = document.createElement('div');
              item.className = 'announcement-bar__item';
              item.innerHTML = `<i class="${m.icon}"></i><span>${m.text}</span>`;
              track.appendChild(item);
            });
          }
        }
      }
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBar);
  } else {
    addBar();
  }
})();


