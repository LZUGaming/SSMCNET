// SSMCNET — einfacher WYSIWYG-Editor für Anfänger.
// Wandelt ein <textarea id="..."> in ein Word-ähnliches Textfeld um:
// man sieht direkt formatierten Text statt HTML-Code, kann per Knopf
// fett/kursiv/Überschrift/Liste machen, ohne Tags kaputt zu machen.
// Für Profis gibt's einen "Code anzeigen"-Umschalter als Rückfalloption.

function initRichEditor(textareaId) {
  const textarea = document.getElementById(textareaId);
  if (!textarea || textarea.dataset.richInit) return;
  textarea.dataset.richInit = '1';

  const wrapper = document.createElement('div');
  wrapper.className = 'rich-editor-wrapper';

  const toolbar = document.createElement('div');
  toolbar.className = 'rich-toolbar';

  const editable = document.createElement('div');
  editable.className = 'rich-editable content-body';
  editable.contentEditable = 'true';
  editable.spellcheck = false;

  const buttons = [
    { label: 'B', title: 'Fett', cmd: 'bold', style: 'font-weight:700;' },
    { label: 'I', title: 'Kursiv', cmd: 'italic', style: 'font-style:italic;' },
    { label: 'H2', title: 'Überschrift', cmd: 'formatBlock', arg: 'H2' },
    { label: 'Text', title: 'Normaler Text', cmd: 'formatBlock', arg: 'P' },
    { label: '• Liste', title: 'Aufzählung', cmd: 'insertUnorderedList' },
    { label: '↩', title: 'Rückgängig', cmd: 'undo' },
  ];

  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rich-btn';
    btn.title = b.title;
    btn.textContent = b.label;
    if (b.style) btn.style.cssText += b.style;
    btn.addEventListener('mousedown', e => e.preventDefault()); // Fokus im Editor behalten
    btn.addEventListener('click', () => {
      document.execCommand(b.cmd, false, b.arg || null);
      editable.focus();
      syncToTextarea();
    });
    toolbar.appendChild(btn);
  });

  // Bild-Button mit Upload zu Supabase Storage
  const imgBtn = document.createElement('button');
  imgBtn.type = 'button';
  imgBtn.className = 'rich-btn';
  imgBtn.title = 'Bild einfügen';
  imgBtn.textContent = '🖼️ Bild';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  let savedRange = null;
  editable.addEventListener('mouseup', () => { savedRange = getCurrentRange(); });
  editable.addEventListener('keyup', () => { savedRange = getCurrentRange(); });

  function getCurrentRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editable.contains(sel.anchorNode)) {
      return sel.getRangeAt(0).cloneRange();
    }
    return null;
  }

  imgBtn.addEventListener('mousedown', e => e.preventDefault());
  imgBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    imgBtn.textContent = 'Lädt hoch…';
    imgBtn.disabled = true;
    try {
      if (!client) throw new Error('Nicht verbunden');
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await client.storage.from('bilder').upload(path, file);
      if (upErr) throw upErr;
      const { data } = client.storage.from('bilder').getPublicUrl(path);
      editable.focus();
      if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      document.execCommand('insertHTML', false, `<img src="${data.publicUrl}" alt="" style="max-width:100%; border-radius:4px; margin:12px 0;">`);
      syncToTextarea();
    } catch (err) {
      alert('Bild-Upload fehlgeschlagen: ' + err.message);
    } finally {
      imgBtn.textContent = '🖼️ Bild';
      imgBtn.disabled = false;
      fileInput.value = '';
    }
  });

  toolbar.appendChild(imgBtn);
  toolbar.appendChild(fileInput);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'rich-btn rich-toggle';
  toggleBtn.textContent = 'Code anzeigen';
  toolbar.appendChild(toggleBtn);

  wrapper.appendChild(toolbar);
  wrapper.appendChild(editable);
  textarea.parentNode.insertBefore(wrapper, textarea);

  function syncToTextarea() {
    textarea.value = editable.innerHTML;
  }
  function syncFromTextarea() {
    editable.innerHTML = textarea.value || '<p>Hier klicken und Text eingeben …</p>';
  }

  editable.addEventListener('input', syncToTextarea);
  syncFromTextarea();

  let showingCode = false;
  toggleBtn.addEventListener('click', () => {
    showingCode = !showingCode;
    if (showingCode) {
      textarea.style.display = 'block';
      wrapper.style.display = 'none';
      toggleBtn.textContent = 'Einfache Ansicht';
    } else {
      syncFromTextarea();
      textarea.style.display = 'none';
      wrapper.style.display = 'block';
      toggleBtn.textContent = 'Code anzeigen';
    }
  });
  // Wenn im Code-Modus getippt wird, beim Zurückwechseln übernehmen
  textarea.addEventListener('input', () => {
    if (showingCode) { /* Wert bleibt bis zum Zurückwechseln in der Textarea */ }
  });
  toggleBtn.insertAdjacentHTML('afterend', '');

  // Hilfsfunktion global verfügbar machen, damit bearbeiten.js nach dem
  // programmatischen Setzen von textarea.value die Ansicht auffrischen kann.
  textarea._richRefresh = syncFromTextarea;
  textarea.style.display = 'none';
}

// Wird von bearbeiten.js aufgerufen, nachdem der Wert einer Textarea
// programmatisch gesetzt wurde (z.B. beim Laden einer Ausbildung/Seite).
function refreshRichEditor(textareaId) {
  const textarea = document.getElementById(textareaId);
  if (textarea && textarea._richRefresh) textarea._richRefresh();
}
