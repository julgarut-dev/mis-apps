(function(){
  function load(){
    try{ return JSON.parse(localStorage.getItem('home_data')||'{}'); }catch(e){ return {}; }
  }
  function save(d){ localStorage.setItem('home_data', JSON.stringify(d)); }
  function esc(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  async function bootstrap(){
    if(localStorage.getItem('home_cloud_url')){
      try{ await FamilySyncKV.pullShopping(); }catch(e){ console.warn(e); }
    }
    render();
  }

  function render(){
    const d=load();
    d.shoppingList = d.shoppingList || [];
    const pend=d.shoppingList.filter(x=>!x.done).length;
    document.getElementById('pendBadge').textContent = `${pend} pendientes`;

    const box=document.getElementById('list');
    if(!d.shoppingList.length){
      box.innerHTML = '<div class="small">Lista vacía. Añade arriba 👆</div>';
      return;
    }
    box.innerHTML = d.shoppingList.map(it=>`
      <div class="item">
        <div class="check ${it.done?'done':''}" data-t="${esc(it.id)}">${it.done?'✓':'•'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${it.done?'opacity:.7;text-decoration:line-through':''}">${esc(it.name)}</div>
          <div class="small">${it.done?'Comprado':'Pendiente'}</div>
        </div>
        <button class="btn secondary" style="width:auto;padding:10px 12px;border-radius:14px" data-del="${esc(it.id)}">🗑️</button>
      </div>
    `).join('');

    box.querySelectorAll('[data-t]').forEach(el=>{
      el.onclick=async ()=>{
        const id=String(el.dataset.t);
        const dd=load();
        dd.shoppingList = dd.shoppingList || [];
        const it=dd.shoppingList.find(x=>String(x.id)===id);
        if(it){ it.done=!it.done; save(dd); render();
          if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushShopping(); }catch(e){} }
        }
      };
    });
    box.querySelectorAll('[data-del]').forEach(btn=>{
      btn.onclick=async ()=>{
        const id=String(btn.dataset.del);
        if(!confirm('¿Borrar de la lista?')) return;
        const dd=load();
        dd.shoppingList = (dd.shoppingList||[]).filter(x=>String(x.id)!==id);
        save(dd); render();
        if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushShopping(); }catch(e){} }
      };
    });
  }

  async function add(){
    const inp=document.getElementById('inp');
    const name=inp.value.trim();
    if(!name) return;
    const d=load();
    d.shoppingList = d.shoppingList || [];
    d.shoppingList.unshift({id:Date.now(), name, done:false});
    save(d);
    inp.value='';
    render();
    if(localStorage.getItem('home_cloud_url')){ try{ await FamilySyncKV.pushShopping(); }catch(e){} }
  }

  document.getElementById('add').onclick=add;
  document.getElementById('btnAdd').onclick=add;
  document.getElementById('inp').addEventListener('keydown', (e)=>{ if(e.key==='Enter') add(); });
  window.addEventListener('storage', (e)=>{ if(e.key==='home_data') render(); });

  bootstrap();
})();