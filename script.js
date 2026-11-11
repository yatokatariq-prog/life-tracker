
async function loadPray() {
  const box = $('pray');

  box.innerHTML = '<p>جاري تحميل مواقيت الصلاة...</p>';

  try {
    const response = await fetch(
      'https://api.aladhan.com/v1/timingsByCity?city=Alexandria&country=Egypt&method=5'
    );

    if (!response.ok) {
      throw new Error('Network error');
    }

    const result = await response.json();

    if (
      result.code !== 200 ||
      !result.data ||
      !result.data.timings
    ) {
      throw new Error('Invalid prayer data');
    }

    const timings = result.data.timings;
    const required = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const key of required) {
      if (!timings[key] || !/^\d{2}:\d{2}/.test(timings[key])) {
        throw new Error('Missing prayer time');
      }
    }

    S.pray = {
      d: today(),
      t: timings
    };

    save();

    const now = new Date();
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const minutes = required.map(key => {
      const [h, m] = timings[key].split(':');
      return Number(h) * 60 + Number(m);
    });

    let next = minutes.findIndex(m => m > currentMinutes);
    if (next === -1) next = 0;

    box.innerHTML = required.map((key, i) => {
      const [h, m] = timings[key].split(':');
      const names = {
        Fajr: 'الفجر',
        Dhuhr: 'الظهر',
        Asr: 'العصر',
        Maghrib: 'المغرب',
        Isha: 'العشاء'
      };

      const hour = Number(h);
      const time =
        `${(hour % 12) || 12}:${m} ${hour >= 12 ? 'م' : 'ص'}`;

      return `
        <div class="pr ${i === next ? 'next' : ''}">
          <span>${names[key]}</span>
          <b>${time}</b>
        </div>
      `;
    }).join('');

  } catch (error) {
    box.innerHTML =
      '<p>تعذر تحميل المواقيت حاليًا. تأكد من الإنترنت وحاول لاحقًا.</p>';
  }
}

