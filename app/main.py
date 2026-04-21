from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers.students import router as students_router
from app.routers.ui import router as ui_router

app = FastAPI()

# Подключаем роутеры. 
# Теперь ВСЕ операции со студентами будут идти через /students/...
app.include_router(ui_router)
app.include_router(students_router)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Я удалил отсюда @app.get("/get_student"), 
# потому что этот путь теперь есть внутри students_router.
