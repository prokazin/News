// Сбор статистики посещений (только для админки)
// Сохраняет в stats.json через GitHub API

async function recordVisit() {
    try {
        // Проверяем, не записывали ли уже сегодня с этого IP
        const today = new Date().toISOString().slice(0, 10);
        const storageKey = `visit_${today}`;
        
        // Используем localStorage чтобы не дублировать визиты за день
        if (localStorage.getItem(storageKey)) {
            return; // Сегодня уже записали
        }
        
        // Получаем текущий stats.json
        const response = await fetch('stats.json?t=' + Date.now());
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        
        const stats = await response.json();
        const visits = stats.visits || [];
        
        // Добавляем новый визит
        visits.push({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.slice(0, 100)
        });
        
        // Обновляем stats.json (через GitHub API)
        await updateStats(visits);
        localStorage.setItem(storageKey, 'true');
        
    } catch (error) {
        // Тихо падаем — не мешаем работе сайта
        console.debug('Статистика не записана:', error.message);
    }
}

async function updateStats(visits) {
    // Получаем текущий файл через API
    const repo = window.location.pathname.split('/')[1]; // имя репозитория
    const owner = window.location.hostname.split('.')[0]; // имя пользователя
    const path = 'stats.json';
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    // Получаем SHA текущего файла
    const fileResponse = await fetch(apiUrl);
    if (!fileResponse.ok) throw new Error('Не удалось получить файл');
    
    const fileData = await fileResponse.json();
    const sha = fileData.sha;
    
    // Формируем новые данные
    const content = JSON.stringify({ visits }, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(content)));
    
    // Отправляем обновление через API
    const updateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: 'Update stats',
            content: encoded,
            sha: sha
        })
    });
    
    if (!updateResponse.ok) {
        throw new Error('Не удалось обновить статистику');
    }
}

// Записываем визит после загрузки страницы
setTimeout(recordVisit, 2000);
