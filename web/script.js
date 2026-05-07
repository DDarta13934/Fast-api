const tg = window.Telegram.WebApp;
tg.expand();

const API = ""; 
let currentId = null;

// Красивые уведомления в блоке result
function show(text) {
    const resDiv = document.getElementById("result");
    if (!resDiv) return;
    resDiv.innerText = text;
    resDiv.className = "alert py-2 text-center small mb-3 " + 
        (text.includes("✅") ? "alert-success" : text.includes("❌") ? "alert-danger" : "alert-info");
}

// 1. ЗАГРУЗКА СПИСКА СТУДЕНТОВ (Вызывается при загрузке страницы)
async function fetchStudents() {
    try {
        const res = await fetch('/students'); 
        const students = await res.json();
        const select = document.getElementById("studentSelect"); // Убедись, что в HTML есть этот ID
        
        if (!select) return;
        select.innerHTML = '<option value="">-- Выберите студента --</option>';

        students.forEach(s => {
            let opt = document.createElement("option");
            opt.value = s.id;
            // Проверяем разные варианты ключей имени
            opt.innerHTML = s.fio || s.ФИО_обучающегося || `ID: ${s.id}`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Ошибка загрузки списка:", e);
    }
}

// Запускаем подгрузку списка сразу
fetchStudents();

// 2. ЗАГРУЗКА ДАННЫХ ВЫБРАННОГО СТУДЕНТА
async function loadData() {
    const select = document.getElementById("studentSelect");
    const practiceInput = document.getElementById("practiceId");
    
    // Берем ID либо из списка, либо из ручного ввода
    currentId = (select && select.value) || (practiceInput && practiceInput.value);

    if (!currentId) return show("❌ Выберите студента из списка");
    
    show("⏳ Загружаем данные...");

    try {
        const res = await fetch(`/students/${currentId}`); 
        const data = await res.json();

        if (res.status === 404) throw new Error("not_found");

        // Маппинг данных (ключ в JSON : ID инпута в HTML)
        const fields = {
            "fio": data.fio, "birth_date": data.birth_date, "module_name": data.module_name,
            "start_day": data.start_day, "start_month": data.start_month, "start_year": data.start_year,
            "end_day": data.end_day, "end_month": data.end_month, "end_year": data.end_year,
            "spec_code": data.spec_code, "spec_name": data.spec_name, "hours": data.hours,
            "teacher_fio": data.teacher_fio, "teacher_phone": data.teacher_phone, "org_name": data.org_name,
            "org_address": data.org_address, "rooms": data.rooms, "org_boss_post": data.org_boss_post,
            "org_boss_fio": data.org_boss_fio, "org_boss_phone": data.org_boss_phone, 
            "org_boss_initials": data.org_boss_initials, "resp_post": data.resp_post,
            "resp_fio": data.resp_fio, "resp_phone": data.resp_phone
        };

        for (let key in fields) {
            const el = document.getElementById(key);
            if (el) el.value = fields[key] || "";
        }
        
        document.getElementById("form").style.display = "block";
        show("✅ Данные загружены");
    } catch (err) {
        show("❌ Запись не найдена");
    }
}

// 3. СОХРАНЕНИЕ
async function saveData() {
    if (!currentId) return;

    const updateData = {};
    const fieldIds = [
        "fio", "birth_date", "module_name", "start_day", "start_month", "start_year",
        "end_day", "end_month", "end_year", "spec_code", "spec_name", "hours",
        "teacher_fio", "teacher_phone", "org_name", "org_address", "rooms",
        "org_boss_post", "org_boss_fio", "org_boss_phone", "org_boss_initials",
        "resp_post", "resp_fio", "resp_phone"
    ];

    fieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) updateData[id] = el.value;
    });

    show("⏳ Сохраняем...");

    try {
        const res = await fetch(`/students/${currentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) show("✅ Данные обновлены");
        else throw new Error();
    } catch (err) {
        show("❌ Не удалось сохранить");
    }
}

// 4. ГЕНЕРАЦИЯ (заменяем твою старую функцию на эту)
function generateDoc() {
    if (!currentId) {
        return show("❌ Сначала выберите студента и загрузите данные");
    }

    // 1. Ищем все чекбоксы документов, которые выбрал пользователь
    const checkboxes = document.querySelectorAll('.doc-checkbox:checked');
    const selectedDocs = Array.from(checkboxes).map(cb => cb.value);

    // 2. Проверяем, выбрано ли хоть что-то
    if (selectedDocs.length === 0) {
        return show("❌ Выберите хотя бы один документ галочкой");
    }

    show("⏳ Подготовка архива...");

    // 3. Формируем строку с файлами (через запятую)
    const filesParam = encodeURIComponent(selectedDocs.join(','));
    
    // 4. Отправляем запрос на сервер (именно этот путь мы прописали в Python)
    window.location.href = `/students/${currentId}/generate-all?files=${filesParam}`;
}
