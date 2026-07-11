// Сбор статистики посещений

function recordVisit() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const storageKey = `visit_${today}`;
        
        // Проверяем, был ли уже визит сегодня
        if (localStorage.getItem(storageKey)) {
            return;
        }
        
        // Загружаем существующую статистику
        let visits = [];
        try {
            const saved = localStorage.getItem('visitsData');
            if (saved) {
                visits = JSON.parse(saved);
            }
        } catch(e) {}
        
        // Добавляем новый визит
        visits.push({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.slice(0, 100)
        });
        
        // Сохраняем (ограничиваем 500 записей)
        if (visits.length > 500) {
            visits = visits.slice(-500);
        }
        
        localStorage.setItem('visitsData', JSON.stringify(visits));
        localStorage.setItem(storageKey, 'true');
        
    } catch(e) {
        // Тихо падаем
    }
}

// Запись визита через 2 секунды после загрузки
setTimeout(recordVisit, 2000);
