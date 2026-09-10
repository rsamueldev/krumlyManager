# Planificación de Sprints y Guía de Ejecución (Solo Developer)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento es la **guía maestra de planificación y ejecución** diseñada específicamente para el desarrollo en solitario (*Solo Developer*) de **Krumly Manager**.

A partir del **Sprint 2**, el proyecto adopta la metodología de **Enfoque Vertical (Vertical Slice Development)**: en cada ticket se construye el Backend (NestJS + Prisma + Arquitectura Hexagonal) e **inmediatamente** la Pantalla/Interfaz en Frontend (React + Vite + TailwindCSS), garantizando software 100% funcional e interactivo paso a paso.

---

## 🛠️ Cómo usar este documento en GitHub

Cada tarea incluye una casilla de verificación (- [ ]). Cuando termines un ticket en el código:
1. Cambia - [ ] por - [x].
2. Haz commit con el mensaje del ticket (ej. git commit -m "feat: [Sprint 2] TSK-201 Constructor de Recetas Base en Cocina (Fullstack)").
3. Sube a GitHub y verás tu progreso visualmente.

---

## 📅 Visión General del Cronograma (5 Sprints / 10 Semanas)

| Sprint | Enfoque Principal (Vertical Slice) | Semanas | Estado |
| :--- | :--- | :---: | :---: |
| **Sprint 1** | Fundaciones, DB Prisma 3NF, Auth RBAC, Insumos & Categorías | Semanas 1 y 2 | ✅ Completado |
| **Sprint 2** | Cocina (Recetas Base en g) & Costeo de Productos Finales (Fullstack) | Semanas 3 y 4 | 🚀 En Inicio |
| **Sprint 3** | Punto de Venta POS, Pago Mixto (USD/VES) & Sync Offline (Fullstack) | Semanas 5 y 6 | ⏳ Pendiente |
| **Sprint 4** | Lotes de Producción, Mermas, Gastos Operativos & Dashboard (Fullstack) | Semanas 7 y 8 | ⏳ Pendiente |
| **Sprint 5** | Pruebas Integrales QA, Optimización & Despliegue Producción | Semanas 9 y 10| ⏳ Pendiente |

---

## 🎯 SPRINT 1: Fundaciones, Base de Datos, Auth & Insumos (Semanas 1 y 2)

**Objetivo del Sprint 1:** Tener el monorepo/estructura inicial compilando, la base de datos PostgreSQL de 14 tablas creada en Supabase vía Prisma ORM, autenticación funcional por roles (Admin vs Cajero) y el CRUD de Insumos y Categorías dinámicas.

### 📋 Checklist de Tareas del Sprint 1:

