
"use strict";

const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString("en-CA");

const defaultState = {
  tasks: [],
  schedule: [],
  gems: 0,
  pages: 0,
  focusMinutes: 0,
  streak: 0,
  lastActive: "",
  theme: "light",
  daily: {}
};

let state = loadState();
let filter = "all";

let timer = {
  interval: null,
  remaining: 25 * 60,
  running: false,
  mode: "focus",
  lastTick: 0
};

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem("tarkeeziData"));

    if(saved && typeof saved === "object"){
      return {
        ...defaultState,
        ...saved,
        tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
        schedule: Array.isArray(saved.schedule) ? saved.schedule : [],
        daily: saved.daily && typeof saved.daily === "object"
          ? saved.daily : {}
      };
    }
  }catch(error){
    console.error("Storage error:",error);
  }

  return {...defaultState};
}

function saveState(){
  try{
    localStorage.setItem("tarkeeziData",JSON.stringify(state));
  }catch(error){
    alert("مساحة التخزين على الجهاز ممتلئة.");
  }
}

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g,char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[char]);
}

function updateStreak(){
  const current = today();

  if(state.lastActive === current) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate()-1);

  const yesterdayText = yesterday.toLocaleDateString("en-CA");

  state.streak =
    state.lastActive === yesterdayText
      ? state.streak + 1
      : 1;

  state.lastActive = current;
}

function renderStats(){
  const done = state.tasks.filter(task=>task.done).length;

  $("completedCount").textContent = done;
  $("totalCount").textContent = state.tasks.length;
  $("focusCount").textContent =
    state.daily[today()]?.focus || 0;

  $("gemCount").textContent = state.gems;
  $("rewardGems").textContent = state.gems;
  $("streakCount").textContent = state.streak;

  const percent = state.tasks.length
    ? Math.round(done/state.tasks.length*100)
    : 0;

  $("taskProgress").style.width = percent+"%";

  $("progressText").textContent = state.tasks.length
    ? `أنجزت ${percent}% من مهامك`
    : "لسه مفيش مهام";

  $("pagesCount").textContent =
    state.daily[today()]?.pages || 0;

  let badges = [];

  if(done>=1) badges.push("🥉 أول إنجاز");
  if(done>=5) badges.push("🥈 بطل المهام");
  if(done>=10) badges.push("🥇 نجم الإنجاز");

  if((state.daily[today()]?.focus||0)>=60){
    badges.push("⏱️ ساعة تركيز");
  }

  $("badges").textContent = badges.length
    ? badges.join(" • ")
    : "ابدأ إنجاز مهامك لتحصل على أوسمة!";
}

function renderTasks(){
  const list = $("taskList");

  const tasks = state.tasks.filter(task=>{
    if(filter==="active") return !task.done;
    if(filter==="done") return task.done;
    return true;
  });

  if(!tasks.length){
    list.innerHTML =
      '<div class="empty">مفيش مهام هنا حاليًا 🌟</div>';
    return;
  }

  list.innerHTML = tasks.map(task=>`
    <div class="task ${task.done?"done":""}">
      <div style="min-width:0">
        <div class="task-name">${escapeHTML(task.name)}</div>

        <div class="task-info">
          ${escapeHTML(task.category)} •
          ${task.date ? escapeHTML(task.date) : "بدون موعد"}
        </div>

        <span class="priority ${task.priority}">
          ${
            task.priority==="high"
              ? "أولوية عالية"
              : task.priority==="low"
                ? "أولوية قليلة"
                : "متوسطة"
          }
        </span>
      </div>

      <div class="task-actions">
        <button class="secondary"
          data-action="toggle"
          data-id="${task.id}"
          title="إنجاز">
          ${task.done?"↩️":"✓"}
        </button>

        <button class="secondary danger"
          data-action="delete"
          data-id="${task.id}"
          title="حذف">🗑️</button>
      </div>
    </div>
  `).join("");
}

$("taskForm").addEventListener("submit",event=>{
  event.preventDefault();

  const name = $("taskName").value.trim();

  if(!name) return;

  state.tasks.unshift({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()+Math.random()),

    name,
    category: $("taskCategory").value,
    priority: $("taskPriority").value,
    date: $("taskDate").value,
    done: false
  });

  $("taskName").value = "";
  $("taskDate").value = "";

  saveState();
  renderAll();
});

