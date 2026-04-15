from docx import Document
from pathlib import Path
import zipfile
import uuid
import os

# Автоматическое определение пути к папке проекта
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
GENERATED_DIR = Path("generated")
GENERATED_DIR.mkdir(exist_ok=True)

def replace_text(doc, data: dict):
    """Рекурсивная замена текста в параграфах и таблицах"""
    for p in doc.paragraphs:
        for key, value in data.items():
            if key in p.text:
                for run in p.runs:
                    run.text = run.text.replace(key, str(value or ""))
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                replace_text(cell, data)

def build_template_data(student_row: dict) -> dict:
    """
    Сопоставляет колонки из БД с метками в Word.
    Я учел скобки и регистр со скриншота твоей БД.
    """
    return {
        "{{ФИО_обучающегося}}": student_row.get("ФИО_обучающегося"),
        "{{дата_рождения}}": student_row.get("{{Дата_рождения}}"),
        "{{наименование_специальности}}": student_row.get("{{наименование_специальности}}"),
        "{{наименование_модуля}}": student_row.get("наименование_модуля"),
        "{{день_начала_ПП}}": student_row.get("день_начала_ПП"),
        "{{месяц_начала_ПП}}": student_row.get("месяц_начала_ПП"),
        "{{год_начала_ПП}}": student_row.get("год_начала_ПП"),
        "{{день_конца_ПП}}": student_row.get("день_конца_ПП"),
        "{{месяц_конца_ПП}}": student_row.get("месяц_конца_ПП"),
        "{{год_конца_ПП}}": student_row.get("год_конца_ПП"),
        "{{название_организации}}": student_row.get("название_организации"),
        "{{адрес_организации}}": student_row.get("адрес_организации"),
        "{{тел_отв_организации}}": student_row.get("тел_отв_организации"),
        "{{ФИО_отв_организации}}": student_row.get("ФИО_отв_организации"),
        "{{код_специальности}}": student_row.get("{{код_специальности}}"),
        "{{ФИО_преподавателя}}": student_row.get("{{ФИО_преподавателя}}"),
    }

def generate_all_docs(student_data: dict):
    """Основная логика генерации ZIP-архива"""
    templates = [
        "Отчёт производственная.docx",
        "Отчёт учебная.docx",
        "Аттестационный лист производственная.docx",
        "Аттестационный лист учебная.docx",
    ]

    folder_name = str(uuid.uuid4())[:8]
    work_dir = GENERATED_DIR / folder_name
    work_dir.mkdir(exist_ok=True)
    
    generated_files = []
    
    print(f"\n--- ПРОВЕРКА ШАБЛОНОВ В: {TEMPLATES_DIR} ---")
    
    for tpl in templates:
        tpl_path = TEMPLATES_DIR / tpl
        out_file = work_dir / tpl
        
        if not tpl_path.exists():
            print(f"❌ ФАЙЛ НЕ НАЙДЕН: {tpl_path}")
            continue
            
        try:
            doc = Document(tpl_path)
            replace_text(doc, student_data) 
            doc.save(out_file)
            generated_files.append(out_file)
            print(f"✅ УСПЕШНО СОЗДАН: {tpl}")
        except Exception as e:
            print(f"🔥 ОШИБКА ПРИ ОБРАБОТКЕ {tpl}: {e}")

    zip_filename = f"docs_{folder_name}.zip"
    zip_path = GENERATED_DIR / zip_filename
    
    with zipfile.ZipFile(zip_path, "w") as z:
        for f in generated_files:
            z.write(f, arcname=f.name)
            
    return zip_path