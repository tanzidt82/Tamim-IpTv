// =============== TAMIM TV - প্রিমিয়াম গ্লাসি আইপিটিভি ===============

let channels = [];
let currentChannelIndex = 0;
let currentCategory = 'all';
let isFloating = false;
let originalParent = null;

// Rakib IPTV এর M3U প্লেলিস্ট লিংক
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
const menuToggle = document.getElementById('menuToggle');
const categoryMenu = document.getElementById('categoryMenu');
const channelNameOverlay = document.getElementById('channelNameOverlay');
const playerWrapper = document.getElementById('playerWrapper');

let totalViews = 8923;
let liveUsers = 128;

// ক্যাটাগরি ডিফাইনেশন
const categoryMap = {
    'bangla': ['সময়', 'চ্যানেল আই', 'এটিএন', 'এনটিভি', 'বিবিসি বাংলা', 'দীপ্ত', 'বাংলাভিশন'],
    'indian': ['স্টার প্লাস', 'জি বাংলা', 'কালারস', 'সনি', 'এন্ড টিভি', 'ইমাজিন'],
    'sports': ['স্পোর্টস', 'ক্রিকেট', 'ফুটবল', 'টি স্পোর্টস', 'ইএসপিএন', 'স্টার স্পোর্টস'],
    'international': ['সিএনএন', 'বিবিসি', 'স্কাই নিউজ', 'আল জাজিরা', 'ফ্রান্স ২৪', 'ডয়েচে ভেলে'],
    'others': ['মিউজিক', 'সিনেমা', 'ডকুমেন্টরি', 'কিডস', 'লাইফস্টাইল', 'ট্রাভেল']
};

// লাইভ কাউন্ট আপডেট
function updateStats() {
    liveUsers = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViews += Math.floor(Math.random() * 25);
    liveUsersSpan.innerText = liveUsers;
    totalViewsSpan.innerText = totalViews;
}
setInterval(updateStats, 8000);

// চ্যানেলের ক্যাটাগরি নির্ধারণ
function getChannelCategory(channelName) {
    const name = channelName.toLowerCase();
    for (let cat of Object.keys(categoryMap)) {
        for (let keyword of categoryMap[cat]) {
            if (name.includes(keyword.toLowerCase())) {
                return cat;
            }
        }
    }
    return 'others';
}

// M3U ফাইল থেকে চ্যানেল লোড
async function loadChannelsFromM3U() {
    try {
        const response = await fetch(playlistUrl);
        const data = await response.text();
        const lines = data.split('\n');
        
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
}

// ব্যাকআপ চ্যানেল
function setBackupChannels() {
    channels = [
        { name: "সময় টিভি", url: "https://dhakaiptv.com/live/somoytv/index.m3u8", logo: "", category: "bangla" },
        { name: "চ্যানেল আই", url: "https://dhakaiptv.com/live/channeli/index.m3u8", logo: "", category: "bangla" },
        { name: "বিবিসি বাংলা", url: "https://eventcast.bbcwise.com/bbcbn.ws/bbcbn.smil/playlist.m3u8", logo: "", category: "bangla" },
        { name: "স্টার স্পোর্টস", url: "https://cdn3.wowza.com/1/8HNCWUg5bG9lL2g0/ODBweGJn/hls/live/playlist.m3u8", logo: "", category: "sports" },
        { name: "সিএনএন", url: "https://live.cnn.com/hls/cnn.m3u8", logo: "", category: "international" },
        { name: "ন্যাশনাল জিও", url: "https://edge21.cdn.bg/ngcint/smil:ngcint.smil/playlist.m3u8", logo: "", category: "others" }
    ];
    renderChannels();
    if (channels.length > 0) playChannel(0);
}

// চ্যানেল রেন্ডার (ক্যাটাগরি অনুযায়ী)
function renderChannels() {
    if (!channelListDiv) return;
    channelListDiv.innerHTML = '';
    
    const filteredChannels = currentCategory === 'all' 
        ? channels 
        : channels.filter(ch => ch.category === currentCategory);
    
    filteredChannels.forEach((ch, idx) => {
        const originalIndex = channels.findIndex(c => c.name === ch.name && c.url === ch.url);
        const card = document.createElement('div');
        card.className = 'channel-card';
        if (originalIndex === currentChannelIndex) card.classList.add('active');
        
        if (ch.logo && ch.logo !== '') {
            card.innerHTML = `<img src="${ch.logo}" loading="lazy"> ${ch.name.substring(0, 18)}`;
        } else {
            card.innerHTML = `<i class="fas fa-tv"></i> ${ch.name.substring(0, 18)}`;
        }
        
        card.addEventListener('click', () => {
            playChannel(originalIndex);
        });
        channelListDiv.appendChild(card);
    });
}

// চ্যানেল প্লে
function playChannel(index) {
    if (!channels[index]) return;
    currentChannelIndex = index;
    const channel = channels[index];
    
    channelNameOverlay.innerText = channel.name;
    
    if (Hls && Hls.isSupported()) {
        if (window.hls) window.hls.destroy();
        const hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log('অটোপ্লে ব্লক'));
        });
        window.hls = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.play().catch(e => console.log('অটোপ্লে ব্লক'));
    } else {
        video.src = channel.url;
        video.play().catch(e => console.log('অটোপ্লে ব্লক'));
    }
    
    renderChannels();
}

