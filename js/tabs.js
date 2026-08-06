// Erkennt .tab-panel-Elemente in einem Container und baut daraus
// eine Reiter-Leiste zum Umschalten (wie Blattreiter in einer Tabelle).
// Wird von academy-detail.js UND seiten-dynamic.js genutzt.
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