- [x] **TSK-101 [Setup]: Inicialización del Proyecto y Configuración Visual**
  - Inicializar carpeta rontend/ (React + TailwindCSS).
  - Inicializar carpeta ackend/ (NestJS TypeScript).
  - Configurar la paleta oficial en 	ailwind.config.js (#AA1616 Krumly Red, #FFF3E8 Soft Cream, #1A0A0A Dark Text).
  - *Criterio de Aceptación:* 
pm run dev en frontend y backend levantan sin errores.

- [x] **TSK-102 [DB]: Configuración de Prisma ORM y Migración de Esquema 3NF**
  - Crear ackend/prisma/schema.prisma con las 14 tablas normalizadas: usuarios, clientes, categorias, insumos, ecetas, eceta_insumos, productos, producto_insumos_adicionales, lotes_produccion, mermas, gastos, entas, enta_detalles, enta_pagos.
  - Ejecutar 
px prisma db push hacia Supabase.
  - *Criterio de Aceptación:* Todas las tablas creadas en Supabase PostgreSQL con sus relaciones y checks.

- [x] **TSK-103 [Auth]: Autenticación y Control de Acceso por Roles (RBAC)**
  - Implementar login en NestJS con JWT / Supabase Auth (Arquitectura Hexagonal).
  - Crear Guard de autorización (RolesGuard) y decorador @Roles().
  - *Criterio de Aceptación:* Usuario Admin accede a todo; Cajero restringido según rol.

- [x] **TSK-104 [Insumos]: CRUD de Insumos y Costo Unitario**
  - Crear la entidad y controlador para Insumos (
ombre, unidad_medida, cantidad_empaque, precio_compra, stock_actual, stock_minimo).
  - Calcular automáticamente: {\text{unitario}} = \frac{P_{\text{compra}}}{Q_{\text{empaque}}}$.
  - *Criterio de Aceptación:* Guardar insumo y verificar que el costo derivado por gramo/ml sea exacto.

- [x] **TSK-105 [Categorías]: Módulo de Categorías Dinámicas**
  - Crear CRUD de la tabla categorias (
ombre, 	ipo: 'producto' | 'gasto').
  - *Criterio de Aceptación:* Permitir crear, listar con filtro dinámico por tipo y editar categorías.

---

## 🍰 SPRINT 2: Cocina (Recetas Base) & Costeo de Productos (Fullstack) (Semanas 3 y 4)

**Objetivo del Sprint 2:** Desarrollar de forma Vertical (Backend NestJS + Frontend React) el módulo de Recetas Base en cocina (mezclas/masas en gramos/ml), el cálculo de costo por gramo de masa y el constructor visual de productos comerciales con insumos adicionales e indirectos.

### 📋 Checklist de Tareas del Sprint 2:

- [ ] **TSK-201 [Recetas]: Constructor de Receta Base en Cocina (Fullstack)**
  - **Backend:** Casos de uso y API para ecetas y eceta_insumos. Cálculo de {\text{total lote}}$ y {\text{por gramo masa}} = \frac{C_{\text{total lote}}}{W_{\text{mezcla gramos}}}$.
  - **Frontend:** Vista/Pantalla del Constructor de Recetas en React + TailwindCSS con buscador de insumos y cálculo interactivo de costo por gramo en tiempo real.
  - *Criterio de Aceptación:* Una mezcla de 1,080g con insumos de .00 refleja visualmente .00833/g.

- [ ] **TSK-202 [Productos]: Definición de Producto y Masa Asignada (Fullstack)**
  - **Backend:** Módulo productos asociando eceta_id e indicando gramos de masa usados por unidad. Cálculo de {\text{masa unidad}} = W_{\text{masa asignada}} \times C_{\text{por gramo masa}}$.
  - **Frontend:** Pantalla de Catálogo de Productos y Ficha Técnica de Galletas en React con tarjetas visuales.
  - *Criterio de Aceptación:* Galleta de 120g calcula automáticamente .00 USD de masa en la interfaz.

- [ ] **TSK-203 [Productos]: Insumos Adicionales (Rellenos/Toppings) e Indirectos (Fullstack)**
  - **Backend:** Vincular insumos adicionales en producto_insumos_adicionales. Campos para empaque, mano de obra, depreciación, desperdicio % y precio de venta. Cálculo de Costo Directo Total y Margen %.
  - **Frontend:** Modal interactivo en React para agregar toppings (ej. Nutella) y barra visual de Margen de Ganancia.
  - *Criterio de Aceptación:* Si Precio Venta <= Costo Directo Total, la UI muestra una alerta roja de pérdida.

---

## 🛒 SPRINT 3: Punto de Venta POS, Pago Mixto & Sync Offline (Fullstack) (Semanas 5 y 6)

**Objetivo del Sprint 3:** Interfaz de cobro en mostrador ultra-rápida, soporte de pago mixto (USD/VES) y funcionamiento sin conexión mediante IndexedDB en la PWA.

### 📋 Checklist de Tareas del Sprint 3:

- [ ] **TSK-301 [POS]: Catálogo Visual y Carrito de Compras (Fullstack)**
  - **Backend:** API REST optimizada para catálogo POS (/api/v1/productos/pos).
  - **Frontend:** Grid de galletas con imágenes, precios en USD y badges de stock (Stock Normal, Stock Bajo, Agotado). Carrito responsive.
  - *Criterio de Aceptación:* Agregar galletas al carrito en menos de 3 segundos.

- [ ] **TSK-302 [POS]: Modal de Pago Mixto y Selección de Cliente (Fullstack)**
  - **Backend:** Endpoint POST /api/v1/ventas registrando venta, detalles y desglose de pagos mixtos en DB.
  - **Frontend:** Selector de cliente y Modal de Pago Mixto en USD y VES con conversión según tasa del día.
  - *Criterio de Aceptación:* Botón "Confirmar Venta" se habilita solo cuando el cobro está 100% cubierto.

- [ ] **TSK-303 [POS]: Modo Offline (IndexedDB) y Sincronización Automática (Fullstack)**
  - **Backend:** Endpoint de recepción de lotes de ventas offline.
  - **Frontend PWA:** Al no haber conexión, guardar venta en IndexedDB (estado_sincronizacion = 'offline_pending'). Al reconectar, sincronizar solo.
  - *Criterio de Aceptación:* Registrar ventas sin internet y comprobar que se sincronicen solas al volver la red.

---

## 📊 SPRINT 4: Producción, Mermas, Gastos Operativos & Dashboard (Fullstack) (Semanas 7 y 8)

**Objetivo del Sprint 4:** Registro de horneados de lotes (descuento automático de insumos e incremento de galletas), descartes de mermas, gastos operativos y consola del Dashboard Financiero.

### 📋 Checklist de Tareas del Sprint 4:

- [ ] **TSK-401 [Producción]: Registro de Lotes Horneados (Fullstack)**
  - **Backend:** Transacción en Prisma descontando insumos e incrementando stock de productos.
  - **Frontend:** Formulario visual de Horneado de Lotes con validación de insumos suficientes.
  - *Criterio de Aceptación:* Bloquear producción si falta harina y mostrar desglose en rojo.

- [ ] **TSK-402 [Mermas]: Registro de Pérdidas y Descartes (Fullstack)**
  - **Backend & Frontend:** Módulo visual para registrar descartes de galletas dañadas y descontar stock.
  - *Criterio de Aceptación:* Pérdida reflejada inmediatamente en el inventario.

- [ ] **TSK-403 [Gastos]: Registro de Gastos Fijos y Variables (Fullstack)**
  - **Backend & Frontend:** Formulario de egresos clasificando por categoría de gasto (	ipo: 'gasto').
  - *Criterio de Aceptación:* Egresos reflejados en el cálculo financiero mensual.

- [ ] **TSK-404 [Dashboard]: Consola Financiera y Punto de Equilibrio (Fullstack)**
  - **Backend & Frontend:** Consola de administración con KPIs, gráficas comparativas y barra de progreso del Punto de Equilibrio en tiempo real (\$).
  - *Criterio de Aceptación:* Utilidad Neta descuenta costos directos de galletas vendidas y gastos operativos.

---

## 🚀 SPRINT 5: QA, Optimización & Despliegue en Producción (Semanas 9 y 10)

**Objetivo del Sprint 5:** Pruebas integrales de flujo, optimización de velocidad, compilación de la PWA y despliegue en entornos de producción.

### 📋 Checklist de Tareas del Sprint 5:

- [ ] **TSK-501 [QA]: Pruebas de Flujo Completo E2E**
  - Probar ciclo completo en UI: Registro Insumo $\rightarrow$ Receta Base $\rightarrow$ Producto $\rightarrow$ Lote Producción $\rightarrow$ Venta POS Pago Mixto $\rightarrow$ Dashboard.
  - *Criterio de Aceptación:* Cero errores de TypeScript y cero inconsistencias de stock/dinero.

- [ ] **TSK-502 [Deploy]: Despliegue en Producción**
  - Backend NestJS desplegado en Render / Railway.
  - Base de Datos de Producción en Supabase.
  - Frontend React PWA desplegado en Vercel.
  - *Criterio de Aceptación:* Aplicación accesible vía URL pública con HTTPS y rendimiento rápido.