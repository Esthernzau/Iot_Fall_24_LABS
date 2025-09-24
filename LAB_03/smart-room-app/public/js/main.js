// public/js/main.js
const api = '/api/rooms';

// ===== dashboard timing (tweak these) =====
const WINDOW_MIN = 5;      // show the last 5 minutes
const BUCKET_SEC = 10;     // average into 10-second buckets (new x-tick every 10s)
const POLL_MS    = 5000;   // refresh UI every 5 seconds

// UI card -> DB room id, and names for legend (with fallbacks)
let uiToDb  = { 1: null, 2: null };
let uiNames = { 1: 'Room 1', 2: 'Room 2' };

// ---------- helpers ----------
async function safeJson(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

// ---------- API calls ----------
async function getRooms() {
  const res = await fetch('/api/rooms', { cache: 'no-store' });
  return safeJson(res);
}

async function setLight(id, on) {
  const res = await fetch(`${api}/${id}/light`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ light: on })
  });
  return safeJson(res);
}

async function allLights(on) {
  const path = on ? 'on' : 'off';
  await fetch(`${api}/lights/${path}`, { method: 'PATCH' });
}

// Bucketed temperature series for ALL rooms
async function getTempSeries(minutes = WINDOW_MIN, bucketSec = BUCKET_SEC) {
  const url = `/api/rooms/temperature-series?minutes=${minutes}&bucketSec=${bucketSec}`;
  const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-store' } });
  return safeJson(res); // [{room_id, temperature, timestamp}, ...] oldest->newest per room
}

// ---------- series helpers for Chart.js ----------
function buildLabels(series) {
  // union of timestamps (ISO), sorted
  const set = new Set(series.map(p => new Date(p.timestamp).toISOString()));
  return Array.from(set).sort();
}

function seriesToDataset(seriesForRoom, labelsISO) {
  const map = new Map(seriesForRoom.map(p => [new Date(p.timestamp).toISOString(), p.temperature]));
  return labelsISO.map(ts => (map.has(ts) ? map.get(ts) : null));
}

// ---------- UI updaters ----------
function updateRoomCard(room, cardNo, latestTemp) {
  const nameEl = document.querySelector(`#room${cardNo}-name`);
  const pillEl = document.querySelector(`#room${cardNo}-light-pill`);
  const bulbEl = document.querySelector(`#room${cardNo}-bulb`);
  const tempEl = document.querySelector(`#room${cardNo}-temp`);
  const btnEl  = document.querySelector(`#room${cardNo}-toggle`);

  if (nameEl) nameEl.textContent = room.name;

  const isOn = !!room.light;
  const lightText = isOn ? 'on' : 'off';
  if (pillEl) {
    pillEl.textContent = lightText;
    pillEl.classList.toggle('on',  isOn);
    pillEl.classList.toggle('off', !isOn);
  }

  if (bulbEl) bulbEl.src = isOn ? '/img/bulb-on.svg' : '/img/bulb-off.svg';
  if (btnEl)  btnEl.textContent = isOn ? 'Turn Off' : 'Turn On';

  if (tempEl) {
    const v = Number(latestTemp);
    tempEl.textContent = Number.isFinite(v) ? v.toFixed(1) : '--'; // 1 decimal on cards
  }
}

function markCardMissing(cardNo) {
  const nameEl = document.querySelector(`#room${cardNo}-name`);
  const pillEl = document.querySelector(`#room${cardNo}-light-pill`);
  const bulbEl = document.querySelector(`#room${cardNo}-bulb`);
  const tempEl = document.querySelector(`#room${cardNo}-temp`);
  const btnEl  = document.querySelector(`#room${cardNo}-toggle`);

  if (nameEl) nameEl.textContent = 'No room found';
  if (pillEl) { pillEl.textContent = '--'; pillEl.classList.remove('on'); pillEl.classList.add('off'); }
  if (tempEl) tempEl.textContent = '--';
  if (bulbEl) bulbEl.src = '/img/bulb-off.svg';
  if (btnEl)  btnEl.textContent = 'Unavailable';
}

