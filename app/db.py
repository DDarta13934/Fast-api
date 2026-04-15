import psycopg2
import os
from psycopg2.extras import DictCursor

def get_conn():
    """
    Создает подключение к базе данных.
    Использует переменную окружения DATABASE_URL на Render 
    или локальные настройки для разработки.
    """
    try:
        # Пытаемся получить URL базы из настроек Render
        db_url = os.getenv("DATABASE_URL")
        
        if db_url:
            # Если мы на Render, подключаемся по ссылке
            conn = psycopg2.connect(db_url)
        else:
            # Если переменной нет (локальный запуск), используем твои старые настройки
            conn = psycopg2.connect(
                dbname="postgres", 
                user="postgres", 
                password="12345", 
                host="localhost", 
                port="5432"
            )
        return conn
    except Exception as e:
        print(f"--- ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ ---")
        print(f"Детали: {e}")
        raise e

def test_connection():
    """Вспомогательная функция для проверки связи"""
    try:
        connection = get_conn()
        cursor = connection.cursor()
        cursor.execute("SELECT version();")
        record = cursor.fetchone()
        print(f"Успешное подключение! Версия базы: {record}")
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Тестовое подключение не удалось: {e}")

if __name__ == "__main__":
    # Если запустить этот файл напрямую, он проверит соединение
    test_connection()
