// =============== TAMIM TV v2.1 - সম্পূর্ণ ফাংশনাল ===============

let channels = [];
let currentChannelIndex = 0;
let currentCategory = 'all';
let currentSearchTerm = '';
let isFloating = false;
let originalParent = null;
let recentChannels = JSON.parse(localStorage.getItem('recentChannels') || '[]');

const playlistUrlInput = document.getElementById('m3uUrl');
let currentPlaylistUrl = 'https://raw.githubusercontent.com/Rakib49/Rakibiptv/refs/heads/main/aynaott.m3u';

// ক্যাটাগরি ম্যাপিং
const categoryMap = {
    'bangla': ['সময়', 'চ্যানেল আই', 'এটিএন', 'এনটিভি', 'বিবিসি বাংলা', 'দীপ্ত', 'বাংলাভিশন', 'ইন্ডিপেন্ডেন্ট', 'বৈশাখী', 'আমার টিভি', 'দেখো'],
    'indian': ['স্টার প্লাস', 'জি বাংলা', 'কালারস', 'সনি', 'এন্ড টিভি', 'ইমাজিন', 'স্টার জলসা', 'কালার্স', 'সনি টিভি', 'জি টিভি'],
    'sports': ['স্পোর্টস', 'ক্রিকেট', 'ফুটবল', 'টি স্পোর্টস', 'ইএসপিএন', 'স্টার স্পোর্টস', 'টেন স্পোর্টস', 'স্পোর্টস ২৪'],
    'international': ['সিএনএন', 'বিবিসি', 'স্কাই নিউজ', 'আল জাজিরা', 'ফ্রান্স ২৪', 'এনবিসি', 'ফক্স', 'সিএনবিসি'],
    'entertainment': ['মিউজিক', 'বিনোদন', 'গান', 'সঙ্গীত', 'ডিজে', 'রেডিও', 'এন্টারটেইনমেন্ট'],
    'movies': ['সিনেমা', 'মুভি', 'হলিউড', 'বলিউড', 'ঢালিউড', 'ফিল্ম'],
    'news': ['নিউজ', 'সংবাদ', 'বার্তা', 'আপডেট', 'ব্রেকিং', 'টক শো'],
    'others': ['লাইফস্টাইল', 'ট্রাভেল', 'কিডস', 'ডকুমেন্টরি', 'শিক্ষা', 'স্বাস্থ্য']
};

// ডোম এলিমেন্টস
const video = document.getElementById('myVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const floatBtn = document.getElementById('floatBtn');
const channelListDiv = document.getElementById('channelList');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const loading = document.getElementById('loading');
const channelCountSpan = document.getElementById('channelCount');
const channelNameOverlay = document.getElementById('channelNameOverlay');
const playerWrapper = document.getElementById('playerWrapper');

// স্ট্যাটস এলিমেন্টস
const liveUsersSpans = ['liveUsersMini', 'liveUsersHeader', 'liveUsersStat'];
const totalViewsSpans = ['totalViewsMini', 'totalViewsHeader', 'totalViewsStat'];

let totalViewsCount = 8923;
let liveUsersCount = 128;

function updateStats() {
    liveUsersCount = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViewsCount += Math.floor(Math.random() * 25);
    liveUsersSpans.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = liveUsersCount;
    });
    totalViewsSpans.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = totalViewsCount.toLocaleString();
    });
}
setInterval(updateStats, 8000);
updateStats();

function getChannelCategory(name) {
    const lower = name.toLowerCase();
    for (let [cat, keywords] of Object.entries(categoryMap)) {
        for (let kw of keywords) {
            if (lower.includes(kw.toLowerCase())) return cat;
        }
    }
    return 'others';
}

async function loadChannels() {
    loading.style.display = 'block';
    try {
        const resp = await fetch(currentPlaylistUrl);
        const data = await resp.text();
        const lines = data.split('\n');
        channels = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
                const url = lines[i + 1];
                let name = lines[i].split(',')[1] || 'Unknown';
                let logo = '';
                const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
                if (logoMatch) logo = logoMatch[1];
                if (url && url.startsWith('http')) {
                    channels.push({ name: name.trim(), url, logo, category: getChannelCategory(name) });
                }
                i++;
            }
        }
        if (channels.length === 0) setBackupChannels();
        renderChannels();
        if (channels.length) playChannel(0);
        document.getElementById('totalChannelsStat').innerText = channels.length;
        document.getElementById('managerTotalChannels').innerText = channels.length;
    } catch(e) { setBackupChannels(); }
    loading.style.display = 'none';
}