// ---------- main refresh ----------
async function refreshRooms() {
  try {
    const rooms = await getRooms();
    rooms.sort((a, b) => a.id - b.id);

    const r1 = rooms[0];
    const r2 = rooms[1];

    uiToDb[1]  = r1?.id ?? null;
    uiToDb[2]  = r2?.id ?? null;
    uiNames[1] = r1?.name || 'Room 1';
    uiNames[2] = r2?.name || 'Room 2';

    // Compute latest temps from the same series used by the chart
    const latestByRoom = await computeLatestTempsFromSeries();

    if (r1) updateRoomCard(r1, 1, latestByRoom.get(r1.id)); else markCardMissing(1);
    if (r2) updateRoomCard(r2, 2, latestByRoom.get(r2.id)); else markCardMissing(2);

    document.querySelectorAll('.room-card').forEach((card, i) => {
      const n = i + 1;
      card.classList.toggle('disabled', !uiToDb[n]);
    });

    await drawTrendChart(); // render time series
  } catch (err) {
    console.error('Failed to refresh rooms:', err);
  }
}

async function computeLatestTempsFromSeries() {
  try {
    const series = await getTempSeries(); // uses WINDOW_MIN & BUCKET_SEC defaults
    const latest = new Map();
    for (const p of series) latest.set(p.room_id, p.temperature); // overwrite to keep last
    return latest;
  } catch {
    return new Map();
  }
}

// ---------- wiring ----------
function wireButtons() {
  const r1Btn = document.querySelector('#room1-toggle');
  const r2Btn = document.querySelector('#room2-toggle');
  const allOnBtn  = document.querySelector('#btnAllOn');
  const allOffBtn = document.querySelector('#btnAllOff');

  if (r1Btn) r1Btn.onclick = async () => {
    if (!uiToDb[1]) return;
    const current = document.querySelector('#room1-light-pill')?.textContent === 'on';
    await setLight(uiToDb[1], !current);
    refreshRooms();
  };

  if (r2Btn) r2Btn.onclick = async () => {
    if (!uiToDb[2]) return;
    const current = document.querySelector('#room2-light-pill')?.textContent === 'on';
    await setLight(uiToDb[2], !current);
    refreshRooms();
  };

  if (allOnBtn)  allOnBtn.onclick  = async () => { await allLights(true);  refreshRooms(); };
  if (allOffBtn) allOffBtn.onclick = async () => { await allLights(false); refreshRooms(); };
}

// ---------- Chart.js (time axis) ----------
let chart;

async function drawTrendChart() {
  const canvas = document.getElementById('tempChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const series = await getTempSeries(); // WINDOW_MIN & BUCKET_SEC

  // Split by room id
  const byRoom = new Map();
  for (const p of series) {
    if (!byRoom.has(p.room_id)) byRoom.set(p.room_id, []);
    byRoom.get(p.room_id).push(p);
  }

  // Labels = union of timestamps across rooms (ISO, sorted)
  const labelsISO = buildLabels(series);

  const r1 = uiToDb[1], r2 = uiToDb[2];

  const datasets = [
    {
      label: uiNames[1],
      data: r1 && byRoom.has(r1) ? seriesToDataset(byRoom.get(r1), labelsISO) : [],
      tension: 0.35,
      cubicInterpolationMode: 'monotone',
      pointRadius: 0,
      pointHoverRadius: 4,
      spanGaps: true,
      borderWidth: 2,
      borderColor: 'rgba(37, 99, 235, 1)',
      backgroundColor: 'rgba(37, 99, 235, 0.12)'
    },
    {
      label: uiNames[2],
      data: r2 && byRoom.has(r2) ? seriesToDataset(byRoom.get(r2), labelsISO) : [],
      tension: 0.35,
      cubicInterpolationMode: 'monotone',
      pointRadius: 0,
      pointHoverRadius: 4,
      spanGaps: true,
      borderWidth: 2,
      borderColor: 'rgba(244, 63, 94, 1)',
      backgroundColor: 'rgba(244, 63, 94, 0.12)'
    }
  ];

  const config = {
    type: 'line',
    data: { labels: labelsISO, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: true },
        decimation: { enabled: true, algorithm: 'min-max' }
      },
      scales: {
        x: {
          type: 'time', // needs chartjs-adapter-date-fns in your HTML
          time: { tooltipFormat: 'HH:mm:ss', displayFormats: { second: 'HH:mm:ss', minute: 'HH:mm' } },
          title: { display: true, text: 'Time' }
        },
        y: {
          min: 18,
          max: 26,
          title: { display: true, text: '°C' }
        }
      }
    }
  };

  if (!chart) {
    chart = new Chart(canvas.getContext('2d'), config);
  } else {
    chart.data.labels = labelsISO;
    chart.data.datasets = datasets;
    chart.update();
  }
}

// ---------- boot ----------
(async function init() {
  wireButtons();
  await refreshRooms();
  setInterval(refreshRooms, POLL_MS); // faster polling
})();
