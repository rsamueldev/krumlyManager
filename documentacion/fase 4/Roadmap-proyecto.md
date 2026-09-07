# Hoja de Ruta del Desarrollo (Development Roadmap)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento establece la hoja de ruta temporal (Roadmap) y los hitos de entrega (*Milestones*) para la construcción, pruebas y despliegue en producción de **Krumly Manager**, estimado en **5 Sprints de 2 semanas (10 semanas en total)**.

---

## 📅 Cronograma General de Hitos (Timeline overview)

```
[Sprint 1: Semanas 1-2] ➔ Fundaciones, Base de Datos, Auth & Insumos
[Sprint 2: Semanas 3-4] ➔ Cocina (Recetas Base) & Costeos de Productos Finales
[Sprint 3: Semanas 5-6] ➔ Punto de Venta POS, Pago Mixto & Sync Offline
[Sprint 4: Semanas 7-8] ➔ Lotes de Producción, Mermas, Gastos & Dashboard
[Sprint 5: Semanas 9-10]➔ Pruebas Integrales de QA, Optimización & Release Producción
```

---

## 🎯 Desglose de Sprints e Hitos de Entrega

### 🔷 Sprint 1 (Semanas 1 y 2): Fundaciones & Arquitectura Base
* **Objetivo:** Establecer el repositorio base, conectar NestJS con Supabase PostgreSQL mediante Prisma ORM, implementar autenticación por roles (RBAC) y activar los módulos base de insumos y categorías.
* **Historias de Usuario:**
  - `[Setup] Inicialización de Monorepo / NestJS + React Tailwind` (3 pts)
  - `[DB] Configuración de Prisma ORM y Migración de Esquema 3NF` (5 pts)
  - `[Auth] Login de Usuarios y Control de Acceso por Roles (RBAC)` (5 pts)
  - `[Insumos] CRUD de Insumos y Cálculo de Costo Unitario` (3 pts)
  - `[Categorías] Módulo de Categorías Dinámicas` (2 pts)
* **Hito 1 (Demo):** Login funcional por roles y gestión completa del almacén de materias primas.

---

### 🔷 Sprint 2 (Semanas 3 y 4): Cocina & Costeo Desacoplado de Productos
* **Objetivo:** Desarrollar el módulo de Recetas Base en cocina (cálculo de costo por gramo de masa) y el constructor de productos comerciales con insumos adicionales (rellenos/toppings) e indirectos.
* **Historias de Usuario:**
  - `[Recetas] Creación de Receta Base en Cocina y Costo por Gramo` (5 pts)
  - `[Productos] Constructor de Productos, Asignación de Masa y Rellenos` (5 pts)
  - `[Productos] Estructuración de Indirectos, Precio y Alerta de Pérdida` (5 pts)
* **Hito 2 (Demo):** Creación de recetas en cocina y catálogo de galletas con costeo directo total e indicador de margen % en vivo.

---

### 🔷 Sprint 3 (Semanas 5 y 6): Punto de Venta POS, Pago Mixto & Sync Offline
* **Objetivo:** Construir la interfaz de cobro rápido en mostrador con soporte de pago en USD/VES, modalidad de Pago Mixto y funcionamiento offline en la PWA con IndexedDB.
* **Historias de Usuario:**
  - `[POS] Interfaz de Catálogo Visual de Galletas y Filtro por Categorías` (5 pts)
  - `[POS] Carrito de Compras, Cliente Opcional y Modal de Pago Mixto` (8 pts)
  - `[POS] Modo Offline con IndexedDB y Sincronización Automática PWA` (8 pts)
* **Hito 3 (Demo):** Cobranza funcional en mostrador con pagos mixtos y ventas guardadas sin conexión.

---

### 🔷 Sprint 4 (Semanas 7 y 8): Producción, Mermas, Gastos & Dashboard
* **Objetivo:** Implementar la producción de lotes horneados (deducción automática de insumos e incremento de galletas), descarte de mermas, registro de gastos operativos y la consola del Dashboard Financiero.
* **Historias de Usuario:**
  - `[Producción] Registro de Lote de Producción e Incremento de Stock` (5 pts)
  - `[Mermas] Registro de Descarte y Ajuste de Inventario` (3 pts)
  - `[Gastos] Registro de Gastos Fijos y Variables en USD/VES` (3 pts)
  - `[Dashboard] Métricas KPI en Tiempo Real y Monitor de Punto de Equilibrio` (5 pts)
  - `[Dashboard] Gráficas Comparativas de Período y Rankings` (5 pts)
* **Hito 4 (Demo):** Dashboard Financiero en vivo calculando Utilidad Neta Real, Ticket Promedio y Punto de Equilibrio.

---

### 🔷 Sprint 5 (Semanas 9 y 10): QA, Optimización & Despliegue en Producción
* **Objetivo:** Ejecutar pruebas de carga, corregir casos borde, validar la sincronización offline y desplegar en entorno de producción.
* **Entregables:**
  - Pruebas E2E de flujos críticos (POS, Recetas, Gastos).
  - Despliegue de Frontend en Vercel (PWA responsive).
  - Despliegue de Backend NestJS en Render / Railway.
  - Base de Datos de Producción en Supabase (PostgreSQL).
* **Hito Final (Go-Live):** Lanzamiento oficial de **Krumly Manager v1.0** para el negocio.
