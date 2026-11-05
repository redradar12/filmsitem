const TMDB_KEY = 'ff8e012967d9a83ac14e23c77b267cf0';
const API = 'https://api.themoviedb.org/3';

const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="500" height="750" fill="#1d1d26"/><text x="250" y="375" fill="#63637a" font-family="sans-serif" font-size="30" text-anchor="middle" dominant-baseline="middle">Afiş yok</text></svg>'
);

const WATCHLIST_KEY = 'fk_watchlist';
const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.1C1.1 8.9 2.6 5.5 5.9 5.1c1.9-.2 3.6.8 4.6 2.3l1.5 2.2 1.5-2.2c1-1.5 2.7-2.5 4.6-2.3 3.3.4 4.8 3.8 3.5 6.8C19.5 16.4 12 21 12 21z"/></svg>';

const SERVERS = [
  { n: 'Sunucu 1', m: 'https://vidsrc.to/embed/movie/{id}', t: 'https://vidsrc.to/embed/tv/{id}/{s}/{e}' },
  { n: 'Sunucu 2', m: 'https://vidlink.pro/movie/{id}', t: 'https://vidlink.pro/tv/{id}/{s}/{e}' },
  { n: 'Sunucu 3', m: 'https://vidsrc.me/embed/movie?tmdb={id}', t: 'https://vidsrc.me/embed/tv?tmdb={id}&season={s}&episode={e}' },
  { n: 'Sunucu 4', m: 'https://embed.su/embed/movie/{id}', t: 'https://embed.su/embed/tv/{id}/{s}/{e}' },
  { n: 'Sunucu 5', m: 'https://www.2embed.cc/embed/{id}', t: 'https://www.2embed.cc/embedtv/{id}&s={s}&e={e}' },
];

const GENRES = [
  { key: 'aksiyon', name: 'Aksiyon', movie: 28, tv: 10759 },
  { key: 'macera', name: 'Macera', movie: 12, tv: null },
  { key: 'animasyon', name: 'Animasyon', movie: 16, tv: 16 },
  { key: 'komedi', name: 'Komedi', movie: 35, tv: 35 },
  { key: 'suc', name: 'Suç', movie: 80, tv: 80 },
  { key: 'belgesel', name: 'Belgesel', movie: 99, tv: 99 },
  { key: 'dram', name: 'Dram', movie: 18, tv: 18 },
  { key: 'aile', name: 'Aile', movie: 10751, tv: 10751 },
  { key: 'fantastik', name: 'Fantastik', movie: 14, tv: null },
  { key: 'tarih', name: 'Tarih', movie: 36, tv: null },
  { key: 'korku', name: 'Korku', movie: 27, tv: null },
  { key: 'muzik', name: 'Müzik', movie: 10402, tv: null },
  { key: 'gizem', name: 'Gizem', movie: 9648, tv: 9648 },
  { key: 'romantik', name: 'Romantik', movie: 10749, tv: null },
  { key: 'bilim-kurgu', name: 'Bilim Kurgu', movie: 878, tv: 10765 },
  { key: 'gerilim', name: 'Gerilim', movie: 53, tv: null },
  { key: 'savas', name: 'Savaş', movie: 10752, tv: 10768 },
  { key: 'western', name: 'Western', movie: 37, tv: 37 },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, index) => CURRENT_YEAR - index);

const MOVIE_FILTERS = [
  { key: 'filmler', label: 'Popüler' },
  { key: 'filmler/en-iyi', label: 'En İyi' },
  { key: 'filmler/vizyonda', label: 'Vizyonda' },
  { key: 'filmler/yakinda', label: 'Yakında' },
  { key: 'filmler/trend', label: 'Trend' },
];

const TV_FILTERS = [
  { key: 'diziler', label: 'Popüler' },
  { key: 'diziler/en-iyi', label: 'En İyi' },
  { key: 'diziler/yayinda', label: 'Yayında' },
  { key: 'diziler/bugun', label: 'Bugün' },
];

const LIST_CONFIG = {
  filmler: { type: 'movie', title: 'Popüler Filmler', endpoint: '/movie/popular' },
  'filmler/en-iyi': { type: 'movie', title: 'En İyi Filmler', endpoint: '/movie/top_rated' },
  'filmler/vizyonda': { type: 'movie', title: 'Vizyondaki Filmler', endpoint: '/movie/now_playing', params: { region: 'TR' } },
  'filmler/yakinda': { type: 'movie', title: 'Yakında Vizyonda', endpoint: '/movie/upcoming', params: { region: 'TR' } },
  'filmler/trend': { type: 'movie', title: 'Trend Filmler', endpoint: '/trending/movie/week' },
  diziler: { type: 'tv', title: 'Popüler Diziler', endpoint: '/tv/popular' },
  'diziler/en-iyi': { type: 'tv', title: 'En İyi Diziler', endpoint: '/tv/top_rated' },
  'diziler/yayinda': { type: 'tv', title: 'Yayındaki Diziler', endpoint: '/tv/on_the_air' },
  'diziler/bugun': { type: 'tv', title: 'Bugün Yayınlanan Diziler', endpoint: '/tv/airing_today' },
};

