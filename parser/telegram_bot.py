import requests
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID

def send_news_to_telegram(news_items):
    """Отправляет новости в Telegram канал"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHANNEL_ID:
        print("⚠️ Telegram не настроен")
        return
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    for item in news_items:
        # Формируем сообщение
        flag = get_flag(item['country'])
        title = item.get('title_ru') or item['title_en']
        
        if not item.get('title_ru'):
            title += " [EN]"
        
        message = f"{flag} {item['source']}\n{title}\n🔗 {item['url']}"
        
        try:
            response = requests.post(url, json={
                'chat_id': TELEGRAM_CHANNEL_ID,
                'text': message,
                'parse_mode': 'HTML',
                'disable_web_page_preview': True
            })
            
            if response.status_code == 200:
                print(f"✅ Отправлено: {item['title_en'][:50]}...")
            else:
                print(f"❌ Ошибка отправки: {response.text}")
                
        except Exception as e:
            print(f"❌ Ошибка: {e}")
        
        # Небольшая задержка между сообщениями
        import time
        time.sleep(0.5)

def get_flag(country):
    flags = {
        'USA': '🇺🇸',
        'Ukraine': '🇺🇦',
        'UK': '🇬🇧',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Europe': '🇪🇺'
    }
    return flags.get(country, '🌍')
