// =============== TAMIM TV v3.0 ===============

let channels = [];
let currentChannelIndex = 0;
let currentCategory = 'all';
let currentSearchTerm = '';
let recentChannels = JSON.parse(localStorage.getItem('recentChannels') || '[]');

let currentPlaylistUrl = 'https://raw.githubusercontent.com/Rakib49/Rakibiptv/refs/heads/main/aynaott.m3u';

// ক্যাটাগরি ম্যাপিং
const categoryMap = {
    'bangla': ['সময়', 'চ্যানেল আই', 'এটিএন', 'এনটিভি', 'বিবিসি বাংলা', 'দীপ্ত', 'বাংলাভিশন', 'বৈশাখী', 'আমার টিভি'],
    'indian': ['স্টার প্লাস', 'জি বাংলা', 'কালারস', 'সনি', 'এন্ড টিভি', 'ইমাজিন', 'স্টার জলসা', 'জি টিভি'],
    'sports': ['স্পোর্টস', 'ক্রিকেট', 'ফুটবল', 'টি স্পোর্টস', 'ইএসপিএন', 'স্টার স্পোর্টস'],
    'international': ['সিএনএন', 'বিবিসি', 'স্কাই নিউজ', 'আল জাজিরা', 'এনবিসি', 'ফক্স'],
    'entertainment': ['মিউজিক', 'বিনোদন', 'গান', 'সঙ্গীত', 'ডিজে', 'এন্টারটেইনমেন্ট'],
    'movies': ['সিনেমা', 'মুভি', 'হলিউড', 'বলিউড', 'ঢালিউড', 'ফিল্ম'],
    'news': ['নিউজ', 'সংবাদ', 'বার্তা', 'ব্রেকিং'],
    'others': ['লাইফস্টাইল', 'ট্রাভেল', 'কিডস', 'ডকুমেন্টরি']
};

