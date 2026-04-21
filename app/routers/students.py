from fastapi import APIRouter, HTTPException
from app.db import get_conn
from fastapi.responses import FileResponse
from app.services.document_service import generate_all_docs, build_template_data
from pydantic import BaseModel
import os

router = APIRouter(tags=["students"])

class StudentUpdateModel(BaseModel):
    fio: str
    module_name: str
    org_name: str
    teacher: str      
    start_date: str   

# Обрабатываем и /students и /students/ для Flutter
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

@router.put("/students/{student_id}")
def update_student(student_id: int, student: StudentUpdateModel):
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

# Путь для генерации ZIP, который теперь прописан во Flutter
@router.get("/students/{student_id}/generate-all")
def generate_all(student_id: int):
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
