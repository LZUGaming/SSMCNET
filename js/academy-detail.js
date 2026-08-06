document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('detail-content');
  const crumb = document.getElementById('crumb-titel');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    container.innerHTML = '<div class="section"><div class="container"><p class="lede">Keine Ausbildung angegeben.</p></div></div>';
    return;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from('ausbildungen')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) throw error || new Error('Nicht gefunden');

    document.title = data.titel + ' — SSMCNET Medical Academy';
    crumb.textContent = data.titel;

    const words = data.titel.split(' ');
    const lastWord = words.pop();
    const restWords = words.join(' ');

    container.innerHTML = `
      <header class="hero" style="padding-top:28px; padding-bottom:40px;">
        <div class="grid-overlay"></div>
        <div class="container">
          <span class="badge">Rang ${data.rang_nummer} · ${escapeHtmlDetail(data.rang_name)}</span>
          <h1 style="margin-top:20px;">${escapeHtmlDetail(restWords)} <span class="accent">${escapeHtmlDetail(lastWord)}</span></h1>
          <p class="lede">${escapeHtmlDetail(data.beschreibung || '')}</p>
        </div>
      </header>
      <div class="content-body">${data.inhalt || '<div class="section"><div class="container"><p class="lede">Für diese Ausbildung ist noch kein ausführlicher Inhalt hinterlegt.</p></div></div>'}</div>
    `;

    initTabs(container);
  } catch (err) {
    console.error('Ausbildung konnte nicht geladen werden:', err);
    container.innerHTML = '<div class="section"><div class="container"><p class="lede">Diese Ausbildung konnte nicht geladen werden.</p></div></div>';
  }
});

// Erkennt .tab-panel-Elemente im geladenen Inhalt und baut daraus
// eine Reiter-Leiste zum Umschalten (wie Blattreiter in einer Tabelle).
function initTabs(container) {
  const panels = container.querySelectorAll('.tab-panel');
  if (panels.length < 2) return;

  const tabBar = document.createElement('div');
  tabBar.className = 'detail-tabs';

  panels.forEach((panel, i) => {
    const label = panel.getAttribute('data-tab-label') || `Variante ${i + 1}`;
    const btn = document.createElement('button');
    btn.className = 'detail-tab-btn' + (i === 0 ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      panel.classList.add('active');
    });
    tabBar.appendChild(btn);
    if (i === 0) panel.classList.add('active');
  });

  panels[0].parentElement.insertBefore(tabBar, panels[0]);
}

function escapeHtmlDetail(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
