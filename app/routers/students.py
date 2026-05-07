from fastapi import APIRouter, HTTPException
from app.db import get_conn
from fastapi.responses import FileResponse
from app.services.document_service import generate_all_docs, build_template_data
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter(prefix="/students", tags=["students"])

# 1. Полная модель данных (24 поля)
class StudentUpdateModel(BaseModel):
    fio: Optional[str] = None
    birth_date: Optional[str] = None
    module_name: Optional[str] = None
    start_day: Optional[str] = None
    start_month: Optional[str] = None
    start_year: Optional[str] = None
    end_day: Optional[str] = None
    end_month: Optional[str] = None
    end_year: Optional[str] = None
    spec_code: Optional[str] = None
    spec_name: Optional[str] = None
    hours: Optional[str] = None
    teacher_fio: Optional[str] = None
    teacher_phone: Optional[str] = None
    org_name: Optional[str] = None
    org_address: Optional[str] = None
    rooms: Optional[str] = None
    org_boss_post: Optional[str] = None
    org_boss_fio: Optional[str] = None
    org_boss_phone: Optional[str] = None
    org_boss_initials: Optional[str] = None
    resp_post: Optional[str] = None
    resp_fio: Optional[str] = None
    resp_phone: Optional[str] = None

@router.get("/")
def get_all_students():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, "ФИО_обучающегося" FROM students ORDER BY id')
            rows = cur.fetchall()
            return [{"id": r[0], "fio": r[1]} for r in rows]

# 2. Получение всех деталей студента для заполнения полей на сайте
@router.get("/{student_id}")
def get_student_detail(student_id: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))
            row = cur.fetchone()
            if not row: 
                raise HTTPException(status_code=404)
            
            # Превращаем кортеж из БД в удобный словарь (key: value)
            columns = [desc[0] for desc in cur.description]
            s = dict(zip(columns, row))
            
            return {
                "id": s.get("id"),
                "fio": s.get("ФИО_обучающегося"),
                "birth_date": s.get("Дата_рождения"),
                "module_name": s.get("наименование_модуля"),
                "start_day": s.get("день_начала_ПП"),
                "start_month": s.get("месяц_начала_ПП"),
                "start_year": s.get("год_начала_ПП"),
                "end_day": s.get("день_конца_ПП"),
                "end_month": s.get("месяц_конца_ПП"),
                "end_year": s.get("год_конца_ПП"),
                "spec_code": s.get("код_специальности"),
                "spec_name": s.get("наименование_специальности"),
                "hours": s.get("количество_часов_ПП"),
                "teacher_fio": s.get("ФИО_преподавателя"),
                "teacher_phone": s.get("тел_преподаваттеля"),
                "org_name": s.get("название_организации"),
                "org_address": s.get("адрес_организации"),
                "rooms": s.get("Наименование_помещений"),
                "org_boss_post": s.get("должность_отв_организации"),
                "org_boss_fio": s.get("ФИО_отв_организации"),
                "org_boss_phone": s.get("тел_отв_организации"),
                "org_boss_initials": s.get("инициалы_отв_организации"),
                "resp_post": s.get("должность_ответственного"),
                "resp_fio": s.get("ФИО_ответственного"),
                "resp_phone": s.get("тел_ответственного")
            }

# 3. Обновление всех 24 полей в БД
@router.put("/{student_id}")
def update_student(student_id: int, student: StudentUpdateModel):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute('''
                    UPDATE students 
                    SET 
                        "ФИО_обучающегося" = COALESCE(%s, "ФИО_обучающегося"),
                        "Дата_рождения" = COALESCE(%s, "Дата_рождения"),
                        "наименование_модуля" = COALESCE(%s, "наименование_модуля"),
                        "день_начала_ПП" = COALESCE(%s, "день_начала_ПП"),
                        "месяц_начала_ПП" = COALESCE(%s, "месяц_начала_ПП"),
                        "год_начала_ПП" = COALESCE(%s, "год_начала_ПП"),
                        "день_конца_ПП" = COALESCE(%s, "день_конца_ПП"),
                        "месяц_конца_ПП" = COALESCE(%s, "месяц_конца_ПП"),
                        "год_конца_ПП" = COALESCE(%s, "год_конца_ПП"),
                        "код_специальности" = COALESCE(%s, "код_специальности"),
                        "наименование_специальности" = COALESCE(%s, "наименование_специальности"),
                        "количество_часов_ПП" = COALESCE(%s, "количество_часов_ПП"),
                        "ФИО_преподавателя" = COALESCE(%s, "ФИО_преподавателя"),
                        "тел_преподаваттеля" = COALESCE(%s, "тел_преподаваттеля"),
                        "название_организации" = COALESCE(%s, "название_организации"),
                        "адрес_организации" = COALESCE(%s, "адрес_организации"),
                        "Наименование_помещений" = COALESCE(%s, "Наименование_помещений"),
                        "должность_отв_организации" = COALESCE(%s, "должность_отв_организации"),
                        "ФИО_отв_организации" = COALESCE(%s, "ФИО_отв_организации"),
                        "тел_отв_организации" = COALESCE(%s, "тел_отв_организации"),
                        "инициалы_отв_организации" = COALESCE(%s, "инициалы_отв_организации"),
                        "должность_ответственного" = COALESCE(%s, "должность_ответственного"),
                        "ФИО_ответственного" = COALESCE(%s, "ФИО_ответственного"),
                        "тел_ответственного" = COALESCE(%s, "тел_ответственного")
                    WHERE id = %s
                ''', (
                    student.fio, student.birth_date, student.module_name,
                    student.start_day, student.start_month, student.start_year,
                    student.end_day, student.end_month, student.end_year,
                    student.spec_code, student.spec_name, student.hours,
                    student.teacher_fio, student.teacher_phone, student.org_name,
                    student.org_address, student.rooms, student.org_boss_post,
                    student.org_boss_fio, student.org_boss_phone, student.org_boss_initials,
                    student.resp_post, student.resp_fio, student.resp_phone,
                    student_id
                ))
                conn.commit()
        return {"status": "ok"}
    except Exception as e:
        print(f"ОШИБКА БД: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}/generate-all")
def generate_all(student_id: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM students WHERE id = %s', (student_id,))
            row = cur.fetchone()
            if not row: raise HTTPException(status_code=404)
            columns = [desc[0] for desc in cur.description]
            student_dict = dict(zip(columns, row))
    
    data_tuple = build_template_data(student_dict)
    zip_path = generate_all_docs(data_tuple)
    return FileResponse(zip_path, filename=f"docs_{student_id}.zip")

@router.get("/generate/{student_id}/{suffix:path}")
async def catch_old_button_request(student_id: int, suffix: str):
    return generate_all(student_id)
