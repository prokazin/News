// Админ-панель: статистика посещений

const PASSWORD = '12345'; // ← смените на свой пароль

function initAdmin() {
    const params = new URLSearchParams(window.location.search);
    const password = params.get('password');
    
    const content = document.getElementById('admin-content');
    const status = document.getElementById('admin-status');
    
    if (password !== PASSWORD) {
        content.innerHTML = `
            <div class="error-box">
                ⚠️ Неверный пароль. Доступ запрещен.
            </div>
        `;
        status.textContent = '❌ Доступ закрыт';
        return;
    }
    
    status.textContent = '✅ Доступ разрешен';
    loadStats();
}

async function loadStats() {
    const content = document.getElementById('admin-content');
    content.innerHTML = '<div class="loader">Загрузка статистики...</div>';
    
    try {
        const response = await fetch('stats.json?t=' + Date.now());
        if (!response.ok) throw new Error('Не удалось загрузить статистику');
        
        const data = await response.json();
        const visits = data.visits || [];
        
        if (visits.length === 0) {
            content.innerHTML = '<div class="no-data">Статистики пока нет</div>';
            return;
        }
        
        // Считаем статистику
        const stats = calculateStats(visits);
        renderStats(stats, visits);
        
    } catch (error) {
        content.innerHTML = `
            <div class="error-box">
                ⚠️ Ошибка загрузки статистики: ${error.message}
            </div>
        `;
    }
}

function calculateStats(visits) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let todayCount = 0;
    let yesterdayCount = 0;
    let weekCount = 0;
    let lastVisits = [];
    
    visits.forEach(visit => {
        const date = new Date(visit.timestamp);
        
        // Сегодня
        if (date >= today) {
            todayCount++;
        }
        // Вчера
        if (date >= yesterday && date < today) {
            yesterdayCount++;
        }
        // За неделю
        if (date >= weekAgo) {
            weekCount++;
        }
    });
    
    // Последние 50 визитов
    lastVisits = visits
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);
    
    return { todayCount, yesterdayCount, weekCount, lastVisits };
}

function renderStats(stats, allVisits) {
    const content = document.getElementById('admin-content');
    
    // Проверяем, есть ли вообще визиты
    const total = allVisits.length;
    
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.todayCount}</div>
                <div class="stat-label">📅 Сегодня</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.yesterdayCount}</div>
                <div class="stat-label">📆 Вчера</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.weekCount}</div>
                <div class="stat-label">📊 За неделю</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${total}</div>
                <div class="stat-label">📈 Всего визитов</div>
            </div>
        </div>
        
        <h3 style="margin:24px 0 12px;font-size:16px;color:#0d1117;">Последние посещения</h3>
        <div class="visits-table">
            <table>
                <thead>
                    <tr>
                        <th>Дата и время</th>
                        <th>User Agent</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.lastVisits.map(visit => `
                        <tr>
                            <td>${formatDate(visit.timestamp)}</td>
                            <td style="font-size:12px;color:#57606a;max-width:300px;word-break:break-all;">${visit.userAgent || '—'}</td>
                        </tr>
                    `).join('')}
                    ${stats.lastVisits.length === 0 ? `
                        <tr><td colspan="2" style="text-align:center;padding:24px;color:#57606a;">Нет данных</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px;font-size:13px;color:#57606a;text-align:right;">
            Показано ${stats.lastVisits.length} из ${total} визитов
        </div>
    `;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Запуск
initAdmin();
