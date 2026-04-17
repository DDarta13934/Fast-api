from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from db import get_conn
from psycopg2.extras import RealDictCursor

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/")
async def read_root(request: Request):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Берем только ID и ФИО для списка
            cur.execute('SELECT id, "ФИО_обучающегося" FROM students ORDER BY id')
            students = cur.fetchall()
            return templates.TemplateResponse("index.html", {
                "request": request, 
                "students": students
            })
    finally:
        conn.close()
