from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers.students import router as students_router
from app.routers.ui import router as ui_router

# Настраиваем redirect_slashes=False, чтобы /students и /students/ работали одинаково
app = FastAPI(redirect_slashes=False)

app.include_router(ui_router)
# Подключаем студентов
app.include_router(students_router)

app.mount("/static", StaticFiles(directory="static"), name="static")

# УДАЛИ отсюда @app.get("/get_student"), он мешает!
