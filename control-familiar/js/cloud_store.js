// Cloud Store - Sincronización UNIFICADA con Google Sheets
// USA EL MISMO FORMATO QUE TAREAS.HTML
(function(){
  // URL FIJA - mismo Apps Script para todo
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwredZeSCW6l8uYx4sx_Q_s1bCGh_mR_2qN1BGY5R4_a7NkStIuZ5Z4VhPrt9pgdnd64g/exec';
  
  function getUrl() { return SCRIPT_URL; }

  // Guardar una clave (mismo formato que tareas.html)
  async function saveKey(key, value) {
    try {
      var url = SCRIPT_URL + '?action=save&key=' + encodeURIComponent(key) + '&data=' + encodeURIComponent(JSON.stringify(value));
      var r = await fetch(url);
      var res = await r.json();
      console.log('CloudStore saved:', key, res.success ? '✓' : '✗');
      return res.success;
    } catch(e) { 
      console.error('CloudStore saveKey error:', e); 
      return false;
    }
  }

  // Cargar todo (mismo formato que tareas.html)
  async function loadAll() {
    try {
      var r = await fetch(SCRIPT_URL + '?action=load');
      var result = await r.json();
      console.log('CloudStore loaded:', result);
      return result.data || {};
    } catch(e) { 
      console.error('CloudStore loadAll error:', e); 
      return {}; 
    }
  }

  // Cargar una clave específica
  async function loadKey(key) {
    var all = await loadAll();
    return all[key] || null;
  }

  // ===== GASTOS =====
  async function syncGastos() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem('gastos_familia_v2') || '{}'); } catch(e) {}
    return await saveKey('gastos', data);
  }

  async function loadGastos() {
    var data = await loadKey('gastos');
    if (data && (data.transactions || data.fixedExpenses)) {
      localStorage.setItem('gastos_familia_v2', JSON.stringify(data));
      console.log('Gastos cargados de la nube');
    }
    return data;
  }

  // ===== CASA (home_data: inventory, shoppingList) =====
  async function syncCasa() {
    var data = {};
    try { data = JSON.parse(localStorage.getItem('home_data') || '{}'); } catch(e) {}
    return await saveKey('home_data', data);
  }

  async function loadCasa() {
    var data = await loadKey('home_data');
    if (data && (data.inventory || data.shoppingList)) {
      localStorage.setItem('home_data', JSON.stringify(data));
      console.log('Casa cargada de la nube');
    }
    return data;
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
    loadCasa: loadCasa
  };
  
  console.log('☁️ CloudStore listo - URL:', SCRIPT_URL);
})();
