import deepl
import time
from config import DEEPL_API_KEY

class Translator:
    def __init__(self):
        self.translator = deepl.Translator(DEEPL_API_KEY) if DEEPL_API_KEY else None
        self.quota_exceeded = False
    
    def translate(self, text):
        """Переводит текст с английского на русский"""
        if not self.translator or self.quota_exceeded:
            return None
        
        if not text or not text.strip():
            return None
        
        try:
            result = self.translator.translate_text(
                text,
                source_lang="EN",
                target_lang="RU"
            )
            return result.text
        except deepl.QuotaExceededException:
            self.quota_exceeded = True
            print("⚠️ Лимит переводов исчерпан")
            return None
        except Exception as e:
            print(f"⚠️ Ошибка перевода: {e}")
            return None
    
    def translate_batch(self, texts):
        """Переводит список текстов"""
        results = []
        for text in texts:
            if self.quota_exceeded:
                results.append(None)
            else:
                translated = self.translate(text)
                results.append(translated)
                # Небольшая задержка между запросами
                time.sleep(0.3)
        return results

# Создаем экземпляр для импорта
translator = Translator()
