from fastapi import APIRouter
from app.db import conn

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/")
def get_students():
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 
                id,
                "{{ФИО_обучающегося}}" AS fio
            FROM students
            ORDER BY id
        """)
        rows = cur.fetchall()

    return [
        {
            "id": row[0],
            "fio": row[1]
        }
        for row in rows
    ]
