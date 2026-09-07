# Prompts para Generación de UI con Inteligencia Artificial (v0.dev / Galileo AI)
## Krumly Manager - Sistema de Gestión y Control Operativo para Repostería

Este documento proporciona una colección de **prompts técnicos de ingeniería de software** listos para copiar y pegar en herramientas de IA de generación de UI como **v0.dev (de Vercel)**, **Uizard** o **Galileo AI**.

Cada prompt incluye la especificación estética del **Design System de Krumly** (Colores `#AA1616` y `#FFF3E8`, tipografía *Inter*/*Outfit* y clases de TailwindCSS).

---

## Prompt 1: Punto de Venta POS (Ventas Rápidas)

```text
Create a modern, responsive Point of Sale (POS) screen for a bakery app called "Krumly Manager" using React, Lucide Icons, and TailwindCSS.

Brand Palette Specs:
- Primary Color: #AA1616 (deep bakery red)
- Secondary Background: #FFF3E8 (soft warm cream)
- Card Surface: #FFFFFF (clean white with border #EEDCD0)
- Text Color: #1A0A0A (dark chocolate)

Layout Structure:
1. Top Header: Logo "Krumly Manager", cashier name "Samuel Rosales", and an offline/online status badge (green pill "Online", orange pill "1 Offline Sync Pending").
2. Main Body (Left 2/3):
   - Category filter pills at the top ("All", "Cookies", "Cakes", "Beverages") with active state in #AA1616.
   - Search bar for products.
   - Grid of product cards (3 columns on desktop, 2 on mobile). Each card shows: product image/icon, name (e.g. "Galleta Choco-Chips 120g"), price "$2.50 USD", stock badge (e.g. "Stock: 45 units" in green, or "Low Stock: 5" in amber).
3. Cart Sidebar (Right 1/3):
   - Header "Current Order".
   - Customer Selector dropdown (default "Public / Anonymous", with option to select registered customer).
   - Order items list with quantity controls (+ / -) and item subtotal.
   - Payment Method Radio Selector: "USD Cash", "VES Cash", "Pago Móvil", "POS Card", "Mixed Payment".
   - Total Amount summary in bold #1A0A0A.
   - Large CTA Button: "Confirm Sale ($10.00 USD)" in bg-[#AA1616] hover:bg-[#8D0F0F] text-white py-4 rounded-xl font-bold shadow-lg.
```

---

## Prompt 2: Constructor de Recetas Base (Cocina)

```text
Build a clean, professional Recipe Batch Constructor screen for a bakery management app called "Krumly Manager" using React and TailwindCSS.

Brand Styling:
- Primary Accent: #AA1616
- Main Background: #FFF3E8
- Cards/Form Container: #FFFFFF with subtle shadow and border #EEDCD0.

Features & Form Elements:
1. Page Header: Title "Crear Receta Base (Cocina)" with a subtitle "Define la masa o mezcla estándar para reutilizar en múltiples productos".
2. Top Input Section:
   - Recipe Name input (e.g., "Masa Base de Vainilla").
   - Total Batch Yield Weight input in grams (e.g., "1,080 g").
3. Ingredients Table:
   - Dynamic rows to select an Insumo/Ingredient from a dropdown (e.g., "Harina de Trigo", "Mantequilla"), enter quantity in grams/ml, and display the calculated line cost.
   - "+ Añadir Ingrediente" button styled with border-[#AA1616] text-[#AA1616].
4. Real-time Summary Card:
   - Display "Costo Total del Lote: $9.00 USD"
   - Display "Costo por Gramo de Masa: $0.0083 / g" highlighted in a warm badge.
5. Action Button: "Guardar Receta Base" in solid bg-[#AA1616] text-white.
```

---

## Prompt 3: Definición y Costeo de Productos Finales

```text
Design a 3-step tabbed product configuration & costing form for "Krumly Manager" using React and TailwindCSS.

Brand Colors: Primary #AA1616, Secondary Background #FFF3E8, Surface #FFFFFF.

Steps/Tabs:
1. Tab 1 - Basic Info: Inputs for Product Name (e.g., "Galleta Vainilla Rellena 120g"), Category dropdown, and Minimum Stock alert threshold.
2. Tab 2 - Masa & Rellenos:
   - Dropdown to select Base Recipe (e.g., "Masa Base de Vainilla") + Input for Masa Grams used per unit (e.g., "120 g"). Displays auto-calculated dough cost.
   - Section to add optional fillings/toppings (e.g., Nutella 20g).
3. Tab 3 - Indirect Costs & Pricing:
   - Inputs for Unit Packaging Cost ($), Unit Decoration Cost ($), Labor Cost ($), Depreciation ($), Waste % (5%).
   - Highlighted Result Card: "Costo Directo Total: $0.95 USD".
   - Input for "Precio de Venta Sugerido ($2.50 USD)".
   - Real-time badges for "Ganancia Bruta: $1.55 USD" and "Margen: 62%".
```

---

## Prompt 4: Dashboard Financiero y Comparativas

```text
Create a high-impact financial dashboard for a bakery business "Krumly Manager" using React, TailwindCSS, and Recharts.

Brand Aesthetics: Background #FFF3E8, Primary #AA1616, Cards #FFFFFF, Dark Text #1A0A0A.

Dashboard Sections:
1. Top Bar: Date range selector ("This Month") and Period Comparison selector ("vs Last Month").
2. 4 Main KPI Cards:
   - Total Sales ($1,250.00 USD, +15% badge in green).
   - Total Expenses ($450.00 USD).
   - Net Profit ($800.00 USD).
   - Average Order Ticket ($8.50 USD).
3. Break-Even Point Progress Bar: Visual bar showing progress toward monthly fixed cost coverage (e.g. "85% Covered - $850 / $1,000").
4. Charts Row:
   - Bar chart comparing Revenue vs Expenses week by week.
5. Ranking Columns:
   - Top 5 Best Selling Cookies table.
   - Frequent Customers list.
```
