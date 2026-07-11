// Загрузка и отображение новостей
async function loadNews() {
    const feed = document.getElementById('news-feed');
    
    try {
        const response = await fetch('news.json?t=' + Date.now());
        if (!response.ok) throw new Error('Не удалось загрузить новости');
        
        const data = await response.json();
        const news = data.news || [];
        
        if (news.length === 0) {
            feed.innerHTML = '<div class="loader">Новостей пока нет</div>';
            return;
        }
        
        // Сортировка по дате (свежие сверху)
        news.sort((a, b) => new Date(b.published) - new Date(a.published));
        
        // Рендерим последние 50 новостей
        const latest = news.slice(0, 50);
        feed.innerHTML = latest.map(item => renderItem(item)).join('');
        
    } catch (error) {
        feed.innerHTML = '<div class="loader">⚠️ Ошибка загрузки. Попробуйте позже.</div>';
        console.error('Ошибка:', error);
    }
}

function renderItem(item) {
    const flag = getFlag(item.country);
    const hasTranslation = item.title_ru && item.title_ru.trim() !== '';
    const title = hasTranslation ? item.title_ru : item.title_en;
    const badge = hasTranslation ? '' : '<span class="news-badge">EN</span>';
    const titleClass = hasTranslation ? 'news-title' : 'news-title en';
    
    // Форматируем дату
    const date = new Date(item.published);
    const timeStr = date.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    return `
        <div class="news-item">
            <div class="news-header">
                <span class="news-flag">${flag}</span>
                <span class="news-source">${item.source}</span>
                <span class="news-country">${item.country}</span>
            </div>
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="${titleClass}">
                ${title} ${badge}
            </a>
            <div class="news-time">${timeStr}</div>
        </div>
    `;
}

function getFlag(country) {
    const flags = {
        'USA': '🇺🇸',
        'Ukraine': '🇺🇦',
        'UK': '🇬🇧',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Europe': '🇪🇺'
    };
    return flags[country] || '🌍';
}

// Запускаем загрузку
loadNews();
