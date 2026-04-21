from fastapi import APIRouter, HTTPException
from app.db import get_conn
from fastapi.responses import FileResponse
from app.services.document_service import generate_all_docs, build_template_data
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter(prefix="/students", tags=["students"])

class StudentUpdateModel(BaseModel):
    fio: Optional[str] = None
    module_name: Optional[str] = "ПМ.01"
    org_name: Optional[str] = None
    teacher: Optional[str] = None
    start_date: Optional[str] = None

@router.get("/")
def get_all_students():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, "ФИО_обучающегося" FROM students ORDER BY id')
            rows = cur.fetchall()
            return [{"id": r[0], "fio": r[1]} for r in rows]

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
            if not r: raise HTTPException(status_code=404)
            return {
                "id": r[0], "fio": r[1], "module_name": r[2], 
                "org_name": r[3], "teacher": r[4], "start_date": r[5]
            }

# Добавляем этот путь для совместимости с твоим JS
@router.put("/{student_id}")
def update_student(student_id: int, student: StudentUpdateModel):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    UPDATE students 
                    SET "ФИО_обучающегося" = %s, "наименование_модуля" = %s, 
                        "название_организации" = %s, "ФИО_отв_организации" = %s, "дата_начала" = %s
                    WHERE id = %s
                ''', (student.fio, student.module_name, student.org_name, 
                      student.teacher, student.start_date, student_id))
                conn.commit()
        return {"status": "ok"}
    except Exception as e:
        print(f"Ошибка сохранения в БД: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}/generate-all")
def generate_all(student_id: int):
    with get_conn() as conn:
        # Используем обычный курсор для получения всех колонок
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))
            row = cur.fetchone()
            if not row: raise HTTPException(status_code=404)
            columns = [desc[0] for desc in cur.description]
            student_dict = dict(zip(columns, row))
    
    data_tuple = build_template_data(student_dict)
    zip_path = generate_all_docs(data_tuple)
    return FileResponse(zip_path, filename=f"docs_{student_id}.zip")

# Маршрут-перехватчик для старой кнопки
@router.get("/generate/{student_id}/{suffix:path}")
async def catch_old_button_request(student_id: int, suffix: str):
    return generate_all(student_id)
