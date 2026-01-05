(function(){
  const DEFAULT_HOME = { tasks:[], events:[], shoppingList:[], menuDay:{desayuno:'',comida:'',merienda:'',cena:''}, menuByDate:{} };

  function loadHome(){
    try{
      const raw = localStorage.getItem('home_data');
      const data = raw ? JSON.parse(raw) : {};
      return Object.assign(structuredClone(DEFAULT_HOME), data||{});
    }catch(e){ return structuredClone(DEFAULT_HOME); }
  }
  function saveHome(d){ localStorage.setItem('home_data', JSON.stringify(d)); }

  function loadGastos(){
    try{ return JSON.parse(localStorage.getItem('gastos_familia_v2')||'null'); }catch(e){ return null; }
  }
  function todayKey(){
    const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }
  function monthKey(){ return new Date().toISOString().slice(0,7); }
  function fmtEUR(n){
    const v=Math.round((Number(n)||0)*100)/100;
    return v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
  }
  function esc(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  async function maybePullCloud(){
    try{
      if(!localStorage.getItem('home_cloud_url')) return;
      await FamilySyncKV.pullEvents();
      await FamilySyncKV.pullShopping();
      await FamilySyncKV.pullMenu();
    }catch(e){
      console.warn('Nube:', e.message||e);
    }
  }

  function render(){
    const hd = loadHome();
    const gd = loadGastos();
    const today = todayKey();
    const thisMonth = monthKey();

    const days=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const now=new Date();
    document.getElementById('todayLine').textContent = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
    document.getElementById('monthBadge').textContent = thisMonth;

    const tasksToday=(hd.tasks||[]).filter(t=>t.date===today);
    const eventsToday=(hd.events||[]).filter(e=>e.date===today);

    let inc=0, exp=0, sav=0;
    const trans = (gd && gd.transactions) ? gd.transactions : [];
    trans.forEach(t=>{
      if (!t.date || !String(t.date).startsWith(thisMonth)) return;
      if (t.type==='income') inc+=Number(t.amount||0);
      else if (t.type==='expense') exp+=Number(t.amount||0);
      else if (t.type==='saving') sav+=Number(t.amount||0);
    });
    const balance = inc - exp - sav;

    const compraPend=(hd.shoppingList||[]).filter(i=>!i.done).length;

    document.getElementById('kpiTasks').textContent = tasksToday.length;
    document.getElementById('kpiEvents').textContent = eventsToday.length;
    document.getElementById('kpiBalance').textContent = fmtEUR(balance);
    document.getElementById('kpiCompra').textContent = compraPend;

    const checklist = [
      ...tasksToday.map(t=>({kind:'task', id:t.id, name:t.name, done:!!t.done})),
      ...eventsToday.map(e=>({kind:'event', id:e.id, name:e.name, done:!!e.done}))
    ];
    const doneCount = checklist.filter(x=>x.done).length;
    const total = checklist.length;
    const pct = total ? Math.round(doneCount/total*100) : 0;

    document.getElementById('chkCount').textContent = `${total} items`;
    document.getElementById('pct').textContent = pct+'%';
    document.getElementById('doneLine').textContent = `${doneCount}/${total}`;
    document.getElementById('bar').style.width = pct+'%';

    const chkHtml = total ? checklist.slice(0,10).map(x=>`
      <div class="item">
        <div class="check ${x.done?'done':''}" data-toggle="${esc(x.kind)}" data-id="${esc(x.id)}">${x.done?'✓':'•'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${x.done?'opacity:.7;text-decoration:line-through':''}">${esc(x.name)}</div>
          <div class="small">${x.kind==='task'?'✅ Tarea':'📅 Evento'}</div>
        </div>
        <span class="badge">${x.kind==='task'?'Tareas':'Agenda'}</span>
      </div>
    `).join('') : `<div class="small">🎉 Hoy no hay tareas ni eventos.</div>`;
    document.getElementById('checklist').innerHTML = chkHtml;

    document.querySelectorAll('[data-toggle]').forEach(el=>{
      el.onclick = async ()=>{
        const kind=el.dataset.toggle;
        const id=String(el.dataset.id);
        const d = loadHome();
        if (kind==='task'){
          const t=(d.tasks||[]).find(x=>String(x.id)===id);
          if (t){ t.done=!t.done; t.doneAt = t.done ? new Date().toISOString() : null; saveHome(d); render(); }
        } else {
          const ev=(d.events||[]).find(x=>String(x.id)===id);
          if (ev){ ev.done=!ev.done; saveHome(d); render();
            // push events to cloud if configured
            if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushEvents(); }catch(e){} }
          }
        }
      };
    });

    // Shopping list
    document.getElementById('shopPend').textContent = `${compraPend} pendientes`;
    const shop = hd.shoppingList || [];
    document.getElementById('shopList').innerHTML = shop.length ? shop.slice(0,8).map(it=>`
      <div class="item">
        <div class="check ${it.done?'done':''}" data-shop="${esc(it.id)}">${it.done?'✓':'•'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${it.done?'opacity:.7;text-decoration:line-through':''}">${esc(it.name)}</div>
          <div class="small">${it.done?'Comprado':'Pendiente'}</div>
        </div>
        <span class="badge">Compra</span>
      </div>
    `).join('') : `<div class="small">No hay nada en la lista. Añade arriba 👆</div>`;

    document.querySelectorAll('[data-shop]').forEach(el=>{
      el.onclick=async ()=>{
        const id=String(el.dataset.shop);
        const d=loadHome();
        const it=(d.shoppingList||[]).find(x=>String(x.id)===id);
        if (it){ it.done=!it.done; saveHome(d); render();
          if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushShopping(); }catch(e){} }
        }
      };
    });

    // Add shopping
    const addBtn=document.getElementById('shopAdd');
    const inp=document.getElementById('shopInput');
    async function addShop(){
      const name=inp.value.trim();
      if(!name) return;
      const d=loadHome();
      d.shoppingList = d.shoppingList || [];
      d.shoppingList.unshift({id:Date.now(), name, done:false});
      saveHome(d);
      inp.value='';
      render();
      if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushShopping(); }catch(e){} }
    }
    addBtn.onclick=addShop;
    inp.onkeydown=(e)=>{ if(e.key==='Enter') addShop(); };

    // Goals
    const goals = (gd && gd.goals) ? gd.goals : [];
    document.getElementById('goals').innerHTML = goals.length ? goals.slice(0,4).map(g=>{
      const target=Number(g.target||0), saved=Number(g.saved||0);
      const gpct = target? Math.max(0, Math.min(100, Math.round(saved/target*100))) : 0;
      return `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="row" style="justify-content:space-between">
            <div style="font-weight:950">${esc(g.icon||'🎯')} ${esc(g.name||'Objetivo')}</div>
            <div class="small">${fmtEUR(saved)} / ${fmtEUR(target)}</div>
          </div>
          <div class="progress" style="margin-top:8px"><div style="width:${gpct}%"></div></div>
          <div class="small" style="margin-top:6px">${gpct}%</div>
        </div>
      `;
    }).join('') : `<div class="small">Aún no hay objetivos. Añádelos en Gastos → Metas.</div>`;

    // Menu day
    const md = hd.menuDay || {};
    document.getElementById('mDes').value = md.desayuno||'';
    document.getElementById('mCom').value = md.comida||'';
    document.getElementById('mMer').value = md.merienda||'';
    document.getElementById('mCen').value = md.cena||'';
  }

  document.getElementById('saveMenu').onclick = async ()=>{
    const d=loadHome();
    d.menuDay = {
      desayuno: document.getElementById('mDes').value.trim(),
      comida: document.getElementById('mCom').value.trim(),
      merienda: document.getElementById('mMer').value.trim(),
      cena: document.getElementById('mCen').value.trim()
    };
    saveHome(d);
    if(localStorage.getItem('home_cloud_url')){
      try{ await FamilySyncKV.pushMenu(); }catch(e){ console.warn(e); }
    }
    alert('✅ Menú guardado');
    render();
  };

  // Cloud button: set URL
  document.getElementById('cloudBtn').onclick = async ()=>{
    const cur = localStorage.getItem('home_cloud_url') || '';
    const url = prompt('Pega aquí la URL de tu Apps Script (Google Sheets) para sincronizar:', cur);
    if(url === null) return;
    const v = url.trim();
    if(!v){
      localStorage.removeItem('home_cloud_url');
      alert('☁️ Nube desactivada en este dispositivo.');
      return;
    }
    localStorage.setItem('home_cloud_url', v);
    alert('☁️ Guardada. Actualizando datos…');
    await maybePullCloud();
    render();
  };

  window.addEventListener('storage', (e)=>{ if (e.key==='home_data' || e.key==='gastos_familia_v2') render(); });

  (async ()=>{
    await maybePullCloud();
    render();
  })();
})();