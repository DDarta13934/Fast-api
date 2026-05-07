// ===== Автоопределение API =====
let API_STUDENTS_LIST = null;   // GET-эндпоинт для списка студентов
let API_STUDENT_DETAIL = null;  // GET-эндпоинт для одного студента (с {id})
let API_STUDENT_UPDATE = null;  // PUT-эндпоинт для сохранения
let currentId = null;

async function discoverEndpoints() {
    try {
        const res = await fetch('/openapi.json');
        if (!res.ok) throw new Error('openapi.json не найден');
        const spec = await res.json();
        const paths = spec.paths || {};

        for (const [path, methods] of Object.entries(paths)) {
            const get = methods.get;
            const put = methods.put;

            // Ищем GET, который возвращает список (без параметров в пути)
            if (get) {
                const hasIdParam = path.includes('{student_id}') || path.includes('{id}');
                if (!hasIdParam && !API_STUDENTS_LIST) {
                    API_STUDENTS_LIST = path;
                    console.log('[AUTO] Список студентов:', path);
                } else if (hasIdParam && !API_STUDENT_DETAIL) {
                    API_STUDENT_DETAIL = path;
                    console.log('[AUTO] Детали студента:', path);
                }
            }

            // Ищем PUT
            if (put && !API_STUDENT_UPDATE) {
                API_STUDENT_UPDATE = path;
                console.log('[AUTO] Обновление студента:', path);
            }
        }

        if (!API_STUDENTS_LIST) {
            console.warn('Не удалось найти эндпоинт списка студентов, использую /api/students');
            API_STUDENTS_LIST = '/api/students';
        }
        if (!API_STUDENT_DETAIL) {
            console.warn('Не удалось найти эндпоинт одного студента, использую /api/students/{id}');
            API_STUDENT_DETAIL = '/api/students/{id}';
        }
        if (!API_STUDENT_UPDATE) {
            console.warn('Не удалось найти эндпоинт обновления, использую /api/students/{id}');
            API_STUDENT_UPDATE = '/api/students/{id}';
        }

        return true;
    } catch (e) {
        console.error('Ошибка автоопределения эндпоинтов:', e);
        // Fallback
        API_STUDENTS_LIST = '/api/students';
        API_STUDENT_DETAIL = '/api/students/{id}';
        API_STUDENT_UPDATE = '/api/students/{id}';
        return false;
    }
}

// ===== Загрузка списка =====
async function loadStudents() {
    const loadingBlock = document.getElementById('loadingBlock');
    const errorBlock = document.getElementById('errorBlock');
    const mainInterface = document.getElementById('mainInterface');

    loadingBlock.style.display = 'block';
    errorBlock.style.display = 'none';
    mainInterface.style.display = 'none';

    if (!API_STUDENTS_LIST) {
        await discoverEndpoints();
    }

    try {
        const response = await fetch(API_STUDENTS_LIST);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let students;
        if (Array.isArray(data)) students = data;
        else if (data.students) students = data.students;
        else if (data.data) students = data.data;
        else throw new Error('Неизвестный формат списка');

        const select = document.getElementById("studentSelect");
        select.innerHTML = '<option value="">-- Выберите студента --</option>';
        students.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id ?? s.ID ?? s.student_id;
            opt.textContent = s.fio || s.ФИО || s.name || s.full_name || `Студент #${opt.value}`;
            select.appendChild(opt);
        });

        loadingBlock.style.display = 'none';
        mainInterface.style.display = 'block';
        showMessage(`✅ Загружено ${students.length} студентов`, 'success');
    } catch (error) {
        loadingBlock.style.display = 'none';
        errorBlock.style.display = 'block';
        document.getElementById('errorMessage').textContent =
            `Не удалось загрузить список: ${error.message}`;
        console.error(error);
    }
}

function retryLoadStudents() {
    discoverEndpoints().then(() => loadStudents());
}

window.addEventListener('DOMContentLoaded', async () => {
    await discoverEndpoints();
    await loadStudents();

    document.getElementById('studentSelect').addEventListener('change', function () {
        if (this.value) {
            document.getElementById("practiceId").value = this.value;
            loadData();
        }
    });
});

