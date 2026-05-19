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

function imageMarkup(src, alt) {
  return src ? `<img src="${src}" alt="${alt || ''}">` : '';
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
  const artists = lineup.artists || [];
  container.innerHTML = `
    <article class="artist-card feature-card">
      ${imageMarkup(lineup.feature?.image, lineup.feature?.image_alt)}
      <div>
        <p class="tag">${lineup.feature?.tag || ''}</p>
        <h3>${lineup.feature?.name || ''}</h3>
        <p>${lineup.feature?.description || ''}</p>
      </div>
    </article>
    ${artists.map((artist, index) => `
      <article class="artist-card">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${artist.name || ''}</h3>
        <p>${artist.description || ''}</p>
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
  renderCollection(document.querySelector('[data-past-events]'), events, (event) => `
    <article>
      <time>${event.date || ''}</time>
      <h3>${event.title || ''}</h3>
      <p>${event.description || ''}</p>
    </article>
  `);
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
