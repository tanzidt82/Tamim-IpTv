// =============== TAMIM TV - ড্যাশবোর্ড ইউআই ভার্সন ===============

let channels = [];
let currentChannelIndex = 0;
let currentCategory = 'all';
let currentSearchTerm = '';
let isFloating = false;
let originalParent = null;
let nextSibling = null;

const playlistUrl = 'https://raw.githubusercontent.com/Rakib49/Rakibiptv/refs/heads/main/aynaott.m3u';

// DOM এলিমেন্টস
const video = document.getElementById('myVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const floatBtn = document.getElementById('floatBtn');
const channelListDiv = document.getElementById('channelList');
const liveUsersSpan = document.getElementById('liveUsers');
const totalViewsSpan = document.getElementById('totalViews');
const liveUsersMini = document.getElementById('liveUsersMini');
const totalViewsMini = document.getElementById('totalViewsMini');
const channelNameOverlay = document.getElementById('channelNameOverlay');
const playerWrapper = document.getElementById('playerWrapper');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const loading = document.getElementById('loading');
const channelCountSpan = document.getElementById('channelCount');

let totalViewsCount = 8923;
let liveUsersCount = 128;

// ক্যাটাগরি ম্যাপিং
const categoryMap = {
    'bangla': ['সময়', 'চ্যানেল আই', 'এটিএন', 'এনটিভি', 'বিবিসি বাংলা', 'দীপ্ত', 'বাংলাভিশন'],
    'indian': ['স্টার প্লাস', 'জি বাংলা', 'কালারস', 'সনি', 'এন্ড টিভি'],
    'sports': ['স্পোর্টস', 'ক্রিকেট', 'ফুটবল', 'টি স্পোর্টস', 'ইএসপিএন'],
    'international': ['সিএনএন', 'বিবিসি', 'স্কাই নিউজ', 'আল জাজিরা'],
    'entertainment': ['মিউজিক', 'বিনোদন', 'গান'],
    'movies': ['সিনেমা', 'মুভি', 'হলিউড'],
    'news': ['নিউজ', 'সংবাদ', 'বার্তা'],
    'others': ['লাইফস্টাইল', 'ট্রাভেল', 'কিডস']
};

function updateStats() {
    liveUsersCount = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViewsCount += Math.floor(Math.random() * 25);
    liveUsersSpan.innerText = liveUsersCount;
    totalViewsSpan.innerText = totalViewsCount;
    if (liveUsersMini) liveUsersMini.innerText = liveUsersCount;
    if (totalViewsMini) totalViewsMini.innerText = (totalViewsCount/1000).toFixed(1) + 'k';
}
setInterval(updateStats, 8000);
updateStats();

function getChannelCategory(channelName) {
    const name = channelName.toLowerCase();
    for (let [cat, keywords] of Object.entries(categoryMap)) {
        for (let keyword of keywords) {
            if (name.includes(keyword.toLowerCase())) return cat;
        }
    }
    return 'others';
}

async function loadChannelsFromM3U() {
    loading.style.display = 'block';
    try {
        const response = await fetch(playlistUrl);
        const data = await response.text();
        const lines = data.split('\n');
        channels = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
                const info = lines[i];
                const url = lines[i + 1];
                let channelName = info.split(',')[1] || 'নাম জানা নেই';
                let logo = '';
                const logoMatch = info.match(/tvg-logo="(.*?)"/);
                if (logoMatch) logo = logoMatch[1];
                if (url && url.startsWith('http')) {
                    channels.push({
                        name: channelName.trim(),
                        url: url,
                        logo: logo,
                        category: getChannelCategory(channelName)
                    });
                }
                i++;
            }
        }
        console.log('মোট চ্যানেল:', channels.length);
        renderChannels();
        if (channels.length > 0) playChannel(0);
    } catch (error) {
        console.error('M3U লোড ব্যর্থ:', error);
        setBackupChannels();
    }
    loading.style.display = 'none';
}

function setBackupChannels() {
    channels = [
        { name: "সময় টিভি", url: "https://dhakaiptv.com/live/somoytv/index.m3u8", logo: "", category: "bangla" },
        { name: "চ্যানেল আই", url: "https://dhakaiptv.com/live/channeli/index.m3u8", logo: "", category: "bangla" },
        { name: "বিবিসি বাংলা", url: "https://eventcast.bbcwise.com/bbcbn.ws/bbcbn.smil/playlist.m3u8", logo: "", category: "bangla" },
        { name: "স্টার স্পোর্টস", url: "https://cdn3.wowza.com/1/8HNCWUg5bG9lL2g0/ODBweGJn/hls/live/playlist.m3u8", logo: "", category: "sports" },
        { name: "সিএনএন", url: "https://live.cnn.com/hls/cnn.m3u8", logo: "", category: "international" }
    ];
    renderChannels();
    if (channels.length > 0) playChannel(0);
}

