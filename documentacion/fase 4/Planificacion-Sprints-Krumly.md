# Planificación de Sprints y Guía de Ejecución (Solo Developer)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento es la **guía maestra de planificación y ejecución** diseñada específicamente para el desarrollo en solitario (*Solo Developer*) de **Krumly Manager**. 

Reemplaza la necesidad de Jira mediante una lista de verificación (*checklists Markdown*) que puedes marcar directamente en GitHub a medida que avances con tus `commits`.

---

## 🛠️ Cómo usar este documento en GitHub

Cada tarea incluye una casilla de verificación (`- [ ]`). Cuando termines un ticket en el código:
1. Cambia `- [ ]` por `- [x]`.
2. Haz commit con el mensaje del ticket (ej. `git commit -m "feat: [Sprint 1] CRUD de Insumos completado"`).
3. Sube a GitHub y verás tu progreso visualmente.

---

## 🗺️ Visión General del Cronograma (5 Sprints / 10 Semanas)

| Sprint | Enfoque Principal | Semanas | Estado |
| :--- | :--- | :---: | :---: |
| **Sprint 1** | Fundaciones, DB Prisma 3NF, Auth RBAC & Insumos/Categorías | Semanas 1 y 2 | 🟡 En Inicio |
| **Sprint 2** | Cocina (Recetas Base en g) & Costeo de Productos Finales | Semanas 3 y 4 | ⏳ Pendiente |
| **Sprint 3** | Punto de Venta POS, Pago Mixto (USD/VES) & Sync Offline | Semanas 5 y 6 | ⏳ Pendiente |
| **Sprint 4** | Lotes de Producción, Mermas, Gastos Operativos & Dashboard | Semanas 7 y 8 | ⏳ Pendiente |
| **Sprint 5** | Pruebas Integrales QA, Optimización & Despliegue Producción | Semanas 9 y 10| ⏳ Pendiente |

---

## 🏃 SPRINT 1: Fundaciones, Base de Datos, Auth & Insumos (Semanas 1 y 2)

**Objetivo del Sprint 1:** Tener el monorepo/estructura inicial compilando, la base de datos PostgreSQL de 14 tablas creada en Supabase vía Prisma ORM, autenticación funcional por roles (Admin vs Cajero) y el CRUD de Insumos y Categorías dinámicas.

### 📋 Checklist de Tareas del Sprint 1:

- [x] **TSK-101 [Setup]: Inicialización del Proyecto y Configuración Visual**
  - Inicializar carpeta `frontend/` (React + TailwindCSS).
  - Inicializar carpeta `backend/` (NestJS TypeScript).
  - Configurar la paleta oficial en `tailwind.config.js` (`#AA1616` Krumly Red, `#FFF3E8` Soft Cream, `#1A0A0A` Dark Text).
  - *Criterio de Aceptación:* `npm run dev` en frontend y backend levantan sin errores.

- [x] **TSK-102 [DB]: Configuración de Prisma ORM y Migración de Esquema 3NF**
  - Crear `backend/prisma/schema.prisma` con las 14 tablas normalizadas: `usuarios`, `clientes`, `categorias`, `insumos`, `recetas`, `receta_insumos`, `productos`, `producto_insumos_adicionales`, `lotes_produccion`, `mermas`, `gastos`, `ventas`, `venta_detalles`, `venta_pagos`.
  - Ejecutar `npx prisma migrate dev --name init_3nf` hacia Supabase.
  - *Criterio de Aceptación:* Todas las tablas creadas en Supabase PostgreSQL con sus relaciones y checks.

- [ ] **TSK-103 [Auth]: Autenticación y Control de Acceso por Roles (RBAC)**
  - Implementar login en NestJS con JWT / Supabase Auth.
  - Crear Guard de autorización (`RolesGuard`).
  - *Criterio de Aceptación:* Usuario Admin accede a todo; Cajero solo a POS e Inventario de galletas.

- [ ] **TSK-104 [Insumos]: CRUD de Insumos y Costo Unitario**
  - Crear la entidad y controlador para Insumos (`nombre`, `unidad_medida`, `cantidad_empaque`, `precio_compra`, `stock_actual`, `stock_minimo`).
  - Calcular automáticamente: $C_{\text{unitario}} = \frac{P_{\text{compra}}}{Q_{\text{empaque}}}$.
  - *Criterio de Aceptación:* Guardar insumo y verificar que el costo derivado por gramo/ml sea exacto.

- [ ] **TSK-105 [Categorías]: Módulo de Categorías Dinámicas**
  - Crear CRUD de la tabla `categorias` (`nombre`, `tipo: 'producto' | 'gasto'`).
  - *Criterio de Aceptación:* Permitir crear y editar categorías para vincular a productos y gastos.

---

## 🏃 SPRINT 2: Cocina (Recetas Base) & Costeo de Productos (Semanas 3 y 4)

**Objetivo del Sprint 2:** Desarrollar el módulo de Recetas Base en cocina (mezclas/masas en gramos/ml), el cálculo de costo por gramo de masa y el constructor de productos comerciales con insumos adicionales (rellenos/toppings) e indirectos.

### 📋 Checklist de Tareas del Sprint 2:

- [ ] **TSK-201 [Recetas]: Constructor de Receta Base en Cocina**
  - Crear vista y API para `recetas` y `receta_insumos`.
  - Permitir agregar N insumos a la mezcla en gramos/ml e ingresar el peso total de masa obtenida.
  - Calcular $C_{\text{total lote}}$ y $C_{\text{por gramo masa}} = \frac{C_{\text{total lote}}}{W_{\text{mezcla gramos}}}$.
  - *Criterio de Aceptación:* Una mezcla de 1,080g con insumos de $9.00 da un costo por gramo de $0.00833/g.

