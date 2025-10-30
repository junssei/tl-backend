import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /overview/summary
// Returns row counts for key tables
router.get('/summary', async (req, res) => {
  try {
    const queries = [
      { key: 'users', sql: 'SELECT COUNT(*)::int AS count FROM users' },
      { key: 'customer', sql: 'SELECT COUNT(*)::int AS count FROM customer' },
      { key: 'products', sql: 'SELECT COUNT(*)::int AS count FROM products' },
      { key: 'orders', sql: 'SELECT COUNT(*)::int AS count FROM public.orders' },
      { key: 'credits', sql: 'SELECT COUNT(*)::int AS count FROM public.credits' },
      { key: 'payments', sql: 'SELECT COUNT(*)::int AS count FROM public.payments' },
      { key: 'order_products', sql: 'SELECT COUNT(*)::int AS count FROM public.order_products' },
    ];

    const results = await Promise.all(
      queries.map((q) => pool.query(q.sql))
    );

    const summary = {};
    results.forEach((r, idx) => {
      summary[queries[idx].key] = r.rows[0]?.count ?? 0;
    });

    return res.json(summary);
  } catch (err) {
    console.error('GET /overview/summary', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /overview
// Returns limited rows for each table (default limit=50)
router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
  try {
    const dataQueries = [
      { key: 'users', sql: 'SELECT id, email, username, phonenumber, createdat, tindahan_name, role, profile_img, gender FROM users ORDER BY id DESC LIMIT $1' },
      { key: 'customer', sql: 'SELECT * FROM customer ORDER BY id DESC LIMIT $1' },
      { key: 'products', sql: 'SELECT * FROM products ORDER BY product_id DESC LIMIT $1' },
      { key: 'orders', sql: 'SELECT * FROM public.orders ORDER BY order_id DESC LIMIT $1' },
      { key: 'credits', sql: 'SELECT * FROM public.credits ORDER BY id DESC LIMIT $1' },
      { key: 'payments', sql: 'SELECT * FROM public.payments ORDER BY id DESC LIMIT $1' },
      { key: 'order_products', sql: 'SELECT * FROM public.order_products ORDER BY id DESC LIMIT $1' },
    ];

    const results = await Promise.all(
      dataQueries.map((q) => pool.query(q.sql, [limit]))
    );

    const payload = {};
    results.forEach((r, idx) => {
      payload[dataQueries[idx].key] = r.rows;
    });

    return res.json({ limit, ...payload });
  } catch (err) {
    console.error('GET /overview', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
 
// UI: Single-file HTML overview
router.get('/ui', (_req, res) => {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TindaLog Overview</title>
  <style>
    :root { --bg:#0b1020; --panel:#121936; --text:#e6e9f5; --muted:#9aa3c7; --accent:#4f7cff; --ok:#16c784; --warn:#f59e0b; --err:#ef4444; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); }
    header { padding: 20px; background: linear-gradient(90deg, #10173a, #0f1632 60%); border-bottom: 1px solid #1e274a; position: sticky; top: 0; z-index: 5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { margin: 0; font-size: 20px; letter-spacing: 0.3px; }
    .controls { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
    select, input, button { background: #0e1531; color: var(--text); border: 1px solid #263159; border-radius: 8px; padding: 8px 10px; }
    button { background: var(--accent); border-color: #395fcc; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: default; }
    .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-top: 18px; }
    .card { background: var(--panel); border: 1px solid #1e274a; border-radius: 12px; padding: 14px; }
    .kpi { display: flex; flex-direction: column; gap: 6px; }
    .kpi .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; }
    .kpi .value { font-size: 22px; font-weight: 700; }
    .tabs { display: flex; gap: 8px; margin-top: 24px; flex-wrap: wrap; }
    .tab { padding: 8px 12px; border-radius: 20px; background: #0e1531; border: 1px solid #263159; color: var(--muted); cursor: pointer; }
    .tab.active { background: #19224a; color: var(--text); border-color: #374276; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #1e274a; text-align: left; padding: 8px 10px; font-size: 13px; }
    th { color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; }
    tbody tr:hover { background: #0f1737; }
    .section { margin-top: 22px; }
    .error { color: var(--err); }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>TindaLog Overview</h1>
      <div class="controls">
        <label>Limit</label>
        <input id="limit" type="number" min="1" max="500" value="50" />
        <button id="refresh">Refresh</button>
        <span id="status" style="margin-left:8px;color:var(--muted)"></span>
      </div>
    </div>
  </header>
  <main class="container">
    <section class="grid" id="kpis"></section>
    <div class="tabs" id="tabs"></div>
    <section class="section" id="tableArea"></section>
  </main>
  <script>
    const ENDPOINT_SUMMARY = '/overview/summary';
    const ENDPOINT_DATA = '/overview';
    const entities = ['users','customer','products','orders','credits','payments','order_products'];

    const kpisEl = document.getElementById('kpis');
    const tabsEl = document.getElementById('tabs');
    const tableAreaEl = document.getElementById('tableArea');
    const limitEl = document.getElementById('limit');
    const statusEl = document.getElementById('status');
    const refreshBtn = document.getElementById('refresh');

    let activeTab = 'users';

    function setStatus(text){ statusEl.textContent = text; }

    function escapeHtml(v){ return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

    function renderKPIs(summary){
      kpisEl.innerHTML = entities.map(key => `
        <div class="card kpi">
          <div class="label">${key.replace('_',' ')}</div>
          <div class="value">${summary?.[key] ?? 0}</div>
        </div>
      `).join('');
    }

    function renderTabs(){
      tabsEl.innerHTML = entities.map(key => `
        <button class="tab ${key===activeTab?'active':''}" data-key="${key}">${key.replace('_',' ')}</button>
      `).join('');
      tabsEl.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.key; renderTabs(); renderTable(window.__data); });
    }

    function renderTable(data){
      tableAreaEl.innerHTML = '';
      const rows = data?.[activeTab] || [];
      if (!rows.length){ tableAreaEl.innerHTML = '<div class="card"><span class="error">No data</span></div>'; return; }
      const columns = Object.keys(rows[0]);
      const thead = '<thead><tr>'+columns.map(c=>`<th>${escapeHtml(c)}</th>`).join('')+'</tr></thead>';
      const tbody = '<tbody>'+rows.map(r=>'<tr>'+columns.map(c=>`<td>${escapeHtml(r[c] ?? '')}</td>`).join('')+'</tr>').join('')+'</tbody>';
      tableAreaEl.innerHTML = `<div class="card"><table>${thead}${tbody}</table></div>`;
    }

    async function load(){
      setStatus('Loading...');
      refreshBtn.disabled = true;
      try {
        const [sRes, dRes] = await Promise.all([
          fetch(ENDPOINT_SUMMARY),
          fetch(ENDPOINT_DATA + '?limit=' + encodeURIComponent(limitEl.value || 50))
        ]);
        const summary = await sRes.json();
        const data = await dRes.json();
        window.__data = data;
        renderKPIs(summary);
        renderTabs();
        renderTable(data);
        setStatus('Updated ' + new Date().toLocaleTimeString());
      } catch (e){
        console.error(e);
        setStatus('Failed to load');
        tableAreaEl.innerHTML = '<div class="card"><span class="error">'+escapeHtml(e?.message || 'Error')+'</span></div>';
      } finally {
        refreshBtn.disabled = false;
      }
    }

    refreshBtn.onclick = load;
    load();
  </script>
</body>
</html>`;
  res.type('html').send(html);
});


