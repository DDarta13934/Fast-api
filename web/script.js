// Определяем базовый URL API
const API_BASE = window.location.origin + '/api';
let currentId = null;

// Функция для отладки
function debugLog(message, data) {
    console.log(`[DEBUG] ${message}:`, data);
}

// 1. ЗАГРУЗКА СПИСКА ПРИ ОТКРЫТИИ
async function loadStudents() {
    const loadingBlock = document.getElementById('loadingBlock');
    const errorBlock = document.getElementById('errorBlock');
    const mainInterface = document.getElementById('mainInterface');
    
    loadingBlock.style.display = 'block';
    errorBlock.style.display = 'none';
    mainInterface.style.display = 'none';
    
    // Пробуем разные варианты эндпоинтов (FastAPI часто использует /api/students или /students)
    const endpoints = [
        `${API_BASE}/students`,
        `${API_BASE}/students/`,
        '/api/students',
        '/api/students/',
        '/students',
        '/students/'
    ];
    
    let students = null;
    let successEndpoint = null;
    
    for (const endpoint of endpoints) {
        try {
            debugLog('Пробуем endpoint', endpoint);
            const response = await fetch(endpoint);
            
            if (response.ok) {
                const data = await response.json();
                debugLog('Успешный ответ от', endpoint);
                debugLog('Данные', data);
                
                // Проверяем, что data - это массив
                if (Array.isArray(data)) {
                    students = data;
                } else if (data.students && Array.isArray(data.students)) {
                    students = data.students;
                } else if (data.data && Array.isArray(data.data)) {
                    students = data.data;
                } else {
                    debugLog('Неизвестный формат данных', data);
                    continue;
                }
                
                successEndpoint = endpoint;
                break;
            } else {
                debugLog('Ошибка ответа от', `${endpoint}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            debugLog('Ошибка запроса к', `${endpoint}: ${error.message}`);
        }
    }
    
    if (students && successEndpoint) {
        // Сохраняем рабочий endpoint для дальнейшего использования
        window.workingEndpoint = successEndpoint.replace(/\/$/, '');
        
        const select = document.getElementById("studentSelect");
        select.innerHTML = '<option value="">-- Выберите студента --</option>';
        
        if (students.length === 0) {
            select.innerHTML += '<option value="" disabled>Нет студентов в базе</option>';
        } else {
            students.forEach(s => {
                let opt = document.createElement("option");
                opt.value = s.id || s.ID || s.student_id;
                opt.textContent = s.fio || s.ФИО || s.name || s.full_name || `Студент #${s.id || s.ID}`;
                select.appendChild(opt);
            });
        }
        
        loadingBlock.style.display = 'none';
        mainInterface.style.display = 'block';
        
        showMessage(`✅ Загружено ${students.length} студентов`, 'success');
    } else {
        loadingBlock.style.display = 'none';
        errorBlock.style.display = 'block';
        
        let errorMsg = 'Не удалось загрузить список студентов. ';
        errorMsg += 'Проверьте, что сервер запущен и база данных доступна. ';
        errorMsg += 'Проверьте консоль браузера (F12) для деталей.';
        
        document.getElementById('errorMessage').textContent = errorMsg;
        debugLog('Все endpoints недоступны', 'Проверьте сервер');
    }
}

function retryLoadStudents() {
    loadStudents();
}

// Загружаем студентов при загрузке страницы
window.addEventListener('DOMContentLoaded', loadStudents);

// Авто-загрузка при выборе из списка
document.getElementById('studentSelect').addEventListener('change', function() {
    if (this.value) {
        document.getElementById("practiceId").value = this.value;
        loadData();
    }
});

// 2. ЗАГРУЗКА ДАННЫХ СТУДЕНТА
async function loadData() {
    currentId = document.getElementById("practiceId").value;
    if (!currentId) {
        showMessage('❌ Введите ID студента', 'danger');
        return;
    }

    showMessage('⏳ Загрузка данных...', 'info');
    
    const baseEndpoint = window.workingEndpoint || `${API_BASE}/students`;
    const url = `${baseEndpoint}/${currentId}`;
    
    debugLog('Загрузка данных студента', url);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        debugLog('Данные студента', data);
        
        // Извлекаем данные студента из ответа
        let studentData = data;
        if (data.student) studentData = data.student;
        if (data.data) studentData = data.data;
        
        // Список всех полей для сопоставления
        const fieldMappings = {
            "fio": ["fio", "ФИО", "full_name", "name", "ФИО_обучающегося"],
            "birth_date": ["birth_date", "birthDate", "дата_рождения", "Дата_рождения"],
            "spec_code": ["spec_code", "specCode", "код_специальности", "Код_специальности"],
            "spec_name": ["spec_name", "specName", "специальность", "Наименование_специальности"],
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
            "org_name": ["org_name", "orgName", "организация", "Название_организации"],
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
        
        // Заполняем поля
        for (const [fieldId, possibleNames] of Object.entries(fieldMappings)) {
            const el = document.getElementById(fieldId);
            if (!el) continue;
            
            let value = '';
            for (const name of possibleNames) {
                if (studentData[name] !== undefined && studentData[name] !== null) {
                    value = studentData[name];
                    break;
                }
            }
            el.value = value;
        }
        
        document.getElementById("formContainer").style.display = "block";
        showMessage('✅ Данные загружены', 'success');
        window.scrollTo({ top: 200, behavior: 'smooth' });
        
    } catch (error) {
        debugLog('Ошибка загрузки', error);
        showMessage(`❌ Ошибка: ${error.message}`, 'danger');
    }
}

// 3. СОХРАНЕНИЕ
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

    const baseEndpoint = window.workingEndpoint || `${API_BASE}/students`;
    const url = `${baseEndpoint}/${currentId}`;
    
    debugLog('Сохранение данных', { url, payload });
    showMessage('⏳ Сохранение...', 'info');
    
    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const result = await response.json();
            debugLog('Результат сохранения', result);
            showMessage('✅ Данные успешно сохранены!', 'success');
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        debugLog('Ошибка сохранения', error);
        showMessage(`❌ Ошибка сохранения: ${error.message}`, 'danger');
    }
}

// 4. ГЕНЕРАЦИЯ ДОКУМЕНТОВ
function generateDoc() {
    if (!currentId) {
        showMessage('❌ Сначала выберите студента', 'danger');
        return;
    }

    const checkboxes = document.querySelectorAll('.doc-checkbox:checked');
    const selectedDocs = Array.from(checkboxes).map(cb => cb.value);

    if (selectedDocs.length === 0) {
        showMessage('❌ Выберите хотя бы один документ', 'danger');
        return;
    }

    const baseEndpoint = window.workingEndpoint || `${API_BASE}/students`;
    const filesParam = encodeURIComponent(selectedDocs.join(','));
    const url = `${baseEndpoint}/${currentId}/generate-all?files=${filesParam}`;
    
    debugLog('Генерация документов', url);
    showMessage('📄 Запускаем генерацию документов...', 'info');
    window.location.href = url;
}

// Вспомогательная функция для показа сообщений
function showMessage(text, type = 'info') {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = text;
    resultDiv.className = `alert alert-${type} py-2 text-center small mb-3`;
    resultDiv.style.display = 'block';
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 5000);
}
