from pathlib import Path
from zipfile import ZipFile
from app.services.document_service import generate_doc

TEMPLATES = {
    "report_prod": "Отчёт производственная.docx",
    "report_edu": "Отчёт учебная.docx",
    "attestation_prod": "Аттестационный лист производственная.docx",
    "attestation_edu": "Аттестационный лист учебная.docx",
}

def generate_all_docs(student: dict, student_id: int) -> Path:
    files = []

    for key, template in TEMPLATES.items():
        path = generate_doc(
            data=student,
            template_name=template,
            output_name=f"{key}_{student_id}.docx"
        )
        files.append(path)

    zip_path = Path("generated") / f"documents_{student_id}.zip"

    with ZipFile(zip_path, "w") as zipf:
        for file in files:
            zipf.write(file, arcname=file.name)

    return zip_path
