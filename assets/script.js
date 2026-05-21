const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');
const year = document.querySelector('[data-year]');

if (year) year.textContent = new Date().getFullYear();

function updateHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 24);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

navToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});

nav?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
});

let targetDate = new Date('2027-03-28T12:00:00+07:00');
const days = document.querySelector('[data-days]');
const hours = document.querySelector('[data-hours]');
const minutes = document.querySelector('[data-minutes]');

function updateCountdown() {
  if (!days || !hours || !minutes) return;
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  days.textContent = String(Math.floor(diff / day)).padStart(2, '0');
  hours.textContent = String(Math.floor((diff % day) / hour)).padStart(2, '0');
  minutes.textContent = String(Math.floor((diff % hour) / minute)).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 30000);

function getValue(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

function setText(selector, value, root = document) {
  const element = typeof selector === 'string' ? root.querySelector(selector) : selector;
  if (element && value !== undefined && value !== null) element.textContent = value;
}

function setLink(element, href, fallback = '#') {
  if (!element) return;
  element.href = href || fallback;
  element.toggleAttribute('aria-disabled', !href);
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function imageMarkup(src, alt) {
  return src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}">` : '';
}

function mediaMarkup(item) {
  if (!item?.src) return '';
  const files = toArray(item.src).length ? toArray(item.src) : [item.src];
  return files.map((file) => singleMediaMarkup({ ...item, src: file })).join('');
}

function fileTypeFromUrl(src = '') {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src) ? 'video' : 'image';
}

function mediaItemFromGithubFile(file) {
  return {
    type: fileTypeFromUrl(file.download_url || file.name),
    src: file.download_url,
    alt: file.name?.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') || 'Event media',
    caption: '',
  };
}

function singleMediaMarkup(item, options = {}) {
  const src = escapeHtml(item.src);
  const caption = item.caption ? `<p>${escapeHtml(item.caption)}</p>` : '';
  const isVideo = item.type === 'video' || fileTypeFromUrl(item.src) === 'video';
  const loading = options.lazy ? 'loading="lazy" decoding="async"' : 'decoding="async"';
  if (isVideo) {
    return `
      <article>
        <video src="${src}" controls playsinline preload="metadata"></video>
        ${caption}
      </article>
    `;
  }
  return `
    <article>
      <img src="${src}" alt="${escapeHtml(item.alt || item.caption || '')}" ${loading}>
      ${caption}
    </article>
  `;
}

function renderCollection(container, items, renderItem) {
  if (!container || !Array.isArray(items)) return;
  container.innerHTML = items.map(renderItem).join('');
}

async function loadSiteContent() {
  try {
    const response = await fetch('content/site.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    renderSite(await response.json());
  } catch (error) {
    console.warn('Using fallback HTML because CMS content could not be loaded.', error);
  }
}

function renderSite(content) {
  document.title = `${content.site?.name || 'ESCAPE'} Music Festival`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', content.site?.description || '');

  document.querySelectorAll('[data-content]').forEach((element) => {
    const value = getValue(content, element.dataset.content);
    if (value !== undefined && value !== null) element.textContent = value;
  });

  const heroBg = document.querySelector('[data-hero-bg]');
  if (heroBg && content.hero?.image) {
    heroBg.style.backgroundImage = `url("${content.hero.image}")`;
    heroBg.setAttribute('aria-label', content.hero.image_alt || '');
  }
  const heroVideo = document.querySelector('[data-hero-video]');
  if (heroVideo) {
    if (content.hero?.video) {
      heroVideo.src = content.hero.video;
      heroVideo.hidden = false;
      heroVideo.setAttribute('aria-label', content.hero.image_alt || 'Festival video');
      heroVideo.play().catch(() => {});
    } else {
      heroVideo.removeAttribute('src');
      heroVideo.hidden = true;
    }
  }

  renderCollection(document.querySelector('[data-hero-highlights]'), content.hero?.highlights, (item) => `<span>${item}</span>`);

  const ticketUrl = content.tickets?.ticket_url || `mailto:${content.contact?.email || 'hello@example.com'}?subject=Festival%20tickets`;
  document.querySelectorAll('[data-ticket-link]').forEach((element) => setLink(element, ticketUrl));
  if (content.tickets?.launch_date) {
    targetDate = new Date(content.tickets.launch_date);
    updateCountdown();
  }

  renderLineup(content.lineup);
  renderExperience(content.experience?.items);
  renderTickets(content.tickets, ticketUrl);
  renderPastEvents(content.past_events?.events);
  renderGallery(content.gallery?.photos);
  renderInfo(content.info?.items, content.info?.faqs);
  renderSponsors(content.sponsors?.items);
  renderContact(content);
}

function renderLineup(lineup) {
  const container = document.querySelector('[data-lineup]');
  if (!container || !lineup) return;
  const artists = toArray(lineup.artists).filter((artist) => artist?.name || artist?.title || artist?.description);
  const feature = lineup.feature || {};
  container.innerHTML = `
    <article class="artist-card feature-card">
      ${imageMarkup(feature.image, feature.image_alt)}
      <div>
        <p class="tag">${escapeHtml(feature.tag || '')}</p>
        <h3>${escapeHtml(feature.name || '')}</h3>
        <p>${escapeHtml(feature.description || '')}</p>
      </div>
    </article>
    ${artists.map((artist, index) => `
      <article class="artist-card">
        ${imageMarkup(artist.image, artist.image_alt || artist.name || artist.title)}
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(artist.name || artist.title || '')}</h3>
        <p>${escapeHtml(artist.description || artist.copy || '')}</p>
      </article>
    `).join('')}
  `;
}

