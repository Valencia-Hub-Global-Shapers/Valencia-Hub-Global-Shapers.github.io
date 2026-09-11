/**
 * main.js
 * Handles: loading team.json / projects.json, rendering language-aware
 * cards, the team bio modal, the project status filter, the ticker,
 * mobile nav, sticky-nav shadow, and the animated stat counters.
 */
(function () {
  'use strict';

  let teamData = [];
  let projectsData = [];
  let activeFilter = 'all';
  let lastFocusedEl = null;

  // ---------- helpers ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function initials(name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function localized(field, lang) {
    if (!field) return '';
    return field[lang] || field.en || field.es || Object.values(field)[0] || '';
  }

  // Fills a container with an initials fallback, then swaps in the real
  // photo only if it loads (repo ships without real /public assets).
  function setPhoto(container, photoPath, name) {
    container.textContent = initials(name);
    if (!photoPath) return;
    const img = new Image();
    img.alt = name;
    img.onload = () => {
      container.textContent = '';
      container.appendChild(img);
    };
    img.onerror = () => {
      /* keep initials fallback */
    };
    img.src = photoPath;
  }

  // ---------- data loading ----------
  // Only fetches what the current page actually renders, so the homepage
  // (which now just links out to team.html / projects.html) doesn't pull
  // in data it no longer displays.
  async function loadData() {
    const needsTeam = !!document.getElementById('teamGrid');
    const needsProjects = !!document.getElementById('projectsGrid');

    const jobs = [];
    if (needsTeam) jobs.push(fetch('data/team.json').then((r) => r.json()).then((d) => (teamData = d)));
    if (needsProjects) jobs.push(fetch('data/projects.json').then((r) => r.json()).then((d) => (projectsData = d)));
    await Promise.all(jobs);
  }

  // ---------- team ----------
  function renderTeam() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    const lang = window.i18n.getLang();
    grid.innerHTML = '';

    teamData.forEach((member) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'team-card';
      card.innerHTML = `
        <div class="team-photo"></div>
        <div class="team-meta">
          <h3>${escapeHtml(member.name)}</h3>
          <p>${escapeHtml(localized(member.role, lang))}</p>
        </div>
      `;
      setPhoto(card.querySelector('.team-photo'), member.photo, member.name);
      card.addEventListener('click', () => openTeamModal(member));
      grid.appendChild(card);
    });
  }

  function openTeamModal(member) {
    const lang = window.i18n.getLang();
    const overlay = document.getElementById('teamModal');
    document.getElementById('modalName').textContent = member.name;
    document.getElementById('modalRole').textContent = localized(member.role, lang);
    document.getElementById('modalBio').textContent = localized(member.bio, lang);
    setPhoto(document.getElementById('modalPhotoInner'), member.photo, member.name);

    lastFocusedEl = document.activeElement;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('modalClose').focus();
  }

  function closeTeamModal() {
    const overlay = document.getElementById('teamModal');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function initModal() {
    const overlay = document.getElementById('teamModal');
    if (!overlay) return; // this page has no team modal (e.g. projects.html)
    document.getElementById('modalClose').addEventListener('click', closeTeamModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeTeamModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeTeamModal();
    });
  }

  // ---------- projects ----------
  function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const lang = window.i18n.getLang();
    const dict = window.i18n.getDict();
    grid.innerHTML = '';

    const visible =
      activeFilter === 'all'
        ? projectsData
        : projectsData.filter((p) => p.status === activeFilter);

    const statusLabelKey = {
      completed: 'projects.filterCompleted',
      ongoing: 'projects.filterOngoing',
      upcoming: 'projects.filterUpcoming',
    };

    visible.forEach((project) => {
      const card = document.createElement('article');
      card.className = 'project-card';

      const statusLabel = statusLabelKey[project.status]
        ? getPath(dict, statusLabelKey[project.status])
        : project.status;

      card.innerHTML = `
        <div class="project-image">
          <span class="status-badge ${project.status}">${escapeHtml(statusLabel)}</span>
          <div class="fallback"></div>
        </div>
        <div class="project-body">
          <h3>${escapeHtml(localized(project.name, lang))}</h3>
          <p class="project-desc">${escapeHtml(localized(project.description, lang))}</p>
          <div class="project-impact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></svg>
            <span>${Number(project.peopleImpacted).toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES')} ${escapeHtml(getPath(dict, 'projects.impacted'))}</span>
          </div>
        </div>
      `;

      const imageWrap = card.querySelector('.project-image');
      const img = new Image();
      img.alt = localized(project.name, lang);
      img.loading = 'lazy';
      img.onload = () => {
        imageWrap.querySelector('.fallback').remove();
        imageWrap.appendChild(img);
      };
      img.onerror = () => {
        /* keep gradient fallback */
      };
      if (project.image) img.src = project.image;

      grid.appendChild(card);
    });
  }

  function getPath(obj, path) {
    return path
      .split('.')
      .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function initFilters() {
    const row = document.getElementById('filterRow');
    if (!row) return; // this page has no project filter (e.g. team.html)
    row.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      activeFilter = btn.getAttribute('data-filter');
      row.querySelectorAll('.filter-pill').forEach((b) => b.classList.toggle('active', b === btn));
      renderProjects();
    });
  }

  // ---------- ticker ----------
  function renderTicker() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const dict = window.i18n.getDict();
    const phrases = [dict.ticker.phrase1, dict.ticker.phrase2, dict.ticker.phrase3];
    const sequence = [...phrases, ...phrases, ...phrases];
    track.innerHTML = sequence.map((p) => `<span>${escapeHtml(p)}</span>`).join('') +
      sequence.map((p) => `<span>${escapeHtml(p)}</span>`).join(''); // doubled for seamless loop
  }

  // ---------- stat counters ----------
  function initStatCounters() {
    const items = document.querySelectorAll('.stat-number[data-count]');
    if (!items.length) return;

    const animate = (el) => {
      if (el.getAttribute('data-no-anim') === 'true') return;
      const target = parseInt(el.getAttribute('data-count'), 10) || 0;
      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      items.forEach((el) => (el.textContent = el.getAttribute('data-count')));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    items.forEach((el) => observer.observe(el));
  }

  // ---------- nav ----------
  function initNav() {
    const nav = document.getElementById('siteNav');
    const toggle = document.getElementById('navToggle');

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- init ----------
  document.getElementById('year').textContent = new Date().getFullYear();
  initModal();
  initFilters();
  initNav();
  initStatCounters();

  loadData().then(() => {
    // First paint waits for i18n's initial languagechange event so team/
    // project copy renders in the right language from the start.
    window.addEventListener('languagechange', () => {
      renderTeam();
      renderProjects();
      renderTicker();
    });
    // In case languagechange already fired before data finished loading.
    if (window.i18n.getDict()) {
      renderTeam();
      renderProjects();
      renderTicker();
    }
  });
})();
