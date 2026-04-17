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
  show("⏳ Загружаем данные...");

  try {
    const res = await fetch(`${API}/practice/${currentId}`);
    const data = await res.json();

    if (data.error) throw new Error();

    document.getElementById("fio").value =
      data["ФИО_обучающегося"] || "";

    document.getElementById("start_month").value =
      data["месяц_начала_ПП"] || "";

    document.getElementById("form").style.display = "block";
    show("✅ Данные загружены");
  } catch {
    show("❌ Запись не найдена");
  }
}

// 💾 СОХРАНЕНИЕ
async function saveData() {
  show("💾 Сохраняем...");

  await fetch(`${API}/practice/${currentId}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      "ФИО_обучающегося": document.getElementById("fio").value,
      "месяц_начала_ПП": document.getElementById("start_month").value
    })
  });

  show("✅ Сохранено");
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
