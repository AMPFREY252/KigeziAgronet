/**
 * Theme Switcher
 * Manages multiple color themes for Kigezi Agronet
 * Available themes: light, dark, modern, nature, ocean, minimal
 */

class ThemeSwitcher {
  constructor() {
    this.themes = ['light', 'dark', 'modern', 'nature', 'ocean', 'minimal'];
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    // Set initial theme
    this.setTheme(this.currentTheme);
    
    // Create theme switcher UI if not exists
    if (!document.querySelector('.theme-switcher')) {
      this.createThemeSwitcher();
    }
  }

  createThemeSwitcher() {
    const container = document.body;
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    
    const themeEmojis = {
      light: '☀️',
      dark: '🌙',
      modern: '✨',
      nature: '🌿',
      ocean: '🌊',
      minimal: '⚫'
    };

    this.themes.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = `theme-switcher-btn ${theme === this.currentTheme ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${themeEmojis[theme]}</span>
        <span class="theme-switcher-label">${this.capitalize(theme)}</span>
      `;
      btn.addEventListener('click', () => this.setTheme(theme));
      switcher.appendChild(btn);
    });

    container.appendChild(switcher);
  }

  setTheme(theme) {
    if (!this.themes.includes(theme)) {
      console.warn(`Theme "${theme}" not found. Using "light" instead.`);
      theme = 'light';
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.currentTheme = theme;

    // Update active button
    document.querySelectorAll('.theme-switcher-btn').forEach((btn, index) => {
      btn.classList.toggle('active', this.themes[index] === theme);
    });

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

    // Add animation to body
    document.body.style.animation = 'fadeIn 300ms ease-out';
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Initialize theme switcher when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
  });
} else {
  new ThemeSwitcher();
}
