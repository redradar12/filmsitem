const TMDB_KEY = 'TMDB_API_KEY';
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="500" height="750" fill="#1d1d26"/><text x="250" y="375" fill="#63637a" font-family="sans-serif" font-size="30" text-anchor="middle" dominant-baseline="middle">Afiş yok</text></svg>'
);

const SERVERS = [
  { n: 'Sunucu 1', m: 'https://vidsrc.to/embed/movie/{id}', t: 'https://vidsrc.to/embed/tv/{id}/{s}/{e}' },
  { n: 'Sunucu 2', m: 'https://vidsrc.me/embed/movie?tmdb={id}', t: 'https://vidsrc.me/embed/tv?tmdb={id}&season={s}&episode={e}' },
  { n: 'Sunucu 3', m: 'https://embed.su/embed/movie/{id}', t: 'https://embed.su/embed/tv/{id}/{s}/{e}' },
  { n: 'Sunucu 4', m: 'https://www.2embed.cc/embed/{id}', t: 'https://www.2embed.cc/embedtv/{id}&s={s}&e={e}' },
];

const app = document.getElementById('app');
const searchInput = document.getElementById('search');

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
    const [trending, movies, shows] = await Promise.all([
      tmdb('/trending/all/week'),
      tmdb('/movie/popular'),
      tmdb('/tv/popular'),
    ]);
    if (token !== renderToken) return;

    const trend = (trending.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');

    app.innerHTML = `
      <section class="row-section">
        <div class="section-head"><h2>Bu Hafta Trend</h2></div>
        <div class="row">${trend.map((item) => cardHTML(item, item.media_type)).join('')}</div>
      </section>
      <section class="row-section">
        <div class="section-head"><h2>Popüler Filmler</h2></div>
        <div class="row">${(movies.results || []).map((item) => cardHTML(item, 'movie')).join('')}</div>
      </section>
      <section class="row-section">
        <div class="section-head"><h2>Popüler Diziler</h2></div>
        <div class="row">${(shows.results || []).map((item) => cardHTML(item, 'tv')).join('')}</div>
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
          <iframe id="player" src="${buildEmbed(0, 'movie', data.id)}" title="${esc(title)}" allowfullscreen referrerpolicy="origin"></iframe>
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
          <iframe id="player" src="${buildEmbed(0, 'tv', data.id, season, episode)}" title="${esc(title)} — S${season} B${episode}" allowfullscreen referrerpolicy="origin"></iframe>
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

async function runSearch(query, token) {
  if (!query) {
    await route();
    return;
  }
  app.innerHTML = '<div class="loader">Aranıyor…</div>';
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
  const token = ++renderToken;
  const parts = parseHash();

  if (!parts.length) {
    await renderHome(token);
    return;
  }
  if (parts[0] === 'film' && parts[1]) {
    await renderMovie(parts[1], token);
    return;
  }
  if (parts[0] === 'dizi' && parts[1]) {
    const season = Number(parts[2]) || 1;
    const episode = Number(parts[3]) || 1;
    await renderTv(parts[1], season, episode, token);
    return;
  }
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

window.addEventListener('hashchange', route);

route();
