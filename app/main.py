from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers.students import router as students_router
from app.routers.ui import router as ui_router

app = FastAPI()

# Подключаем роутеры БЕЗ префикса здесь, так как они уже есть внутри файлов
app.include_router(ui_router)
app.include_router(students_router)

app.mount("/static", StaticFiles(directory="static"), name="static")