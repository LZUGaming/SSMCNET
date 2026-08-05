// SSMCNET — lädt die Ausbildungen live aus Supabase und befüllt
// 1) das "Ausbildung"-Dropdown im Header (auf jeder Seite)
// 2) die volle Übersicht auf academy.html (falls dort vorhanden)

document.addEventListener('DOMContentLoaded', async () => {
  const panel = document.getElementById('ausbildung-dropdown-panel');
  const academyContainer = document.getElementById('academy-dynamic-list');
  if (!panel && !academyContainer) return;

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from('ausbildungen')
      .select('*')
      .order('rang_nummer', { ascending: true })
      .order('reihenfolge', { ascending: true });

    if (error) throw error;

    // Nach Rang gruppieren, Reihenfolge beibehalten
    const groups = [];
    const byRang = {};
    for (const row of data) {
      if (!byRang[row.rang_nummer]) {
        byRang[row.rang_nummer] = { rang_nummer: row.rang_nummer, rang_name: row.rang_name, items: [] };
        groups.push(byRang[row.rang_nummer]);
      }
      byRang[row.rang_nummer].items.push(row);
    }

    if (panel) renderDropdown(panel, groups);
    if (academyContainer) renderAcademyList(academyContainer, groups);
  } catch (err) {
    console.error('Ausbildungen konnten nicht geladen werden:', err);
    if (panel) panel.innerHTML = '<div class="nav-drop-group"><div class="nav-drop-label">Fehler beim Laden</div></div>';
    if (academyContainer) academyContainer.innerHTML = '<div class="container"><p class="lede">Ausbildungen konnten nicht geladen werden. Bitte Seite neu laden.</p></div>';
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderDropdown(panel, groups) {
  let html = '';
  groups.forEach((group, i) => {
    html += `<div class="nav-drop-group">`;
    html += `<div class="nav-drop-label">Rang ${group.rang_nummer} · ${escapeHtml(group.rang_name)}</div>`;
    group.items.forEach(item => {
      if (item.status === 'offen' && item.slug) {
        html += `<a href="academy-detail.html?slug=${encodeURIComponent(item.slug)}" class="nav-drop-link">${escapeHtml(item.titel)}</a>`;
      } else {
        html += `<a href="academy.html" class="nav-drop-link nodoc">${escapeHtml(item.titel)} <span class="nav-drop-tag">bald</span></a>`;
      }
    });
    html += `</div>`;
    if (i < groups.length - 1) html += `<div class="nav-drop-divider"></div>`;
  });
  panel.innerHTML = html;
}

function renderAcademyList(container, groups) {
  let html = '';
  groups.forEach((group, i) => {
    html += `<section class="section${i > 0 ? ' section-border-top' : ''}">`;
    html += `<div class="container">`;
    html += `<div class="section-head"><span class="eyebrow">Rang ${group.rang_nummer}</span><h2>${escapeHtml(group.rang_name)}</h2></div>`;
    group.items.forEach(item => {
      const titleHtml = (item.status === 'offen' && item.slug)
        ? `<a href="academy-detail.html?slug=${encodeURIComponent(item.slug)}">${escapeHtml(item.titel)}</a>`
        : escapeHtml(item.titel);
      const statusLabel = item.status === 'offen' ? 'Offen' : 'Bald';
      html += `<div class="training-item">
        <div class="t-body"><h3>${titleHtml}</h3><p>${escapeHtml(item.beschreibung || '')}</p></div>
        <div class="t-status">${statusLabel}</div>
      </div>`;
    });
    html += `</div></section>`;
  });
  container.innerHTML = html;
}
