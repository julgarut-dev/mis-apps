// Cloud Store - Sincronización UNIFICADA con Google Sheets
// TODAS las secciones usan este mismo script
(function(){
  // URL FIJA - mismo Apps Script para todo
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwredZeSCW6l8uYx4sx_Q_s1bCGh_mR_2qN1BGY5R4_a7NkStIuZ5Z4VhPrt9pgdnd64g/exec';
  
  function getUrl() { return SCRIPT_URL; }

  // Guardar una clave
  async function saveKey(key, value) {
    try {
      await fetch(SCRIPT_URL + '?action=save&key=' + encodeURIComponent(key) + '&data=' + encodeURIComponent(JSON.stringify(value)));
      console.log('CloudStore: guardado', key);
    } catch(e) { console.error('CloudStore saveKey error:', e); }
  }

  // Cargar una clave
  async function loadKey(key) {
    try {
      var r = await fetch(SCRIPT_URL + '?action=load');
      var result = await r.json();
      var data = result.data || {};
      return data[key] || null;
    } catch(e) { console.error('CloudStore loadKey error:', e); return null; }
  }

  // Cargar todo
  async function loadAll() {
    try {
      var r = await fetch(SCRIPT_URL + '?action=load');
      var result = await r.json();
      return result.data || {};
    } catch(e) { console.error('CloudStore error:', e); return {}; }
  }

  // ===== GASTOS =====
  async function syncGastos() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem('gastos_familia_v2') || '{}'); } catch(e) {}
    await saveKey('gastos', data);
  }

  async function loadGastos() {
    var data = await loadKey('gastos');
    if (data) {
      localStorage.setItem('gastos_familia_v2', JSON.stringify(data));
    }
    return data;
  }

  // ===== CASA (home_data: inventory, shoppingList) =====
  async function syncCasa() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem('home_data') || '{}'); } catch(e) {}
    await saveKey('home_data', data);
  }

  async function loadCasa() {
    var data = await loadKey('home_data');
    if (data) {
      localStorage.setItem('home_data', JSON.stringify(data));
    }
    return data;
  }

  // ===== TAREAS (homedata) =====
  async function syncTareas() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem('homedata') || '{}'); } catch(e) {}
    await saveKey('tareas', data);
  }

  async function loadTareas() {
    var data = await loadKey('tareas');
    if (data) {
      localStorage.setItem('homedata', JSON.stringify(data));
    }
    return data;
  }

  // ===== AGENDA (events dentro de home_data) =====
  async function syncEvents() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem('home_data') || '{}'); } catch(e) {}
    await saveKey('events', data.events || []);
  }

  async function loadEvents() {
    var events = await loadKey('events');
    if (events && Array.isArray(events)) {
      var data = {};
      try { data = JSON.parse(localStorage.getItem('home_data') || '{}'); } catch(e) {}
      data.events = events;
      localStorage.setItem('home_data', JSON.stringify(data));
    }
    return events;
  }

  // Exportar
  window.CloudStore = {
    getUrl: getUrl,
    saveKey: saveKey,
    loadKey: loadKey,
    loadAll: loadAll,
    syncGastos: syncGastos,
    loadGastos: loadGastos,
    syncCasa: syncCasa,
    loadCasa: loadCasa,
    syncTareas: syncTareas,
    loadTareas: loadTareas,
    syncEvents: syncEvents,
    loadEvents: loadEvents
  };
  
  console.log('CloudStore inicializado con URL:', SCRIPT_URL);
})();
