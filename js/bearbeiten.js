// Einfacher Passwortschutz — siehe Hinweis in supabase_inhalt_update.sql:
// das ist KEIN echter Zugriffsschutz, nur eine Hürde für normale Besucher.
const EDIT_PASSWORD = "ssmc-intern-2026"; // <- hier bei Bedarf ändern

let client;
let currentId = null;

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

  select.addEventListener('change', () => {
    if (select.value) loadTraining(select.value);
    else document.getElementById('form-fields').style.display = 'none';
  });

  document.getElementById('save-btn').addEventListener('click', saveTraining);
}

async function loadTraining(id) {
  const { data, error } = await client.from('ausbildungen').select('*').eq('id', id).single();
  if (error || !data) {
    alert('Konnte Ausbildung nicht laden.');
    return;
  }
  currentId = data.id;
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
  if (!currentId) return;
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

  const { error } = await client.from('ausbildungen').update(updates).eq('id', currentId);
  if (error) {
    msg.className = 'err';
    msg.textContent = 'Fehler beim Speichern: ' + error.message;
  } else {
    msg.className = 'ok';
    msg.textContent = 'Gespeichert ✓';
  }
}
