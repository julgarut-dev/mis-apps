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
      <a href="calendario.html" data-page="calendario"><span class="ico">📅</span><span>Calendario</span></a>
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
  var dateParam = sp.get('date');
  
  // Guardar fecha para usar en modales
  if (dateParam) window.presetDate = dateParam;
  
  if (!action) return;

  if (current === 'tareas' && action === 'newTask'){
    setTimeout(function(){ 
      if (typeof window.openTaskModal === 'function') {
        window.openTaskModal();
        // Si hay fecha, setearla
        if (dateParam && document.getElementById('taskDate')) {
          document.getElementById('taskDate').value = dateParam;
        }
      }
    }, 300);
  }
  if (current === 'agenda' && action === 'newEvent'){
    setTimeout(function(){ 
      if (typeof window.openEventModal === 'function') {
        window.openEventModal(dateParam || null);
      } else {
        var btn = document.getElementById('btnAddEvent'); 
        if (btn) btn.click();
        if (dateParam && document.getElementById('eventDate')) {
          setTimeout(function() {
            document.getElementById('eventDate').value = dateParam;
          }, 100);
        }
      }
    }, 300);
  }
  if (current === 'gastos' && action === 'newExpense'){
    setTimeout(function(){ if (typeof window.openModal === 'function') window.openModal('expense'); }, 350);
  }
})();