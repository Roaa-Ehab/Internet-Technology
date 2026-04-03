document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  function normalizeUrl(url) {
    if (!url) return '#';
    var value = String(url).trim();
    if (value.startsWith('#https://') || value.startsWith('#http://')) {
      return value.slice(1);
    }
    return value;
  }

  function parseManagedJson(id) {
    var node = document.getElementById(id);
    if (!node) return [];
    try {
      var parsed = JSON.parse(node.textContent.trim() || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Could not parse managed JSON for:', id, error);
      return [];
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeLinkMarkup(url, text, className) {
    var cleanUrl = normalizeUrl(url || '#');
    var safeText = escapeHtml(text || 'Open');
    var safeClass = escapeHtml(className || '');

    if (!cleanUrl || cleanUrl === '#') {
      return '<span class="' + safeClass + ' static-card-link">' + safeText + '</span>';
    }

    return '<a href="' + escapeHtml(cleanUrl) + '" class="' + safeClass + '" target="_blank" rel="noopener">' + safeText + '</a>';
  }

  var body = document.body;
  var menuBtn = document.querySelector('.custom-menu-btn');
  var menuCloseBtn = document.querySelector('.nav-menu-close');
  var navMenu = document.querySelector('.nav-menu');
  var menuBackdrop = document.querySelector('.menu-backdrop');
  var menuLinks = document.querySelectorAll('.nav-menu a[href^="#"], .nav-menu a[target="_blank"]');
  var submenuToggles = document.querySelectorAll('.submenu-toggle');
  var themeToggle = document.querySelector('.theme-toggle');

  function openMenu() {
    if (!menuBtn || !navMenu || !menuBackdrop) return;
    navMenu.classList.add('active');
    menuBackdrop.classList.add('active');
    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    navMenu.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  }

  function closeMenu() {
    if (!menuBtn || !navMenu || !menuBackdrop) return;
    navMenu.classList.remove('active');
    menuBackdrop.classList.remove('active');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    navMenu.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function (event) {
      event.preventDefault();
      if (navMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener('click', closeMenu);
  }

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMenu);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  submenuToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var parent = toggle.closest('.has-submenu');
      var expanded = toggle.getAttribute('aria-expanded') === 'true';

      submenuToggles.forEach(function (otherToggle) {
        if (otherToggle !== toggle) {
          otherToggle.setAttribute('aria-expanded', 'false');
          otherToggle.closest('.has-submenu').classList.remove('open');
        }
      });

      toggle.setAttribute('aria-expanded', String(!expanded));
      parent.classList.toggle('open', !expanded);
    });
  });

  menuLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu();
    });
  });

  function applyTheme(theme) {
    body.classList.toggle('dark-mode', theme === 'dark');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  window.localStorage.setItem('must-theme', 'light');
  applyTheme('light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var nextTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
      window.localStorage.setItem('must-theme', nextTheme);
    });
  }

  var animatedElements = document.querySelectorAll('.fade-in-up');
  if ('IntersectionObserver' in window && animatedElements.length) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animatedElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  var gallerySlides = document.querySelectorAll('.gallery-slide');
  var galleryDotsContainer = document.querySelector('.gallery-dots');
  var currentGallerySlide = 0;
  var galleryTimer = null;

  if (gallerySlides.length && galleryDotsContainer) {
    gallerySlides.forEach(function (_, index) {
      var dot = document.createElement('div');
      dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
      dot.addEventListener('click', function () {
        goToGallerySlide(index);
        resetGalleryTimer();
      });
      galleryDotsContainer.appendChild(dot);
    });

    var galleryDots = galleryDotsContainer.querySelectorAll('.gallery-dot');

    function goToGallerySlide(index) {
      gallerySlides[currentGallerySlide].classList.remove('active');
      galleryDots[currentGallerySlide].classList.remove('active');
      currentGallerySlide = index;
      gallerySlides[currentGallerySlide].classList.add('active');
      galleryDots[currentGallerySlide].classList.add('active');
    }

    function nextGallerySlide() {
      goToGallerySlide((currentGallerySlide + 1) % gallerySlides.length);
    }

    function resetGalleryTimer() {
      window.clearInterval(galleryTimer);
      galleryTimer = window.setInterval(nextGallerySlide, 7000);
    }

    resetGalleryTimer();
  }

  var awardsTrack = document.querySelector('.awards-track');
  var awardsSlides = document.querySelectorAll('.awards-slide');
  var awardsDotsContainer = document.querySelector('.awards-dots');
  var currentAwardSlide = 0;
  var awardsTimer = null;

  if (awardsTrack && awardsSlides.length && awardsDotsContainer) {
    awardsSlides.forEach(function (_, index) {
      var dot = document.createElement('div');
      dot.className = 'award-dot' + (index === 0 ? ' active' : '');
      dot.addEventListener('click', function () {
        goToAwardSlide(index);
        resetAwardsTimer();
      });
      awardsDotsContainer.appendChild(dot);
    });

    var awardsDots = awardsDotsContainer.querySelectorAll('.award-dot');

    function goToAwardSlide(index) {
      if (index >= awardsSlides.length) index = 0;
      if (index < 0) index = awardsSlides.length - 1;
      awardsDots[currentAwardSlide].classList.remove('active');
      currentAwardSlide = index;
      awardsTrack.style.transform = 'translateX(' + (currentAwardSlide * -100) + '%)';
      awardsDots[currentAwardSlide].classList.add('active');
    }

    function nextAwardSlide() {
      goToAwardSlide(currentAwardSlide + 1);
    }

    function resetAwardsTimer() {
      window.clearInterval(awardsTimer);
      awardsTimer = window.setInterval(nextAwardSlide, 7000);
    }

    resetAwardsTimer();
  }

  function renderNews(items) {
    var target = document.getElementById('managedNewsCards');
    if (!target) return;

    target.innerHTML = items.map(function (item) {
      var imgSrc = item.imageUrl ? escapeHtml(item.imageUrl) : 'images/logo-png.png';
      var linkMarkup = safeLinkMarkup(item.linkUrl, item.linkText || 'Read more', 'news-link');

      return (
        '<div class="news-card fade-in-up visible">' +
          '<img src="' + imgSrc + '" alt="News" style="width: 100%; height: 250px; object-fit: cover; object-position: center; display: block; margin: 0 auto;">' +
          '<div class="news-meta" style="padding: 20px 20px 0;">' +
            '<span><i class="far fa-calendar"></i> ' + escapeHtml(item.badge) + '</span>' +
          '</div>' +
          '<div style="padding: 0 20px 20px;">' +
            '<h4 class="navy-title" style="margin-bottom: 15px;">' + escapeHtml(item.title) + '</h4>' +
            linkMarkup +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderEvents(items) {
    var target = document.getElementById('managedEventsCards');
    if (!target) return;

    target.innerHTML = items.map(function (item) {
      var imgSrc = item.imageUrl ? escapeHtml(item.imageUrl) : 'images/logo-png.png';
      var linkMarkup = safeLinkMarkup(item.linkUrl, item.linkText || 'Register Now', 'event-link');

      return (
        '<div class="event-card fade-in-up visible">' +
          '<div class="img-wrapper">' +
            '<img src="' + imgSrc + '" alt="Event" style="width: 100%; height: 250px; object-fit: cover; object-position: center; display: block; margin: 0 auto;">' +
            '<div class="date-box">' +
              '<span class="day">' + escapeHtml(item.day) + '</span>' +
              '<span class="month" style="font-size:0.9rem;">' + escapeHtml(item.monthYear) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="event-content" style="padding: 40px 20px 20px;">' +
            '<h4 class="navy-title">' + escapeHtml(item.title) + '</h4>' +
            '<p style="font-size: 0.9rem; color: #555; margin-top: 10px; margin-bottom: 15px;">' + escapeHtml(item.summary) + '</p>' +
            linkMarkup +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  renderNews(parseManagedJson('managed-news-data'));
  renderEvents(parseManagedJson('managed-events-data'));
});
