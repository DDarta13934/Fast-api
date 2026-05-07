from fastapi import FastAPI, HTTPException
from app.routers.students import StudentUpdateModel, update_student
from fastapi.staticfiles import StaticFiles
from app.routers.students import router as students_router
from app.routers.ui import router as ui_router
from app.db import get_conn
from psycopg2.extras import RealDictCursor

app = FastAPI(redirect_slashes=False)

# Подключаем роутеры с префиксом /api, чтобы пути были /api/students и т.д.
app.include_router(ui_router, prefix="/api")
app.include_router(students_router, prefix="/api")

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Эндпоинт для получения всех студентов ---
@app.get("/api/students")
async def get_all_students():
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM students ORDER BY id")
            students = cur.fetchall()
            return students
    finally:
        conn.close()

# --- Эндпоинт для получения одного студента (если нет в роутере) ---
@app.get("/api/students/{student_id}")
async def get_student(student_id: int):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM students WHERE id = %s", (student_id,))
            student = cur.fetchone()
            if not student:
                raise HTTPException(status_code=404, detail="Студент не найден")
            return student
    finally:
        conn.close()

# --- Эндпоинт для обновления (PUT /api/students/{student_id}) ---
@app.put("/api/students/{student_id}")
async def update_student_endpoint(student_id: int, student: StudentUpdateModel):
    return update_student(student_id, student)

# --- Старые эндпоинты для совместимости (если нужны) ---
@app.get("/get_student/{student_id}")
async def legacy_get_student(student_id: int):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM students WHERE id = %s", (student_id,))
            student = cur.fetchone()
            if not student:
                raise HTTPException(status_code=404, detail="Студент не найден")
            return student
    finally:
        conn.close()

@app.put("/practice/{student_id}")
async def legacy_save_data(student_id: int, student: StudentUpdateModel):
    return update_student(student_id, student)

# Раздача статики (web) – должна идти последней!
app.mount("/web", StaticFiles(directory="web"), name="web_static")
