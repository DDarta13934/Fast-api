from pydantic import BaseModel
from typing import Optional
from datetime import date

class PracticeUpdate(BaseModel):
    fio: Optional[str]
    group_name: Optional[str]
    practice_start: Optional[date]
    practice_end: Optional[date]
    practice_place: Optional[str]
