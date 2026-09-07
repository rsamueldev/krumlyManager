# Wireframes Estructurales e Inventario de Pantallas (Screen Inventory)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento especifica la estructura visual y funcional pantalla por pantalla de **Krumly Manager**, definiendo el layout, los componentes de interfaz, botones, controles y el origen de datos para cada vista.

---

## Índice de Pantallas
1. [Pantalla 1: Inicio de Sesión / Login](#pantalla-1-inicio-de-sesión--login)
2. [Pantalla 2: Punto de Venta POS (Ventas Rápidas)](#pantalla-2-punto-de-venta-pos-ventas-rápidas)
3. [Pantalla 3: Módulo de Recetas Base (Cocina)](#pantalla-3-módulo-de-recetas-base-cocina)
4. [Pantalla 4: Definición y Costeo de Productos Finales](#pantalla-4-definición-y-costeo-de-productos-finales)
5. [Pantalla 5: Registro de Lotes de Producción y Mermas](#pantalla-5-registro-de-lotes-de-producción-y-mermas)
6. [Pantalla 6: Gestión de Gastos Operativos (Fijos y Variables)](#pantalla-6-gestión-de-gastos-operativos-fijos-y-variables)
7. [Pantalla 7: Dashboard Financiero, KPIs y Comparativas](#pantalla-7-dashboard-financiero-kpis-y-comparativas)
8. [Pantalla 8: Gestión de Insumos, Categorías y Clientes](#pantalla-8-gestión-de-insumos-categorías-y-clientes)

---

## Pantalla 1: Inicio de Sesión / Login

* **Propósito:** Autenticar usuarios y restringir el acceso a las funciones del sistema según el rol (Administrador vs Cajero).
* **Layout:** Formulario centrado tipo tarjeta (*Card Container*) sobre fondo suave (`#FFF3E8`) con logotipo superior de Krumly.

### Componentes Visuales
- **Encabezado:** Isotipo y Logotipo de Krumly.
- **Campo 1:** Input de Texto para `Username` o `Correo Electrónico` (con ícono de usuario).
- **Campo 2:** Input de Contraseña con botón ojo de `Mostrar/Ocultar contraseña`.
- **Botón Principal:** Botón animado `Iniciar Sesión` en color marca Krumly (`#AA1616`).
- **Banner de Error:** Alerta flotante roja para credenciales incorrectas.

---

## Pantalla 2: Punto de Venta POS (Ventas Rápidas)

* **Propósito:** Permitir al vendedor/administrador registrar ventas en menos de 10 segundos desde un teléfono, tablet o computadora, soportando pagos en USD/VES, pago mixto y funcionamiento offline.
* **Layout:** 
  - **Izquierda (2/3 de pantalla):** Barra de búsqueda, filtro por Categorías y Grid visual de tarjetas de Productos.
  - **Derecha (1/3 de pantalla):** Panel de Carrito de Compras, Selector de Cliente, Desglose de Pago y Botón de Cobro.

### Componentes Visuales
- **Barra Superior (Header):** Nombre de usuario, badge indicador de estado de red (`Online` verde / `Offline` naranja con contador de ventas pendientes).
- **Filtro de Categorías:** Chips deslizables (*Todas, Galletas, Tortas, Bebidas, etc.*).
- **Grid de Productos:** Tarjetas con imagen/ícono, nombre del producto, precio en USD, badge con `Stock Disponible` (Badge amarillo si `Stock <= Stock Mínimo`, gris deshabilitado si `Stock = 0`).
- **Panel de Carrito:**
  - Lista de productos agregados con contador `+` / `-` y subtotal.
  - Selector desplegable de `Cliente` (Buscador rápido o checkbox *"Venta a Público General"*).
  - Selector de Método de Pago: Botones tipo radio (*Efectivo USD, Efectivo VES, Pago Móvil, Punto, Transferencia, Pago Mixto*).
- **Modal de Pago Mixto (Flotante):**
  - Muestra Total a Cobrar en USD.
  - Campos de entrada para cada método (ej. *Monto Efectivo USD*, *Monto Pago Móvil VES* con conversión automática a tasa BCV/Manual).
  - Indicador dinámico: *"Falta por cobrar: $0.00"*.
- **Botón de Cobro Principal:** Botón de alto impacto `Confirmar Venta ($XX.XX USD)` en verde esmeralda o `#AA1616`.

---

## Pantalla 3: Módulo de Recetas Base (Cocina)

* **Propósito:** Permitir al Administrador registrar mezclas/masas producidas en cocina, ingresar ingredientes en gramos/ml y calcular el costo exacto por gramo de masa.
* **Layout:** Vista dividida (Lista de Recetas a la izquierda / Formulario de Edición y Tabla de Ingredientes a la derecha).

### Componentes Visuales
- **Barra de Herramientas:** Botón `+ Nueva Receta Base` e input de búsqueda de recetas.
- **Formulario Principal:**
  - Input: `Nombre de la Receta / Mezcla` (ej. *Masa Base de Vainilla*).
  - Input: `Peso Total Obtenido de la Mezcla (Gramos)` (ej. *1,080 g*).
- **Tabla de Ingredientes de la Mezcla:**
  - Selector desplegable de `Insumo` (proveniente de la tabla `insumos`).
  - Input: `Cantidad en gramos/ml` para la mezcla completa.
  - Columna calculada: Costo acumulado por ingrediente.
  - Botón `+ Agregar Ingrediente` y botón eliminar ítem.
- **Caja de Resultados Finos:**
  - Tarjeta desplegando el **Costo Total del Lote ($)** y el **Costo por Gramo de Masa ($/g)** calculado en tiempo real por NestJS.
- **Botón de Acción:** `Guardar Receta Base`.

---

## Pantalla 4: Definición y Costeo de Productos Finales

* **Propósito:** Configurar un producto comercial para la venta, asociando su masa base, insumos adicionales (rellenos/toppings), empaques, indirectos y margen de ganancia %.
* **Layout:** Formulario por pasos (Tabs: *1. Datos Básicos*, *2. Masa & Rellenos*, *3. Indirectos & Precio*).

### Componentes Visuales
- **Tab 1 - Datos Básicos:**
  - Inputs: `Nombre Comercial` (ej. *Galleta Vainilla Rellena 120g*), `Categoría` (dropdown), `Stock Mínimo` (alerta de producción).
- **Tab 2 - Masa & Insumos Adicionales:**
  - Selector de `Receta Base` (dropdown) + Input `Gramos de Masa Utilizados` (ej. *120 g*).
  - Módulo de Rellenos/Toppings: Selector de insumo adicional (ej. *Nutella*) + Input `Cantidad` (ej. *20 g*).
  - Cálculo dinámico del costo de masa y costo de adicionales.
- **Tab 3 - Indirectos y Precio:**
  - Inputs: `Costo Empaque ($)`, `Costo Decoración ($)`, `Mano de Obra ($)`, `Depreciación ($)`, `% Desperdicio`.
  - Tarjeta Resumen: **Costo Directo Total por Unidad ($)**.
  - Input de `Precio de Venta Sugerido ($)`.
  - Indicador de **Ganancia Bruta ($)** y **Margen %** (Badge verde si margen > 40%, amarillo si 20-40%, rojo con alerta si da pérdida).
- **Botón de Acción:** `Guardar y Activar en POS`.

---

## Pantalla 5: Registro de Lotes de Producción y Mermas

* **Propósito:** Incrementar el stock de galletas fabricadas descontando materias primas o registrar pérdidas de productos por daño/vencimiento.
* **Layout:** Panel con dos pestañas principales (`[📦 Registrar Producción]` / `[⚠️ Registrar Merma]`).

### Componentes Visuales
- **Pestaña Producción:**
  - Selector de `Producto Terminado` + Input `Cantidad de Unidades Fabricadas`.
  - Vista previa de insumos que se descontarán automáticamente según la receta.
  - Banner de Advertencia si el stock de algún insumo no alcanza (con enlace directo a *"Registrar Compra de Insumo"*).
  - Botón `Confirmar Lote de Producción`.
- **Pestaña Merma:**
  - Selector de `Producto Terminado` + Input `Cantidad Perdida`.
  - Selector/Input de `Motivo` (*Producto roto al empacar, Vencimiento, Falla de cocción*).
  - Botón `Registrar Merma` (Descuenta stock de inmediato).

---

## Pantalla 6: Gestión de Gastos Operativos (Fijos y Variables)

* **Propósito:** Registrar egresos de operación (alquiler, servicios, publicidad, delivery) para descontarlos de las utilidades y calcular el Punto de Equilibrio.
* **Layout:** Encabezado con métrica de Gastos del Mes + Formulario rápido superior + Tabla histórica inferior.

### Componentes Visuales
- **Métrica Superior:** Tarjeta con `Total Gastos del Mes ($)` desglosado en Fijos y Variables.
- **Formulario de Registro:**
  - Selector `Tipo de Gasto` (Fijo / Variable).
  - Selector `Categoría` (dropdown dinámico: *Servicios, Alquiler, Marketing, Delivery*).
  - Input: `Concepto / Descripción` (ej. *Pago de Luz y Gas*).
  - Input: `Monto USD` e Input opcional `Monto VES + Tasa`.
  - Selector opcional: `Método de Pago`.
  - Botón `Guardar Gasto`.
- **Tabla Histórica de Gastos:**
  - Columnas: Fecha, Tipo, Categoría, Concepto, Monto USD, Usuario, Acciones (Editar/Eliminar).

---

## Pantalla 7: Dashboard Financiero, KPIs y Comparativas

* **Propósito:** Ofrecer la consola de mando estratégica para el Administrador General con utilidades reales, ticket promedio y monitor de punto de equilibrio.
* **Layout:** Filtro superior de fechas + Grid de 4 Tarjetas KPI + Barra de Punto de Equilibrio + Gráficos Comparativos + Tabla de Rankings.

### Componentes Visuales
- **Filtro de Período Superior:** Selector de rango (ej. *Este Mes*) + Selector de Comparativa (ej. *vs Mes Anterior*).
- **Tarjetas KPI Principales:**
  1. `Ventas Totales ($)` (con badge % variación ej. *+15% vs mes anterior*).
  2. `Egresos Totales ($)` (Insumos + Gastos Fijos/Variables).
  3. `Utilidad Neta Real ($)` (Ingresos - Costos Directos - Gastos).
  4. `Ticket Promedio ($)` ($Ventas \div N^\circ \text{ Transacciones}$).
- **Monitor de Punto de Equilibrio (Barra de Progreso):**
  - Muestra gráficamente cuántas unidades o dinero se ha vendido vs el monto necesario para cubrir costos fijos ($PE_\$).
- **Sección Comparativa (Gráfico de Barras/Líneas):**
  - Comparativa de Ingresos vs Egresos por semanas del mes.
- **Sección de Rankings (Dos columnas):**
  - Columna 1: Top 5 Productos Más Vendidos (con margen %).
  - Columna 2: Clientes Frecuentes (mayor volumen de compra).

---

## Pantalla 8: Gestión de Insumos, Categorías y Clientes

* **Propósito:** Tablas maestras de administración para mantener insumos, categorías dinámicas y el directorio de clientes.
* **Layout:** Pestañas superiores (`[Insumos]` | `[Categorías]` | `[Clientes]`).

### Componentes Visuales
- **Pestaña Insumos:** Tabla editable con Nombre, Unidad de medida, Cantidad empaque, Precio compra, Costo por gramo derivado, Stock Actual y Stock Mínimo (con alerta visual si `Stock <= Mínimo`).
- **Pestaña Categorías:** Tabla simple para agregar/editar categorías clasificadas por tipo (`Producto` o `Gasto`).
- **Pestaña Clientes:** Tabla con Nombre, Teléfono, Ubicación/Sector e Historial de Compras acumuladas.