function renderExperience(items) {
  renderCollection(document.querySelector('[data-experience]'), items, (item) => `
    <article>
      ${imageMarkup(item.image, item.image_alt)}
      <h3>${item.title || ''}</h3>
      <p>${item.description || ''}</p>
    </article>
  `);
}

function renderTickets(tickets, ticketUrl) {
  renderCollection(document.querySelector('[data-ticket-options]'), tickets?.options, (ticket) => `
    <article class="${ticket.featured ? 'ticket-featured' : ''}">
      <p class="tag">${ticket.tag || ''}</p>
      <h3>${ticket.price || tickets?.price || ''}</h3>
      <p>${ticket.description || ''}</p>
      <a class="button compact ${ticket.featured ? 'primary' : ''}" href="${ticket.button_label === 'Contact' ? '#contact' : ticketUrl}">${ticket.button_label || 'More Info'}</a>
    </article>
  `);
}

function renderPastEvents(events) {
  const container = document.querySelector('[data-past-events]');
  const eventItems = toArray(events);
  renderCollection(container, eventItems, (event, index) => {
    const videoSource = event.aftermovie_video_url || event.aftermovie_video;
    const hasVideo = Boolean(videoSource);
    return `
    <article class="${hasVideo ? 'has-video' : ''}" ${hasVideo ? `tabindex="0" role="button" aria-label="Play ${escapeHtml(event.title || 'event')} aftermovie" data-event-video="${escapeHtml(videoSource)}" data-event-title="${escapeHtml(event.title || '')}" data-event-date="${escapeHtml(event.date || '')}"` : ''}>
      <time>${escapeHtml(event.date || '')}</time>
      <h3>${escapeHtml(event.title || '')}</h3>
      <p>${escapeHtml(event.description || '')}</p>
      ${hasVideo ? '<span class="play-chip">Play aftermovie</span>' : ''}
    </article>
  `;
  });
  initPastEventVideos(container);
}

function ensureVideoModal() {
  let modal = document.querySelector('[data-video-modal]');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.hidden = true;
  modal.setAttribute('data-video-modal', '');
  modal.innerHTML = `
    <div class="video-modal-backdrop" data-video-close></div>
    <div class="video-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
      <button class="video-modal-close" type="button" aria-label="Close video" data-video-close>Close</button>
      <div class="video-modal-heading">
        <p data-video-date></p>
        <h3 id="video-modal-title" data-video-title></h3>
      </div>
      <div class="video-frame" data-video-frame></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-video-close]')) closeVideoModal();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeVideoModal();
  });
  return modal;
}

function openVideoModal(card) {
  const modal = ensureVideoModal();
  const frame = modal.querySelector('[data-video-frame]');
  const source = card.dataset.eventVideo;
  setText(modal.querySelector('[data-video-date]'), card.dataset.eventDate || '');
  setText(modal.querySelector('[data-video-title]'), card.dataset.eventTitle || 'Aftermovie');
  frame.innerHTML = videoEmbedMarkup(source);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  const player = frame.querySelector('video');
  player?.play().catch(() => {});
  modal.querySelector('[data-video-close]')?.focus();
}

function closeVideoModal() {
  const modal = document.querySelector('[data-video-modal]');
  const player = modal?.querySelector('video');
  if (player) {
    player.pause();
    player.removeAttribute('src');
    player.load();
  }
  const frame = modal?.querySelector('[data-video-frame]');
  if (frame) frame.innerHTML = '';
  if (modal) modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function getVideoEmbedUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : url;
    }
    return url;
  } catch {
    return url;
  }
}

function videoEmbedMarkup(url) {
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  if (isDirectVideo || url.startsWith('/')) {
    return `<video src="${escapeHtml(url)}" controls autoplay playsinline></video>`;
  }
  return `<iframe src="${escapeHtml(getVideoEmbedUrl(url))}" title="Aftermovie video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
}

function initPastEventVideos(container) {
  if (!container) return;
  container.querySelectorAll('[data-event-video]').forEach((card) => {
    card.addEventListener('click', () => openVideoModal(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openVideoModal(card);
      }
    });
  });
}

function renderGallery(photos) {
  renderCollection(document.querySelector('[data-gallery]'), photos, (photo) => `
    <article>
      ${imageMarkup(photo.image, photo.image_alt)}
      <p>${photo.caption || ''}</p>
    </article>
  `);
}

function renderInfo(items, faqs) {
  renderCollection(document.querySelector('[data-info-items]'), items, (item) => `
    <article><h3>${item.title || ''}</h3><p>${item.description || ''}</p></article>
  `);
  renderCollection(document.querySelector('[data-faqs]'), faqs, (faq, index) => `
    <details ${index === 0 ? 'open' : ''}>
      <summary>${faq.question || ''}</summary>
      <p>${faq.answer || ''}</p>
    </details>
  `);
}

function renderSponsors(items) {
  renderCollection(document.querySelector('[data-sponsors]'), items, (sponsor) => `
    <span>${sponsor.logo ? `<img src="${sponsor.logo}" alt="${sponsor.name || 'Sponsor'} logo">` : sponsor.name || ''}</span>
  `);
}

function renderContact(content) {
  const form = document.querySelector('[data-contact-form]');
  if (form) form.action = `mailto:${content.contact?.email || 'hello@example.com'}`;
  setLink(document.querySelector('[data-social="facebook"]'), content.site?.facebook_url);
  setLink(document.querySelector('[data-social="instagram"]'), content.site?.instagram_url);
  setLink(document.querySelector('[data-social="tiktok"]'), content.site?.tiktok_url);
}

loadSiteContent();
