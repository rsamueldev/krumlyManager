# Design System Definitivo y Especificación UI de Alta Fidelidad (Hi-Fi)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento constituye la guía definitiva del **Sistema de Diseño de Alta Fidelidad (Hi-Fi Design System)** para **Krumly Manager**, conteniendo los tokens visuales, variables CSS, clases de TailwindCSS, estados de componentes y pautas estéticas para llevar el proyecto a producción.

---

## 1. Tokens de Color y Paleta Definitiva (HEX, RGB, HSL)

```
+-----------------------------------------------------------------------------------+
|  PRIMARY BRAND (Krumly Red):        #AA1616  |  hsl(0, 77%, 38%)  | rgb(170,22,22) |
|  PRIMARY HOVER (Dark Crimson):      #8D0F0F  |  hsl(0, 81%, 31%)  | rgb(141,15,15) |
|  SECONDARY BG (Warm Soft Cream):    #FFF3E8  |  hsl(29, 100%, 95%)| rgb(255,243,232)|
|  SURFACE CARD (Pure White):         #FFFFFF  |  hsl(0, 0%, 100%)  | rgb(255,255,255)|
|  TEXT PRIMARY (Dark Chocolate):     #1A0A0A  |  hsl(0, 44%, 7%)   | rgb(26,10,10)  |
|  TEXT MUTED (Warm Moka):            #665353  |  hsl(0, 10%, 36%)  | rgb(102,83,83) |
|  BORDER COLOR (Soft Crust):         #EEDCD0  |  hsl(24, 45%, 87%) | rgb(238,220,208)|
+-----------------------------------------------------------------------------------+
```

### 1.1 Configuración de TailwindCSS (`tailwind.config.js`)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        krumly: {
          red: '#AA1616',
          'red-dark': '#8D0F0F',
          cream: '#FFF3E8',
          chocolate: '#1A0A0A',
          moka: '#665353',
          border: '#EEDCD0',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#2563EB',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'modal': '24px',
        'button': '10px',
      },
      boxShadow: {
        'krumly-sm': '0 2px 8px rgba(26, 10, 10, 0.04)',
        'krumly-md': '0 4px 16px rgba(26, 10, 10, 0.08)',
        'krumly-lg': '0 12px 32px rgba(170, 22, 22, 0.12)',
      }
    },
  },
}
```

---

## 2. Escala Tipográfica Hi-Fi

* **Títulos y Marca:** Google Font `Outfit` (Pesos: Bold 700, SemiBold 600).
* **Cuerpo de Interfaz y Tablas:** Google Font `Inter` (Pesos: Regular 400, Medium 500, SemiBold 600).

| Elemento | Tamaño (px / rem) | Peso | Fuente | Línea / Espaciado | Clase Tailwind |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 - Encabezados Principales** | `28px / 1.75rem` | 700 | Outfit | `1.2 / -0.02em` | `font-heading font-bold text-2xl text-krumly-chocolate` |
| **H2 - Títulos de Sección** | `20px / 1.25rem` | 600 | Outfit | `1.3 / -0.01em` | `font-heading font-semibold text-xl text-krumly-chocolate` |
| **H3 - Títulos de Tarjeta** | `16px / 1.00rem` | 600 | Outfit | `1.4 / normal` | `font-heading font-semibold text-base text-krumly-chocolate` |
| **Body Lead - Párrafo Destacado**| `15px / 0.9375rem`| 500 | Inter | `1.5 / normal` | `font-body font-medium text-sm text-krumly-chocolate` |
| **Body Regular - Texto de Tabla** | `14px / 0.875rem` | 400 | Inter | `1.5 / normal` | `font-body font-normal text-sm text-krumly-chocolate` |
| **Caption / Labels / Badges** | `12px / 0.75rem` | 600 | Inter | `1.2 / +0.02em` | `font-body font-semibold text-xs tracking-wider uppercase` |

---

## 3. Anatomía y Estados de Componentes Hi-Fi

### 3.1 Botón Principal (CTA - Action Button)
- **Apariencia Normal:** `bg-krumly-red text-white font-semibold py-3 px-6 rounded-button shadow-krumly-md hover:bg-krumly-red-dark transition-all duration-200 active:scale-[0.98]`
- **Estado Hover:** El color pasa de `#AA1616` a `#8D0F0F` con leve elevación.
- **Estado Disabled (Deshabilitado / Sin Stock):** `bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-none`

### 3.2 Botón Secundario / Acción Cancelar
- **Apariencia Normal:** `bg-transparent border border-krumly-red text-krumly-red font-medium py-3 px-6 rounded-button hover:bg-krumly-cream transition-all duration-200`

### 3.3 Tarjeta de Producto (Grid POS)
- **Contenedor:** `bg-white border border-krumly-border rounded-card p-4 shadow-krumly-sm hover:shadow-krumly-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between`
- **Badges de Stock Integros:**
  - **Stock Normal:** `bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold`
  - **Stock Bajo (Alerta):** `bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold animate-pulse`
  - **Agotado:** `bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-full font-semibold`

### 3.4 Modal de Pago Mixto (Superficie Elevada)
- **Backdrop:** `fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center`
- **Cuerpo del Modal:** `bg-white rounded-modal p-8 max-w-lg w-full shadow-krumly-lg border border-krumly-border animate-in fade-in zoom-in duration-200`
- **Monto Restante Dinámico:**
  - Si falta cobrar: `bg-amber-50 border border-amber-200 text-amber-900 font-bold p-3 rounded-lg text-center`
  - Si cobro completado: `bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold p-3 rounded-lg text-center`

---

## 4. Iconografía y Feedback de Interfaz

* **Librería de Íconos:** `Lucide React` (Trazo fino `strokeWidth={1.75}`).
* **Íconos Clave:**
  - Ventas POS: `<ShoppingCart />`, `<CreditCard />`, `<Banknote />`, `<Smartphone />`.
  - Recetas & Cocina: `<ChefHat />`, `<Scale />`, `<Utensils />`, `<Package />`.
  - Finanzas: `<TrendingUp />`, `<DollarSign />`, `<PieChart />`, `<AlertTriangle />`.
