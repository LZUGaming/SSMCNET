// Einfacher Passwortschutz — siehe Hinweis in supabase_inhalt_update.sql:
// das ist KEIN echter Zugriffsschutz, nur eine Hürde für normale Besucher.
const EDIT_PASSWORD = "ssmc-intern-2026"; // <- hier bei Bedarf ändern

let client;
let currentId = null;
let isNew = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pw-submit').addEventListener('click', tryLogin);
  document.getElementById('pw-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') tryLogin();
  });
});

function tryLogin() {
  const val = document.getElementById('pw-input').value;
  if (val === EDIT_PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('edit-screen').style.display = 'block';
    initEditor();
  } else {
    document.getElementById('pw-error').style.display = 'block';
  }
}

async function initEditor() {
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.getElementById('mode-ausbildungen-btn').addEventListener('click', () => switchMode('ausbildungen'));
  document.getElementById('mode-seiten-btn').addEventListener('click', () => switchMode('seiten'));
  document.getElementById('select-training').addEventListener('change', () => {
    const val = document.getElementById('select-training').value;
    if (val) loadTraining(val);
    else document.getElementById('form-fields').style.display = 'none';
  });
  document.getElementById('save-btn').addEventListener('click', saveTraining);
  document.getElementById('new-btn').addEventListener('click', startNew);
  document.getElementById('select-seite').addEventListener('change', () => {
    const val = document.getElementById('select-seite').value;
    if (val) loadSeite(val);
    else document.getElementById('seite-fields').style.display = 'none';
  });
  document.getElementById('save-seite-btn').addEventListener('click', saveSeite);

  await Promise.all([refreshList(), refreshSeitenList()]);
}

function switchMode(mode) {
  const isAusbildungen = mode === 'ausbildungen';
  document.getElementById('mode-ausbildungen').style.display = isAusbildungen ? 'block' : 'none';
  document.getElementById('mode-seiten').style.display = isAusbildungen ? 'none' : 'block';
  document.getElementById('mode-ausbildungen-btn').classList.toggle('active', isAusbildungen);
  document.getElementById('mode-seiten-btn').classList.toggle('active', !isAusbildungen);
}

async function refreshList() {
  const select = document.getElementById('select-training');
  const { data, error } = await client
    .from('ausbildungen')
    .select('id, rang_nummer, rang_name, titel, status')
    .order('rang_nummer', { ascending: true })
    .order('reihenfolge', { ascending: true });

  if (error) {
    select.innerHTML = '<option>Fehler beim Laden</option>';
    return;
  }

  select.innerHTML = '<option value="">— auswählen —</option>' + data.map(row =>
    `<option value="${row.id}">Rang ${row.rang_nummer} · ${row.titel} (${row.status})</option>`
  ).join('');
}

function startNew() {
  isNew = true;
  currentId = null;
  document.getElementById('select-training').value = '';
  document.getElementById('f-rang-nummer').value = '';
  document.getElementById('f-rang-name').value = '';
  document.getElementById('f-titel').value = '';
  document.getElementById('f-beschreibung').value = '';
  document.getElementById('f-status').value = 'offen';
  document.getElementById('f-slug').value = '';
  document.getElementById('f-reihenfolge').value = '';
  document.getElementById('f-inhalt').value = '';
  document.getElementById('form-fields').style.display = 'block';
  document.getElementById('save-msg').textContent = '';
  document.getElementById('save-btn').textContent = 'Neu anlegen';
  document.getElementById('f-titel').focus();
}

async function loadTraining(id) {
  const { data, error } = await client.from('ausbildungen').select('*').eq('id', id).single();
  if (error || !data) {
    alert('Konnte Ausbildung nicht laden.');
    return;
  }
  currentId = data.id;
  isNew = false;
  document.getElementById('save-btn').textContent = 'Speichern';
  document.getElementById('f-rang-nummer').value = data.rang_nummer;
  document.getElementById('f-rang-name').value = data.rang_name;
  document.getElementById('f-titel').value = data.titel;
  document.getElementById('f-beschreibung').value = data.beschreibung || '';
  document.getElementById('f-status').value = data.status;
  document.getElementById('f-slug').value = data.slug || '';
  document.getElementById('f-reihenfolge').value = data.reihenfolge;
  document.getElementById('f-inhalt').value = data.inhalt || '';
  document.getElementById('form-fields').style.display = 'block';
  document.getElementById('save-msg').textContent = '';
}

async function saveTraining() {
  if (!isNew && !currentId) return;
  const msg = document.getElementById('save-msg');
  msg.className = '';
  msg.textContent = 'Speichert…';

  const updates = {
    rang_nummer: parseInt(document.getElementById('f-rang-nummer').value, 10),
    rang_name: document.getElementById('f-rang-name').value,
    titel: document.getElementById('f-titel').value,
    beschreibung: document.getElementById('f-beschreibung').value,
    status: document.getElementById('f-status').value,
    slug: document.getElementById('f-slug').value || null,
    reihenfolge: parseInt(document.getElementById('f-reihenfolge').value, 10),
    inhalt: document.getElementById('f-inhalt').value,
  };

  if (isNew) {
    const { data, error } = await client.from('ausbildungen').insert(updates).select().single();
    if (error) {
      msg.className = 'err';
      msg.textContent = 'Fehler beim Anlegen: ' + error.message;
      return;
    }
    msg.className = 'ok';
    msg.textContent = 'Neu angelegt ✓';
    isNew = false;
    currentId = data.id;
    document.getElementById('save-btn').textContent = 'Speichern';
    await refreshList();
    return;
  }

  const { error } = await client.from('ausbildungen').update(updates).eq('id', currentId);
  if (error) {
    msg.className = 'err';
    msg.textContent = 'Fehler beim Speichern: ' + error.message;
  } else {
    msg.className = 'ok';
    msg.textContent = 'Gespeichert ✓';
  }
}

// ============================================================
// SEITEN (Startseite, Abteilungen, Ansprechpartner, Funkcodes,
// Karriere, Regelwerk, Sanktionskatalog, Aktuelles)
// ============================================================

let currentSeiteKey = null;

async function refreshSeitenList() {
  const select = document.getElementById('select-seite');
  const { data, error } = await client
    .from('seiten')
    .select('seite_key, titel')
    .order('titel', { ascending: true });

  if (error) {
    select.innerHTML = '<option>Fehler beim Laden</option>';
    return;
  }

  select.innerHTML = '<option value="">— auswählen —</option>' + data.map(row =>
    `<option value="${row.seite_key}">${row.titel}</option>`
  ).join('');
}

async function loadSeite(seiteKey) {
  const { data, error } = await client.from('seiten').select('*').eq('seite_key', seiteKey).single();
  if (error || !data) {
    alert('Konnte Seite nicht laden.');
    return;
  }
  currentSeiteKey = data.seite_key;
  document.getElementById('s-inhalt').value = data.inhalt || '';
  document.getElementById('seite-fields').style.display = 'block';
  document.getElementById('save-seite-msg').textContent = '';
}

async function saveSeite() {
  if (!currentSeiteKey) return;
  const msg = document.getElementById('save-seite-msg');
  msg.className = '';
  msg.textContent = 'Speichert…';

  const { error } = await client
    .from('seiten')
    .update({ inhalt: document.getElementById('s-inhalt').value, aktualisiert_am: new Date().toISOString() })
    .eq('seite_key', currentSeiteKey);

  if (error) {
    msg.className = 'err';
    msg.textContent = 'Fehler beim Speichern: ' + error.message;
  } else {
    msg.className = 'ok';
    msg.textContent = 'Gespeichert ✓';
  }
}
