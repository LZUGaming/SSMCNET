// SSMCNET — lädt den Hauptinhalt einer "normalen" Seite (Startseite,
// Abteilungen, Ansprechpartner, Funkcodes, Karriere, Regelwerk,
// Sanktionskatalog, Aktuelles) live aus Supabase.
// Jede dieser Seiten hat im HTML: <div id="seiten-content" data-seite="KEY"></div>

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('seiten-content');
  if (!container) return;

  const seiteKey = container.getAttribute('data-seite');

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from('seiten')
      .select('inhalt')
      .eq('seite_key', seiteKey)
      .single();

    if (error || !data) throw error || new Error('Nicht gefunden');

    container.innerHTML = data.inhalt || '<div class="section"><div class="container"><p class="lede">Für diese Seite ist noch kein Inhalt hinterlegt.</p></div></div>';

    if (typeof initTabs === 'function') initTabs(container);
  } catch (err) {
    console.error('Seiteninhalt konnte nicht geladen werden:', err);
    container.innerHTML = '<div class="section"><div class="container"><p class="lede">Inhalt konnte nicht geladen werden. Bitte Seite neu laden.</p></div></div>';
  }
});
