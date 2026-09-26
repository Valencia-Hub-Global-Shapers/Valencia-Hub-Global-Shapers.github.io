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
  let alumniData = [];
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
  // `position` is a CSS object-position value (e.g. "center top", "50% 20%")
  // so individual portraits can be re-centered without cropping the source file.
  function setPhoto(container, photoPath, name, position) {
    container.textContent = initials(name);
    if (!photoPath) return;
    const img = new Image();
    img.alt = name;
    img.style.objectPosition = position || 'center';
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
    const needsAlumni = !!document.getElementById('alumniList');

    const jobs = [];
    if (needsTeam) jobs.push(fetch('data/team.json').then((r) => r.json()).then((d) => (teamData = d)));
    if (needsProjects) jobs.push(fetch('data/projects.json').then((r) => r.json()).then((d) => (projectsData = d)));
    if (needsAlumni) jobs.push(fetch('data/alumni.json').then((r) => r.json()).then((d) => (alumniData = d)));
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
      setPhoto(card.querySelector('.team-photo'), member.photo, member.name, member.photoPosition);
      card.addEventListener('click', () => openTeamModal(member));
      grid.appendChild(card);
    });
  }

  const LINK_ICONS = {
    linkedin:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="7.5" y1="10" x2="7.5" y2="17"/><circle cx="7.5" cy="6.8" r="1"/><path d="M11.5 17v-4.2c0-1.6 1-2.6 2.4-2.6 1.3 0 2.1.9 2.1 2.6V17"/></svg>',
    website:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z"/></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>',
    twitter:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 0 0 1.8-2.2 8 8 0 0 1-2.5 1 4 4 0 0 0-6.9 3.6A11.4 11.4 0 0 1 3.9 4.6a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.7-.5v.1a4 4 0 0 0 3.2 3.9c-.6.2-1.2.2-1.8.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.4a11.3 11.3 0 0 0 6.1 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.4-1.3 2-2.1-.7.3-1.5.5-2.3.6Z"/></svg>'
  };

  function renderMemberLinks(container, links) {
    container.innerHTML = '';
    if (!links) return;
    Object.keys(LINK_ICONS).forEach((key) => {
      const url = links[key];
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', key.charAt(0).toUpperCase() + key.slice(1));
      a.innerHTML = LINK_ICONS[key];
      container.appendChild(a);
    });
  }

  function openTeamModal(member) {
    const lang = window.i18n.getLang();
    const overlay = document.getElementById('teamModal');
    document.getElementById('modalName').textContent = member.name;
    document.getElementById('modalRole').textContent = localized(member.role, lang);
    document.getElementById('modalBio').textContent = localized(member.bio, lang);
    renderMemberLinks(document.getElementById('modalLinks'), member.links);
    setPhoto(document.getElementById('modalPhotoInner'), member.photo, member.name, member.photoPosition);

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

  // ---------- alumni ----------
  function renderAlumni() {
    const list = document.getElementById('alumniList');
    if (!list) return;
    list.innerHTML = '';

    alumniData.forEach((person) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = person.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `
        <span>${escapeHtml(person.name)}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
      `;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  // ---------- projects ----------
  function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    const lang = window.i18n.getLang();
    const dict = window.i18n.getDict();
    grid.innerHTML = '';

    // Ongoing first, then upcoming, then completed; JSON order within each.
    const statusOrder = { ongoing: 0, upcoming: 1, completed: 2 };
    const visible = (
      activeFilter === 'all'
        ? projectsData.slice()
        : projectsData.filter((p) => p.status === activeFilter)
    ).sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

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
        <div class="project-body">
          <span class="status-badge ${project.status}">${escapeHtml(statusLabel)}</span>
          <h3>${escapeHtml(localized(project.name, lang))}</h3>
          <p class="project-desc">${escapeHtml(localized(project.description, lang))}</p>
          <div class="project-impact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6"/></svg>
            <span>${escapeHtml(formatImpact(project.peopleImpacted, lang))} ${escapeHtml(getPath(dict, 'projects.impacted'))}</span>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  // Numbers are localised; strings (e.g. "+100") are shown as written.
  function formatImpact(value, lang) {
    if (typeof value === 'string') return value;
    return Number(value).toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES');
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
    renderAlumni();

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
