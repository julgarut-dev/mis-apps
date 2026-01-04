(function(){
  function pageName(){
    var p = location.pathname.split('/').pop() || '';
    return p.replace('.html','');
  }
  var current = pageName();
  var nav = document.createElement('div');
  nav.className = 'shell-bottom-nav';
  nav.innerHTML = `
    <div class="nav-wrap">
      <a href="inicio.html" data-page="inicio"><span class="ico">🏠</span><span>Inicio</span></a>
      <a href="agenda.html" data-page="agenda"><span class="ico">📅</span><span>Agenda</span></a>
      <a href="tareas.html" data-page="tareas"><span class="ico">✅</span><span>Tareas</span></a>
      <a href="gastos.html" data-page="gastos"><span class="ico">💰</span><span>Gastos</span></a>
      <a href="casa.html" data-page="casa"><span class="ico">📦</span><span>Casa</span></a>
      <a href="documentos.html" data-page="documentos"><span class="ico">📚</span><span>Docs</span></a>
    </div>
  `;
  document.body.appendChild(nav);
  var spacer = document.createElement('div');
  spacer.className = 'shell-spacer';
  document.body.appendChild(spacer);
  nav.querySelectorAll('a').forEach(function(a){
    if (a.dataset.page === current) a.classList.add('active');
  });

  var sp = new URLSearchParams(location.search);
  var action = sp.get('action');
  if (!action) return;

  if (current === 'tareas' && action === 'newTask'){
    setTimeout(function(){ if (typeof window.openTaskModal === 'function') window.openTaskModal(); }, 250);
  }
  if (current === 'agenda' && action === 'newEvent'){
    setTimeout(function(){ var btn = document.getElementById('btnAddEvent'); if (btn) btn.click(); }, 250);
  }
  if (current === 'gastos' && action === 'newExpense'){
    setTimeout(function(){ if (typeof window.openModal === 'function') window.openModal('expense'); }, 350);
  }
})();