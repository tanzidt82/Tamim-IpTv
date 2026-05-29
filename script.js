// =============== Rakib IPTV এর সব চ্যানেল Tamim TV তে ===============
let channels = [];
let currentChannelIndex = 0;

// Rakib এর M3U প্লেলিস্ট লিংক
const playlistUrl = 'https://raw.githubusercontent.com/Rakib49/Rakibiptv/refs/heads/main/aynaott.m3u';

// HLS লাইব্রেরি চেক
const video = document.getElementById('myVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const channelListDiv = document.getElementById('channelList');
const liveUsersSpan = document.getElementById('liveUsers');
const totalViewsSpan = document.getElementById('totalViews');

let totalViews = 8923;
let liveUsers = 128;

// লাইভ কাউন্ট আপডেট
function updateStats() {
    liveUsers = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViews += Math.floor(Math.random() * 25);
    liveUsersSpan.innerText = liveUsers;
    totalViewsSpan.innerText = totalViews;
}
setInterval(updateStats, 8000);

// M3U ফাইল থেকে চ্যানেল লোড করা
async function loadChannelsFromM3U() {
    try {
        const response = await fetch(playlistUrl);
        const data = await response.text();
        const lines = data.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
                // চ্যানেলের নাম ও লোগো বের করা
                const info = lines[i];
                const url = lines[i + 1];
                let channelName = info.split(',')[1] || 'নাম জানা নেই';
                let logo = '';
                
                // tvg-logo বের করা (যদি থাকে)
                const logoMatch = info.match(/tvg-logo="(.*?)"/);
                if (logoMatch) {
                    logo = logoMatch[1];
                }
                
                // URL যদি ঠিক থাকে তাহলে যোগ করো
                if (url && url.startsWith('http')) {
                    channels.push({
                        name: channelName,
                        url: url,
                        logo: logo
                    });
                }
                i++; // URL লাইন স্কিপ করার জন্য
            }
        }
        
        console.log('মোট চ্যানেল পেয়েছি:', channels.length);
        renderChannels();
        
        if (channels.length > 0) {
            playChannel(0);
        }
        
    } catch (error) {
        console.error('M3U লোড করতে সমস্যা:', error);
        // ব্যাকআপ চ্যানেল (যদি M3U না চলে)
        setBackupChannels();
    }
}

// ব্যাকআপ চ্যানেল (M3U না কাজ করলে)
function setBackupChannels() {
    channels = [
        { name: "📺 BTV জাতীয়", url: "https://tvsen6.aynaott.com/btvnat/index.m3u8", logo: "" },
        { name: "📡 BTV চট্টগ্রাম", url: "https://tvsen6.aynaott.com/btvctg/index.m3u8", logo: "" },
        { name: "🎬 সময় টিভি", url: "https://dhakaiptv.com/live/somoytv/index.m3u8", logo: "" },
        { name: "📰 বিবিসি বাংলা", url: "https://eventcast.bbcwise.com/bbcbn.ws/bbcbn.smil/playlist.m3u8", logo: "" },
        { name: "⚽ স্পোর্টস", url: "https://cdn3.wowza.com/1/8HNCWUg5bG9lL2g0/ODBweGJn/hls/live/playlist.m3u8", logo: "" }
    ];
    renderChannels();
    if (channels.length > 0) playChannel(0);
}

// চ্যানেল গুলো UI তে দেখানো
function renderChannels() {
    if (!channelListDiv) return;
    channelListDiv.innerHTML = '';
    
    channels.forEach((ch, index) => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        
        // লোগো দেখানো (যদি থাকে)
        if (ch.logo && ch.logo !== '') {
            card.innerHTML = `<img src="${ch.logo}" style="width:40px;height:40px;border-radius:10px;display:block;margin:0 auto 8px;"> ${ch.name.substring(0, 20)}`;
        } else {
            card.innerHTML = `<i class="fas fa-tv"></i> ${ch.name.substring(0, 20)}`;
        }
        
        card.addEventListener('click', () => {
            playChannel(index);
        });
        channelListDiv.appendChild(card);
    });
}

// চ্যানেল প্লে করা
function playChannel(index) {
    if (!channels[index]) return;
    currentChannelIndex = index;
    const channelUrl = channels[index].url;
    
    if (Hls && Hls.isSupported()) {
        if (window.hls) {
            window.hls.destroy();
        }
        const hls = new Hls();
        hls.loadSource(channelUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log('অটোপ্লে ব্লক'));
        });
        window.hls = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channelUrl;
        video.play().catch(e => console.log('অটোপ্লে ব্লক'));
    } else {
        video.src = channelUrl;
        video.play().catch(e => console.log('অটোপ্লে ব্লক'));
    }
    
    // অ্যাক্টিভ স্টাইল
    document.querySelectorAll('.channel-card').forEach((card, i) => {
        if (i === index) {
            card.style.border = '2px solid cyan';
            card.style.boxShadow = '0 0 15px cyan';
        } else {
            card.style.border = '1px solid rgba(255,255,255,0.15)';
            card.style.boxShadow = 'none';
        }
    });
    
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

// পরবর্তী চ্যানেল
function nextChannel() {
    let nextIndex = currentChannelIndex + 1;
    if (nextIndex >= channels.length) nextIndex = 0;
    playChannel(nextIndex);
}

// আগের চ্যানেল
function prevChannel() {
    let prevIndex = currentChannelIndex - 1;
    if (prevIndex < 0) prevIndex = channels.length - 1;
    playChannel(prevIndex);
}

// প্লে/পজ টগল
playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

nextBtn.addEventListener('click', nextChannel);

video.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
});
video.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// HLS লাইব্রেরি চেক করে শুরু করা
if (typeof Hls !== 'undefined') {
    loadChannelsFromM3U();
} else {
    console.log('HLS লাইব্রেরি লোড হচ্ছে...');
    setTimeout(() => {
        if (typeof Hls !== 'undefined') {
            loadChannelsFromM3U();
        } else {
            setBackupChannels();
        }
    }, 1000);
                    }