- [ ] **TSK-202 [Productos]: Definición de Producto y Masa Asignada**
  - Crear módulo `productos` asociando `receta_id` e indicando gramos de masa usados por unidad.
  - Calcular $C_{\text{masa unidad}} = W_{\text{masa asignada}} \times C_{\text{por gramo masa}}$.
  - *Criterio de Aceptación:* Galleta de 120g calcula automáticamente $1.00 USD de masa.

- [ ] **TSK-203 [Productos]: Insumos Adicionales (Rellenos/Toppings) e Indirectos**
  - Permitir vincular insumos adicionales en `producto_insumos_adicionales` (ej. 20g Nutella).
  - Campos para empaque, mano de obra, depreciación, desperdicio % y precio de venta.
  - Calcular Costo Directo Total, Ganancia Bruta y Margen %.
  - *Criterio de Aceptación:* Si Precio Venta <= Costo Directo Total, muestra alerta roja de pérdida.

---

## 🏃 SPRINT 3: Punto de Venta POS, Pago Mixto & Sync Offline (Semanas 5 y 6)

**Objetivo del Sprint 3:** Interfaz de cobro en mostrador ultra-rápida, soporte de pago mixto (USD/VES) y funcionamiento sin conexión mediante IndexedDB en la PWA.

### 📋 Checklist de Tareas del Sprint 3:

- [ ] **TSK-301 [POS]: Catálogo Visual y Carrito de Compras**
  - Grid de galletas con imágenes, precios en USD y badges de stock (`Stock Normal`, `Stock Bajo`, `Agotado`).
  - Carrito de compras responsive con incremento/decrecimiento de cantidades.
  - *Criterio de Aceptación:* Agregar galletas al carrito en menos de 3 segundos.

- [ ] **TSK-302 [POS]: Modal de Pago Mixto y Selección de Cliente**
  - Selector de cliente registrado u opción *"Venta a Público General (Anónimo)"*.
  - Modal de Pago Mixto en USD y VES con conversión según tasa de cambio del día.
  - Validar que $\sum \text{Pagos} = \text{Total Venta}$.
  - *Criterio de Aceptación:* Botón "Confirmar Venta" se habilita solo cuando el cobro está 100% cubierto.

- [ ] **TSK-303 [POS]: Modo Offline (IndexedDB) y Sincronización Automática**
  - Al no haber conexión, guardar venta en IndexedDB (`estado_sincronizacion = 'offline_pending'`).
  - Descontar stock visualmente en el cliente PWA.
  - Al detectar reconexión, enviar ventas a NestJS y actualizar estado a `'offline_synced'`.
  - *Criterio de Aceptación:* Registrar ventas sin internet y comprobar que se sincronicen solas al volver la red.

---

## 🏃 SPRINT 4: Producción, Mermas, Gastos Operativos & Dashboard (Semanas 7 y 8)

**Objetivo del Sprint 4:** Registro de horneados de lotes (descuento automático de insumos e incremento de galletas), descartes de mermas, gastos operativos y consola del Dashboard Financiero.

### 📋 Checklist de Tareas del Sprint 4:

- [ ] **TSK-401 [Producción]: Registro de Lotes Horneados**
  - Formulario `lotes_produccion` para indicar producto y cantidad fabricada.
  - Descontar insumos automáticamente (Receta base + Adicionales) de la tabla `insumos`.
  - Incrementar `stock_actual` en la tabla `productos`.
  - *Criterio de Aceptación:* Si no hay suficiente harina, bloquear la producción y mostrar desglose de insumos faltantes.

- [ ] **TSK-402 [Mermas]: Registro de Pérdidas y Descartes**
  - Formulario `mermas` para indicar producto, cantidad rota/dañada y motivo.
  - Descontar galletas inmediatamente del stock de venta.
  - *Criterio de Aceptación:* Stock de producto disminuye y la pérdida queda registrada con usuario y fecha.

- [ ] **TSK-403 [Gastos]: Registro de Gastos Fijos y Variables**
  - Módulo para ingresar gastos en USD o Bolívares con su categoría correspondiente.
  - *Criterio de Aceptación:* Egresos reflejados en el cálculo financiero mensual.

- [ ] **TSK-404 [Dashboard]: Consola Financiera y Punto de Equilibrio**
  - Visualización de KPIs: Ventas Totales, Egresos, Utilidad Neta Real y Ticket Promedio.
  - Barra de progreso del Punto de Equilibrio en tiempo real ($PE_\$).
  - Gráficas comparativas (% variación de ingresos vs período anterior).
  - *Criterio de Aceptación:* La Utilidad Neta descuenta los costos directos de las galletas vendidas y los gastos operativos.

---

## 🏃 SPRINT 5: QA, Optimización & Despliegue en Producción (Semanas 9 y 10)

**Objetivo del Sprint 5:** Pruebas integrales de flujo, optimización de velocidad, compilación de la PWA y despliegue en entornos de producción.

### 📋 Checklist de Tareas del Sprint 5:

- [ ] **TSK-501 [QA]: Pruebas de Flujo Completo E2E**
  - Probar ciclo completo: Registro Insumo $\rightarrow$ Receta Base $\rightarrow$ Producto $\rightarrow$ Lote Producción $\rightarrow$ Venta POS Pago Mixto $\rightarrow$ Dashboard.
  - *Criterio de Aceptación:* Cero errores de tipo (TypeScript) y cero inconsistencias de stock/dinero.

- [ ] **TSK-502 [Deploy]: Despliegue en Producción**
  - Backend NestJS desplegado en Render / Railway.
  - Base de Datos de Producción en Supabase.
  - Frontend React PWA desplegado en Vercel.
  - *Criterio de Aceptación:* Aplicación accesible vía URL pública con HTTPS y rendimiento rápido.

