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

# 1. ПОЛУЧЕНИЕ СПИСКА (адрес: /students/)
@router.get("/")
def get_students():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT id, "ФИО_обучающегося" FROM students ORDER BY id')
                rows = cur.fetchall()
                return [{"id": r[0], "fio": r[1]} for r in rows]
    except Exception as e:
        print(f"Ошибка списка: {e}")
        return []

# 2. ПОЛУЧЕНИЕ ОДНОГО СТУДЕНТА (адрес: /students/{id})
@router.get("/{student_id}")
def get_student_detail(student_id: int):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    SELECT id, "ФИО_обучающегося", "наименование_модуля", "название_организации", "ФИО_отв_организации"
                    FROM students WHERE id = %s
                ''', (student_id,))
                r = cur.fetchone()
                if not r:
                    raise HTTPException(status_code=404, detail="Студент не найден")
                return {"id": r[0], "fio": r[1], "module_name": r[2], "org_name": r[3]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. ОБНОВЛЕНИЕ ДАННЫХ В БД (адрес: /students/{id} через PUT)
@router.put("/{student_id}")
def update_student(student_id: int, student: StudentUpdateModel):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Обновляем только те поля, которые мы реально вывели в интерфейс
                cur.execute('''
                    UPDATE students 
                    SET "ФИО_обучающегося" = %s, 
                        "наименование_модуля" = %s, 
                        "название_организации" = %s
                    WHERE id = %s
                ''', (student.fio, student.module_name, student.org_name, student_id))
                conn.commit()
        return {"status": "ok"}
    except Exception as e:
        print(f"Ошибка сохранения в БД: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. ГЕНЕРАЦИЯ (адрес: /students/{id}/generate-all)
@router.get("/{student_id}/generate-all")
def generate_all(student_id: int):
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