// ডোম এলিমেন্টস
const video = document.getElementById('myVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBackBtn = document.getElementById('seekBackBtn');
const seekForwardBtn = document.getElementById('seekForwardBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const channelListDiv = document.getElementById('channelList');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const loading = document.getElementById('loading');
const channelCountSpan = document.getElementById('channelCount');
const channelNameOverlay = document.getElementById('channelNameOverlay');
const playerWrapper = document.getElementById('playerWrapper');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

let totalViewsCount = 8923;
let liveUsersCount = 128;

function updateStats() {
    liveUsersCount = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViewsCount += Math.floor(Math.random() * 25);
    const liveEl = document.getElementById('liveUsersStat');
    const viewsEl = document.getElementById('totalViewsStat');
    if (liveEl) liveEl.innerText = liveUsersCount;
    if (viewsEl) viewsEl.innerText = totalViewsCount.toLocaleString();
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
        const totalSpan = document.getElementById('totalChannelsStat');
        const managerSpan = document.getElementById('managerTotalChannels');
        if (totalSpan) totalSpan.innerText = channels.length;
        if (managerSpan) managerSpan.innerText = channels.length;
    } catch(e) { setBackupChannels(); }
    loading.style.display = 'none';
}

function setBackupChannels() {
    channels = [
        { name: "সময় টিভি", url: "https://dhakaiptv.com/live/somoytv/index.m3u8", logo: "", category: "bangla" },
        { name: "চ্যানেল আই", url: "https://dhakaiptv.com/live/channeli/index.m3u8", logo: "", category: "bangla" },
        { name: "বিবিসি বাংলা", url: "https://eventcast.bbcwise.com/bbcbn.ws/bbcbn.smil/playlist.m3u8", logo: "", category: "bangla" },
        { name: "এটিএন বাংলা", url: "https://dhakaiptv.com/live/atnbangla/index.m3u8", logo: "", category: "bangla" },
        { name: "স্টার স্পোর্টস", url: "https://cdn3.wowza.com/1/8HNCWUg5bG9lL2g0/ODBweGJn/hls/live/playlist.m3u8", logo: "", category: "sports" },
        { name: "টি স্পোর্টস", url: "https://dhakaiptv.com/live/tsports/index.m3u8", logo: "", category: "sports" },
        { name: "সিএনএন", url: "https://live.cnn.com/hls/cnn.m3u8", logo: "", category: "international" },
        { name: "জি বাংলা", url: "https://dhakaiptv.com/live/zeebangla/index.m3u8", logo: "", category: "indian" }
    ];
    renderChannels();
    if (channels.length) playChannel(0);
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
        const hls = new Hls({ manifestLoadingTimeOut: 10000 });
        hls.loadSource(ch.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(e=>console.log));
        window.hls = hls;
    } else {
        video.src = ch.url;
        video.play().catch(e=>console.log);
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
            item.onclick = () => { showPage('live'); playChannel(idx); };
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

function seekBack() { video.currentTime = Math.max(0, video.currentTime - 10); }
function seekForward() { video.currentTime = Math.min(video.duration, video.currentTime + 10); }
function toggleFullscreen() {
    if (!document.fullscreenElement) playerWrapper.requestFullscreen().catch(e=>console.log);
    else document.exitFullscreen();
}

let hideTimeout;
function showControls() {
    const controls = document.getElementById('videoControls');
    controls.classList.add('show');
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => controls.classList.remove('show'), 1500);
}
playerWrapper.addEventListener('click', showControls);
playerWrapper.addEventListener('mousemove', showControls);

function setCategory(cat) {
    currentCategory = cat;
    renderChannels();
    document.querySelectorAll('.cat-tab').forEach(btn => {
        if (btn.dataset.cat === cat) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('open');
}

function handleSearch() { currentSearchTerm = searchInput.value; renderChannels(); }
function clearSearchInput() { searchInput.value = ''; currentSearchTerm = ''; renderChannels(); }

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNav) activeNav.classList.add('active');
    if (pageId === 'channels') {
        const container = document.getElementById('channelManagerList');
        if (container) {
            container.innerHTML = '';
            channels.forEach((ch, idx) => {
                const div = document.createElement('div');
                div.className = 'manager-channel-item';
                div.innerHTML = `<span><i class="fas fa-tv"></i> ${ch.name.substring(0, 35)}</span><span style="color:#3b82f6">${ch.category}</span>`;
                div.onclick = () => { showPage('live'); playChannel(idx); };
                container.appendChild(div);
            });
        }
    }
    if (pageId === 'live' && channels.length === 0) loadChannels();
    if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('open');
}

// সেটিংস
document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
    video.volume = e.target.value / 100;
    document.getElementById('volumeValue').innerText = e.target.value + '%';
});
document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
    if (!e.target.checked) document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
});
document.getElementById('glassEffectToggle')?.addEventListener('change', (e) => {
    const cards = document.querySelectorAll('.stat-card, .player-card, .settings-section, .channels-container');
    cards.forEach(c => c.style.backdropFilter = e.target.checked ? 'blur(10px)' : 'none');
});
document.getElementById('updateM3U')?.addEventListener('click', () => {
    const newUrl = document.getElementById('m3uUrl').value;
    if (newUrl) { currentPlaylistUrl = newUrl; loadChannels(); }
});

// ইভেন্ট লিসেনার
playPauseBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextChannel);
prevBtn.addEventListener('click', prevChannel);
seekBackBtn.addEventListener('click', seekBack);
seekForwardBtn.addEventListener('click', seekForward);
fullscreenBtn.addEventListener('click', toggleFullscreen);
searchInput.addEventListener('input', handleSearch);
clearSearch.addEventListener('click', clearSearchInput);
video.addEventListener('play', () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>');
video.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');

document.querySelectorAll('.cat-tab').forEach(btn => {
    btn.addEventListener('click', () => setCategory(btn.dataset.cat));
});
document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', (e) => { e.preventDefault(); showPage(nav.dataset.page); });
});
if (menuToggle) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
}
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

if (typeof Hls !== 'undefined') loadChannels();
else setTimeout(() => { if (typeof Hls !== 'undefined') loadChannels(); else setBackupChannels(); }, 1000);
video.volume = 0.7;
