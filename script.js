// চ্যানেলের তালিকা (ইউটিউব লাইভ বা M3U লিংক বসাতে পারো)
const channels = [
    { name: "🎬 সিনেমা", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", icon: "fas fa-film" },
    { name: "⚽ স্পোর্টস", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", icon: "fas fa-futbol" },
    { name: "🎵 মিউজিক", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", icon: "fas fa-music" },
    { name: "📰 নিউজ", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", icon: "fas fa-newspaper" },
    { name: "🍿 ড্রামা", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", icon: "fas fa-tv" },
    { name: "🌍 ন্যাচার", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", icon: "fas fa-tree" }
];

const video = document.getElementById('myVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const channelListDiv = document.getElementById('channelList');
const liveUsersSpan = document.getElementById('liveUsers');
const totalViewsSpan = document.getElementById('totalViews');

// এলোমেলো ভিউ ও ইউজার দেখানোর ফাংশন (প্রিমিয়াম ফিল)
let totalViews = 8923;
let liveUsers = 128;

function updateStats() {
    // লাইভ ইউজার প্রতি ৮ সেকেন্ডে বাড়ে/কমে
    liveUsers = Math.floor(Math.random() * (210 - 85 + 1) + 85);
    totalViews += Math.floor(Math.random() * 25);
    liveUsersSpan.innerText = liveUsers;
    totalViewsSpan.innerText = totalViews;
}
setInterval(updateStats, 8000);

// চ্যানেল গুলো UI তে দেখানো
channels.forEach((ch, index) => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    card.innerHTML = `<i class="${ch.icon}"></i> ${ch.name}`;
    card.addEventListener('click', () => {
        // স্ট্রিম URL পরিবর্তন
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = ch.url;
            video.load();
            video.play();
        } else {
            alert("এই ব্রাউজার HLS সাপোর্ট করে না। তবে Chrome, Edge ভাল কাজ করে।");
        }
    });
    channelListDiv.appendChild(card);
});

// প্লে/পজ বাটন
playPauseBtn.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

// পরবর্তী চ্যানেল (সিম্পল: র‍্যান্ডম চ্যানেল লোড)
nextBtn.addEventListener('click', () => {
    let randomIndex = Math.floor(Math.random() * channels.length);
    let newSrc = channels[randomIndex].url;
    video.src = newSrc;
    video.load();
    video.play();
});

// ভিডিও স্টেটস অনুযায়ী প্লে বাটন আইকন পরিবর্তন
video.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
});
video.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// প্রাথমিক সোর্স সেট
video.src = channels[0].url;
video.load();