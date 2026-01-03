
(function(){
  // Apps Script URL preset (same as tareas)
  localStorage.setItem('home_cloud_url', 'https://script.google.com/macros/s/AKfycbwredZeSCW6l8uYx4sx_Q_s1bCGh_mR_2qN1BGY5R4_a7NkStIuZ5Z4VhPrt9pgdnd64g/exec');

  function getApi(){ return localStorage.getItem('home_cloud_url'); }

  async function req(method, data){
    const url = getApi();
    const opts = { method };
    if(method === 'POST'){
      opts.headers = {'Content-Type':'application/x-www-form-urlencoded'};
      opts.body = new URLSearchParams(data).toString();
    }
    const r = await fetch(method==='GET' ? url+'?'+new URLSearchParams(data) : url, opts);
    return r.json();
  }

  async function loadAll(){
    const res = await req('GET', { action:'load' });
    return res.data || {};
  }

  async function loadKey(key){
    const all = await loadAll();
    return all[key] ?? null;
  }

  async function saveKey(key, value){
    await req('POST', { action:'save', key, data: JSON.stringify(value) });
  }

  window.CloudStore = { loadAll, loadKey, saveKey };
})();
