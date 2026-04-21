from fastapi import FastAPI, HTTPException

from fastapi.staticfiles import StaticFiles

from app.routers.students import router as students_router

from app.routers.ui import router as ui_router

# --- НОВЫЕ ИМПОРТЫ ДЛЯ БАЗЫ ДАННЫХ ---

from app.db import get_conn

from psycopg2.extras import RealDictCursor

# Было: app = FastAPI()
app = FastAPI(redirect_slashes=False)

# Подключаем роутеры БЕЗ префикса здесь, так как они уже есть внутри файлов

app.include_router(ui_router)

app.include_router(students_router)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- НОВЫЙ ЭНДПОИНТ ДЛЯ АВТОЗАПОЛНЕНИЯ ---

@app.get("/get_student/{student_id}")

async def get_student(student_id: int):

    conn = get_conn()

    try:

        # Используем RealDictCursor, чтобы ключи в JSON совпадали с названиями колонок в БД

        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))

            student = cur.fetchone()

            if not student:

                raise HTTPException(status_code=404, detail="Студент не найден")

            return student

    finally:

        conn.close()