// ===== Загрузка данных одного студента =====
async function loadData() {
    currentId = document.getElementById("practiceId").value;
    if (!currentId) {
        showMessage('❌ Введите ID студента', 'danger');
        return;
    }

    if (!API_STUDENT_DETAIL) await discoverEndpoints();
    const url = API_STUDENT_DETAIL.replace('{student_id}', currentId).replace('{id}', currentId);
    showMessage('⏳ Загрузка данных...', 'info');

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let student = data;
        if (data.student) student = data.student;
        else if (data.data) student = data.data;

        const fieldMap = {
            "fio": ["fio", "ФИО", "full_name", "name", "ФИО_обучающегося"],
            "birth_date": ["birth_date", "birthDate", "дата_рождения"],
            "spec_code": ["spec_code", "specCode", "код_специальности"],
            "spec_name": ["spec_name", "specName", "специальность"],
            "module_name": ["module_name", "moduleName", "модуль", "ПМ"],
            "hours": ["hours", "часы", "hours_count"],
            "start_day": ["start_day", "startDay"],
            "start_month": ["start_month", "startMonth"],
            "start_year": ["start_year", "startYear"],
            "end_day": ["end_day", "endDay"],
            "end_month": ["end_month", "endMonth"],
            "end_year": ["end_year", "endYear"],
            "teacher_fio": ["teacher_fio", "teacherFio", "преподаватель"],
            "teacher_phone": ["teacher_phone", "teacherPhone", "телефон_преподавателя"],
            "org_name": ["org_name", "orgName", "организация"],
            "org_address": ["org_address", "orgAddress", "адрес_организации"],
            "rooms": ["rooms", "помещения"],
            "org_boss_post": ["org_boss_post", "orgBossPost", "должность_рук"],
            "org_boss_fio": ["org_boss_fio", "orgBossFio", "фио_рук"],
            "org_boss_phone": ["org_boss_phone", "orgBossPhone", "телефон_рук"],
            "org_boss_initials": ["org_boss_initials", "orgBossInitials", "инициалы_рук"],
            "resp_post": ["resp_post", "respPost", "должность_отв"],
            "resp_fio": ["resp_fio", "respFio", "фио_отв"],
            "resp_phone": ["resp_phone", "respPhone", "телефон_отв"]
        };

        for (const [id, keys] of Object.entries(fieldMap)) {
            const el = document.getElementById(id);
            if (!el) continue;
            let val = '';
            for (const k of keys) {
                if (student[k] !== undefined && student[k] !== null) {
                    val = student[k];
                    break;
                }
            }
            el.value = val;
        }

        document.getElementById("formContainer").style.display = "block";
        showMessage('✅ Данные загружены', 'success');
        window.scrollTo({ top: 200, behavior: 'smooth' });
    } catch (error) {
        showMessage(`❌ Ошибка: ${error.message}`, 'danger');
        console.error(error);
    }
}

// ===== Сохранение =====
async function saveData() {
    if (!currentId) {
        showMessage('❌ Сначала загрузите данные студента', 'danger');
        return;
    }

    const payload = {};
    const fields = [
        "fio", "birth_date", "spec_code", "spec_name", "module_name", "hours",
        "start_day", "start_month", "start_year", "end_day", "end_month", "end_year",
        "teacher_fio", "teacher_phone", "org_name", "org_address", "rooms",
        "org_boss_post", "org_boss_fio", "org_boss_phone", "org_boss_initials",
        "resp_post", "resp_fio", "resp_phone"
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) payload[id] = el.value;
    });

    if (!API_STUDENT_UPDATE) await discoverEndpoints();
    const url = API_STUDENT_UPDATE.replace('{student_id}', currentId).replace('{id}', currentId);

    showMessage('⏳ Сохранение...', 'info');
    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showMessage('✅ Данные сохранены', 'success');
    } catch (error) {
        showMessage(`❌ Ошибка сохранения: ${error.message}`, 'danger');
        console.error(error);
    }
}

// ===== Генерация docx =====
function generateDoc() {
    if (!currentId) {
        showMessage('❌ Сначала выберите студента', 'danger');
        return;
    }
    const checked = document.querySelectorAll('.doc-checkbox:checked');
    if (checked.length === 0) {
        showMessage('❌ Выберите документы', 'danger');
        return;
    }
    const files = Array.from(checked).map(cb => cb.value).join(',');
    const base = API_STUDENT_UPDATE || '/api/students/{id}';
    const genUrl = base
        .replace('{student_id}', currentId)
        .replace('{id}', currentId) + '/generate-all?files=' + encodeURIComponent(files);
    showMessage('📄 Запускаем генерацию...', 'info');
    window.location.href = genUrl;
}

function showMessage(text, type = 'info') {
    const div = document.getElementById('result');
    div.textContent = text;
    div.className = `alert alert-${type} py-2 text-center small mb-3`;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 5000);
}
