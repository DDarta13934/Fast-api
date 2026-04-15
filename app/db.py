import psycopg2
from psycopg2.extras import DictCursor
import time

def get_conn():
    try:
        conn = psycopg2.connect(
            dbname="postgres", 
            user="postgres", 
            password="12345", 
            host="localhost", 
            port="5432"
        )
        return conn
    except Exception as e:
        print(f"--- ОШИБКА ПОДКЛЮЧЕНИЯ К POSTGRES ---")
        print(e)
        raise e