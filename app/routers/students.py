from fastapi import APIRouter, HTTPException
from app.db import get_conn
from fastapi.responses import FileResponse
from app.services.document_service import generate_all_docs, build_template_data
from pydantic import BaseModel
import os

# Схема для валидации данных при сохранении
class StudentUpdateModel(BaseModel):
    fio: str
    module_name: str
    org_name: str

router = APIRouter(prefix="/students", tags=["students"])

# --- 1. ОБНОВЛЕННАЯ СХЕМА ---
# Добавляем поля для преподавателя и даты
class StudentUpdateModel(BaseModel):
    fio: str
    module_name: str
    org_name: str
    teacher: str      # Новое поле
    start_date: str   # Новое поле (для даты начала)

# ... (код получения списка остается прежним) ...

# --- 2. ОБНОВЛЕННОЕ ПОЛУЧЕНИЕ (пункт 2) ---
@router.get("/{student_id}")
def get_student_detail(student_id: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT id, "ФИО_обучающегося", "наименование_модуля", 
                       "название_организации", "ФИО_отв_организации", "дата_начала"
                FROM students WHERE id = %s
            ''', (student_id,))
            r = cur.fetchone()
            # ... остальной код возврата словаря ...
            return {
                "id": r[0], "fio": r[1], "module_name": r[2], 
                "org_name": r[3], "teacher": r[4], "start_date": r[5]
            }

# --- 3. ОБНОВЛЕННОЕ СОХРАНЕНИЕ (пункт 3) ---
@router.put("/{student_id}")
def update_student(student_id: int, student: StudentUpdateModel):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Обновляем все поля, включая новые
                cur.execute('''
                    UPDATE students 
                    SET "ФИО_обучающегося" = %s, 
                        "наименование_модуля" = %s, 
                        "название_организации" = %s,
                        "ФИО_отв_организации" = %s,
                        "дата_начала" = %s
                    WHERE id = %s
                ''', (
                    student.fio, 
                    student.module_name, 
                    student.org_name, 
                    student.teacher, 
                    student.start_date, 
                    student_id
                ))
                conn.commit()
        return {"status": "ok"}
    except Exception as e:
        print(f"Ошибка сохранения в БД: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. ГЕНЕРАЦИЯ (теперь адрес совпадает с тем, что ищет браузер)
@router.get("/generate/{student_id}/{doc_name}")
def generate_all(student_id: int, doc_name: str):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Используем DictCursor или просто индексный доступ
                cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))
                # Получаем имена колонок
                columns = [desc[0] for desc in cur.description]
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404)
                # Превращаем в словарь для функции генерации
                student_dict = dict(zip(columns, row))

        data_tuple = build_template_data(student_dict)
        zip_path = generate_all_docs(data_tuple)
        
        return FileResponse(zip_path, filename=f"student_{student_id}_docs.zip")
    except Exception as e:
        print(f"Ошибка генерации: {e}")
        raise HTTPException(status_code=500, detail=str(e))
