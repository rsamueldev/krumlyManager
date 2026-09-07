# Flujos de Navegación y Mapa del Sitio (User Journeys)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento define la arquitectura de navegación de usuario (UX) y el mapa del sitio para **Krumly Manager**, modelado en código estandarizado **Mermaid.js**.

---

## 1. Mapa del Sitio (Sitemap General)

```mermaid
graph TD
    A[Inicio de Sesión / Login] --> B{Validación de Rol}
    B -->|Administrador| C[Dashboard Principal]
    B -->|Cajero| D[Punto de Venta POS]
    
    %% Módulos del Administrador
    C --> D[Punto de Venta POS]
    C --> E[Módulo Recetas Base]
    C --> F[Módulo Productos]
    C --> G[Módulo Producción & Mermas]
    C --> H[Módulo Gastos]
    C --> I[Módulo Insumos & Categorías]
    C --> J[Módulo Clientes]
    C --> K[Reportes & Finanzas]

    %% Vistas secundarias
    E --> E1[Constructor de Receta Base]
    F --> F1[Definición de Producto & Costeos]
    G --> G1[Registrar Lote de Producción]
    G --> G2[Registrar Merma / Pérdida]
    H --> H1[Registrar Gasto Fijo / Variable]
    D --> D1[Modal de Pago Mixto]
    D --> D2[Sincronizador Offline]
```

---

## 2. Flujo de Autenticación y Control de Acceso (RBAC)

```mermaid
stateDiagram-v2
    [*] --> LoginScreen: Usuario ingresa username/email y password
    LoginScreen --> ValidarCredenciales: Enviar a API NestJS / Supabase Auth
    ValidarCredenciales --> ErrorAuth: Credenciales Incorrectas
    ErrorAuth --> LoginScreen: Mostrar Alerta 'Usuario o clave inválidos'
    
    ValidarCredenciales --> RolCheck: Autenticación Exitosa
    RolCheck --> AdminDashboard: Rol = 'admin' (Acceso Total 100%)
    RolCheck --> POSScreen: Rol = 'cajero' (Acceso Exclusivo a POS y Stock)
```

---

## 3. Flujo POS de Ventas, Pago Mixto y Sincronización Offline

```mermaid
sequenceDiagram
    autonumber
    actor Vendedor as Vendedor / Admin
    participant POS as UI POS (React PWA)
    participant Cache as IndexedDB (Offline)
    participant API as Backend NestJS
    participant DB as Supabase (PostgreSQL)

    Vendedor->>POS: Selecciona productos del catálogo visual
    POS->>POS: Verifica disponibilidad de Stock (Alerta si Stock <= Stock Mínimo)
    Vendedor->>POS: (Opcional) Asigna cliente registrado o deja en Público General
    Vendedor->>POS: Selecciona Método de Pago
    
    alt Es Pago Mixto
        Vendedor->>POS: Ingresa desglose (ej. $5 Efectivo USD + $5 Pago Móvil en VES)
        POS->>POS: Valida que Suma de Pagos == Total Venta
    end

    Vendedor->>POS: Presiona "Confirmar Venta"

    alt Conexión Online disponible
        POS->>API: POST /ventas (datos venta + desglose pagos)
        API->>DB: Guarda Venta, VentaPagos y descuenta Stock (Prisma Transaction)
        DB-->>API: Confirmación exitosa
        API-->>POS: HTTP 201 Created (estado: 'online')
        POS->>Vendedor: Muestra pantalla de Recibo / Confirmación
    else Sin Conexión (Modo Offline)
        POS->>Cache: Guarda Transacción localmente (estado: 'offline_pending')
        POS->>POS: Descuenta Stock visualmente en la PWA
        POS->>Vendedor: Muestra Banner: "Venta guardada Offline"
        Note over POS,Cache: Al recuperar señal de red
        POS->>API: Sincroniza ventas pendientes desde IndexedDB
        API->>DB: Aplica ventas en Supabase y actualiza estado a 'offline_synced'
    end
```

