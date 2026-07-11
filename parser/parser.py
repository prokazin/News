import feedparser
import json
import os
import hashlib
from datetime import datetime
from config import SOURCES, KEYWORDS, NEWS_FILE, FETCH_LIMIT, MAX_NEWS
from translator import translator
from telegram_bot import send_news_to_telegram

def load_news():
    """Загружает существующие новости из файла"""
    if os.path.exists(NEWS_FILE):
        with open(NEWS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('news', [])
    return []

def save_news(news):
    """Сохраняет новости в файл"""
    # Ограничиваем количество
    if len(news) > MAX_NEWS:
        news = news[:MAX_NEWS]
    
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump({'news': news}, f, ensure_ascii=False, indent=2)

def fetch_rss(url):
    """Загружает RSS ленту"""
    try:
        feed = feedparser.parse(url)
        return feed.entries
    except Exception as e:
        print(f"⚠️ Ошибка загрузки {url}: {e}")
        return []

def is_relevant(title):
    """Проверяет, соответствует ли новость ключевым словам"""
    if not KEYWORDS:
        return True
    title_lower = title.lower()
    return any(keyword.lower() in title_lower for keyword in KEYWORDS)

def generate_id(url):
    """Генерирует уникальный ID на основе URL"""
    return hashlib.md5(url.encode()).hexdigest()[:12]

def main():
    print(f"🔄 Запуск парсера: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Загружаем существующие новости
    existing_news = load_news()
    existing_urls = {item['url'] for item in existing_news}
    
    new_items = []
    new_for_telegram = []
    
    # Проходим по источникам
    for source in SOURCES:
        print(f"📡 Читаем {source['name']} ({source['country']})...")
        entries = fetch_rss(source['rss'])
        
        count = 0
        for entry in entries[:FETCH_LIMIT]:
            url = entry.get('link', '')
            title = entry.get('title', '').strip()
            published = entry.get('published', '')
            
            if not url or not title:
                continue
            
            # Проверяем дубликат
            if url in existing_urls:
                continue
            
            # Проверяем релевантность
            if not is_relevant(title):
                continue
            
            # Форматируем дату
            try:
                pub_date = datetime(*entry.published_parsed[:6]).isoformat()
            except:
                pub_date = datetime.now().isoformat()
            
            # Создаем запись
            item = {
                'id': generate_id(url),
                'url': url,
                'title_en': title,
                'title_ru': None,
                'source': source['name'],
                'country': source['country'],
                'published': pub_date
            }
            
            new_items.append(item)
            new_for_telegram.append(item)
            existing_urls.add(url)
            count += 1
        
        print(f"  Найдено новых: {count}")
    
    # Переводим заголовки
    if new_items:
        print(f"🔄 Перевод {len(new_items)} заголовков...")
        titles = [item['title_en'] for item in new_items]
        translations = translator.translate_batch(titles)
        
        for i, translation in enumerate(translations):
            if translation:
                new_items[i]['title_ru'] = translation
            # Если перевода нет, оставляем None
        
        # Добавляем к существующим
        all_news = new_items + existing_news
        save_news(all_news)
        print(f"✅ Сохранено {len(new_items)} новых новостей")
        
        # Отправляем в Telegram
        if new_for_telegram:
            print("📨 Отправка в Telegram...")
            send_news_to_telegram(new_for_telegram)
    else:
        print("ℹ️ Новых новостей нет")
    
    print("✅ Завершено\n")

if __name__ == "__main__":
    main()
