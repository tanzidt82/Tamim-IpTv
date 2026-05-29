// =============== TAMIM TV v2.5 - প্রিমিয়াম বেগুনী থিম ===============

let channels = [];
let currentChannelIndex = 0;
let currentCategory = 'all';
let currentSearchTerm = '';
let isFloating = false;
let originalParent = null;
let floatTimeout = null;
let recentChannels = JSON.parse(localStorage.getItem('recentChannels') || '[]');

let currentPlaylistUrl = 'https://raw.githubusercontent.com/Rakib49/Rakibiptv/refs/heads/main/aynaott.m3u';

// ক্যাটাগরি ম্যাপিং (ঠিক করে দেওয়া)
const categoryMap = {
    'bangla': ['সময়', 'চ্যানেল আই', 'এটিএন', 'এনটিভি', 'বিবিসি বাংলা', 'দীপ্ত', 'বাংলাভিশন', 'ইন্ডিপেন্ডেন্ট', 'বৈশাখী', 'আমার টিভি', 'দেখো', 'বাংলা', 'নিউজ বাংলা'],
    'indian': ['স্টার প্লাস', 'জি বাংলা', 'কালারস', 'সনি', 'এন্ড টিভি', 'ইমাজিন', 'স্টার জলসা', 'কালার্স', 'সনি টিভি', 'জি টিভি', 'ইন্ডিয়ান'],
    'sports': ['স্পোর্টস', 'ক্রিকেট', 'ফুটবল', 'টি স্পোর্টস', 'ইএসপিএন', 'স্টার স্পোর্টস', 'টেন স্পোর্টস', 'স্পোর্টস ২৪', 'স্পোর্টস লাইভ'],
    'international': ['সিএনএন', 'বিবিসি', 'স্কাই নিউজ', 'আল জাজিরা', 'ফ্রান্স ২৪', 'এনবিসি', 'ফক্স', 'সিএনবিসি', 'ইন্টারন্যাশনাল'],
    'entertainment': ['মিউজিক', 'বিনোদন', 'গান', 'সঙ্গীত', 'ডিজে', 'রেডিও', 'এন্টারটেইনমেন্ট', 'মিউজিক ভিডিও'],
    'movies': ['সিনেমা', 'মুভি', 'হলিউড', 'বলিউড', 'ঢালিউড', 'ফিল্ম', 'মুভি চ্যানেল'],
    'news': ['নিউজ', 'সংবাদ', 'বার্তা', 'আপডেট', 'ব্রেকিং', 'টক শো', 'সংবাদ চ্যানেল'],
    'others': ['লাইফস্টাইল', 'ট্রাভেল', 'কিডস', 'ডকুমেন্টরি', 'শিক্ষা', 'স্বাস্থ্য', 'লাইফ']
};

// ডোম এলিমেন্টস
const video = document.getElementById('myVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const floatBtn = document.getElementById('floatBtn');
const closeFloatBtn = document.getElementById('closeFloatBtn');
const channelListDiv = document.getElementById('channelList');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const loading = document.getElementById('loading');
const channelCountSpan = document.getElementById('channelCount');
const channelNameOverlay = document.getElementById('channelNameOverlay');
const playerWrapper = document.getElementById('playerWrapper');
const sidebar = document.getElementById('sidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');

// স্ট্যাটস আপডেট
let totalViewsCount = 8923;
let liveUsersCount = 128;

function updateStats() {
    liveUsersCount = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViewsCount += Math.floor(Math.random() * 25);
    ['liveUsersMini', 'liveUsersHeader', 'liveUsersStat'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = liveUsersCount;
    });
    ['totalViewsMini', 'totalViewsHeader', 'totalViewsStat'].forEach(id => {
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
        { name: "এটিএন বাংলা", url: "https://dhakaiptv.com/live/atnbangla/index.m3u8", logo: "", category: "bangla" },
        { name: "স্টার স্পোর্টস", url: "https://cdn3.wowza.com/1/8HNCWUg5bG9lL2g0/ODBweGJn/hls/live/playlist.m3u8", logo: "", category: "sports" },
        { name: "টি স্পোর্টস", url: "https://dhakaiptv.com/live/tsports/index.m3u8", logo: "", category: "sports" },
        { name: "সিএনএন", url: "https://live.cnn.com/hls/cnn.m3u8", logo: "", category: "international" },
        { name: "ন্যাশনাল জিও", url: "https://edge21.cdn.bg/ngcint/smil:ngcint.smil/playlist.m3u8", logo: "", category: "others" },
        { name: "ডিসকভারি", url: "https://edge21.cdn.bg/discovery/smil:discovery.smil/playlist.m3u8", logo: "", category: "others" },
        { name: "জি বাংলা", url: "https://dhakaiptv.com/live/zeebangla/index.m3u8", logo: "", category: "indian" }
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
        if (ch.logo) card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/30/9b59b6?text=TV'"><span>${ch.name.substring(0, 22)}</span>`;
        else card.innerHTML = `<i class="