---

## 4. Flujo de Cocina: Creación de Receta Base

```mermaid
flowchart TD
    A[Usuario ingresa a Recetas Base] --> B[Clic en 'Nueva Receta Base']
    B --> C[Ingresa Nombre de la Mezcla ej. Masa Base Vainilla]
    C --> D[Selecciona Insumo de la Lista]
    D --> E[Ingresa Cantidad en gramos/ml para el lote completo]
    E --> F{¿Agregar otro ingrediente?}
    F -->|Sí| D
    F -->|No| G[Ingresa Peso Total de la Mezcla Obtenida ej. 1080g]
    G --> H[API NestJS calcula Costo Total Lote y Costo por Gramo]
    H --> I[Guarda Receta Base en Supabase]
    I --> J[Receta lista para ser reutilizada en múltiples productos]
```

---

## 5. Flujo de Producto y Costeo Desacoplado

```mermaid
flowchart TD
    A[Usuario selecciona 'Nuevo Producto'] --> B[Ingresa Nombre, Categoría y Stock Mínimo]
    B --> C[Selecciona Receta Base ej. Masa Base Vainilla]
    C --> D[Indica Gramos de Masa usados por unidad ej. 120g]
    D --> E[API NestJS calcula Costo de Masa = Gramos * Costo_por_Gramo]
    E --> F{¿Agregar Rellenos/Decoración adicionales?}
    F -->|Sí| G[Selecciona Insumo ej. Nutella e ingresa cantidad ej. 20g]
    G --> F
    F -->|No| H[Ingresa Costos Indirectos: Empaque, Decoración, Mano Obra, Depreciación, % Desperdicio]
    H --> I[API NestJS calcula Costo Directo Total]
    I --> J[Usuario ingresa Precio de Venta Sugerido]
    J --> K{¿Precio Venta > Costo Directo Total?}
    K -->|No| L[Alerta: 'Precio genera pérdida' - Ajustar Precio]
    L --> J
    K -->|Sí| M[Guarda Producto con su estructura de costos y activa en POS]
```

---

## 6. Flujo de Producción y Mermas

```mermaid
flowchart TD
    SubGraph1[Registro de Lote de Producción]
    A1[Usuario selecciona 'Registrar Lote'] --> B1[Elige Producto y Cantidad a hornear]
    B1 --> C1[API NestJS verifica Stock de Insumos requeridos]
    C1 --> D1{¿Hay suficientes insumos?}
    D1 -->|No| E1[Muestra Desglose de Faltantes + Botón para registrar compra]
    D1 -->|Sí| F1[NestJS descuenta insumos de la Receta Base + Adicionales]
    F1 --> G1[NestJS incrementa Stock de Producto Terminado]
    G1 --> H1[Guarda registro en lotes_produccion con usuario_id]

    SubGraph2[Registro de Merma / Pérdida]
    A2[Usuario selecciona 'Registrar Merma'] --> B2[Selecciona Producto Terminado]
    B2 --> C2[Ingresa Cantidad descartada y Motivo ej. Roto al empacar]
    C2 --> D2[NestJS reduce Stock de Producto y guarda registro en mermas]
```

---

## 7. Flujo de Gastos Operativos y Dashboard Financiero

```mermaid
flowchart TD
    A[Usuario abre Dashboard Krumly] --> B[Selecciona Período Principal ej. Este Mes]
    B --> C[Selecciona Período de Comparación ej. Mes Anterior]
    C --> D[API NestJS consulta Ventas, Costos Directos, Mermas y Gastos Fijos/Variables]
    D --> E[Calcular Utilidad Neta = Ingresos - Costos Directos - Gastos]
    E --> F[Calcular Ticket Promedio y Punto de Equilibrio]
    F --> G[Calcular % Variación de Ingresos, Egresos y Utilidad]
    G --> H[Renderizar Gráficas Comparativas, Alertas de Stock Mínimo y Ranking de Clientes]
```
