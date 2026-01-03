# Control Familiar (versión "bien hecha" + sincronización)

Esta versión mantiene tus páginas completas de **Tareas** y **Gastos** (sin romper nada),
y añade:

- 🏠 Inicio (dashboard completo)
- 📅 Agenda tipo agenda (eventos con fecha)
- 📦 Casa (lista de compra con checks)
- Menú inferior común en todas las páginas

## ✅ Sincronización con TU Apps Script (sin cambiar backend)
Tu Apps Script trabaja con una hoja con columnas: key | data | updated
y acciones: load / save.

Esta app usa esa misma URL guardada en:
- localStorage['home_cloud_url']

### Cómo configurarlo (en cada móvil / navegador)
1) Abre la app → Inicio
2) Pulsa ☁️ Nube
3) Pega la URL de tu Apps Script (la del Sheet de tareas)
4) Listo

Se sincroniza en Google Sheet con estas keys:
- events
- shopping
- menu_day

(Además de lo que ya tengas para tareas, si tu app de tareas lo hace.)

## Abrir
- Abre `index.html` (te manda a `pages/inicio.html`)
