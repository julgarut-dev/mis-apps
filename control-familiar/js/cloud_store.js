// CloudStore for your existing Apps Script (key/data/updated).
// Needs localStorage['home_cloud_url'] = 'https://script.google.com/macros/s/.../exec'
(function(){
  function getApi(){ return localStorage.getItem('home_cloud_url') || ''; }

  async function req(method, data){
    const url = getApi();
    if(!url) throw new Error('Falta configurar la URL de Google Sheets (home_cloud_url).');
    const opts = { method };
    if(method === 'POST'){
      opts.headers = {'Content-Type':'application/x-www-form-urlencoded'};
      opts.body = new URLSearchParams(data).toString();
      const r = await fetch(url, opts);
      return await r.json();
    } else {
      const qs = new URLSearchParams(data).toString();
      const r = await fetch(url + (url.includes('?')?'&':'?') + qs);
      return await r.json();
    }
  }

  async function loadAll(){
    const res = await req('GET', { action:'load' });
    if(!res || res.success === false) throw new Error(res?.error || 'Error load');
    return res.data || {};
  }

  async function loadKey(key){
    const all = await loadAll();
    return all[key] ?? null;
  }

  async function saveKey(key, value){
    const res = await req('POST', { action:'save', key, data: JSON.stringify(value) });
    if(!res || res.success === false) throw new Error(res?.error || 'Error save');
    return true;
  }

  window.CloudStore = { loadAll, loadKey, saveKey };
})();