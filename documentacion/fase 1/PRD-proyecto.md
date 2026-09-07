# Documento de Requisitos del Producto (PRD)
## Sistema de Gestión y Control Operativo para Krumly (Repostería / Galletas)

---

## 1. Visión del Proyecto y Objetivos Principales

### 1.1 Visión del Producto
Desarrollar una plataforma de software interna (ERP/POS ligero) diseñada específicamente para la gestión integral, control operativo y visibilidad financiera de **Krumly**, un emprendimiento de repostería en crecimiento. El sistema centralizará la información de ventas, inventario de insumos, stock de productos terminados, registro de mermas, catálogo dinámico de categorías, gastos fijos y variables, catálogo desacoplado de Recetas Base y estructura de costos completa por producto.

---

## 3. Funcionalidades Core (MVP - Versión 1.0)

### 3.6 Módulo 6: Gestión Centralizada de Categorías
- **Tabla Máster `categorias`:** Entidad normalizada 3NF que clasifica tanto Productos (ej. *Galletas, Tortas, Bebidas*) como Gastos (ej. *Alquiler, Servicios, Publicidad, Delivery*).
- **Mantenimiento Dinámico:** Permite crear, editar y organizar categorías sin tocar texto plano en productos o gastos, garantizando reportes y métricas sin errores tipográficos.
