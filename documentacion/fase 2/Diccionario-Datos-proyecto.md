# Diccionario de Datos del Sistema - Krumly Manager
## Sistema de Gestión y Control Operativo para Krumly (Repostería / Galletas)

Este documento especifica la estructura detallada del modelo de base de datos relacional (PostgreSQL / Supabase gestionado vía NestJS + Prisma ORM) para **Krumly Manager**, correspondiente al Diagrama Entidad-Relación (DER) normalizado en 3ra Forma Normal (3NF) con arquitectura desacoplada de Recetas y Productos.

---

## Índice de Tablas
1. [Tabla: `usuarios`](#1-tabla-usuarios)
2. [Tabla: `clientes`](#2-tabla-clientes)
3. [Tabla: `categorias`](#3-tabla-categorias)
4. [Tabla: `insumos`](#4-tabla-insumos)
5. [Tabla: `recetas`](#5-tabla-recetas)
6. [Tabla: `receta_insumos`](#6-tabla-receta_insumos)
7. [Tabla: `productos`](#7-tabla-productos)
8. [Tabla: `producto_insumos_adicionales`](#8-tabla-producto_insumos_adicionales)
9. [Tabla: `lotes_produccion`](#9-tabla-lotes_produccion)
10. [Tabla: `mermas`](#10-tabla-mermas)
11. [Tabla: `gastos`](#11-tabla-gastos)
12. [Tabla: `ventas`](#12-tabla-ventas)
13. [Tabla: `venta_detalles`](#13-tabla-venta_detalles)
14. [Tabla: `venta_pagos`](#14-tabla-venta_pagos)

---

## 1. Tabla: `usuarios`
**Descripción:** Perfiles y credenciales para el sistema Krumly.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador único universal. | `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` |
| `username` | `VARCHAR(50)` | No | **UNIQUE** | N/A | Nombre de usuario para login. | `admin_samuel` |
| `email` | `VARCHAR(100)` | No | **UNIQUE** | N/A | Correo electrónico. | `samuel@krumly.com` |
| `password_hash` | `VARCHAR(255)` | No | N/A | N/A | Hash encriptado de contraseña. | `$2a$12$e8...` |
| `role` | `VARCHAR(20)` | No | N/A | `'admin'` | Rol (`CHECK: 'admin', 'cajero'`). | `'admin'` |
| `activo` | `BOOLEAN` | No | N/A | `true` | Estado activo/inactivo. | `true` |
| `created_at` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha de creación. | `2026-08-31 10:00:00` |

---

## 2. Tabla: `clientes`
**Descripción:** Directorio de clientes recurrentes (cafeterías, cantinas o clientes frecuentes) para asociar a ventas opcionalmente.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador único del cliente. | `c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a00` |
| `nombre` | `VARCHAR(100)` | No | N/A | N/A | Nombre del cliente o establecimiento. | `Cafetería Central` |
| `telefono` | `VARCHAR(30)` | Sí | N/A | `NULL` | Teléfono de contacto. | `+58 412 1234567` |
| `ubicacion` | `VARCHAR(255)`| Sí | N/A | `NULL` | Dirección o sector. | `Av. Principal, C.C. Plaza` |
| `created_at` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha de registro. | `2026-08-31 10:00:00` |

---

## 3. Tabla: `categorias`
**Descripción:** Catálogo dinámico centralizado para clasificar Productos y Gastos.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador de categoría. | `cat1ebc99...` |
| `nombre` | `VARCHAR(100)` | No | N/A | N/A | Nombre de la categoría. | `'Galletas'` o `'Servicios'` |
| `tipo` | `VARCHAR(20)` | No | N/A | N/A | (`CHECK: 'producto', 'gasto'`). | `'producto'` |
| `created_at` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha de creación. | `2026-08-31 10:00:00` |

---

## 4. Tabla: `insumos`
**Descripción:** Materias primas e ingredientes para recetas e insumos adicionales.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador del insumo. | `b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22` |
| `nombre` | `VARCHAR(100)` | No | N/A | N/A | Nombre del insumo. | `Harina de Trigo Todo Uso` |
| `unidad_medida` | `VARCHAR(20)` | No | N/A | N/A | (`CHECK: 'gramos', 'ml', 'unidades'`). | `'gramos'` |
| `cantidad_empaque`| `DECIMAL(10,2)`| No | N/A | N/A | Cantidad en empaque. | `1000.00` |
| `precio_compra` | `DECIMAL(10,2)`| No | N/A | N/A | Precio pagado por paquete. | `3.50` |
| `costo_unitario` | `DECIMAL(12,4)`| No | N/A | N/A | Costo derivado por gramo/ml ($P_{\text{compra}} \div Q_{\text{empaque}}$). | `0.0035` |
| `stock_actual` | `DECIMAL(10,2)`| No | N/A | `0.00` | Existencia física en almacén. | `5500.00` |
| `stock_minimo` | `DECIMAL(10,2)`| No | N/A | `500.00` | Umbral para alerta. | `1000.00` |
| `created_at` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha de creación. | `2026-08-31 10:00:00` |

---

## 5. Tabla: `recetas`
**Descripción:** Formulación independiente de mezclas/masas base en cocina.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador de receta base. | `r1eebc99...` |
| `nombre` | `VARCHAR(100)` | No | N/A | N/A | Nombre de la masa base. | `Masa Base de Vainilla` |
| `peso_total_mezcla_gramos`|`DECIMAL(10,2)`| No | N/A | N/A | Peso de la mezcla obtenida. | `1080.00` |
| `costo_total_lote`|`DECIMAL(10,2)`| No | N/A | `0.00` | Suma de insumos. | `9.00` |
| `costo_por_gramo`|`DECIMAL(12,4)`| No | N/A | `0.00` | Costo por gramo de masa. | `0.0083` |
| `usuario_id` | `UUID` | No | **FK** | N/A | Creador de la receta (`usuarios.id`). | `a0eebc99...` |
| `created_at` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha de creación. | `2026-08-31 10:00:00` |

---

## 6. Tabla: `receta_insumos`
**Descripción:** Ingredientes para la preparación de una `receta` base (genérico para gramos, ml o unidades).

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador. | `d3eebc99...` |
| `receta_id` | `UUID` | No | **FK** | N/A | Referencia a `recetas.id`. | `r1eebc99...` |
| `insumo_id` | `UUID` | No | **FK** | N/A | Referencia a `insumos.id`. | `b1eebc99...` |
| `cantidad` | `DECIMAL(10,2)`| No | N/A | N/A | Cantidad en la unidad del insumo (gramos, ml o unidades). | `500.00` |

---

## 7. Tabla: `productos`
**Descripción:** Catálogo de galletas y postres finales comercializados.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador del producto. | `c2eebc99...` |
| `nombre` | `VARCHAR(100)` | No | N/A | N/A | Nombre comercial. | `Galleta Vainilla Rellena 120g` |
| `categoria_id` | `UUID` | Sí | **FK** | `NULL` | Categoría asignada (`categorias.id`). | `cat1ebc99...` |
| `receta_id` | `UUID` | Sí | **FK** | `NULL` | Receta base utilizada (`recetas.id`). | `r1eebc99...` |
| `peso_masa_gramos`|`DECIMAL(10,2)`| Sí | N/A | `0.00` | Gramos de masa asignados. | `120.00` |
| `costo_masa_unidad`|`DECIMAL(10,2)`| No | N/A | `0.00` | Costo de la masa ($120\text{g} \times \text{Costo por Gramo}$). | `0.50` |
| `costo_insumos_adicionales`|`DECIMAL(10,2)`| Sí | N/A | `0.00` | Relleno/toppings agregados. | `0.20` |
| `costo_empaque` | `DECIMAL(10,2)`| Sí | N/A | `0.00` | Costo unitario empaque. | `0.10` |
| `costo_mano_obra`| `DECIMAL(10,2)`| Sí | N/A | `0.00` | Prorrateo mano de obra. | `0.10` |
| `costo_depreciacion`|`DECIMAL(10,2)`| Sí | N/A | `0.00` | Prorrateo equipos. | `0.02` |
| `porcentaje_desperdicio`|`DECIMAL(5,2)`| Sí | N/A | `5.00` | % Desperdicio estimado. | `5.00` |
| `costo_directo_total`|`DECIMAL(10,2)`| No | N/A | `0.00` | Costo directo total. | `0.95` |
| `precio_venta` | `DECIMAL(10,2)`| No | N/A | N/A | Precio al público en USD. | `2.50` |
| `margen_ganancia_porcentaje`|`DECIMAL(5,2)`| No | N/A | `0.00` | Margen de ganancia %. | `62.00` |
| `stock_actual` | `INT` | No | N/A | `0` | Unidades listas en stock. | `30` |
| `stock_minimo` | `INT` | No | N/A | `10` | Alerta de producción. | `10` |
| `activo` | `BOOLEAN` | No | N/A | `true` | Habilita/oculta en POS. | `true` |

---

## 8. Tabla: `producto_insumos_adicionales`
**Descripción:** Insumos específicos agregados directamente a un producto final (rellenos como Nutella/Arequipe, decoraciones, toppings).

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador del adicional. | `pa1ebc99...` |
| `producto_id` | `UUID` | No | **FK** | N/A | Referencia a `productos.id`. | `c2eebc99...` |
| `insumo_id` | `UUID` | No | **FK** | N/A | Referencia a `insumos.id` (ej. Nutella). | `b2eebc99...` |
| `cantidad` | `DECIMAL(10,2)`| No | N/A | N/A | Cantidad agregada por unidad. | `20.00` |

---

## 9. Tabla: `lotes_produccion`
**Descripción:** Lotes fabricados que incrementan stock de producto y descuentan insumos según la receta estandarizada y los adicionales.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador de lote. | `e4eebc99...` |
| `producto_id` | `UUID` | No | **FK** | N/A | Referencia a `productos.id`. | `c2eebc99...` |
| `receta_id` | `UUID` | Sí | **FK** | `NULL` | Referencia a la receta base usada (`recetas.id`). | `r1eebc99...` |
| `cantidad_producida` | `INT` | No | N/A | N/A | Unidades fabricadas. | `54` |
| `fecha_produccion`| `TIMESTAMP` | No | N/A | `NOW()` | Fecha/hora de horneado. | `2026-08-31 08:00:00` |
| `notas` | `TEXT` | Sí | N/A | `NULL` | Observaciones (ej. "3 tandas"). | `'Hornada matutina'` |
| `usuario_id` | `UUID` | No | **FK** | N/A | Usuario que registró (`usuarios.id`). | `a0eebc99...` |

---

## 10. Tabla: `mermas`
**Descripción:** Losses or descartes of finished products.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador. | `m1eebc99...` |
| `producto_id` | `UUID` | No | **FK** | N/A | Producto descartado (`productos.id`).| `c2eebc99...` |
| `cantidad` | `INT` | No | N/A | N/A | Unidades descartadas. | `3` |
| `motivo` | `VARCHAR(255)`| No | N/A | N/A | Motivo de merma. | `'Roto al empacar'` |
| `fecha_merma` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha. | `2026-08-31 14:00:00` |
| `usuario_id` | `UUID` | No | **FK** | N/A | Usuario responsable. | `a0eebc99...` |

---

## 11. Tabla: `gastos`
**Descripción:** Egresos fijos y variables operativos.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador. | `g1eebc99...` |
| `tipo_gasto` | `VARCHAR(20)` | No | N/A | N/A | (`CHECK: 'fijo', 'variable'`). | `'fijo'` |
| `categoria_id` | `UUID` | Sí | **FK** | `NULL` | Categoría asignada (`categorias.id`). | `cat2ebc99...` |
| `concepto` | `VARCHAR(150)`| No | N/A | N/A | Descripción. | `'Pago servicio eléctrico'` |
| `monto_usd` | `DECIMAL(10,2)`| No | N/A | N/A | Monto en USD. | `45.00` |
| `monto_ves` | `DECIMAL(12,2)`| Sí | N/A | `NULL` | Monto en Bolívares. | `1800.00` |
| `tasa_cambio` | `DECIMAL(10,2)`| Sí | N/A | `NULL` | Tasa aplicada. | `40.00` |
| `metodo_pago` | `VARCHAR(30)` | Sí | N/A | `NULL` | Medio de pago opcional. | `'pago_movil'` |
| `fecha_gasto` | `TIMESTAMP` | No | N/A | `NOW()` | Fecha. | `2026-08-31 09:00:00` |
| `usuario_id` | `UUID` | No | **FK** | N/A | Usuario que registró. | `a0eebc99...` |

---

## 12. Tabla: `ventas`
**Descripción:** Transacciones de venta procesadas en el POS.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador de venta. | `f5eebc99...` |
| `codigo_venta` | `VARCHAR(20)` | No | **UNIQUE** | N/A | Ticket correlativo. | `'V-20260831-001'` |
| `fecha_venta` | `TIMESTAMP` | No | N/A | `NOW()` | Estampa de tiempo. | `2026-08-31 11:15:00` |
| `cliente_id` | `UUID` | Sí | **FK** | `NULL` | Cliente opcional (`clientes.id`). | `c1eebc99...` |
| `total_venta` | `DECIMAL(10,2)`| No | N/A | N/A | Total en USD. | `10.00` |
| `estado_sincronizacion`| `VARCHAR(20)`| No | N/A | `'online'` | (`CHECK: 'online', 'offline_pending', 'offline_synced'`). | `'online'` |
| `usuario_id` | `UUID` | No | **FK** | N/A | Vendedor. | `a0eebc99...` |

---

## 13. Tabla: `venta_detalles`
**Descripción:** Desglose de ítems vendidos por transacción.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador de detalle. | `g6eebc99...` |
| `venta_id` | `UUID` | No | **FK** | N/A | Referencia a `ventas.id`. | `f5eebc99...` |
| `producto_id` | `UUID` | No | **FK** | N/A | Referencia a `productos.id`. | `c2eebc99...` |
| `cantidad` | `INT` | No | N/A | N/A | Cantidad vendida. | `5` |
| `precio_unitario` | `DECIMAL(10,2)`| No | N/A | N/A | Precio unitario al vender. | `2.00` |
| `subtotal` | `DECIMAL(10,2)`| No | N/A | N/A | Subtotal ($Q \times P_{\text{unitario}}$). | `10.00` |

---

## 14. Tabla: `venta_pagos`
**Descripción:** Desglose de pagos individuales para soporte de Pago Mixto.

| Campo | Tipo de Dato | Nulo | Llave | Valor por Defecto | Descripción | Ejemplo |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| `id` | `UUID` | No | **PK** | `gen_random_uuid()` | Identificador del pago parcial. | `p1eebc99...` |
| `venta_id` | `UUID` | No | **FK** | N/A | Venta vinculada (`ventas.id`).| `f5eebc99...` |
| `metodo_pago` | `VARCHAR(30)` | No | N/A | N/A | (`CHECK: 'efectivo_usd', 'efectivo_ves', 'pago_movil', 'punto_venta', 'transferencia'`). | `'pago_movil'` |
| `monto_usd` | `DECIMAL(10,2)`| No | N/A | N/A | Monto en USD. | `6.00` |
| `monto_ves` | `DECIMAL(12,2)`| Sí | N/A | `NULL` | Monto en Bolívares. | `240.00` |
| `tasa_cambio` | `DECIMAL(10,2)`| Sí | N/A | `NULL` | Tasa aplicada. | `40.00` |
| `referencia_pago`| `VARCHAR(50)`| Sí | N/A | `NULL` | Referencia o lote. | `'004829'` |