$("taskList").addEventListener("click",event=>{
  const button = event.target.closest("button[data-action]");

  if(!button) return;

  const task = state.tasks.find(
    item=>item.id===button.dataset.id
  );

  if(!task) return;

  if(button.dataset.action==="toggle"){
    task.done = !task.done;

    if(task.done){
      state.gems += 10;
      updateStreak();
    }

  }else if(button.dataset.action==="delete"){

    if(!confirm("متأكد إنك عايز تحذف المهمة؟")) return;

    state.tasks = state.tasks.filter(
      item=>item.id!==task.id
    );
  }

  saveState();
  renderAll();
});

document.querySelectorAll("[data-filter]").forEach(button=>{
  button.addEventListener("click",()=>{
    filter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(item=>{
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderTasks();
  });
});

// جدول المذاكرة
$("scheduleForm").addEventListener("submit",event=>{
  event.preventDefault();

  const subject = $("scheduleSubject").value.trim();
  const time = $("scheduleTime").value;

  if(!subject || !time) return;

  state.schedule.push({
    id: Date.now()+Math.random(),
    subject,
    time
  });

  state.schedule.sort(
    (a,b)=>a.time.localeCompare(b.time)
  );

  $("scheduleSubject").value = "";
  $("scheduleTime").value = "";

  saveState();
  renderSchedule();
});

function renderSchedule(){
  const list = $("scheduleList");

  if(!state.schedule.length){
    list.innerHTML =
      '<div class="empty">جدولك لسه فاضي</div>';
    return;
  }

  list.innerHTML = state.schedule.map(item=>`
    <div class="schedule-row">
      <span>
        ${escapeHTML(item.time)} —
        ${escapeHTML(item.subject)}
      </span>

      <button class="secondary danger"
        data-remove="${item.id}">
        حذف
      </button>
    </div>
  `).join("");
}

$("scheduleList").addEventListener("click",event=>{
  const button = event.target.closest("[data-remove]");

  if(!button) return;

  state.schedule = state.schedule.filter(
    item=>String(item.id)!==button.dataset.remove
  );

  saveState();
  renderSchedule();
});

// مؤقت التركيز
function getDuration(mode){
  const id = mode==="focus"
    ? "focusMinutes"
    : "breakMinutes";

  const min = 5;
  const max = mode==="focus" ? 60 : 30;

  let value = Number($(id).value);

  if(!Number.isFinite(value)){
    value = mode==="focus" ? 25 : 5;
  }

  value = Math.max(min,Math.min(max,Math.round(value)));

  $(id).value = value;

  return value*60;
}

function showTimer(){
  const mins = Math.floor(timer.remaining/60);
  const secs = timer.remaining%60;

  $("timerDisplay").textContent =
    String(mins).padStart(2,"0")+":"+
    String(secs).padStart(2,"0");

  $("timerMode").textContent =
    timer.mode==="focus"
      ? "وقت التركيز 📚"
      : "وقت الراحة ☕";
}

function stopInterval(){
  if(timer.interval!==null){
    clearInterval(timer.interval);
    timer.interval = null;
  }
}

function tick(){
  if(!timer.running) return;

  const now = Date.now();
  const elapsed = Math.floor(
    (now-timer.lastTick)/1000
  );

  if(elapsed<=0) return;

  timer.lastTick += elapsed*1000;
  timer.remaining = Math.max(
    0,
    timer.remaining-elapsed
  );

  showTimer();

  if(timer.remaining<=0){
    finishTimer();
  }
}

function startTimer(){
  if(timer.running) return;

  if(timer.remaining<=0){
    timer.remaining = getDuration(timer.mode);
  }

  timer.running = true;
  timer.lastTick = Date.now();

  stopInterval();

  timer.interval = setInterval(tick,250);

  $("timerMessage").textContent =
    "ركز في مهمتك، أنت تقدر! 💪";

  showTimer();
}

function pauseTimer(){
  if(!timer.running) return;

  tick();

  timer.running = false;
  stopInterval();

  $("timerMessage").textContent =
    "المؤقت متوقف مؤقتًا.";
}

function resetTimer(){
  timer.running = false;
  stopInterval();

  timer.remaining = getDuration(timer.mode);

  $("timerMessage").textContent =
    "جاهز تبدأ من جديد؟";

  showTimer();
}

function finishTimer(){
  timer.running = false;
  stopInterval();

  if(timer.mode==="focus"){
    const minutes = Number($("focusMinutes").value);

    state.daily[today()] ||= {
      focus:0,
      pages:0
    };

    state.daily[today()].focus += minutes;
    state.focusMinutes += minutes;

    updateStreak();

    state.gems += 5;
    timer.mode = "break";

    $("timerMessage").textContent =
      "أحسنت! خلصت جلسة تركيز وكسبت 5 جواهر 🎉";

  }else{
    timer.mode = "focus";

    $("timerMessage").textContent =
      "خلصت الراحة، مستعد لجلسة جديدة؟";
  }

  timer.remaining = getDuration(timer.mode);

  saveState();
  renderStats();
  showTimer();

  alert(
    timer.mode==="break"
      ? "انتهت جلسة التركيز! وقت الراحة ☕"
      : "انتهت الراحة! نرجع للتركيز 💪"
  );
}

$("startTimer").addEventListener("click",startTimer);
$("pauseTimer").addEventListener("click",pauseTimer);
$("resetTimer").addEventListener("click",resetTimer);

["focusMinutes","breakMinutes"].forEach(id=>{
  $(id).addEventListener("change",()=>{
    if(!timer.running){
      timer.remaining = getDuration(timer.mode);
      showTimer();
    }
  });
});

// عداد القراءة
$("addPage").addEventListener("click",()=>{
  state.daily[today()] ||= {
    focus:0,
    pages:0
  };

  state.daily[today()].pages++;
  state.pages++;

  saveState();
  renderStats();
});

$("removePage").addEventListener("click",()=>{
  state.daily[today()] ||= {
    focus:0,
    pages:0
  };

  if(state.daily[today()].pages>0){
    state.daily[today()].pages--;
    state.pages = Math.max(0,state.pages-1);

    saveState();
    renderStats();
  }
});

// الوضع الليلي
function applyTheme(){
  document.body.classList.toggle(
    "dark",
    state.theme==="dark"
  );

  $("themeBtn").textContent =
    state.theme==="dark" ? "☀️" : "🌙";
}

$("themeBtn").addEventListener("click",()=>{
  state.theme =
    state.theme==="dark" ? "light" : "dark";

  saveState();
  applyTheme();
});

// مواقيت الصلاة
const prayerNames = {
  Fajr:"الفجر 🌅",
  Dhuhr:"الظهر ☀️",
  Asr:"العصر",
  Maghrib:"المغرب 🌇",
  Isha:"العشاء 🌙"
};

function cleanTime(value){
  return String(value||"").match(/\d{1,2}:\d{2}/)?.[0]
    || "--:--";
}

async function loadPrayer(){
  const list = $("prayerList");

  list.innerHTML =
    '<div class="empty">جاري تحميل المواقيت...</div>';

  $("prayerDate").textContent =
    new Date().toLocaleDateString("ar-EG",{
      weekday:"long",
      year:"numeric",
      month:"long",
      day:"numeric"
    });

  try{
    const response = await fetch(
      "https://api.aladhan.com/v1/timingsByCity?city=Alexandria&country=Egypt&method=5"
    );

    if(!response.ok){
      throw new Error("Network error");
    }

    const result = await response.json();

    if(result.code!==200 || !result.data?.timings){
      throw new Error("Invalid data");
    }

    const timings = result.data.timings;
    const keys = Object.keys(prayerNames);

    if(!keys.every(key=>timings[key])){
      throw new Error("Missing prayer time");
    }

    const now = new Date();
    const current = now.getHours()*60+now.getMinutes();

    let nextPrayer = null;

    for(const key of keys){
      const time = cleanTime(timings[key]);
      const [h,m] = time.split(":").map(Number);

      if(h*60+m>current){
        nextPrayer = key;
        break;
      }
    }

    list.innerHTML = keys.map(key=>`
      <div class="prayer-row ${
        key===nextPrayer ? "active" : ""
      }">
        <span>
          ${prayerNames[key]}
          ${key===nextPrayer ? "• الصلاة القادمة" : ""}
        </span>

        <strong dir="ltr">
          ${escapeHTML(cleanTime(timings[key]))}
        </strong>
      </div>
    `).join("");

  }catch(error){
    list.innerHTML =
      '<div class="empty">تعذر تحميل المواقيت. تأكد من الإنترنت وحاول التحديث.</div>';

    console.error("Prayer times error:",error);
  }
}

$("refreshPrayer").addEventListener("click",loadPrayer);

// تشغيل التطبيق
function renderAll(){
  renderStats();
  renderTasks();
  renderSchedule();
}

applyTheme();
renderAll();
showTimer();
loadPrayer();

