// Minimal IndexedDB helper
const DB_NAME = 'CattyBoardDB', STORE = 'tracks', DB_VERSION = 1;
let db;
function openDb(){ return new Promise((res,rej)=>{ const r = indexedDB.open(DB_NAME, DB_VERSION); r.onupgradeneeded = ()=> r.result.createObjectStore(STORE, { keyPath:'id', autoIncrement:true }); r.onsuccess = ()=>{ db = r.result; res(db); }; r.onerror = ()=> rej(r.error); }); }
function addTrack(track){ return new Promise((res,rej)=>{ const tx = db.transaction(STORE,'readwrite'); const store = tx.objectStore(STORE); const r = store.add(track); r.onsuccess = ()=> res(r.result); r.onerror = ()=> rej(r.error); }); }
function getAllTracks(){ return new Promise((res,rej)=>{ const tx = db.transaction(STORE,'readonly'); const store = tx.objectStore(STORE); const r = store.getAll(); r.onsuccess = ()=> res(r.result); r.onerror = ()=> rej(r.error); }); }

// Helpers
function fileToDataURL(file){ return new Promise(res=>{ const fr = new FileReader(); fr.onload = ()=> res(fr.result); fr.readAsDataURL(file); }); }
function fmt(s){ if (!s && s!==0) return '--:--'; s = Math.floor(s); const m = Math.floor(s/60); const sec = s%60; return `${m}:${sec.toString().padStart(2,'0')}`; }

// UI refs
const tracksBody = document.getElementById('tracksBody');
const heroCover = document.getElementById('heroCover');
const heroTitle = document.getElementById('heroTitle');
const heroPlay = document.getElementById('heroPlay');
const openAdd = document.getElementById('openAdd');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const addForm = document.getElementById('addForm');
const audio = document.getElementById('audio');
const playPause = document.getElementById('playPause');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seek = document.getElementById('seek');
const curTime = document.getElementById('curTime');
const durTime = document.getElementById('durTime');
const playerThumb = document.getElementById('playerThumb');
const playerSong = document.getElementById('playerSong');
const playerArtistText = document.getElementById('playerArtistText');
const volEl = document.getElementById('vol');
const muteEl = document.getElementById('mute');
const heroActions = document.getElementById('heroPlay');

let tracks = [];
let currentIndex = -1;

// modal handlers
openAdd.addEventListener('click', ()=> modal.classList.remove('hidden'));
closeModal && closeModal.addEventListener('click', ()=> modal.classList.add('hidden'));

addForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const title = document.getElementById('fTitle').value || 'Untitled';
  const artist = document.getElementById('fArtist').value || '';
  const album = document.getElementById('fAlbum').value || '';
  const cov = document.getElementById('fCover').files[0];
  const aud = document.getElementById('fAudio').files[0];
  if (!aud) return alert('Select audio');
  const coverData = cov ? await fileToDataURL(cov) : '';
  const audioData = await fileToDataURL(aud);
  const t = { title, artist, album, coverData, audioData, created: Date.now() };
  await addTrack(t);
  modal.classList.add('hidden'); addForm.reset();
  await loadTracks();
});