const app = document.getElementById('app');
const searchInput = document.getElementById('search');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const logo = document.querySelector('.logo');

let renderToken = 0;
let searchTimer = null;
let trailerRequest = 0;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function image(path, size = 'w500') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : PLACEHOLDER;
}

function poster(path) {
  return image(path, 'w500');
}

function year(date) {
  return date ? String(date).slice(0, 4) : '—';
}

function score(value) {
  const n = Number(value);
  return n > 0 ? n.toFixed(1) : '—';
}

function formatCount(value) {
  const n = Number(value);
  return n > 0 ? n.toLocaleString('tr-TR') : '';
}

let watchlistCache = null;

function getWatchlist() {
  if (watchlistCache) return watchlistCache;
  try {
    const parsed = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    watchlistCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    watchlistCache = [];
  }
  return watchlistCache;
}

function watchlistKey(type, id) {
  return `${type}:${id}`;
}

function isSaved(type, id) {
  return getWatchlist().some((item) => item.key === watchlistKey(type, id));
}

function saveWatchlist(items) {
  watchlistCache = items;
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
  } catch {}
  updateWatchlistCount();
}

function toggleWatchlist(item) {
  const items = getWatchlist();
  const key = watchlistKey(item.type, item.id);
  const index = items.findIndex((entry) => entry.key === key);
  let saved;
  if (index >= 0) {
    items.splice(index, 1);
    saved = false;
  } else {
    items.unshift({
      key,
      type: item.type,
      id: Number(item.id),
      title: item.title,
      poster_path: item.poster_path || '',
      year: item.year || '',
      vote_average: Number(item.vote_average) || 0,
      added: Date.now(),
    });
    saved = true;
  }
  saveWatchlist(items);
  return saved;
}

function updateWatchlistCount() {
  const count = getWatchlist().length;
  document.querySelectorAll('.watchlist-count').forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
}

function buildEmbed(index, type, id, season, episode) {
  const server = SERVERS[index];
  if (!server) return '';
  const template = type === 'movie' ? server.m : server.t;
  return template
    .replaceAll('{id}', id)
    .replaceAll('{s}', season)
    .replaceAll('{e}', episode);
}

function serverButtons(activeIndex) {
  return SERVERS.map((server, index) =>
    `<button type="button" class="server-btn${index === activeIndex ? ' active' : ''}" data-i="${index}">${esc(server.n)}</button>`
  ).join('');
}

function bindServers(type, id, season, episode) {
  const wrap = document.getElementById('servers');
  const frame = document.getElementById('player');
  if (!wrap || !frame) return;
  wrap.addEventListener('click', (event) => {
    const button = event.target.closest('.server-btn');
    if (!button || button.classList.contains('active')) return;
    const index = Number(button.dataset.i);
    wrap.querySelectorAll('.server-btn').forEach((btn) => {
      btn.classList.toggle('active', btn === button);
    });
    frame.src = buildEmbed(index, type, id, season, episode);
  });
}

function showError(error) {
  app.innerHTML = `
    <div class="error">
      <strong>Bir şeyler ters gitti.</strong>
      İçerik yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
      <button class="btn btn-ghost retry-btn" type="button">Tekrar dene</button>
    </div>`;
  const retry = app.querySelector('.retry-btn');
  if (retry) retry.addEventListener('click', () => route());
  if (error) console.error(error);
}

