// Прямая загрузка RSS через прокси-сервис
const SOURCES = [
    { name: "CNN", country: "USA", rss: "http://rss.cnn.com/rss/cnn_topstories.rss" },
    { name: "Fox News", country: "USA", rss: "http://feeds.foxnews.com/foxnews/politics" },
    { name: "Kyiv Independent", country: "Ukraine", rss: "https://kyivindependent.com/feed/" },
    { name: "Reuters", country: "UK", rss: "http://feeds.reuters.com/reuters/topNews" },
    { name: "BBC", country: "UK", rss: "http://feeds.bbci.co.uk/news/rss.xml" }
];

const PROXY = "https://api.allorigins.win/raw?url=";
let allNews = [];

function loadSavedNews() {
    try {
        const saved = localStorage.getItem('newsData');
        if (saved) { allNews = JSON.parse(saved); return true; }
    } catch(e) {}
    return false;
}

function saveNews() {
    try { localStorage.setItem('newsData', JSON.stringify(allNews)); } catch(e) {}
}

async function fetchRSS(url) {
    try {
        const response = await fetch(PROXY + encodeURIComponent(url));
        if (!response.ok) throw new Error('Ошибка загрузки');
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');
        const result = [];
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
            if (title && link) result.push({ title, link, pubDate });
        });
        return result;
    } catch(e) {
        console.error('Ошибка RSS:', url, e);
        return [];
    }
}

function isDuplicate(url) {
    return allNews.some(item => item.url === url);
}

function getFlag(country) {
    const flags = { 'USA': '🇺🇸', 'Ukraine': '🇺🇦', 'UK': '🇬🇧', 'Germany': '🇩🇪' };
    return flags[country] || '🌍';
}

function renderNews() {
    const feed = document.getElementById('news-feed');
    if (allNews.length === 0) {
        feed.innerHTML = '<div class="loader">Новостей пока нет. Обновление...</div>';
        return;
    }
    const sorted = [...allNews].sort((a, b) => new Date(b.published) - new Date(a.published));
    const latest = sorted.slice(0, 50);
    feed.innerHTML = latest.map(item => {
        const title = item.title_ru || item.title_en || 'Без заголовка';
        const badge = item.title_ru ? '' : '<span class="news-badge">EN</span>';
        const titleClass = item.title_ru ? 'news-title' : 'news-title en';
        return `
            <div class="news-item">
                <div class="news-header">
                    <span class="news-flag">${getFlag(item.country)}</span>
                    <span class="news-source">${item.source}</span>
                    <span class="news-country">${item.country}</span>
                </div>
                <a href="${item.url}" target="_blank" rel="noopener" class="${titleClass}">
                    ${title} ${badge}
                </a>
            </div>
        `;
    }).join('');
}

async function updateNews() {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = '<div class="loader">🔄 Загрузка новостей...</div>';
    let newItems = [];
    for (const source of SOURCES) {
        try {
            const items = await fetchRSS(source.rss);
            for (const item of items) {
                if (!isDuplicate(item.link)) {
                    newItems.push({
                        url: item.link,
                        title_en: item.title,
                        title_ru: null,
                        source: source.name,
                        country: source.country,
                        published: item.pubDate || new Date().toISOString()
                    });
                }
            }
        } catch(e) { console.error('Ошибка источника:', source.name); }
    }
    if (newItems.length > 0) {
        allNews = [...newItems, ...allNews];
        saveNews();
        renderNews();
        sendToTelegram(newItems);
    } else {
        if (allNews.length === 0) {
            feed.innerHTML = '<div class="loader">⚠️ Не удалось загрузить новости. Попробуйте позже.</div>';
        } else {
            renderNews();
        }
    }
}

async function sendToTelegram(items) {
    const BOT_TOKEN = "8972375608:AAE4thoN-Im-Zvf8eGywzdj_cRL2HCSXk1M";
    const CHANNEL = "@newspapernewsusa";
    for (const item of items) {
        const flag = getFlag(item.country);
        const msg = `${flag} ${item.source}\n${item.title_en}\n🔗 ${item.url}`;
        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: CHANNEL, text: msg, disable_web_page_preview: true })
            });
        } catch(e) { console.error('Ошибка отправки в Telegram'); }
    }
}

loadSavedNews();
renderNews();
updateNews();
setInterval(updateNews, 30 * 60 * 1000);
