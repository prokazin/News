# Настройки парсера

# Список RSS-источников
SOURCES = [
    {
        "name": "CNN",
        "country": "USA",
        "rss": "http://rss.cnn.com/rss/cnn_topstories.rss"
    },
    {
        "name": "Fox News",
        "country": "USA",
        "rss": "http://feeds.foxnews.com/foxnews/politics"
    },
    {
        "name": "Kyiv Independent",
        "country": "Ukraine",
        "rss": "https://kyivindependent.com/feed/"
    },
    {
        "name": "Reuters",
        "country": "UK",
        "rss": "http://feeds.reuters.com/reuters/topNews"
    },
    {
        "name": "BBC",
        "country": "UK",
        "rss": "http://feeds.bbci.co.uk/news/rss.xml"
    },
    {
        "name": "DW",
        "country": "Germany",
        "rss": "https://rss.dw.com/rdf/rss-en-all"
    }
]

# Ключевые слова для фильтра (оставляем пустым, чтобы брать все новости)
# Если нужно фильтровать — раскомментируйте и добавьте слова
KEYWORDS = []  # ["Russia", "Ukraine", "war", "Putin", "Zelensky"]

# API ключи
DEEPL_API_KEY = "ваш_ключ_deepl"
TELEGRAM_BOT_TOKEN = "ваш_токен_бота"
TELEGRAM_CHANNEL_ID = "@ваш_канал"  # или ID канала

# Пути к файлам (относительно корня проекта)
NEWS_FILE = "news.json"
STATS_FILE = "stats.json"

# Настройки парсинга
FETCH_LIMIT = 5  # сколько новостей брать с каждого RSS
MAX_NEWS = 500   # сколько всего хранить в news.json