function setBackupChannels() {
    channels = [
        { name: "সময় টিভি", url: "https://dhakaiptv.com/live/somoytv/index.m3u8", logo: "", category: "bangla" },
        { name: "চ্যানেল আই", url: "https://dhakaiptv.com/live/channeli/index.m3u8", logo: "", category: "bangla" },
        { name: "বিবিসি বাংলা", url: "https://eventcast.bbcwise.com/bbcbn.ws/bbcbn.smil/playlist.m3u8", logo: "", category: "bangla" },
        { name: "স্টার স্পোর্টস", url: "https://cdn3.wowza.com/1/8HNCWUg5bG9lL2g0/ODBweGJn/hls/live/playlist.m3u8", logo: "", category: "sports" },
        { name: "টি স্পোর্টস", url: "https://dhakaiptv.com/live/tsports/index.m3u8", logo: "", category: "sports" },
        { name: "সিএনএন", url: "https://live.cnn.com/hls/cnn.m3u8", logo: "", category: "international" },
        { name: "ন্যাশনাল জিও", url: "https://edge21.cdn.bg/ngcint/smil:ngcint.smil/playlist.m3u8", logo: "", category: "others" },
        { name: "ডিসকভারি", url: "https://edge21.cdn.bg/discovery/smil:discovery.smil/playlist.m3u8", logo: "", category: "others" }
    ];
    renderChannels();
    if (channels.length) playChannel(0);
    document.getElementById('totalChannelsStat').innerText = channels.length;
}

function renderChannels() {
    if (!channelListDiv) return;
    let filtered = channels;
    if (currentCategory !== 'all') filtered = filtered.filter(ch => ch.category === currentCategory);
    if (currentSearchTerm.trim()) {
        const s = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(ch => ch.name.toLowerCase().includes(s));
    }
    channelCountSpan.innerText = filtered.length + ' channels';
    if (filtered.length === 0) {
        channelListDiv.innerHTML = '<div class="no-results"><i class="fas fa-search"></i> No channels found</div>';
        return;
    }
    channelListDiv.innerHTML = '';
    filtered.forEach(ch => {
        const origIdx = channels.findIndex(c => c.name === ch.name && c.url === ch.url);
        const card = document.createElement('div');
        card.className = 'channel-card';
        if (origIdx === currentChannelIndex) card.classList.add('active');
        if (ch.logo) card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/30/3b82f6?text=TV'"><span>${ch.name.substring(0, 22)}</span>`;
        else card.innerHTML = `<i class="fas fa-tv"></i><span>${ch.name.substring(0, 22)}</span>`;
        card.onclick = () => playChannel(origIdx);
        channelListDiv.appendChild(card);
    });
}

function playChannel(index) {
    if (!channels[index]) return;
    currentChannelIndex = index;
    const ch = channels[index];
    channelNameOverlay.innerText = ch.name;
    if (window.hls) window.hls.destroy();
    if (Hls && Hls.isSupported()) {
        const hls = new Hls({ manifestLoadingTimeOut: 10000, manifestLoadingMaxRetry: 3 });
        hls.loadSource(ch.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (document.getElementById('autoPlayToggle')?.checked) video.play().catch(e=>console.log);
        });
        window.hls = hls;
    } else {
        video.src = ch.url;
        if (document.getElementById('autoPlayToggle')?.checked) video.play().catch(e=>console.log);
    }
    renderChannels();
    updateRecentChannels(ch.name);
    renderRecentList();
}

function updateRecentChannels(chName) {
    recentChannels = recentChannels.filter(n => n !== chName);
    recentChannels.unshift(chName);
    if (recentChannels.length > 5) recentChannels.pop();
    localStorage.setItem('recentChannels', JSON.stringify(recentChannels));
}

function renderRecentList() {
    const container = document.getElementById('recentList');
    if (!container) return;
    container.innerHTML = '';
    recentChannels.forEach(name => {
        const ch = channels.find(c => c.name === name);
        if (ch) {
            const idx = channels.findIndex(c => c.name === name);
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.innerText = name.length > 20 ? name.substring(0, 18) + '..' : name;
            item.onclick = () => playChannel(idx);
            container.appendChild(item);
        }
    });
}

function nextChannel() {
    let filtered = channels;
    if (currentCategory !== 'all') filtered = filtered.filter(ch => ch.category === currentCategory);
    if (currentSearchTerm.trim()) filtered = filtered.filter(ch => ch.name.toLowerCase().includes(currentSearchTerm.toLowerCase()));
    if (filtered.length === 0) return;
    const curIdx = filtered.findIndex(ch => ch.url === channels[currentChannelIndex]?.url);
    let next = curIdx + 1;
    if (next >= filtered.length) next = 0;
    playChannel(channels.findIndex(ch => ch.url === filtered[next].url));
}

function prevChannel() {
    let filtered = channels;
    if (currentCategory !== 'all') filtered = filtered.filter(ch => ch.category === currentCategory);
    if (currentSearchTerm.trim()) filtered = filtered.filter(ch => ch.name.toLowerCase().includes(currentSearchTerm.toLowerCase()));
    if (filtered.length === 0) return;
    const curIdx = filtered.findIndex(ch => ch.url === channels[currentChannelIndex]?.url);
    let prev = curIdx - 1;
    if (prev < 0) prev = filtered.length - 1;
    playChannel(channels.findIndex(ch => ch.url === filtered[prev].url));
}