function renderChannels() {
    if (!channelListDiv) return;
    channelListDiv.innerHTML = '';
    let filtered = channels;
    if (currentCategory !== 'all') filtered = filtered.filter(ch => ch.category === currentCategory);
    if (currentSearchTerm.trim() !== '') {
        const s = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(ch => ch.name.toLowerCase().includes(s));
    }
    if (channelCountSpan) channelCountSpan.innerText = filtered.length + ' channels';
    if (filtered.length === 0) {
        channelListDiv.innerHTML = '<div class="no-results"><i class="fas fa-search"></i> No channels found</div>';
        return;
    }
    filtered.forEach((ch, idx) => {
        const originalIndex = channels.findIndex(c => c.name === ch.name && c.url === ch.url);
        const card = document.createElement('div');
        card.className = 'channel-card';
        if (originalIndex === currentChannelIndex) card.classList.add('active');
        if (ch.logo && ch.logo !== '') {
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/35/3b82f6?text=TV'"><span>${ch.name.substring(0, 22)}</span>`;
        } else {
            card.innerHTML = `<i class="fas fa-tv"></i><span>${ch.name.substring(0, 22)}</span>`;
        }
        card.addEventListener('click', () => playChannel(originalIndex));
        channelListDiv.appendChild(card);
    });
}

function playChannel(index) {
    if (!channels[index]) return;
    currentChannelIndex = index;
    const channel = channels[index];
    channelNameOverlay.innerText = channel.name;
    if (window.hls) window.hls.destroy();
    if (Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(e=>console.log));
        window.hls = hls;
    } else {
        video.src = channel.url;
        video.play().catch(e=>console.log);
    }
    renderChannels();
}

function nextChannel() {
    let filtered = channels;
    if (currentCategory !== 'all') filtered = filtered.filter(ch => ch.category === currentCategory);
    if (currentSearchTerm.trim() !== '') {
        const s = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(ch => ch.name.toLowerCase().includes(s));
    }
    if (filtered.length === 0) return;
    const curIdx = filtered.findIndex(ch => ch.url === channels[currentChannelIndex]?.url);
    let next = curIdx + 1;
    if (next >= filtered.length) next = 0;
    const originalIndex = channels.findIndex(ch => ch.url === filtered[next].url);
    playChannel(originalIndex);
}

function prevChannel() {
    let filtered = channels;
    if (currentCategory !== 'all') filtered = filtered.filter(ch => ch.category === currentCategory);
    if (currentSearchTerm.trim() !== '') {
        const s = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(ch => ch.name.toLowerCase().includes(s));
    }
    if (filtered.length === 0) return;
    const curIdx = filtered.findIndex(ch => ch.url === channels[currentChannelIndex]?.url);
    let prev = curIdx - 1;
    if (prev < 0) prev = filtered.length - 1;
    const originalIndex = channels.findIndex(ch => ch.url === filtered[prev].url);
    playChannel(originalIndex);
}

function togglePlay() {
    if (video.paused) { video.play(); playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
    else { video.pause(); playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) playerWrapper.requestFullscreen().catch(e=>console.log);
    else document.exitFullscreen();
}

let dragData = { active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };
function toggleFloating() {
    if (!isFloating) {
        originalParent = playerWrapper.parentNode;
        nextSibling = playerWrapper.nextSibling;
        document.body.appendChild(playerWrapper);
        playerWrapper.classList.add('floating-video');
        playerWrapper.style.position = 'fixed';
        playerWrapper.style.bottom = '20px';
        playerWrapper.style.right = '20px';
        playerWrapper.style.left = 'auto';
        playerWrapper.style.top = 'auto';
        isFloating = true;
        floatBtn.innerHTML = '<i class="fas fa-window-minimize"></i>';
        playerWrapper.addEventListener('mousedown', startDrag);
        playerWrapper.addEventListener('touchstart', startDrag);
    } else {
        if (originalParent) {
            if (nextSibling) originalParent.insertBefore(playerWrapper, nextSibling);
            else originalParent.appendChild(playerWrapper);
        }
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
    dragData.active = true;
    const touch = e.touches ? e.touches[0] : e;
    dragData.startX = touch.clientX - playerWrapper.offsetLeft;
    dragData.startY = touch.clientY - playerWrapper.offsetTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', stopDrag);
}
function onDrag(e) {
    if (!dragData.active) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    let left = touch.clientX - dragData.startX;
    let top = touch.clientY - dragData.startY;
    left = Math.max(0, Math.min(window.innerWidth - playerWrapper.offsetWidth, left));
    top = Math.max(0, Math.min(window.innerHeight - playerWrapper.offsetHeight, top));
    playerWrapper.style.left = left + 'px';
    playerWrapper.style.top = top + 'px';
    playerWrapper.style.right = 'auto';
    playerWrapper.style.bottom = 'auto';
}
function stopDrag() {
    dragData.active = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}
function setCategory(category) {
    currentCategory = category;
    renderChannels();
    document.querySelectorAll('.cat-tab').forEach(btn => {
        if (btn.dataset.cat === category) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}
function handleSearch() { currentSearchTerm = searchInput.value; renderChannels(); }
function clearSearchInput() { searchInput.value = ''; currentSearchTerm = ''; renderChannels(); }
function toggleControls() { document.getElementById('videoControls').classList.toggle('show'); }

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
document.querySelectorAll('.cat-tab').forEach(btn => {
    btn.addEventListener('click', () => setCategory(btn.dataset.cat));
});

if (typeof Hls !== 'undefined') loadChannelsFromM3U();
else setTimeout(() => { if (typeof Hls !== 'undefined') loadChannelsFromM3U(); else setBackupChannels(); }, 1000);
