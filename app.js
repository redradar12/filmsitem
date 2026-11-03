const TMDB_KEY = 'ff8e012967d9a83ac14e23c77b267cf0';
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="500" height="750" fill="#1d1d26"/><text x="250" y="375" fill="#63637a" font-family="sans-serif" font-size="30" text-anchor="middle" dominant-baseline="middle">Afiş yok</text></svg>'
);

const SERVERS = [
  { n: 'Sunucu 1', m: 'https://vidlink.pro/movie/{id}', t: 'https://vidlink.pro/tv/{id}/{s}/{e}' },
  { n: 'Sunucu 2', m: 'https://vidsrc.to/embed/movie/{id}', t: 'https://vidsrc.to/embed/tv/{id}/{s}/{e}' },
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

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function poster(path) {
  return path ? IMG + path : PLACEHOLDER;
}

function year(date) {
  return date ? String(date).slice(0, 4) : '—';
}

function score(value) {
  const n = Number(value);
  return n > 0 ? n.toFixed(1) : '—';
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
    </div>`;
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

function cardHTML(item, type) {
  const title = item.title || item.name || 'İsimsiz';
  const date = item.release_date || item.first_air_date;
  const href = type === 'movie' ? `#/film/${item.id}` : `#/dizi/${item.id}/1/1`;
  return `
    <a class="card" href="${href}">
      <img src="${poster(item.poster_path)}" alt="${esc(title)}" loading="lazy">
      <div class="card-info">
        <h3>${esc(title)}</h3>
        <div class="card-meta">
          <span>${esc(year(date))}</span>
          <span class="score">★ ${score(item.vote_average)}</span>
        </div>
      </div>
    </a>`;
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

    app.innerHTML = `
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

async function renderMovie(id, token) {
  app.innerHTML = '<div class="loader">Yükleniyor…</div>';
  try {
    const data = await tmdb('/movie/' + id);
    if (token !== renderToken) return;

    const title = data.title || data.original_title || 'İsimsiz';
    const genres = (data.genres || []).map((genre) => `<span class="genre">${esc(genre.name)}</span>`).join('');
    const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}s ${data.runtime % 60}dk` : '';

    app.innerHTML = `
      <article class="detail">
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
            </div>
            ${genres ? `<div class="genres">${genres}</div>` : ''}
            <p class="overview">${esc(data.overview) || 'Özet bulunamadı.'}</p>
          </div>
        </div>
        <div class="player">
          <iframe id="player" src="${buildEmbed(0, 'movie', data.id)}" title="${esc(title)}" allowfullscreen referrerpolicy="origin" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
        </div>
        <div class="servers" id="servers">${serverButtons(0)}</div>
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
    const [data, seasonData] = await Promise.all([
      tmdb('/tv/' + id),
      tmdb(`/tv/${id}/season/${season}`),
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
      const thumb = ep.still_path ? `<img class="ep-thumb" src="${IMG + ep.still_path}" alt="Bölüm ${ep.episode_number}" loading="lazy">` : '';
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
        <div class="detail-head">
          <div class="detail-poster">
            <img src="${poster(data.poster_path)}" alt="${esc(title)}" loading="lazy">
          </div>
          <div class="detail-info">
            <h1>${esc(title)}</h1>
            <div class="meta">
              <span>${year(data.first_air_date)}</span>
              <span>S${season} B${episode}</span>
              ${runtime ? `<span>${runtime}</span>` : ''}
              <span class="score">★ ${score(data.vote_average)}</span>
            </div>
            ${genres ? `<div class="genres">${genres}</div>` : ''}
            <p class="overview">${esc(data.overview) || 'Özet bulunamadı.'}</p>
          </div>
        </div>
        <div class="player">
          <iframe id="player" src="${buildEmbed(0, 'tv', data.id, season, episode)}" title="${esc(title)} — S${season} B${episode}" allowfullscreen referrerpolicy="origin" allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>
        </div>
        <div class="servers" id="servers">${serverButtons(0)}</div>
        <h2 class="season-title">Bölümler</h2>
        <div class="seasons">${seasonButtonHtml}</div>
        <div class="episodes">${episodeHtml || '<div class="empty">Bu sezon için bölüm bulunamadı.</div>'}</div>
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
  if (mainNav.contains(event.target) || menuToggle.contains(event.target)) return;
  closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

window.addEventListener('hashchange', route);

buildNav();
route();
