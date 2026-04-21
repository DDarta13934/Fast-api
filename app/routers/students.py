from fastapi import APIRouter, HTTPException
from app.db import get_conn
from fastapi.responses import FileResponse
from app.services.document_service import generate_all_docs, build_template_data
from pydantic import BaseModel
import os

# Убираем жесткий префикс, чтобы лучше контролировать пути
router = APIRouter(tags=["students"])

class StudentUpdateModel(BaseModel):
    fio: str
    module_name: str
    org_name: str
    teacher: str      
    start_date: str   

# Исправляем 404 для списка студентов (обрабатываем оба варианта: со слэшем и без)
@router.get("/students")
@router.get("/students/")
def get_all_students():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, "ФИО_обучающегося" FROM students ORDER BY id')
            rows = cur.fetchall()
            return [{"id": r[0], "fio": r[1]} for r in rows]

@router.get("/students/{student_id}")
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

# НОВЫЙ ПУТЬ (для ZIP)
@router.get("/students/{student_id}/generate-all")
def generate_all(student_id: int):
    return handle_generation(student_id)

# СТАРЫЙ ПУТЬ (Ловушка для кнопки в приложении)
# Этот путь перехватит запрос /students/generate/23/Аттестационный...
@router.get("/students/generate/{student_id}/{doc_name:path}")
def legacy_generate(student_id: int, doc_name: str):
    return handle_generation(student_id)

def handle_generation(student_id: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            if not row: raise HTTPException(status_code=404)
            student_dict = dict(zip(columns, row))
    
    data_tuple = build_template_data(student_dict)
    zip_path = generate_all_docs(data_tuple)
    return FileResponse(zip_path, filename=f"docs_{student_id}.zip")