function closeNavGroups() {
  mainNav.querySelectorAll('.nav-group.open').forEach((group) => {
    group.classList.remove('open');
    const toggle = group.querySelector('.nav-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
}

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Menüyü aç');
  mainNav.classList.remove('open');
  closeNavGroups();
}

function updateNav(section) {
  mainNav.querySelectorAll('[data-nav]').forEach((item) => {
    const active = item.dataset.nav === section;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

function buildNav() {
  const moviesPanel = document.getElementById('navMovies');
  const showsPanel = document.getElementById('navShows');
  const genresPanel = document.getElementById('navGenres');
  const yearsPanel = document.getElementById('navYears');
  if (!moviesPanel || !showsPanel || !genresPanel || !yearsPanel) return;

  moviesPanel.innerHTML = MOVIE_FILTERS
    .map((item) => `<a href="#/${item.key}">${esc(item.label)}</a>`)
    .join('');
  showsPanel.innerHTML = TV_FILTERS
    .map((item) => `<a href="#/${item.key}">${esc(item.label)}</a>`)
    .join('');
  genresPanel.innerHTML = GENRES
    .map((genre) => `<a href="#/tur/${genre.key}">${esc(genre.name)}</a>`)
    .join('') + '<a class="nav-all" href="#/turler">Tüm Türler →</a>';
  yearsPanel.innerHTML = YEARS
    .map((year) => `<a href="#/yil/${year}">${year}</a>`)
    .join('');
}

async function tmdb(path, params = {}) {
  const url = new URL(API + path);
  const query = new URLSearchParams();
  query.set('api_key', TMDB_KEY);
  query.set('language', 'tr-TR');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  url.search = query.toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error('TMDB HTTP ' + response.status);
  return response.json();
}

function safeTmdb(path, params) {
  return tmdb(path, params).catch(() => null);
}

function cardHTML(item, type) {
  const title = item.title || item.name || 'İsimsiz';
  const date = item.release_date || item.first_air_date;
  const itemYear = item.year || year(date);
  const scoreValue = score(item.vote_average);
  const href = type === 'movie' ? `#/film/${item.id}` : `#/dizi/${item.id}/1/1`;
  const saved = isSaved(type, item.id);
  return `
    <article class="card">
      <a class="card-link" href="${href}">
        <div class="card-poster">
          <img src="${poster(item.poster_path)}" alt="${esc(title)}" loading="lazy">
          <span class="card-score">★ ${scoreValue}</span>
        </div>
        <div class="card-info">
          <h3>${esc(title)}</h3>
          <div class="card-meta">
            <span>${esc(itemYear)}</span>
            <span>${type === 'tv' ? 'Dizi' : 'Film'}</span>
          </div>
        </div>
      </a>
      <button class="card-save${saved ? ' saved' : ''}" type="button" data-type="${type}" data-id="${item.id}" data-title="${esc(title)}" data-poster="${esc(item.poster_path || '')}" data-year="${esc(itemYear)}" data-score="${scoreValue === '—' ? '0' : scoreValue}" aria-label="${saved ? 'Listemden çıkar' : 'Listeme ekle'}" aria-pressed="${saved}">${HEART_SVG}</button>
    </article>`;
}

async function renderHome(token) {
  app.innerHTML = '<div class="loader">Yükleniyor…</div>';
  try {
    const [trending, nowPlaying, movies, shows, topShows] = await Promise.all([
      tmdb('/trending/all/week'),
      tmdb('/movie/now_playing', { region: 'TR' }),
      tmdb('/movie/popular'),
      tmdb('/tv/popular'),
      tmdb('/tv/top_rated'),
    ]);
    if (token !== renderToken) return;

    const trend = (trending.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
    const hero = trend.find((item) => item.backdrop_path && item.overview) || trend.find((item) => item.backdrop_path) || trend[0];
    const heroTitle = hero ? (hero.title || hero.name || 'İsimsiz') : '';
    const heroType = hero && hero.media_type === 'tv' ? 'tv' : 'movie';
    const heroHref = hero ? (heroType === 'tv' ? `#/dizi/${hero.id}/1/1` : `#/film/${hero.id}`) : '';

    app.innerHTML = `
      ${hero ? `
      <section class="hero">
        ${hero.backdrop_path ? `<img class="hero-bg" src="${image(hero.backdrop_path, 'w1280')}" alt="" aria-hidden="true" fetchpriority="high">` : ''}
        <div class="hero-inner">
          <span class="hero-label">Bu Hafta Trend</span>
          <h1>${esc(heroTitle)}</h1>
          <div class="hero-meta">
            <span class="score">★ ${score(hero.vote_average)}</span>
            <span>${year(hero.release_date || hero.first_air_date)}</span>
            <span>${heroType === 'tv' ? 'Dizi' : 'Film'}</span>
          </div>
          <p class="hero-overview">${esc(hero.overview) || 'Özet bulunamadı.'}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="${heroHref}">Detay</a>
            <button class="btn btn-ghost" type="button" data-trailer-type="${heroType}" data-trailer-id="${hero.id}" data-trailer-title="${esc(heroTitle)}">Fragman</button>
          </div>
        </div>
      </section>` : ''}
      <section class="row-section">
        <div class="section-head"><h2>Bu Hafta Trend</h2></div>
        <div class="row">${trend.map((item) => cardHTML(item, item.media_type)).join('')}</div>
      </section>
      <section class="row-section">
        <div class="section-head">
          <h2>Vizyondakiler</h2>
          <a class="see-all" href="#/filmler/vizyonda">Tümü →</a>
        </div>
        <div class="row">${(nowPlaying.results || []).map((item) => cardHTML(item, 'movie')).join('')}</div>
      </section>
      <section class="row-section">
        <div class="section-head">
          <h2>Popüler Filmler</h2>
          <a class="see-all" href="#/filmler">Tümü →</a>
        </div>
        <div class="row">${(movies.results || []).map((item) => cardHTML(item, 'movie')).join('')}</div>
      </section>
      <section class="row-section">
        <div class="section-head">
          <h2>Popüler Diziler</h2>
          <a class="see-all" href="#/diziler">Tümü →</a>
        </div>
        <div class="row">${(shows.results || []).map((item) => cardHTML(item, 'tv')).join('')}</div>
      </section>
      <section class="row-section">
        <div class="section-head">
          <h2>En İyi Diziler</h2>
          <a class="see-all" href="#/diziler/en-iyi">Tümü →</a>
        </div>
        <div class="row">${(topShows.results || []).map((item) => cardHTML(item, 'tv')).join('')}</div>
      </section>`;
    document.title = 'FilmKatalog — Film ve Dizi Kataloğu';
  } catch (error) {
    if (token !== renderToken) return;
    showError(error);
  }
}

function castSection(cast, type) {
  const people = (cast || []).slice(0, 12);
  if (!people.length) return '';
  return `
    <section class="detail-section">
      <h2>Oyuncular</h2>
      <div class="cast-row">
        ${people.map((person) => {
          const character = type === 'tv'
            ? (person.roles?.[0]?.character || '')
            : (person.character || '');
          const portrait = person.profile_path
            ? `<img src="${image(person.profile_path, 'w185')}" alt="${esc(person.name)}" loading="lazy">`
            : '<div class="cast-placeholder">?</div>';
          return `<div class="cast-card">${portrait}<strong>${esc(person.name)}</strong><span>${esc(character)}</span></div>`;
        }).join('')}
      </div>
    </section>`;
}

function providersSection(providerData) {
  if (!providerData) return '';
  const groups = [
    { key: 'flatrate', label: 'Abonelik' },
    { key: 'rent', label: 'Kiralama' },
    { key: 'buy', label: 'Satın Alma' },
  ];
  const rows = groups.map((group) => {
    const list = (providerData[group.key] || []).filter((provider) => provider.logo_path);
    if (!list.length) return '';
    return `<div class="providers-row"><span class="providers-label">${group.label}</span><div class="providers-logos">${list.map((provider) => `<img src="${image(provider.logo_path, 'w92')}" alt="${esc(provider.provider_name)}" title="${esc(provider.provider_name)}" loading="lazy">`).join('')}</div></div>`;
  }).join('');
  if (!rows) return '';
  return `
    <section class="detail-section">
      <h2>Nerede İzlenir?</h2>
      <div class="providers">${rows}</div>
      <div class="provider-note">Veriler JustWatch tarafından sağlanmaktadır.${providerData.link ? ` <a class="section-link" href="${esc(providerData.link)}" target="_blank" rel="noopener">Tüm seçenekler →</a>` : ''}</div>
    </section>`;
}

function reviewsSection(reviews, type, id) {
  const items = (reviews?.results || []).slice(0, 4);
  const link = `https://www.themoviedb.org/${type === 'tv' ? 'tv' : 'movie'}/${id}/reviews`;
  const cards = items.map((review) => {
    const rating = review.author_details?.rating ? `★ ${review.author_details.rating}/10` : '';
    const created = review.created_at ? new Date(review.created_at) : null;
    const dateValue = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString('tr-TR') : '';
    const raw = stripHtml(review.content);
    const text = raw.length > 700 ? `${raw.slice(0, 700)}…` : raw;
    return `<article class="review">
      <div class="review-head"><strong>${esc(review.author)}</strong><span>${rating}${rating && dateValue ? ' · ' : ''}${dateValue}</span></div>
      <p>${esc(text)}</p>
      <a class="review-link" href="${esc(review.url || link)}" target="_blank" rel="noopener">TMDB'de oku →</a>
    </article>`;
  }).join('');
  return `
    <section class="detail-section">
      <div class="section-head">
        <h2>Yorumlar</h2>
        <a class="see-all" href="${link}" target="_blank" rel="noopener">TMDB'de tümü →</a>
      </div>
      ${cards || '<div class="empty">Bu yapım için henüz yorum yok.</div>'}
    </section>`;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function loadReviews(type, id) {
  const path = type === 'tv' ? `/tv/${id}/reviews` : `/movie/${id}/reviews`;
  const tr = await safeTmdb(path, { language: 'tr-TR' });
  if (tr?.results?.length) return tr;
  return safeTmdb(path, { language: 'en-US' });
}

function similarSection(items, type) {
  const list = (items || []).slice(0, 12);
  if (!list.length) return '';
  return `
    <section class="detail-section">
      <h2>Benzer ${type === 'tv' ? 'Diziler' : 'Filmler'}</h2>
      <div class="row detail-row">${list.map((item) => cardHTML(item, type)).join('')}</div>
    </section>`;
}

function detailSaveButton(item, type) {
  const title = item.title || item.name || 'İsimsiz';
  const itemYear = year(item.release_date || item.first_air_date);
  const scoreValue = score(item.vote_average);
  const saved = isSaved(type, item.id);
  return `<button class="btn btn-ghost detail-save${saved ? ' saved' : ''}" type="button" data-type="${type}" data-id="${item.id}" data-title="${esc(title)}" data-poster="${esc(item.poster_path || '')}" data-year="${esc(itemYear)}" data-score="${scoreValue === '—' ? '0' : scoreValue}" aria-pressed="${saved}">${HEART_SVG}<span class="detail-save-label">${saved ? 'Listemde' : 'Listeme Ekle'}</span></button>`;
}

async function renderMovie(id, token) {
  app.innerHTML = '<div class="loader">Yükleniyor…</div>';
  try {
    const [data, credits, recommendations, reviews, providers] = await Promise.all([
      tmdb('/movie/' + id),
      safeTmdb(`/movie/${id}/credits`),
      safeTmdb(`/movie/${id}/recommendations`),
      loadReviews('movie', id),
      safeTmdb(`/movie/${id}/watch/providers`),
    ]);
    if (token !== renderToken) return;

    const title = data.title || data.original_title || 'İsimsiz';
    const genres = (data.genres || []).map((genre) => `<span class="genre">${esc(genre.name)}</span>`).join('');
    const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}s ${data.runtime % 60}dk` : '';
    const director = (credits?.crew || []).find((person) => person.job === 'Director');

    app.innerHTML = `
      <article class="detail">
        <div class="detail-hero">
          ${data.backdrop_path ? `<img class="detail-hero-bg" src="${image(data.backdrop_path, 'w1280')}" alt="" aria-hidden="true">` : ''}
          <div class="detail-head">
            <div class="detail-poster">
              <img src="${poster(data.poster_path)}" alt="${esc(title)}" loading="lazy">
            </div>
            <div class="detail-info">
              <h1>${esc(title)}</h1>
              <div class="meta">
                <span>${year(data.release_date)}</span>
                ${runtime ? `<span>${runtime}</span>` : ''}
                <span class="score">★ ${score(data.vote_average)}</span>
                ${data.vote_count ? `<span>${formatCount(data.vote_count)} oy</span>` : ''}
                ${director ? `<span>Yönetmen: ${esc(director.name)}</span>` : ''}
              </div>
              ${genres ? `<div class="genres">${genres}</div>` : ''}
              <p class="overview">${esc(data.overview) || 'Özet bulunamadı.'}</p>
              <div class="detail-actions">
                <button class="btn btn-primary" type="button" data-trailer-type="movie" data-trailer-id="${data.id}" data-trailer-title="${esc(title)}">Fragman</button>
                ${detailSaveButton(data, 'movie')}
                <a class="btn btn-ghost" href="https://www.themoviedb.org/movie/${data.id}" target="_blank" rel="noopener">TMDB</a>
              </div>
            </div>
          </div>
        </div>
        <div class="player">
          <iframe id="player" src="${buildEmbed(0, 'movie', data.id)}" title="${esc(title)}" allowfullscreen referrerpolicy="origin" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
        </div>
        <div class="servers" id="servers">${serverButtons(0)}</div>
        ${castSection(credits?.cast, 'movie')}
        ${providersSection(providers?.results?.TR)}
        ${reviewsSection(reviews, 'movie', data.id)}
        ${similarSection(recommendations?.results, 'movie')}
      </article>`;
    bindServers('movie', data.id, 1, 1);
    document.title = `${title} — FilmKatalog`;
  } catch (error) {
    if (token !== renderToken) return;
    showError(error);
  }
}

async function renderTv(id, season, episode, token) {
  app.innerHTML = '<div class="loader">Yükleniyor…</div>';
  try {
    const [data, seasonData, credits, recommendations, reviews, providers] = await Promise.all([
      tmdb('/tv/' + id),
      tmdb(`/tv/${id}/season/${season}`),
      safeTmdb(`/tv/${id}/aggregate_credits`),
      safeTmdb(`/tv/${id}/recommendations`),
      loadReviews('tv', id),
      safeTmdb(`/tv/${id}/watch/providers`),
    ]);
    if (token !== renderToken) return;

    const title = data.name || data.original_name || 'İsimsiz';
    const genres = (data.genres || []).map((genre) => `<span class="genre">${esc(genre.name)}</span>`).join('');
    const episodes = seasonData.episodes || [];
    const current = episodes.find((ep) => ep.episode_number === episode);
    const runtime = current && current.runtime
      ? `${current.runtime}dk`
      : (data.episode_run_time && data.episode_run_time[0] ? `${data.episode_run_time[0]}dk` : '');
    const seasons = (data.seasons || []).filter((s) => s.season_number > 0);

    const seasonButtonHtml = seasons.map((s) => {
      const active = s.season_number === season ? ' active' : '';
      return `<a class="season-btn${active}" href="#/dizi/${data.id}/${s.season_number}/1">Sezon ${s.season_number}</a>`;
    }).join('');

    const episodeHtml = episodes.map((ep) => {
      const active = ep.episode_number === episode ? ' active' : '';
      const thumb = ep.still_path ? `<img class="ep-thumb" src="${image(ep.still_path, 'w300')}" alt="Bölüm ${ep.episode_number}" loading="lazy">` : '';
      const time = ep.runtime ? `<span class="ep-time">${ep.runtime}dk</span>` : '';
      return `
        <a class="episode${active}" href="#/dizi/${data.id}/${season}/${ep.episode_number}">
          ${thumb}
          <span class="ep-num">${ep.episode_number}</span>
          <span class="ep-title">${esc(ep.name || 'Bölüm ' + ep.episode_number)}</span>
          ${time}
        </a>`;
    }).join('');

    app.innerHTML = `
      <article class="detail">
        <div class="detail-hero">
          ${data.backdrop_path ? `<img class="detail-hero-bg" src="${image(data.backdrop_path, 'w1280')}" alt="" aria-hidden="true">` : ''}
          <div class="detail-head">
            <div class="detail-poster">
              <img src="${poster(data.poster_path)}" alt="${esc(title)}" loading="lazy">
            </div>
            <div class="detail-info">
              <h1>${esc(title)}</h1>
              <div class="meta">
                <span>${year(data.first_air_date)}</span>
                ${data.number_of_seasons ? `<span>${data.number_of_seasons} sezon</span>` : ''}
                <span>S${season} B${episode}</span>
                ${runtime ? `<span>${runtime}</span>` : ''}
                <span class="score">★ ${score(data.vote_average)}</span>
                ${data.vote_count ? `<span>${formatCount(data.vote_count)} oy</span>` : ''}
              </div>
              ${genres ? `<div class="genres">${genres}</div>` : ''}
              <p class="overview">${esc(data.overview) || 'Özet bulunamadı.'}</p>
              <div class="detail-actions">
                <button class="btn btn-primary" type="button" data-trailer-type="tv" data-trailer-id="${data.id}" data-trailer-title="${esc(title)}">Fragman</button>
                ${detailSaveButton(data, 'tv')}
                <a class="btn btn-ghost" href="https://www.themoviedb.org/tv/${data.id}" target="_blank" rel="noopener">TMDB</a>
              </div>
            </div>
          </div>
        </div>
        <div class="player">
          <iframe id="player" src="${buildEmbed(0, 'tv', data.id, season, episode)}" title="${esc(title)} — S${season} B${episode}" allowfullscreen referrerpolicy="origin" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
        </div>
        <div class="servers" id="servers">${serverButtons(0)}</div>
        <section class="detail-section">
          <h2>Bölümler</h2>
          <div class="seasons">${seasonButtonHtml}</div>
          <div class="episodes">${episodeHtml || '<div class="empty">Bu sezon için bölüm bulunamadı.</div>'}</div>
        </section>
        ${castSection(credits?.cast, 'tv')}
        ${providersSection(providers?.results?.TR)}
        ${reviewsSection(reviews, 'tv', data.id)}
        ${similarSection(recommendations?.results, 'tv')}
      </article>`;
    bindServers('tv', data.id, season, episode);
    document.title = `${title} — S${season} B${episode} — FilmKatalog`;
  } catch (error) {
    if (token !== renderToken) return;
    showError(error);
  }
}

function listTabs(type, activeKey) {
  const source = type === 'movie' ? MOVIE_FILTERS : TV_FILTERS;
  return source.map((item) => ({
    label: item.label,
    href: '#/' + item.key,
    active: item.key === activeKey,
  }));
}

async function renderList(config, key, token) {
  await renderBrowse({
    title: config.title,
    endpoint: config.endpoint,
    params: config.params,
    type: config.type,
    tabs: listTabs(config.type, key),
    token,
  });
}

async function renderBrowse({ title, endpoint, params = {}, type, tabs, token }) {
  app.innerHTML = '<div class="loader">Yükleniyor…</div>';
  try {
    const data = await tmdb(endpoint, { ...params, page: 1 });
    if (token !== renderToken) return;

    const results = data.results || [];
    let page = data.page || 1;
    const totalPages = data.total_pages || 1;
    const tabsHtml = tabs && tabs.length
      ? `<div class="filter-tabs">${tabs.map((tab) => `<a class="filter-tab${tab.active ? ' active' : ''}" href="${tab.href}">${esc(tab.label)}</a>`).join('')}</div>`
      : '';

    app.innerHTML = `
      <section class="search-section">
        <h2>${esc(title)}</h2>
        ${tabsHtml}
        <div class="grid" id="listGrid">${results.map((item) => cardHTML(item, type)).join('')}</div>
        ${results.length ? '' : '<div class="empty">Bu listede içerik bulunamadı.</div>'}
        <div class="more-wrap">${page < totalPages ? '<button class="more-btn" id="moreBtn" type="button">Daha fazla</button>' : ''}</div>
      </section>`;
    document.title = `${title} — FilmKatalog`;

    bindLoadMore({ endpoint, params, page, totalPages, type, token });
  } catch (error) {
    if (token !== renderToken) return;
    showError(error);
  }
}

function bindLoadMore({ endpoint, params, page, totalPages, type, token }) {
  const moreBtn = document.getElementById('moreBtn');
  if (!moreBtn) return;
  moreBtn.addEventListener('click', async () => {
    moreBtn.disabled = true;
    moreBtn.textContent = 'Yükleniyor…';
    try {
      const next = await tmdb(endpoint, { ...params, page: page + 1 });
      if (token !== renderToken) return;
      page = next.page || page + 1;
      const grid = document.getElementById('listGrid');
      if (!grid) return;
      grid.insertAdjacentHTML('beforeend', (next.results || []).map((item) => cardHTML(item, type)).join(''));
      if (page >= (next.total_pages || totalPages)) {
        moreBtn.remove();
      } else {
        moreBtn.disabled = false;
        moreBtn.textContent = 'Daha fazla';
      }
    } catch (error) {
      moreBtn.disabled = false;
      moreBtn.textContent = 'Tekrar dene';
      console.error(error);
    }
  });
}

async function renderGenre(key, type, token) {
  const genre = GENRES.find((item) => item.key === key);
  if (!genre) {
    app.innerHTML = '<div class="empty">Tür bulunamadı.</div>';
    return;
  }
  if (type === 'tv' && !genre.tv) {
    location.replace('#/tur/' + key);
    return;
  }

  const isTv = type === 'tv';
  const tabs = [{ label: 'Filmler', href: `#/tur/${key}`, active: !isTv }];
  if (genre.tv) tabs.push({ label: 'Diziler', href: `#/tur/${key}/diziler`, active: isTv });

  await renderBrowse({
    title: `${genre.name} ${isTv ? 'Dizileri' : 'Filmleri'}`,
    endpoint: isTv ? '/discover/tv' : '/discover/movie',
    params: { with_genres: isTv ? genre.tv : genre.movie, sort_by: 'popularity.desc' },
    type: isTv ? 'tv' : 'movie',
    tabs,
    token,
  });
}

async function renderYear(year, type, token) {
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    app.innerHTML = '<div class="empty">Geçersiz yıl.</div>';
    return;
  }

  const isTv = type === 'tv';
  const tabs = [
    { label: 'Filmler', href: `#/yil/${year}`, active: !isTv },
    { label: 'Diziler', href: `#/yil/${year}/diziler`, active: isTv },
  ];

  await renderBrowse({
    title: `${year} ${isTv ? 'Dizileri' : 'Filmleri'}`,
    endpoint: isTv ? '/discover/tv' : '/discover/movie',
    params: isTv
      ? { first_air_date_year: year, sort_by: 'popularity.desc' }
      : { primary_release_year: year, sort_by: 'popularity.desc' },
    type: isTv ? 'tv' : 'movie',
    tabs,
    token,
  });
}

function renderGenres() {
  app.innerHTML = `
    <section class="search-section">
      <h2>Tüm Türler</h2>
      <div class="genre-grid">
        ${GENRES.map((genre) => `<a class="genre-card" href="#/tur/${genre.key}"><span>${esc(genre.name)}</span><span class="genre-card-arrow">→</span></a>`).join('')}
      </div>
    </section>`;
  document.title = 'Tüm Türler — FilmKatalog';
}

function renderWatchlist() {
  const items = getWatchlist();
  app.innerHTML = `
    <section class="search-section">
      <div class="section-head">
        <h2>Listem <span class="page-count">${items.length} yapım</span></h2>
      </div>
      ${items.length
        ? `<div class="grid">${items.map((item) => cardHTML(item, item.type)).join('')}</div>`
        : `<div class="empty">Listen henüz boş. Film ve dizilerdeki kalp ikonuna basarak ekleyebilirsin. <a class="section-link" href="#/filmler">Filmleri keşfet →</a></div>`}
    </section>`;
  document.title = 'Listem — FilmKatalog';
}

async function openTrailer(type, id, title) {
  const modal = document.getElementById('trailerModal');
  const body = document.getElementById('trailerBody');
  if (!modal || !body) return;
  const requestId = ++trailerRequest;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  body.innerHTML = '<div class="loader">Fragman yükleniyor…</div>';
  try {
    const data = await tmdb(type === 'tv' ? `/tv/${id}/videos` : `/movie/${id}/videos`);
    if (requestId !== trailerRequest || modal.hidden) return;
    const videos = (data.results || []).filter((video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser'));
    const video = videos.find((item) => item.iso_639_1 === 'tr') || videos[0];
    if (!video) {
      body.innerHTML = '<div class="empty">Fragman bulunamadı.</div>';
      return;
    }
    body.innerHTML = `<div class="trailer-frame"><iframe src="https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0" title="${esc(title)} — Fragman" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="origin"></iframe></div>`;
  } catch (error) {
    if (requestId !== trailerRequest || modal.hidden) return;
    body.innerHTML = '<div class="empty">Fragman yüklenemedi.</div>';
  }
}

function closeTrailer() {
  trailerRequest += 1;
  const modal = document.getElementById('trailerModal');
  const body = document.getElementById('trailerBody');
  if (modal) modal.hidden = true;
  if (body) body.innerHTML = '';
  document.body.classList.remove('modal-open');
}

async function runSearch(query, token) {
  if (!query) {
    await route();
    return;
  }
  app.innerHTML = '<div class="loader">Aranıyor…</div>';
  updateNav('');
  try {
    const data = await tmdb('/search/multi', { query, include_adult: false });
    if (token !== renderToken) return;

    const results = (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
    if (!results.length) {
      app.innerHTML = `<div class="empty">"${esc(query)}" için sonuç bulunamadı.</div>`;
      document.title = `"${query}" — FilmKatalog`;
      return;
    }

    app.innerHTML = `
      <section class="search-section">
        <h2>"${esc(query)}" için sonuçlar</h2>
        <div class="grid">${results.map((item) => cardHTML(item, item.media_type)).join('')}</div>
      </section>`;
    document.title = `"${query}" — FilmKatalog`;
  } catch (error) {
    if (token !== renderToken) return;
    showError(error);
  }
}

function parseHash() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

async function route() {
  closeMenu();
  closeTrailer();
  window.scrollTo(0, 0);
  if (searchInput.value) searchInput.value = '';
  const token = ++renderToken;
  const parts = parseHash();

  if (!parts.length) {
    updateNav('home');
    await renderHome(token);
    return;
  }
  if (parts[0] === 'filmler' || parts[0] === 'diziler') {
    const key = parts.join('/');
    const config = LIST_CONFIG[key];
    const activeKey = config ? key : parts[0];
    updateNav(parts[0] === 'filmler' ? 'movies' : 'shows');
    await renderList(config || LIST_CONFIG[parts[0]], activeKey, token);
    return;
  }
  if (parts[0] === 'turler') {
    updateNav('genres');
    renderGenres();
    return;
  }
  if (parts[0] === 'tur' && parts[1]) {
    updateNav('genres');
    await renderGenre(parts[1], parts[2] === 'diziler' ? 'tv' : 'movie', token);
    return;
  }
  if (parts[0] === 'yil' && parts[1]) {
    updateNav('years');
    await renderYear(Number(parts[1]), parts[2] === 'diziler' ? 'tv' : 'movie', token);
    return;
  }
  if (parts[0] === 'listem') {
    updateNav('watchlist');
    renderWatchlist();
    return;
  }
  if (parts[0] === 'film' && parts[1]) {
    updateNav('movies');
    await renderMovie(parts[1], token);
    return;
  }
  if (parts[0] === 'dizi' && parts[1]) {
    updateNav('shows');
    const season = Number(parts[2]) || 1;
    const episode = Number(parts[3]) || 1;
    await renderTv(parts[1], season, episode, token);
    return;
  }
  updateNav('home');
  await renderHome(token);
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const query = searchInput.value.trim();
  searchTimer = setTimeout(() => {
    const token = ++renderToken;
    runSearch(query, token);
  }, 400);
});

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  if (isOpen) {
    closeMenu();
    return;
  }
  closeNavGroups();
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Menüyü kapat');
  mainNav.classList.add('open');
});

mainNav.addEventListener('click', (event) => {
  const toggle = event.target.closest('.nav-toggle');
  if (toggle) {
    const group = toggle.closest('.nav-group');
    const wasOpen = group.classList.contains('open');
    closeNavGroups();
    if (!wasOpen) {
      group.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    return;
  }

  const link = event.target.closest('a');
  if (!link) return;
  closeMenu();
  if (location.hash === link.getAttribute('href')) {
    event.preventDefault();
    route();
  }
});

logo.addEventListener('click', (event) => {
  if (location.hash === logo.getAttribute('href')) {
    event.preventDefault();
    route();
  }
});

document.addEventListener('click', (event) => {
  const saveButton = event.target.closest('.card-save');
  if (saveButton) {
    event.preventDefault();
    const saved = toggleWatchlist({
      type: saveButton.dataset.type,
      id: Number(saveButton.dataset.id),
      title: saveButton.dataset.title,
      poster_path: saveButton.dataset.poster,
      year: saveButton.dataset.year,
      vote_average: Number(saveButton.dataset.score) || 0,
    });
    saveButton.classList.toggle('saved', saved);
    saveButton.setAttribute('aria-pressed', String(saved));
    saveButton.setAttribute('aria-label', saved ? 'Listemden çıkar' : 'Listeme ekle');
    if (location.hash === '#/listem') renderWatchlist();
    return;
  }

  const detailSave = event.target.closest('.detail-save');
  if (detailSave) {
    event.preventDefault();
    const saved = toggleWatchlist({
      type: detailSave.dataset.type,
      id: Number(detailSave.dataset.id),
      title: detailSave.dataset.title,
      poster_path: detailSave.dataset.poster,
      year: detailSave.dataset.year,
      vote_average: Number(detailSave.dataset.score) || 0,
    });
    detailSave.classList.toggle('saved', saved);
    detailSave.setAttribute('aria-pressed', String(saved));
    const label = detailSave.querySelector('.detail-save-label');
    if (label) label.textContent = saved ? 'Listemde' : 'Listeme Ekle';
    return;
  }

  const trailerButton = event.target.closest('[data-trailer-id]');
  if (trailerButton) {
    event.preventDefault();
    openTrailer(trailerButton.dataset.trailerType, trailerButton.dataset.trailerId, trailerButton.dataset.trailerTitle);
    return;
  }

  if (event.target.closest('[data-close-modal]')) {
    closeTrailer();
  }
});

document.addEventListener('click', (event) => {
  if (mainNav.contains(event.target) || menuToggle.contains(event.target)) return;
  closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    closeTrailer();
  }
});

window.addEventListener('hashchange', route);

buildNav();
updateWatchlistCount();
route();
