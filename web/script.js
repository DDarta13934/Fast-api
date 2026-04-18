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
    const res = await fetch(`${API}/practice/${currentId}`);
    const data = await res.json();

    if (data.error) throw new Error();

    // Загружаем ВСЕ поля, чтобы они отобразились в интерфейсе
    document.getElementById("fio").value = data["ФИО_обучающегося"] || "";
    document.getElementById("teacher").value = data["ФИО_преподавателя"] || "";
    document.getElementById("start_day").value = data["день_начала_ПП"] || "";
    document.getElementById("start_month").value = data["месяц_начала_ПП"] || "";
    document.getElementById("start_year").value = data["год_начала_ПП"] || "";
    document.getElementById("org_name").value = data["название_организации"] || "";

    document.getElementById("form").style.display = "block";
    show("✅ Данные загружены");
  } catch {
    show("❌ Запись не найдена");
  }
}

// 💾 СОХРАНЕНИЕ
async function saveData() {
  if (!currentId) return;
  show("💾 Сохраняем...");

  try {
    const res = await fetch(`${API}/practice/${currentId}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        "ФИО_обучающегося": document.getElementById("fio").value,
        "ФИО_преподавателя": document.getElementById("teacher").value,
        "день_начала_ПП": document.getElementById("start_day").value,
        "месяц_начала_ПП": document.getElementById("start_month").value,
        "год_начала_ПП": document.getElementById("start_year").value,
        // Вот оно — наше новое поле организации!
        "название_организации": document.getElementById("org_name").value 
      })
    });

    if (res.ok) {
        show("✅ Сохранено");
    } else {
        show("❌ Ошибка сохранения");
    }
  } catch {
    show("❌ Ошибка сети");
  }
}

// 📄 ГЕНЕРАЦИЯ ОДНОГО ДОКУМЕНТА
function generateDoc() {
  if (!currentId) {
      show("❌ Сначала выберите студента!");
      return;
  }
  show("📄 Генерируем документ...");
  window.location = `${API}/generate/${currentId}/Аттестационный лист производственная`;
}

// 📦 ВСЕ ДОКУМЕНТЫ
function generateAll() {
  show("📦 Генерируем документы...");
  window.location = `${API}/generate_all/${currentId}`;
}

// 📨 ОТПРАВКА В TELEGRAM
function sendToTelegram() {
  const chatId = tg.initDataUnsafe.user.id;
  show("📨 Отправляем в Telegram...");

  fetch(
    `${API}/send/${currentId}/Аттестационный лист производственная/${chatId}`
  ).then(() => show("✅ Документ отправлен"));
}