function renderTracks(){
  tracksBody.innerHTML = '';
  tracks.forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.dataset.index = i;
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <img src="${t.coverData||'images/album.jpg'}" class="track-thumb" alt="thumb">
          <div>
            <div style="font-weight:600">${escapeHtml(t.title)}</div>
            <div style="color:#7d8b95;font-size:13px">${escapeHtml(t.artist)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(t.album||'')}</td>
      <td>you</td>
      <td>${new Date(t.created).toLocaleDateString()}</td>
      <td>${t.duration||'--:--'}</td>
    `;
    tr.addEventListener('dblclick', ()=> playTrackAt(i));
    tracksBody.appendChild(tr);
  });
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

async function loadTracks(){
  tracks = await getAllTracks();
  // measure durations if missing
  for (let t of tracks){ if (!t.duration){ t.duration = await measureDuration(t.audioData); const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(t); } }
  renderTracks();
  if (tracks.length){ heroCover.src = tracks[0].coverData || 'images/album.jpg'; heroTitle.textContent = tracks[0].title || 'Playlist'; }
}

function measureDuration(dataUrl){ return new Promise(res=>{ const a = new Audio(); a.src = dataUrl; a.addEventListener('loadedmetadata', ()=> res(fmt(a.duration))); setTimeout(()=>{ if (!a.duration) res('--:--'); },1500); }); }

function playTrackAt(idx){ if (!tracks[idx]) return; currentIndex = idx; const t = tracks[idx]; audio.src = t.audioData; playerThumb.src = t.coverData || 'images/album.jpg'; playerSong.textContent = t.title; playerArtistText.textContent = t.artist; audio.play(); updatePlayingRow(); }

function updatePlayingRow(){ Array.from(tracksBody.querySelectorAll('tr')).forEach(tr=> tr.classList.remove('playing')); const row = tracksBody.querySelector(`tr[data-index="${currentIndex}"]`); if (row) row.classList.add('playing'); }

// playback controls
playPause.addEventListener('click', ()=>{ if (!audio.src && tracks.length) playTrackAt(0); else if (audio.paused) audio.play(); else audio.pause(); });
prevBtn.addEventListener('click', ()=>{ if (currentIndex>0) playTrackAt(currentIndex-1); });
nextBtn.addEventListener('click', ()=>{ if (currentIndex+1 < tracks.length) playTrackAt(currentIndex+1); });

audio.addEventListener('timeupdate', ()=>{ if (audio.duration){ seek.value = (audio.currentTime / audio.duration)*100; curTime.textContent = fmt(audio.currentTime); durTime.textContent = fmt(audio.duration); } });
seek.addEventListener('input', ()=>{ if (!audio.duration) return; audio.currentTime = (seek.value/100)*audio.duration; });

audio.addEventListener('play', ()=>{ playPause.textContent = '⏸'; heroPlay.textContent = '⏸'; });
audio.addEventListener('pause', ()=>{ playPause.textContent = '▶'; heroPlay.textContent = '▶'; });

// initialize volume
const saved = localStorage.getItem('cb_vol');
if (saved !== null) { audio.volume = parseFloat(saved); if (volEl) volEl.value = saved; }
else { audio.volume = 1; }

volEl && volEl.addEventListener('input', ()=>{
  audio.volume = parseFloat(volEl.value);
  localStorage.setItem('cb_vol', volEl.value);
  if (audio.volume === 0) muteEl.textContent = '🔇'; else muteEl.textContent = '🔊';
});

muteEl && muteEl.addEventListener('click', ()=>{
  audio.muted = !audio.muted;
  muteEl.textContent = audio.muted ? '🔇' : '🔊';
});

// ensure UI reflects audio muted state on load
if (audio.muted) muteEl.textContent = '🔇'; else muteEl.textContent = '🔊';

// hero play binds to play first track or resume
heroPlay.addEventListener('click', ()=>{ if (!audio.src && tracks.length) playTrackAt(0); else if (audio.paused) audio.play(); else audio.pause(); });

async function seedDemoTracks(){
  // check if DB already has tracks
  const existing = await getAllTracks();
  if (existing && existing.length) return;
  console.log('Seeding demo tracks...');
  const demo = [
    {
      title: 'SoundHelix Song 1', artist: 'SoundHelix', album: 'Samples',
      coverData: 'https://picsum.photos/seed/1/400/400',
      audioData: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      created: Date.now(),
    },
    {
      title: 'SoundHelix Song 2', artist: 'SoundHelix', album: 'Samples',
      coverData: 'https://picsum.photos/seed/2/400/400',
      audioData: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      created: Date.now(),
    },
    {
      title: 'SoundHelix Song 3', artist: 'SoundHelix', album: 'Samples',
      coverData: 'https://picsum.photos/seed/3/400/400',
      audioData: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      created: Date.now(),
    },
    {
      title: 'SoundHelix Song 4', artist: 'SoundHelix', album: 'Samples',
      coverData: 'https://picsum.photos/seed/4/400/400',
      audioData: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      created: Date.now(),
    },
    {
      title: 'SoundHelix Song 5', artist: 'SoundHelix', album: 'Samples',
      coverData: 'https://picsum.photos/seed/5/400/400',
      audioData: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      created: Date.now(),
    }
  ];
  for (let t of demo){
    try{ await addTrack(t); }catch(e){ console.warn('Failed to add demo track', e); }
  }
}

async function init(){ await openDb(); await seedDemoTracks(); await loadTracks(); const sv = localStorage.getItem('cb_vol'); if (sv) { vol.value = sv; audio.volume = parseFloat(sv); } }
init();

// Expose a small console helper
window.CattyBoard = { dbName: DB_NAME };
