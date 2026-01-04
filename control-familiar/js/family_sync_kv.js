(function(){
  // URL FIJA para todo
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwredZeSCW6l8uYx4sx_Q_s1bCGh_mR_2qN1BGY5R4_a7NkStIuZ5Z4VhPrt9pgdnd64g/exec';

  function loadHome(){
    try{ return JSON.parse(localStorage.getItem('home_data')||'{}'); }catch(e){ return {}; }
  }
  function saveHome(d){ localStorage.setItem('home_data', JSON.stringify(d)); }

  function todayKey(){
    const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }

  async function pullEvents(){
    try {
      const r = await fetch(SCRIPT_URL + '?action=load');
      const result = await r.json();
      const data = result.data || {};
      if (data.events && Array.isArray(data.events)) {
        const d = loadHome();
        d.events = data.events;
        saveHome(d);
        return d.events;
      }
    } catch(e) { console.error('pullEvents error:', e); }
    return [];
  }

  async function pushEvents(){
    try {
      const d = loadHome();
      await fetch(SCRIPT_URL + '?action=save&key=events&data=' + encodeURIComponent(JSON.stringify(d.events || [])));
    } catch(e) { console.error('pushEvents error:', e); }
  }

  async function pullShopping(){
    try {
      const r = await fetch(SCRIPT_URL + '?action=load');
      const result = await r.json();
      const data = result.data || {};
      if (data.shopping && Array.isArray(data.shopping)) {
        const d = loadHome();
        d.shoppingList = data.shopping;
        saveHome(d);
        return d.shoppingList;
      }
    } catch(e) { console.error('pullShopping error:', e); }
    return [];
  }

  async function pushShopping(){
    try {
      const d = loadHome();
      await fetch(SCRIPT_URL + '?action=save&key=shopping&data=' + encodeURIComponent(JSON.stringify(d.shoppingList || [])));
    } catch(e) { console.error('pushShopping error:', e); }
  }

  async function pullMenu(){
    try {
      const r = await fetch(SCRIPT_URL + '?action=load');
      const result = await r.json();
      const data = result.data || {};
      if (data.menu_day) {
        const d = loadHome();
        d.menuByDate = data.menu_day;
        const tk = todayKey();
        d.menuDay = d.menuByDate[tk] || {};
        saveHome(d);
        return d.menuByDate;
      }
    } catch(e) { console.error('pullMenu error:', e); }
    return {};
  }

  async function pushMenu(){
    try {
      const d = loadHome();
      d.menuByDate = d.menuByDate || {};
      const tk = todayKey();
      d.menuByDate[tk] = d.menuDay || {desayuno:'',comida:'',merienda:'',cena:''};
      saveHome(d);
      await fetch(SCRIPT_URL + '?action=save&key=menu_day&data=' + encodeURIComponent(JSON.stringify(d.menuByDate)));
    } catch(e) { console.error('pushMenu error:', e); }
  }

  window.FamilySyncKV = { pullEvents, pushEvents, pullShopping, pushShopping, pullMenu, pushMenu, todayKey, loadHome, saveHome };
})();