const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
let filter = "all";

function todayIndex() {
  return (new Date().getDay() + 1) % 7;
}
let tasks = JSON.parse(localStorage.getItem("tasksV2")) || [];
let userName = localStorage.getItem("myName") || "";
let dark = localStorage.getItem("dark") === "1";

function save() {
  localStorage.setItem("tasksV2", JSON.stringify(tasks));
  localStorage.setItem("myName", userName);
  localStorage.setItem("dark", dark ? "1" : "0");
}

function openApp() {
  document.getElementById("welcomeBox").hidden = true;
  document.getElementById("mainApp").hidden = false;
  document.getElementById("greeting").textContent = "📚 أهلاً يا " + userName + "، نظم يومك هنا 🚀";
  showTasks();
}

function applyTheme() {
  document.body.classList.toggle("dark", dark);
  document.getElementById("themeBtn").textContent = dark ? "☀️" : "🌙";
}

function saveName() {
  let name = document.getElementById("nameInput").value.trim();
  if (name === "") {
    alert("اكتب اسمك الأول!");
    return;
  }
  userName = name;
  save();
  openApp();
}

function addTask() {
  let name = document.getElementById("taskInput").value.trim();
  if (name === "") {
    alert("اكتب اسم المهمة الأول يا " + userName + "!");
    return;
  }
  tasks.push({
    name: name,
    cat: document.getElementById("catInput").value,
    day: Number(document.getElementById("dayInput").value),
    time: document.getElementById("timeInput").value,
    done: false
  });
  tasks.sort(function(a, b) {
    return a.day - b.day || a.time.localeCompare(b.time);
  });
  save();
  document.getElementById("taskInput").value = "";
  showTasks();
}

function toggleDone(i) {
  tasks[i].done = !tasks[i].done;
  save();
  showTasks();
}

function deleteTask(i) {
  tasks.splice(i, 1);
  save();
  showTasks();
}

function showTasks() {
  let done = tasks.filter(function(t) { return t.done; }).length;
  let percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  document.getElementById("bar").style.width = percent + "%";

  let counter = document.getElementById("counter");
  if (tasks.length === 0) {
    counter.textContent = "لسه مبدأتش 😴";
  } else if (done === tasks.length) {
    counter.textContent = "عاااااش يا وحش! خلصت كل حاجة 🏆🔥";
  } else {
    counter.textContent = "🎯 خلصت " + done + " من " + tasks.length + " (" + percent + "%)";
  }

  let list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(function(t, i) {
        if (filter === "active" && t.done) return;
    if (filter === "done" && !t.done) return;
    let li = document.createElement("li");
    if (t.done) li.className = "done";
    if (t.day === todayIndex() && !t.done) li.classList.add("today");
    let title = document.createElement("b");
    title.textContent = t.cat + " " + t.name;

    let info = document.createElement("span");
    info.textContent = "📅 " + days[t.day] + (t.time ? " | ⏰ " + t.time : "");

    let doneBtn = document.createElement("button");
    doneBtn.className = "doneBtn";
    doneBtn.textContent = t.done ? "↩️ رجعها" : "✅ خلصتها";
    doneBtn.onclick = function() { toggleDone(i); };

    let delBtn = document.createElement("button");
    delBtn.textContent = "🗑️ حذف";
    delBtn.onclick = function() { deleteTask(i); };

    li.append(title, info, doneBtn, delBtn);
    list.appendChild(li);
  });
}

document.getElementById("saveNameBtn").addEventListener("click", saveName);
document.getElementById("addBtn").addEventListener("click", addTask);

document.getElementById("themeBtn").addEventListener("click", function() {
  dark = !dark;
  save();
  applyTheme();
});

document.getElementById("clearBtn").addEventListener("click", function() {
  if (confirm("متأكد تمسح كل المهام يا " + userName + "؟")) {
    tasks = [];
    save();
    showTasks();
  }
});

document.getElementById("nameInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") saveName();
});

document.getElementById("taskInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") addTask();
});
document.querySelectorAll(".filterBtn").forEach(function(btn) {
  btn.addEventListener("click", function() {
    filter = btn.dataset.filter;
    document.querySelectorAll(".filterBtn").forEach(function(b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    showTasks();
  });
});
let pomoSeconds = 25 * 60;
let pomoTimer = null;
let pomoStudy = true;

function showPomo() {
  let m = Math.floor(pomoSeconds / 60);
  let s = pomoSeconds % 60;
  document.getElementById("pomoTime").textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  document.getElementById("pomoMode").textContent =
    pomoStudy ? "📚 وقت مذاكرة" : "☕ وقت راحة";
}

function tick() {
  pomoSeconds--;
  if (pomoSeconds <= 0) {
    pomoStudy = !pomoStudy;
    pomoSeconds = pomoStudy ? 25 * 60 : 5 * 60;
    if (navigator.vibrate) navigator.vibrate(500);
  }
  showPomo();
}

document.getElementById("pomoStart").addEventListener("click", function() {
  if (pomoTimer === null) {
    pomoTimer = setInterval(tick, 1000);
    this.textContent = "⏸️ إيقاف";
  } else {
    clearInterval(pomoTimer);
    pomoTimer = null;
    this.textContent = "▶️ ابدأ";
  }
});

document.getElementById("pomoReset").addEventListener("click", function() {
  clearInterval(pomoTimer);
  pomoTimer = null;
  pomoStudy = true;
  pomoSeconds = 25 * 60;
  document.getElementById("pomoStart").textContent = "▶️ ابدأ";
  showPomo();
});

showPomo();
applyTheme();
if (userName !== "") openApp();