// নেক্সট চ্যানেল
function nextChannel() {
    const filteredChannels = currentCategory === 'all' 
        ? channels 
        : channels.filter(ch => ch.category === currentCategory);
    
    const currentFilteredIndex = filteredChannels.findIndex(ch => ch.url === channels[currentChannelIndex].url);
    let nextIndex = currentFilteredIndex + 1;
    if (nextIndex >= filteredChannels.length) nextIndex = 0;
    
    const nextChannelObj = filteredChannels[nextIndex];
    const originalIndex = channels.findIndex(ch => ch.url === nextChannelObj.url);
    playChannel(originalIndex);
}

// প্রিভিয়াস চ্যানেল
function prevChannel() {
    const filteredChannels = currentCategory === 'all' 
        ? channels 
        : channels.filter(ch => ch.category === currentCategory);
    
    const currentFilteredIndex = filteredChannels.findIndex(ch => ch.url === channels[currentChannelIndex].url);
    let prevIndex = currentFilteredIndex - 1;
    if (prevIndex < 0) prevIndex = filteredChannels.length - 1;
    
    const prevChannelObj = filteredChannels[prevIndex];
    const originalIndex = channels.findIndex(ch => ch.url === prevChannelObj.url);
    playChannel(originalIndex);
}

// প্লে/পজ টগল
function togglePlay() {
    if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// ফুলস্ক্রিন টগল
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        playerWrapper.requestFullscreen().catch(err => {
            console.log('ফুলস্ক্রিন error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// ফ্লোটিং ভিডিও টগল
function toggleFloating() {
    if (!isFloating) {
        originalParent = playerWrapper.parentNode;
        const placeholder = document.createElement('div');
        placeholder.id = 'video-placeholder';
        placeholder.style.height = playerWrapper.offsetHeight + 'px';
        originalParent.insertBefore(placeholder, playerWrapper);
        document.body.appendChild(playerWrapper);
        playerWrapper.classList.add('floating-video');
        isFloating = true;
        floatBtn.innerHTML = '<i class="fas fa-window-minimize"></i>';
    } else {
        const placeholder = document.getElementById('video-placeholder');
        if (placeholder) {
            placeholder.parentNode.insertBefore(playerWrapper, placeholder);
            placeholder.remove();
        }
        playerWrapper.classList.remove('floating-video');
        isFloating = false;
        floatBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
    }
}

// ভিডিও কন্ট্রোল টগল (ট্যাপ করলে)
function toggleControls() {
    const controls = document.getElementById('videoControls');
    controls.classList.toggle('show');
}

// ক্যাটাগরি পরিবর্তন
function setCategory(category) {
    currentCategory = category;
    renderChannels();
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.cat === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    categoryMenu.classList.remove('show');
}

// ইভেন্ট লিসেনার
playPauseBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextChannel);
prevBtn.addEventListener('click', prevChannel);
fullscreenBtn.addEventListener('click', toggleFullscreen);
floatBtn.addEventListener('click', toggleFloating);
menuToggle.addEventListener('click', () => categoryMenu.classList.toggle('show'));
playerWrapper.addEventListener('click', toggleControls);
video.addEventListener('play', () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>');
video.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');

// ক্যাটাগরি বাটন তৈরি
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setCategory(btn.dataset.cat);
    });
});

// ক্লিক করলে মেনু বন্ধ
document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !categoryMenu.contains(e.target)) {
        categoryMenu.classList.remove('show');
    }
});

// HLS চেক করে শুরু
if (typeof Hls !== 'undefined') {
    loadChannelsFromM3U();
} else {
    setTimeout(() => {
        if (typeof Hls !== 'undefined') loadChannelsFromM3U();
        else setBackupChannels();
    }, 1000);
                           }
