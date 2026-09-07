# Guía de Configuración de Jira y Planificación del Sprint 1
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento proporciona las instrucciones paso a paso para importar el **Product Backlog** en Jira, configurar el flujo de trabajo Scrum/Kanban y la selección oficial de tareas comprometidas para el **Sprint 1**.

---

## 1. Guía Paso a Paso para Importar el Backlog en Jira

Para cargar automáticamente las 8 Épicas y 15 Historias de Usuario sin escribir un solo ticket a mano:

1. **Inicia sesión en Jira** y navega a tu espacio de trabajo o proyecto `Krumly Manager`.
2. Dirígete al menú superior de configuración (ícono de tuerca ⚙️) y selecciona **Configuración del sistema** (*System Settings*).
3. En la barra lateral izquierda, busca la sección **Importación de sistema externo** (*External System Import*) y haz clic en **CSV**.
4. Haz clic en **Examinar** y selecciona el archivo [`Backlog-proyecto.csv`](file:///c:/Users/Samuel%20Rosales/Documents/SAMUEL%20PERSONALES/developmenet/documentacion/fase%204/Backlog-proyecto.csv).
5. Selecciona el proyecto destino de Jira donde se crearán las tareas y asegúrate de marcar la casilla *"Usar codificación UTF-8"*.
6. **Mapeo de Campos:** Mapea las columnas del CSV con los campos estándar de Jira:
   - Column `Issue Type` $\rightarrow$ Field `Issue Type`
   - Column `Summary` $\rightarrow$ Field `Summary`
   - Column `Description` $\rightarrow$ Field `Description`
   - Column `Acceptance Criteria` $\rightarrow$ Field `Acceptance Criteria` (o agregar a Description)
   - Column `Story Points` $\rightarrow$ Field `Story Points`
   - Column `Epic Link` $\rightarrow$ Field `Epic Link`
   - Column `Priority` $\rightarrow$ Field `Priority`
7. Haz clic en **Comenzar Importación** (*Begin Import*). En menos de 30 segundos todas las tareas quedarán vinculadas a sus Épicas en tu tablero.

---

## 2. Flujo de Trabajo Recomendado para el Tablero (Workflow Jira)

Se recomienda configurar un tablero Scrum/Kanban con 5 columnas de estado:

```
[Por Hacer (To Do)] ➔ [En Progreso (In Progress)] ➔ [Revisión de Código (Code Review)] ➔ [Pruebas QA] ➔ [Hecho (Done)]
```

* **Por Hacer (To Do):** Tickets aprobados del backlog esperando ser tomados.
* **En Progreso (In Progress):** Tareas activas siendo programadas por el desarrollador.
* **Revisión de Código (Code Review):** Pull Requests en GitHub pendientes de revisión.
* **Pruebas QA:** Tareas desplegadas en entorno de staging listas para validación de criterios de aceptación.
* **Hecho (Done):** Tareas validadas y fusionadas en la rama `main` de GitHub.

---

## 3. Planificación del Sprint 1 (Sprint Commitment - 2 Semanas)

El **Sprint 1** se enfoca exclusivamente en sentar la arquitectura base de la aplicación, la base de datos PostgreSQL/Prisma ORM, la autenticación de usuarios por roles y el layout base del frontend.

### 📋 Lista de Tickets Comprometidos para el Sprint 1:

| Ticket Key / Resumen | Tipo | Story Points | Prioridad |
| :--- | :--- | :---: | :--- |
| **`[Setup] Inicialización de Monorepo / NestJS + React Tailwind`** | Story | **3** | Alta |
| **`[DB] Configuración de Prisma ORM y Migración de Esquema 3NF`** | Story | **5** | Alta |
| **`[Auth] Login de Usuarios y Control de Acceso por Roles (RBAC)`** | Story | **5** | Alta |
| **`[Insumos] CRUD de Insumos y Cálculo de Costo Unitario`** | Story | **3** | Alta |
| **`[Categorías] Módulo de Categorías Dinámicas para Productos y Gastos`**| Story | **2** | Media |

* **Carga Total Estimada para el Sprint 1:** **18 Story Points**
* **Duración:** 2 Semanas
* **Entregable del Sprint 1:** Sistema base desplegado con Login funcional, base de datos de 14 tablas creada y gestión de insumos y categorías activa.
