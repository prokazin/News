const PASSWORD = '12345'; // Смените на свой пароль

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

function loadStats() {
    const content = document.getElementById('admin-content');
    
    // Загружаем статистику из localStorage
    let visits = [];
    try {
        const saved = localStorage.getItem('visitsData');
        if (saved) {
            visits = JSON.parse(saved);
        }
    } catch(e) {}
    
    if (visits.length === 0) {
        content.innerHTML = '<div class="no-data">Статистики пока нет</div>';
        return;
    }
    
    const stats = calculateStats(visits);
    renderStats(stats, visits);
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
    
    visits.forEach(visit => {
        const date = new Date(visit.timestamp);
        if (date >= today) todayCount++;
        if (date >= yesterday && date < today) yesterdayCount++;
        if (date >= weekAgo) weekCount++;
    });
    
    const lastVisits = visits
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);
    
    return { todayCount, yesterdayCount, weekCount, lastVisits, total: visits.length };
}

function renderStats(stats, allVisits) {
    const content = document.getElementById('admin-content');
    
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
                <div class="stat-number">${stats.total}</div>
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
                            <td style="font-size:12px;color:#57606a;word-break:break-all;">${visit.userAgent || '—'}</td>
                        </tr>
                    `).join('')}
                    ${stats.lastVisits.length === 0 ? `
                        <tr><td colspan="2" style="text-align:center;padding:24px;color:#57606a;">Нет данных</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        <div style="margin-top:12px;font-size:13px;color:#57606a;text-align:right;">
            Показано ${stats.lastVisits.length} из ${stats.total} визитов
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

initAdmin();
