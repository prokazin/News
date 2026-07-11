// Прямая загрузка RSS через прокси-сервис
const SOURCES = [
    { name: "CNN", country: "USA", rss: "http://rss.cnn.com/rss/cnn_topstories.rss" },
    { name: "Fox News", country: "USA", rss: "http://feeds.foxnews.com/foxnews/politics" },
    { name: "Kyiv Independent", country: "Ukraine", rss: "https://kyivindependent.com/feed/" },
    { name: "Reuters", country: "UK", rss: "http://feeds.reuters.com/reuters/topNews" },
    { name: "BBC", country: "UK", rss: "http://feeds.bbci.co.uk/news/rss.xml" }
];

// КЛЮЧЕВЫЕ СЛОВА ДЛЯ ФИЛЬТРА (только военно-политические новости о войне)
const KEYWORDS = [
    "ukraine", "russia", "putin", "zelensky", "kyiv", "moscow",
    "war", "military", "army", "troops", "soldiers", "defense", "defence",
    "weapons", "missile", "drone", "tank", "artillery", "ammunition",
    "sanctions", "aid", "support", "supplies", "delivery",
    "attack", "strike", "bomb", "shelling", "offensive", "counteroffensive",
    "nato", "eu", "european", "alliance", "diplomacy", "negotiations",
    "crimea", "donbas", "donetsk", "luhansk", "kharkiv", "odesa", "dnipro"
];

const PROXY = "https://corsproxy.io/?";
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

// Функция проверки релевантности новости
function isRelevant(title) {
    const lowerTitle = title.toLowerCase();
    for (const keyword of KEYWORDS) {
        if (lowerTitle.includes(keyword.toLowerCase())) {
            return true;
        }
    }
    return false;
}

function isDuplicate(url) {
    return allNews.some(item => item.url === url);
}

function getFlag(country) {
    const flags = { 'USA': '🇺🇸', 'Ukraine': '🇺🇦', 'UK': '🇬🇧', 'Germany': '🇩🇪' };
    return flags[country] || '🌍';
}

// Функция перевода через бесплатный API
async function translateText(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data[0]) {
            return data[0][0][0];
        }
        return null;
    } catch(e) {
        console.error('Ошибка перевода:', e);
        return null;
    }
}

function renderNews() {
    const feed = document.getElementById('news-feed');
    if (allNews.length === 0) {
        feed.innerHTML = '<div class="loader">Новостей пока нет. Обновление...</div>';
        updateCounter();
        return;
    }
    const sorted = [...allNews].sort((a, b) => new Date(b.published) - new Date(a.published));
    const latest = sorted.slice(0, 50);
    feed.innerHTML = latest.map(item => {
        const title = item.title_ru || item.title_en || 'Без заголовка';
        const badge = item.title_ru ? '' : '<span class="news-badge">EN</span>';
        const titleClass = item.title_ru ? 'news-title' : 'news-title en';
        const time = item.published ? new Date(item.published).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        }) : '';
        return `
            <div class="news-item">
                <div class="news-header">
                    <span class="news-flag">${getFlag(item.country)}</span>
                    <span class="news-source">${item.source}</span>
                    <span class="news-country">${item.country}</span>
                    ${time ? `<span class="news-time">🕐 ${time}</span>` : ''}
                </div>
                <a href="${item.url}" target="_blank" rel="noopener" class="${titleClass}">
                    ${title} ${badge}
                </a>
            </div>
        `;
    }).join('');
    updateCounter();
}

function updateCounter() {
    const countEl = document.getElementById('total-count');
    const timeEl = document.getElementById('update-time');
    if (countEl) countEl.textContent = allNews.length;
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = `Обновлено: ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const footerTime = document.getElementById('footer-time');
    if (footerTime) {
        const now = new Date();
        footerTime.textContent = `🕐 ${now.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
}

async function updateNews() {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = '<div class="loader">🔄 Загрузка новостей...</div>';
    let newItems = [];
    
    for (const source of SOURCES) {
        try {
            const items = await fetchRSS(source.rss);
            for (const item of items) {
                if (isDuplicate(item.link)) continue;
                if (!isRelevant(item.title)) continue;
                
                newItems.push({
                    url: item.link,
                    title_en: item.title,
                    title_ru: null,
                    source: source.name,
                    country: source.country,
                    published: item.pubDate || new Date().toISOString()
                });
            }
        } catch(e) { 
            console.error('Ошибка источника:', source.name); 
        }
    }
    
    if (newItems.length > 0) {
        feed.innerHTML = '<div class="loader">🔄 Перевод заголовков...</div>';
        for (let i = 0; i < newItems.length; i++) {
            const translated = await translateText(newItems[i].title_en);
            if (translated) {
                newItems[i].title_ru = translated;
            }
        }
        
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
    updateCounter();
}

async function sendToTelegram(items) {
    const BOT_TOKEN = "8972375608:AAE4thoN-Im-Zvf8eGywzdj_cRL2HCSXk1M";
    const CHANNEL = "@newspapernewsusa";
    
    for (const item of items) {
        const flag = getFlag(item.country);
        const title = item.title_ru || item.title_en;
        const time = new Date(item.published).toLocaleString('ru-RU', {
            hour: '2-digit', minute: '2-digit'
        });
        
        const msg = `📌 ${flag} <b>${item.source}</b>  ·  ${time}\n\n${title}\n\n🔗 <a href="${item.url}">Читать полностью</a>`;
        
        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHANNEL,
                    text: msg,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                })
            });
        } catch(e) { 
            console.error('Ошибка отправки в Telegram'); 
        }
    }
}

loadSavedNews();
renderNews();
updateNews();
setInterval(updateNews, 30 * 60 * 1000);
