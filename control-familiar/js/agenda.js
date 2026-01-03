(function(){
  const DEFAULT_HOME = { tasks:[], events:[] };

  function loadHome(){
    try{
      const raw=localStorage.getItem('home_data');
      const data=raw?JSON.parse(raw):{};
      return Object.assign(structuredClone(DEFAULT_HOME), data||{});
    }catch(e){ return structuredClone(DEFAULT_HOME); }
  }
  function saveHomeFull(d){ localStorage.setItem('home_data', JSON.stringify(d)); }

  function key(d){
    const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function esc(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  const modal=document.getElementById('eventModal');
  document.getElementById('btnAddEvent').onclick=()=>{ openModal(); };
  document.getElementById('closeModal').onclick=()=>{ modal.classList.remove('active'); };
  modal.addEventListener('click', (e)=>{ if (e.target===modal) modal.classList.remove('active'); });

  function openModal(){
    modal.classList.add('active');
    document.getElementById('evTitle').value='';
    document.getElementById('evDate').value = new Date().toISOString().slice(0,10);
    setTimeout(()=>document.getElementById('evTitle').focus(), 50);
  }

  document.getElementById('saveEvent').onclick=async ()=>{
    const title=document.getElementById('evTitle').value.trim();
    const date=document.getElementById('evDate').value;
    if(!title){ alert('Escribe un título'); return; }
    if(!date){ alert('Elige fecha'); return; }
    const d=loadHome();
    d.events = d.events || [];
    d.events.push({id:Date.now(), name:title, date:date, done:false, createdAt:new Date().toISOString()});
    saveHomeFull(d);
    if(localStorage.getItem('home_cloud_url')){
      try{ await FamilySyncKV.pushEvents(); }catch(e){ console.warn(e); }
    }
    modal.classList.remove('active');
    render();
  };

  function renderDay(listEl, badgeEl, day){
    const k=key(day);
    badgeEl.textContent = k;
    const d=loadHome();

    const events=(d.events||[]).filter(e=>e.date===k);
    const tasksAll = (d.tasks||[]).filter(t=>t.date===k);
    const tasks = tasksAll.map(t=>({type:'task', id:t.id, name:t.name, done:!!t.done}));
    const items = [
      ...events.map(e=>({type:'event', id:e.id, name:e.name, done:!!e.done})),
      ...tasks
    ];

    if(!items.length){
      listEl.innerHTML = '<div class="small">Nada programado.</div>';
      return;
    }

    listEl.innerHTML = items.map(it=>`
      <div class="item">
        <div class="check ${it.done?'done':''}" data-toggle="${esc(it.type)}" data-id="${esc(it.id)}">${it.done?'✓':'•'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${it.done?'opacity:.7;text-decoration:line-through':''}">${esc(it.name)}</div>
          <div class="small">${it.type==='event'?'📅 Evento':'✅ Tarea'}</div>
        </div>
        <span class="badge">${it.type==='event'?'Agenda':'Tareas'}</span>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-toggle]').forEach(btn=>{
      btn.onclick=async ()=>{
        const type=btn.dataset.toggle;
        const id=String(btn.dataset.id);
        const dd=loadHome();
        if(type==='event'){
          const ev=(dd.events||[]).find(x=>String(x.id)===id);
          if(ev){ ev.done=!ev.done; saveHomeFull(dd);
            if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushEvents(); }catch(e){} }
            render();
          }
        }else{
          const t=(dd.tasks||[]).find(x=>String(x.id)===id);
          if(t){ t.done=!t.done; t.doneAt = t.done ? new Date().toISOString() : null; saveHomeFull(dd); render(); }
        }
      };
    });
  }

  function renderUpcoming(){
    const box=document.getElementById('upcoming');
    const d=loadHome();
    const start=new Date(); start.setHours(0,0,0,0);

    let groups = [];
    for(let i=0;i<14;i++){
      const day=addDays(start,i);
      const k=key(day);
      const evs=(d.events||[]).filter(e=>e.date===k);
      const ts=(d.tasks||[]).filter(t=>t.date===k);
      if(!evs.length && !ts.length) continue;
      groups.push({day, k, evs, ts});
    }

    if(!groups.length){
      box.innerHTML = '<div class="small">No hay nada en los próximos 14 días.</div>';
      return;
    }

    box.innerHTML = groups.map(g=>{
      const title = g.day.toLocaleDateString('es-ES',{weekday:'long', day:'2-digit', month:'short'});
      const rows = [
        ...g.evs.map(e=>({type:'event', id:e.id, name:e.name, done:!!e.done})),
        ...g.ts.map(t=>({type:'task', id:t.id, name:t.name, done:!!t.done}))
      ];
      return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div class="row" style="justify-content:space-between">
            <div style="font-weight:950;text-transform:capitalize">${esc(title)}</div>
            <span class="badge">${rows.length} items</span>
          </div>
          <div style="margin-top:8px">
            ${rows.slice(0,6).map(it=>`
              <div class="row" style="gap:8px;margin-top:6px">
                <span class="badge">${it.type==='event'?'📅':'✅'}</span>
                <div style="flex:1;min-width:0;${it.done?'opacity:.7;text-decoration:line-through':''}">${esc(it.name)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  async function bootstrap(){
    if(localStorage.getItem('home_cloud_url')){
      try{ await FamilySyncKV.pullEvents(); }catch(e){ console.warn(e); }
    }
    render();
  }

  function render(){
    const now=new Date(); now.setHours(0,0,0,0);
    renderDay(document.getElementById('todayList'), document.getElementById('todayBadge'), now);
    renderDay(document.getElementById('tomList'), document.getElementById('tomBadge'), addDays(now,1));
    renderUpcoming();
  }

  bootstrap();
})();