(function(){
  function loadHome(){
    try{ return JSON.parse(localStorage.getItem('home_data')||'{}'); }catch(e){ return {}; }
  }
  function saveHome(d){ localStorage.setItem('home_data', JSON.stringify(d)); }

  function todayKey(){
    const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }

  async function pullEvents(){
    if(!window.CloudStore) return;
    const events = await CloudStore.loadKey('events');
    const d = loadHome();
    d.events = Array.isArray(events) ? events : (d.events||[]);
    saveHome(d);
    return d.events;
  }
  async function pushEvents(){
    const d = loadHome();
    await CloudStore.saveKey('events', d.events || []);
  }

  async function pullShopping(){
    if(!window.CloudStore) return;
    const shopping = await CloudStore.loadKey('shopping');
    const d = loadHome();
    d.shoppingList = Array.isArray(shopping) ? shopping : (d.shoppingList||[]);
    saveHome(d);
    return d.shoppingList;
  }
  async function pushShopping(){
    const d = loadHome();
    await CloudStore.saveKey('shopping', d.shoppingList || []);
  }

  // menu_day stored as map: { 'YYYY-MM-DD': {desayuno,comida,merienda,cena} }
  async function pullMenu(){
    if(!window.CloudStore) return;
    const menu = await CloudStore.loadKey('menu_day');
    const d = loadHome();
    if(menu && typeof menu === 'object' && !Array.isArray(menu)){
      d.menuByDate = menu;
    } else {
      d.menuByDate = d.menuByDate || {};
    }
    // keep legacy menuDay for current date
    const tk = todayKey();
    d.menuDay = (d.menuByDate && d.menuByDate[tk]) ? d.menuByDate[tk] : (d.menuDay||{});
    saveHome(d);
    return d.menuByDate;
  }
  async function pushMenu(){
    const d = loadHome();
    d.menuByDate = d.menuByDate || {};
    const tk = todayKey();
    d.menuByDate[tk] = d.menuDay || {desayuno:'',comida:'',merienda:'',cena:''};
    saveHome(d);
    await CloudStore.saveKey('menu_day', d.menuByDate);
  }

  window.FamilySyncKV = { pullEvents, pushEvents, pullShopping, pushShopping, pullMenu, pushMenu, todayKey, loadHome, saveHome };
})();