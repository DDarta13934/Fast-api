from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers.students import router as students_router
from app.routers.ui import router as ui_router

# Параметр redirect_slashes=False вылечит ошибку 404 для /students/
app = FastAPI(redirect_slashes=False)

app.include_router(ui_router)
app.include_router(students_router)

app.mount("/static", StaticFiles(directory="static"), name="static")