function togglePlay() {
    if (video.paused) { video.play(); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    else { video.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) playerWrapper.requestFullscreen().catch(e=>console.log);
    else document.exitFullscreen();
}

let drag = { active: false, startX: 0, startY: 0, left: 0, top: 0 };
function toggleFloating() {
    if (!isFloating) {
        originalParent = playerWrapper.parentNode;
        document.body.appendChild(playerWrapper);
        playerWrapper.classList.add('floating-video');
        playerWrapper.style.position = 'fixed';
        playerWrapper.style.bottom = '20px';
        playerWrapper.style.right = '20px';
        isFloating = true;
        floatBtn.innerHTML = '<i class="fas fa-window-minimize"></i>';
        playerWrapper.addEventListener('mousedown', startDrag);
        playerWrapper.addEventListener('touchstart', startDrag);
    } else {
        if (originalParent) originalParent.appendChild(playerWrapper);
        playerWrapper.classList.remove('floating-video');
        playerWrapper.style.position = '';
        isFloating = false;
        floatBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
        playerWrapper.removeEventListener('mousedown', startDrag);
        playerWrapper.removeEventListener('touchstart', startDrag);
    }
}
function startDrag(e) {
    if (!isFloating) return;
    drag.active = true;
    const touch = e.touches ? e.touches[0] : e;
    drag.startX = touch.clientX - playerWrapper.offsetLeft;
    drag.startY = touch.clientY - playerWrapper.offsetTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', stopDrag);
}
function onDrag(e) {
    if (!drag.active) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    let left = touch.clientX - drag.startX;
    let top = touch.clientY - drag.startY;
    left = Math.max(0, Math.min(window.innerWidth - playerWrapper.offsetWidth, left));
    top = Math.max(0, Math.min(window.innerHeight - playerWrapper.offsetHeight, top));
    playerWrapper.style.left = left + 'px';
    playerWrapper.style.top = top + 'px';
    playerWrapper.style.right = 'auto';
    playerWrapper.style.bottom = 'auto';
}
function stopDrag() {
    drag.active = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

function setCategory(cat) {
    currentCategory = cat;
    renderChannels();
    document.querySelectorAll('.cat-tab').forEach(btn => {
        if (btn.dataset.cat === cat) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function handleSearch() { currentSearchTerm = searchInput.value; renderChannels(); }
function clearSearchInput() { searchInput.value = ''; currentSearchTerm = ''; renderChannels(); }
function toggleControls() { document.getElementById('videoControls').classList.toggle('show'); }

// পেজ নেভিগেশন
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${pageId}"]`).classList.add('active');
    if (pageId === 'channels') renderChannelManager();
    if (pageId === 'live' && channels.length === 0) loadChannels();
}

function renderChannelManager() {
    const container = document.getElementById('channelManagerList');
    if (!container) return;
    container.innerHTML = '';
    channels.forEach((ch, idx) => {
        const div = document.createElement('div');
        div.className = 'manager-channel-item';
        div.innerHTML = `<span><i class="fas fa-tv"></i> ${ch.name.substring(0, 30)}</span><span style="color:#3b82f6">${ch.category}</span>`;
        div.onclick = () => { showPage('live'); playChannel(idx); };
        container.appendChild(div);
    });
}

// সেটিংস ফাংশন
document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
    video.volume = e.target.value / 100;
    document.getElementById('volumeValue').innerText = e.target.value + '%';
});
document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
    if (!e.target.checked) document.body.style.background = '#f0f2f5';
    else document.body.style.background = '#0a0c12';
});
document.getElementById('glassEffectToggle')?.addEventListener('change', (e) => {
    const cards = document.querySelectorAll('.glass-card, .stat-card, .player-card, .settings-section, .channels-grid-container');
    cards.forEach(c => c.style.backdropFilter = e.target.checked ? 'blur(12px)' : 'none');
});
document.getElementById('updateM3U')?.addEventListener('click', () => {
    currentPlaylistUrl = document.getElementById('m3uUrl').value;
    loadChannels();
});
document.getElementById('autoPlayToggle')?.addEventListener('change', (e) => {
    if (e.target.checked && video.paused && channels.length) video.play().catch(e=>console.log);
});

// ইভেন্ট লিসেনার
playPauseBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextChannel);
prevBtn.addEventListener('click', prevChannel);
fullscreenBtn.addEventListener('click', toggleFullscreen);
floatBtn.addEventListener('click', toggleFloating);
playerWrapper.addEventListener('click', toggleControls);
searchInput.addEventListener('input', handleSearch);
clearSearch.addEventListener('click', clearSearchInput);
video.addEventListener('play', () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>');
video.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');
document.querySelectorAll('.cat-tab').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.cat)));
document.querySelectorAll('.nav-item').forEach(nav => nav.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(nav.dataset.page);
}));
document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// স্টার্ট
if (typeof Hls !== 'undefined') loadChannels();
else setTimeout(() => { if (typeof Hls !== 'undefined') loadChannels(); else setBackupChannels(); }, 1000);
video.volume = 0.7;
