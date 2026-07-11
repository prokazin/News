// Сбор статистики посещений

function recordVisit() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const storageKey = `visit_${today}`;
        
        if (localStorage.getItem(storageKey)) {
            return;
        }
        
        let visits = [];
        try {
            const saved = localStorage.getItem('visitsData');
            if (saved) {
                visits = JSON.parse(saved);
            }
        } catch(e) {}
        
        visits.push({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.slice(0, 100)
        });
        
        if (visits.length > 500) {
            visits = visits.slice(-500);
        }
        
        localStorage.setItem('visitsData', JSON.stringify(visits));
        localStorage.setItem(storageKey, 'true');
        
    } catch(e) {}
}

setTimeout(recordVisit, 2000);
