let currentType = 'music';
let currentTrack = null;
let isPlaying = false;
let searchTimeout = null;
let playlist = JSON.parse(localStorage.getItem('ss-playlist') || '[]');

const audio = document.getElementById('audio-player');

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');

  const navBtn = document.getElementById('nav-' + name);
  if (navBtn) navBtn.classList.add('active');

  if (name === 'playlist') renderPlaylist();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setType(type, btn) {
  currentType = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

document.getElementById('search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(doSearch, 600);
});

async function doSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) return;

  const container = document.getElementById('results-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Buscando...</span></div>';

  const entityMap = { music: 'song', album: 'album', artist: 'musicArtist' };
  const entity = entityMap[currentType];

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=30&country=BR&media=music`;
    const resp = await fetch(url);
    const data = await resp.json();

    let results = data.results || [];

    if (!document.getElementById('explicit-check').checked) {
      results = results.filter(r =>
        r.trackExplicitness !== 'explicit' &&
        r.collectionExplicitness !== 'explicit'
      );
    }

    renderResults(results);
  } catch {
    container.innerHTML = '<div class="empty-state"><div class="big">⚠️</div><p>Erro ao buscar. Verifique sua conexão.</p></div>';
  }
}

function renderResults(results) {
  const container = document.getElementById('results-container');

  if (!results.length) {
    container.innerHTML = '<div class="empty-state"><span class="big">🔍</span><p>Nenhum resultado encontrado.</p></div>';
    return;
  }

  const countHtml = `
    <div class="results-header">
      <h2>Resultados</h2>
      <span class="results-count">${results.length} encontrados</span>
    </div>`;

  const cardsHtml = results.map(item => {
    const artUrl = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '300x300') : null;
    const title = item.trackName || item.collectionName || item.artistName || 'Desconhecido';
    const artist = item.artistName || '';
    const genre = item.primaryGenreName || '';
    const itemId = item.trackId || item.collectionId || item.artistId;
    const hasPreview = !!item.previewUrl;
    const isSaved = playlist.some(p => p.id === itemId);
    const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');

    return `
      <div class="card" onclick="showDetail(${itemJson})">
        <div class="card-img-wrap">
          ${artUrl
            ? `<img class="card-img" src="${artUrl}" alt="${title}" loading="lazy">`
            : `<div class="card-img-placeholder">🎵</div>`}
        </div>
        <div class="card-body">
          <div class="card-title" title="${title}">${title}</div>
          <div class="card-subtitle">${artist}</div>
          ${genre ? `<div class="card-genre">${genre}</div>` : ''}
          <div class="card-actions" onclick="event.stopPropagation()">
            ${hasPreview
              ? `<button class="btn-play" id="play-btn-${itemId}" onclick="playTrack(${itemJson})">▶ Play</button>`
              : `<button class="btn-play" style="background:var(--surface-2);color:var(--text-3);cursor:default;">Sem preview</button>`}
            <button class="btn-save ${isSaved ? 'saved' : ''}" id="save-btn-${itemId}"
              onclick="toggleSave(${itemJson})">
              ${isSaved ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = countHtml + `<div class="results-grid">${cardsHtml}</div>`;
}

function showDetail(item) {
  const artUrl = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : null;
  const title = item.trackName || item.collectionName || item.artistName || 'Desconhecido';
  const artist = item.artistName || '';
  const album = item.collectionName || '—';
  const genre = item.primaryGenreName || '—';
  const duration = item.trackTimeMillis ? msToTime(item.trackTimeMillis) : '—';

  const price = item.trackPrice
    ? `R$ ${item.trackPrice.toFixed(2).replace('.', ',')}`
    : item.collectionPrice
      ? `R$ ${item.collectionPrice.toFixed(2).replace('.', ',')}`
      : 'Gratuito';

  const type = item.wrapperType === 'artist'
    ? 'Artista'
    : item.kind === 'song'
      ? 'Música'
      : 'Álbum';

  const itemId = item.trackId || item.collectionId || item.artistId;
  const isSaved = playlist.some(p => p.id === itemId);
  const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-layout">
      <div>
        ${artUrl
          ? `<img class="detail-art" src="${artUrl}" alt="${title}">`
          : `<div class="detail-art-placeholder">🎵</div>`}
      </div>
      <div class="detail-info">
        <div class="detail-type">${type}</div>
        <h1 class="detail-title">${title}</h1>
        <div class="detail-artist">${artist}</div>
        <div class="detail-meta">
          <div class="meta-item"><label>Álbum</label><value>${album}</value></div>
          <div class="meta-item"><label>Gênero</label><value>${genre}</value></div>
          <div class="meta-item"><label>Duração</label><value>${duration}</value></div>
          <div class="meta-item"><label>Preço</label><value>${price}</value></div>
        </div>
        <div class="detail-actions">
          ${item.previewUrl
            ? `<button class="btn-primary" id="detail-play-btn" onclick="playTrack(${itemJson})">▶ Ouvir Preview</button>`
            : `<button class="btn-primary" style="background:var(--surface-2);color:var(--text-3);cursor:default;">Sem preview</button>`}
          <button class="btn-secondary ${isSaved ? 'active' : ''}" id="detail-save-btn"
            onclick="toggleSave(${itemJson})">
            ${isSaved ? '✓ Salvo' : '+ Salvar na Playlist'}
          </button>
        </div>
      </div>
    </div>`;

  showPage('detail');
}

function playTrack(item) {
  if (!item.previewUrl) return;

  if (currentTrack && currentTrack.previewUrl === item.previewUrl && isPlaying) {
    audio.pause();
    isPlaying = false;
    document.getElementById('mini-play-btn').textContent = '▶';
    return;
  }

  currentTrack = item;
  audio.src = item.previewUrl;
  audio.play().catch(() => {});
  isPlaying = true;

  const title = item.trackName || item.collectionName || item.artistName;

  document.getElementById('player-title').textContent = title;
  document.getElementById('player-artist').textContent = item.artistName || '';
  document.getElementById('player-art').src = item.artworkUrl100 || '';
  document.getElementById('mini-play-btn').textContent = '⏸';

  document.getElementById('mini-player').classList.add('visible');
  document.body.classList.add('player-open');

  showToast('▶ ' + title);
}

function togglePlay() {
  if (!currentTrack) return;

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    document.getElementById('mini-play-btn').textContent = '▶';
  } else {
    audio.play().catch(() => {});
    isPlaying = true;
    document.getElementById('mini-play-btn').textContent = '⏸';
  }
}

function closePlayer() {
  audio.pause();
  audio.src = '';
  isPlaying = false;
  currentTrack = null;

  document.getElementById('mini-player').classList.remove('visible');
  document.body.classList.remove('player-open');
}

function seekAudio(e) {
  if (!currentTrack || !audio.duration) return;

  const bar = document.getElementById('progress-bar');
  const rect = bar.getBoundingClientRect();

  const ratio = Math.max(
    0,
    Math.min(1, (e.clientX - rect.left) / rect.width)
  );

  audio.currentTime = ratio * audio.duration;
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;

  document.getElementById('progress-fill').style.width =
    (audio.currentTime / audio.duration * 100) + '%';

  document.getElementById('player-current').textContent =
    formatTime(audio.currentTime);

  document.getElementById('player-duration').textContent =
    formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  isPlaying = false;
  document.getElementById('mini-play-btn').textContent = '▶';
  document.getElementById('progress-fill').style.width = '0%';
});

function toggleSave(item) {
  const id = item.trackId || item.collectionId || item.artistId;
  const idx = playlist.findIndex(p => p.id === id);

  if (idx >= 0) {
    playlist.splice(idx, 1);
    showToast('Removido da playlist');
  } else {
    playlist.push({ id, item, suggestRadio: false });
    showToast('✓ Salvo na playlist!');
  }

  localStorage.setItem('ss-playlist', JSON.stringify(playlist));
  updateBadge();
  updateSaveButtons(id, idx < 0);
}

function updateSaveButtons(id, saved) {
  const cardBtn = document.getElementById('save-btn-' + id);

  if (cardBtn) {
    cardBtn.className = 'btn-save ' + (saved ? 'saved' : '');
    cardBtn.textContent = saved ? '✓' : '+';
  }

  const detailBtn = document.getElementById('detail-save-btn');

  if (detailBtn) {
    detailBtn.className = 'btn-secondary ' + (saved ? 'active' : '');
    detailBtn.textContent = saved
      ? '✓ Salvo'
      : '+ Salvar na Playlist';
  }
}

function updateBadge() {
  const badge = document.getElementById('playlist-badge');

  badge.style.display = playlist.length > 0 ? 'inline' : 'none';
  badge.textContent = playlist.length;
}

function toggleSuggest(id) {
  const entry = playlist.find(p => p.id === id);
  if (!entry) return;

  entry.suggestRadio = !entry.suggestRadio;

  localStorage.setItem('ss-playlist', JSON.stringify(playlist));

  const btn = document.getElementById('suggest-' + id);

  if (btn) {
    btn.className =
      'suggest-toggle ' + (entry.suggestRadio ? 'on' : '');

    btn.textContent = entry.suggestRadio
      ? '📻 Sugerido'
      : '📻 Sugerir';
  }

  if (entry.suggestRadio) {
    showToast('📻 Sugerido para a rádio!');
  }
}

function removeFromPlaylist(id) {
  playlist = playlist.filter(p => p.id !== id);

  localStorage.setItem('ss-playlist', JSON.stringify(playlist));

  updateBadge();
  renderPlaylist();

  showToast('Removido da playlist');
}

function renderPlaylist() {
  const container = document.getElementById('playlist-content');

  document.getElementById('playlist-count').textContent =
    playlist.length +
    (playlist.length === 1
      ? ' música salva'
      : ' músicas salvas');

  if (!playlist.length) {
    container.innerHTML = `
      <div class="playlist-empty">
        <span class="empty-icon">🎵</span>
        <p>Sua playlist está vazia.<br>Busque músicas e salve suas favoritas.</p>
        <button class="btn-primary" onclick="showPage('search')" style="margin:0 auto;">
          Buscar músicas
        </button>
      </div>`;
    return;
  }

  container.innerHTML = playlist.map(({ item, id, suggestRadio }) => {
    const title =
      item.trackName ||
      item.collectionName ||
      item.artistName ||
      '—';

    const artist = item.artistName || '';
    const genre = item.primaryGenreName || '';

    const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');

    return `
      <div class="playlist-item">
        <img class="playlist-art" src="${item.artworkUrl100 || ''}" alt="${title}" onerror="this.style.display='none'">

        <div class="playlist-info">
          <div class="playlist-title">${title}</div>
          <div class="playlist-artist">${artist}</div>
          ${genre ? `<div class="playlist-genre">${genre}</div>` : ''}
        </div>

        <div class="playlist-item-actions">
          ${item.previewUrl
            ? `<button class="btn-icon" onclick="playTrack(${itemJson})">▶</button>`
            : ''}

          <button class="suggest-toggle ${suggestRadio ? 'on' : ''}" id="suggest-${id}"
            onclick="toggleSuggest(${id})">
            📻 ${suggestRadio ? 'Sugerido' : 'Sugerir'}
          </button>

          <button class="btn-icon remove" onclick="removeFromPlaylist(${id})">
            ✕
          </button>
        </div>
      </div>`;
  }).join('');
}

function submitContactForm() {
  const fields = [
    {
      id: 'f-nome',
      errId: 'err-nome',
      check: v => v.trim().length >= 2
    },
    {
      id: 'f-sobrenome',
      errId: 'err-sobrenome',
      check: v => v.trim().length >= 2
    },
    {
      id: 'f-email',
      errId: 'err-email',
      check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    },
    {
      id: 'f-assunto',
      errId: 'err-assunto',
      check: v => v !== ''
    },
    {
      id: 'f-mensagem',
      errId: 'err-mensagem',
      check: v => v.trim().length >= 10
    }
  ];

  let valid = true;

  fields.forEach(({ id, errId, check }) => {
    const el = document.getElementById(id);
    const err = document.getElementById(errId);

    const ok = check(el.value);

    el.classList.toggle('error', !ok);
    el.classList.toggle('success', ok);

    err.classList.toggle('visible', !ok);

    if (!ok) valid = false;
  });

  const termos = document.getElementById('f-termos');
  const errTermos = document.getElementById('err-termos');

  const termosOk = termos.checked;

  errTermos.classList.toggle('visible', !termosOk);

  if (!termosOk) valid = false;

  if (!valid) {
    showToast(' Preencha todos os campos corretamente.');
    return;
  }

  const btn = document.querySelector('.btn-submit');

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  setTimeout(() => {
    document.getElementById('contact-form-wrap').style.display = 'none';

    document.getElementById('form-success').classList.add('visible');

    showToast('✅ Mensagem enviada com sucesso!');
  }, 1000);
}

function resetContactForm() {
  ['f-nome', 'f-sobrenome', 'f-email', 'f-mensagem'].forEach(id => {
    const el = document.getElementById(id);

    el.value = '';
    el.classList.remove('error', 'success');
  });

  document.getElementById('f-assunto').value = '';
  document.getElementById('f-assunto').classList.remove('error', 'success');

  document.getElementById('f-termos').checked = false;

  document.querySelectorAll('.field-error').forEach(e => {
    e.classList.remove('visible');
  });

  const btn = document.querySelector('.btn-submit');

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Enviar mensagem ✉️';
  }

  document.getElementById('contact-form-wrap').style.display = 'block';

  document.getElementById('form-success').classList.remove('visible');
}

document.addEventListener('DOMContentLoaded', () => {
  ['f-nome', 'f-sobrenome', 'f-email', 'f-assunto', 'f-mensagem']
    .forEach(id => {
      const el = document.getElementById(id);

      if (!el) return;

      el.addEventListener('input', () => {
        el.classList.remove('error');

        document
          .getElementById('err-' + id.replace('f-', ''))
          .classList.remove('visible');
      });
    });
});

function msToTime(ms) {
  const s = Math.floor(ms / 1000);

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatTime(secs) {
  return `${Math.floor(secs / 60)}:${String(
    Math.floor(secs % 60)
  ).padStart(2, '0')}`;
}

function showToast(msg) {
  const t = document.getElementById('toast');

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 2500);
}

updateBadge();