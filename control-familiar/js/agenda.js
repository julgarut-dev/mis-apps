(function(){
  const DEFAULT_HOME = { tasks:[], events:[] };
  const EVENT_TYPES = {
    medico: {icon:'🏥', name:'Médico'},
    trabajo: {icon:'💼', name:'Trabajo'},
    ocio: {icon:'🎉', name:'Ocio'},
    cumple: {icon:'🎂', name:'Cumple'},
    familia: {icon:'👨‍👩‍👧', name:'Familia'},
    otro: {icon:'📌', name:'Otro'}
  };

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

  // Check if recurring event matches a date
  function matchesRecur(event, targetDate) {
    if (!event.recur || !event.date) return false;
    const evDate = new Date(event.date);
    const tDate = new Date(targetDate);
    
    if (event.recur === 'daily') return true;
    if (event.recur === 'weekly') return evDate.getDay() === tDate.getDay();
    if (event.recur === 'monthly') return evDate.getDate() === tDate.getDate();
    if (event.recur === 'yearly') return evDate.getMonth() === tDate.getMonth() && evDate.getDate() === tDate.getDate();
    return false;
  }

  const modal=document.getElementById('eventModal');
  document.getElementById('btnAddEvent').onclick=()=>{ openModal(); };
  document.getElementById('closeModal').onclick=()=>{ modal.classList.remove('active'); };
  modal.addEventListener('click', (e)=>{ if (e.target===modal) modal.classList.remove('active'); });

  function openModal(){
    modal.classList.add('active');
    document.getElementById('evTitle').value='';
    document.getElementById('evDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('evRecur').value = '';
    if (window.setEventType) window.setEventType('otro');
    setTimeout(()=>document.getElementById('evTitle').focus(), 50);
  }

  document.getElementById('saveEvent').onclick=async ()=>{
    const title=document.getElementById('evTitle').value.trim();
    const date=document.getElementById('evDate').value;
    const recur=document.getElementById('evRecur').value;
    const type = window.currentEventType || 'otro';
    
    if(!title){ alert('Escribe un título'); return; }
    if(!date){ alert('Elige fecha'); return; }
    const d=loadHome();
    d.events = d.events || [];
    d.events.push({
      id:Date.now(), 
      name:title, 
      date:date, 
      type:type,
      recur:recur,
      done:false, 
      createdAt:new Date().toISOString()
    });
    saveHomeFull(d);
    if(window.CloudStore){
      try{ await CloudStore.syncCasa(); }catch(e){ console.warn(e); }
    }
    modal.classList.remove('active');
    render();
  };

  function getEventsForDate(d, dateKey, events) {
    let result = [];
    events.forEach(e => {
      if (e.date === dateKey) {
        result.push(e);
      } else if (e.recur && matchesRecur(e, dateKey)) {
        result.push({...e, isRecurring: true, originalDate: e.date});
      }
    });
    return result;
  }

  function renderDay(listEl, badgeEl, day){
    const k=key(day);
    badgeEl.textContent = k;
    const d=loadHome();

    const events = getEventsForDate(day, k, d.events||[]);
    const tasksAll = (d.tasks||[]).filter(t=>t.date===k);
    const tasks = tasksAll.map(t=>({type:'task', id:t.id, name:t.name, done:!!t.done}));
    const items = [
      ...events.map(e=>({
        type:'event', 
        id:e.id, 
        name:e.name, 
        done:!!e.done,
        eventType: e.type || 'otro',
        recur: e.recur,
        isRecurring: e.isRecurring
      })),
      ...tasks
    ];

    if(!items.length){
      listEl.innerHTML = '<div class="small">Nada programado.</div>';
      return;
    }

    listEl.innerHTML = items.map(it=>{
      let typeBadge = '';
      let recurBadge = '';
      if (it.type === 'event') {
        const et = EVENT_TYPES[it.eventType] || EVENT_TYPES.otro;
        typeBadge = `<span class="event-badge ${it.eventType}">${et.icon}</span>`;
        if (it.recur || it.isRecurring) recurBadge = '<span class="recur-badge">🔁</span>';
      }
      return `
      <div class="item">
        <div class="check ${it.done?'done':''}" data-toggle="${esc(it.type)}" data-id="${esc(it.id)}">${it.done?'✓':'•'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${it.done?'opacity:.7;text-decoration:line-through':''}">${esc(it.name)}${recurBadge}</div>
          <div class="small">${it.type==='event'?'📅 Evento':'✅ Tarea'}</div>
        </div>
        ${typeBadge}
      </div>
    `}).join('');

    listEl.querySelectorAll('[data-toggle]').forEach(btn=>{
      btn.onclick=async ()=>{
        const type=btn.dataset.toggle;
        const id=String(btn.dataset.id);
        const dd=loadHome();
        if(type==='event'){
          const ev=(dd.events||[]).find(x=>String(x.id)===id);
          if(ev){ ev.done=!ev.done; saveHomeFull(dd);
            if(window.CloudStore){ try{ await CloudStore.syncCasa(); }catch(e){} }
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
      const evs = getEventsForDate(day, k, d.events||[]);
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
        ...g.evs.map(e=>({type:'event', id:e.id, name:e.name, done:!!e.done, eventType:e.type||'otro', recur:e.recur, isRecurring:e.isRecurring})),
        ...g.ts.map(t=>({type:'task', id:t.id, name:t.name, done:!!t.done}))
      ];
      return `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
          <div class="row" style="justify-content:space-between">
            <div style="font-weight:950;text-transform:capitalize">${esc(title)}</div>
            <span class="badge">${rows.length} items</span>
          </div>
          <div style="margin-top:8px">
            ${rows.slice(0,6).map(it=>{
              const et = EVENT_TYPES[it.eventType] || EVENT_TYPES.otro;
              const badge = it.type==='event' ? `<span class="event-badge ${it.eventType}">${et.icon}</span>` : '<span class="badge">✅</span>';
              const recurIcon = (it.recur || it.isRecurring) ? ' 🔁' : '';
              return `
              <div class="row" style="gap:8px;margin-top:6px">
                ${badge}
                <div style="flex:1;min-width:0;${it.done?'opacity:.7;text-decoration:line-through':''}">${esc(it.name)}${recurIcon}</div>
              </div>
            `}).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  async function bootstrap(){
    if(window.CloudStore){
      try{ await CloudStore.loadCasa(); }catch(e){ console.warn(e); }
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