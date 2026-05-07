const tg = window.Telegram.WebApp;
tg.expand();

const API = ""; 
let currentId = null;

function show(text) {
    const resDiv = document.getElementById("result");
    resDiv.innerText = text;
    if (text.includes("✅")) {
        resDiv.className = "alert alert-success py-2 text-center small mb-3";
    } else if (text.includes("❌")) {
        resDiv.className = "alert alert-danger py-2 text-center small mb-3";
    } else {
        resDiv.className = "alert alert-info py-2 text-center small mb-3";
    }
}

// 📥 ЗАГРУЗКА (заполняем все 24 поля)
async function loadData() {
    currentId = document.getElementById("practiceId").value;
    if (!currentId) return;
    
    show("⏳ Загружаем данные...");

    try {
        const res = await fetch(`/students/${currentId}`); 
        const data = await res.json();

        if (res.status === 404) throw new Error("not_found");

        // Расставляем данные по ID (имена ключей должны совпадать с JSON из Python)
        document.getElementById("fio").value = data.fio || "";
        document.getElementById("birth_date").value = data.birth_date || "";
        document.getElementById("module_name").value = data.module_name || "";
        document.getElementById("start_day").value = data.start_day || "";
        document.getElementById("start_month").value = data.start_month || "";
        document.getElementById("start_year").value = data.start_year || "";
        document.getElementById("end_day").value = data.end_day || "";
        document.getElementById("end_month").value = data.end_month || "";
        document.getElementById("end_year").value = data.end_year || "";
        document.getElementById("spec_code").value = data.spec_code || "";
        document.getElementById("spec_name").value = data.spec_name || "";
        document.getElementById("hours").value = data.hours || "";
        document.getElementById("teacher_fio").value = data.teacher_fio || "";
        document.getElementById("teacher_phone").value = data.teacher_phone || "";
        document.getElementById("org_name").value = data.org_name || "";
        document.getElementById("org_address").value = data.org_address || "";
        document.getElementById("rooms").value = data.rooms || "";
        document.getElementById("org_boss_post").value = data.org_boss_post || "";
        document.getElementById("org_boss_fio").value = data.org_boss_fio || "";
        document.getElementById("org_boss_phone").value = data.org_boss_phone || "";
        document.getElementById("org_boss_initials").value = data.org_boss_initials || "";
        document.getElementById("resp_post").value = data.resp_post || "";
        document.getElementById("resp_fio").value = data.resp_fio || "";
        document.getElementById("resp_phone").value = data.resp_phone || "";
        
        document.getElementById("form").style.display = "block";
        show("✅ Данные загружены");
    } catch (err) {
        show("❌ Запись не найдена");
    }
}

// 💾 СОХРАНЕНИЕ (собираем все 24 поля)
async function saveData() {
    if (!currentId) return;

    // Собираем объект в точном соответствии с StudentUpdateModel в Python
    const updateData = {
        fio: document.getElementById("fio").value,
        birth_date: document.getElementById("birth_date").value,
        module_name: document.getElementById("module_name").value,
        start_day: document.getElementById("start_day").value,
        start_month: document.getElementById("start_month").value,
        start_year: document.getElementById("start_year").value,
        end_day: document.getElementById("end_day").value,
        end_month: document.getElementById("end_month").value,
        end_year: document.getElementById("end_year").value,
        spec_code: document.getElementById("spec_code").value,
        spec_name: document.getElementById("spec_name").value,
        hours: document.getElementById("hours").value,
        teacher_fio: document.getElementById("teacher_fio").value,
        teacher_phone: document.getElementById("teacher_phone").value,
        org_name: document.getElementById("org_name").value,
        org_address: document.getElementById("org_address").value,
        rooms: document.getElementById("rooms").value,
        org_boss_post: document.getElementById("org_boss_post").value,
        org_boss_fio: document.getElementById("org_boss_fio").value,
        org_boss_phone: document.getElementById("org_boss_phone").value,
        org_boss_initials: document.getElementById("org_boss_initials").value,
        resp_post: document.getElementById("resp_post").value,
        resp_fio: document.getElementById("resp_fio").value,
        resp_phone: document.getElementById("resp_phone").value
    };

    show("⏳ Сохраняем...");

    try {
        // Отправляем на /students/, так как мы обновили роутеры
        const res = await fetch(`/students/${currentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            show("✅ Данные обновлены в базе");
        } else {
            const errorInfo = await res.json();
            console.error("Ошибка сервера:", errorInfo);
            throw new Error("Ошибка сохранения");
        }
    } catch (err) {
        show("❌ Не удалось сохранить данные");
    }
}

// 📄 ГЕНЕРАЦИЯ
function generateAll() {
    if (!currentId) return show("❌ Сначала загрузите данные студента");
    window.location.href = `/students/${currentId}/generate-all`;
}

// 📨 ОТПРАВКА В TELEGRAM
function sendToTelegram() {
    if (!tg.initDataUnsafe.user) return show("❌ Откройте через Telegram");
    const chatId = tg.initDataUnsafe.user.id;
    show("📨 Отправляем в Telegram...");

    fetch(`${API}/send/${currentId}/Документы/${chatId}`)
        .then(() => show("✅ Документы отправлены"))
        .catch(() => show("❌ Ошибка отправки"));
}
