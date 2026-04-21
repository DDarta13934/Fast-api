const tg = window.Telegram.WebApp;
tg.expand();

const API = ""; // пусто = тот же домен

let currentId = null;

function show(text) {
    const resDiv = document.getElementById("result");
    resDiv.innerText = text;
    
    // Меняем цвет в зависимости от результата
    if (text.includes("✅")) {
        resDiv.className = "alert alert-success py-2 text-center small mb-3";
    } else if (text.includes("❌")) {
        resDiv.className = "alert alert-danger py-2 text-center small mb-3";
    } else {
        resDiv.className = "alert alert-info py-2 text-center small mb-3";
    }
}

// 📥 ЗАГРУЗКА
async function loadData() {
  currentId = document.getElementById("practiceId").value;
  if (!currentId) return;
  
  show("⏳ Загружаем данные...");

  try {
    // Добавили /students/ в путь
    const res = await fetch(`/students/${currentId}`); 
    const data = await res.json();

    if (res.status === 404) throw new Error("not_found");

    // Заполняем поля (используем имена ключей из твоего students.py)
    document.getElementById("fio").value = data.fio || "";
    document.getElementById("org_name").value = data.org_name || "";
    // Примечание: в твоем Python коде сейчас нет передачи teacher и дат, 
    // они пока останутся пустыми, пока не допишешь их в students.py
    
    document.getElementById("form").style.display = "block";
    show("✅ Данные загружены");
  } catch (err) {
    show("❌ Запись не найдена");
  }
}

// 💾 СОХРАНЕНИЕ
async function saveData() {
    if (!currentId) return;

    const day = document.getElementById("start_day").value;
    const month = document.getElementById("start_month").value;
    const year = document.getElementById("start_year").value;
    const fullDate = `${day} ${month} ${year}`;

    const updateData = {
        fio: document.getElementById("fio").value,
        org_name: document.getElementById("org_name").value,
        module_name: "ПМ.01", // Можно вынести в отдельное поле ввода
        teacher: document.getElementById("teacher").value,
        start_date: fullDate
    };

    show("⏳ Сохраняем...");

    try {
        const res = await fetch(`/students/${currentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            show("✅ Данные обновлены в базе");
        } else {
            throw new Error("Ошибка сохранения");
        }
    } catch (err) {
        show("❌ Не удалось сохранить данные");
    }
}

// 📄 ГЕНЕРАЦИЯ (теперь обе кнопки ведут на ZIP, так как это работает)
function generateDoc() {
    generateAll();
}

function generateAll() {
    if (!currentId) return show("❌ Сначала загрузите данные студента");
    // Этот путь у нас работает в браузере!
    window.location.href = `/students/${currentId}/generate-all`;
}

// 📦 ВСЕ ДОКУМЕНТЫ
function generateAll() {
  if (!currentId) return show("❌ Выберите студента");
  window.location = `/students/${currentId}/generate-all`;
}

// 📨 ОТПРАВКА В TELEGRAM
function sendToTelegram() {
  const chatId = tg.initDataUnsafe.user.id;
  show("📨 Отправляем в Telegram...");

  fetch(
    `${API}/send/${currentId}/Аттестационный лист производственная/${chatId}`
  ).then(() => show("✅ Документ отправлен"));
}
