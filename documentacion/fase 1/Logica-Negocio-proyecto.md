# Documento Maestro de Lógica de Negocio, Estructura de Costos y Casos de Uso
## Sistema de Gestión y Control Operativo para Krumly (Repostería / Galletas)

---

## 1. Lógica de Negocio y Reglas Core

### 1.1 Fórmulas Matemáticas y Financieras

#### 1.1.1 Costo de Insumos y Materia Prima
Para cada insumo $i$ registrado en el inventario:
$$C_{\text{unidad}, i} = \frac{P_{\text{compra}, i}}{Q_{\text{empaque}, i}}$$

#### 1.1.2 Costo de Receta Base (Cocina) y Costo Directo Total por Producto (Desacoplado)
Las recetas no están amarradas a un único producto; se crean independientemente en la cocina como **Recetas Base / Mezclas** (ej. "Masa Base de Vainilla").

1. **Costo Total y Costo por Gramo de la Receta Base ($C_{\text{gramo}}$):**
   $$C_{\text{receta base}} = \sum_{i=1}^{n} \left( Q_{\text{receta}, i} \times C_{\text{unidad}, i} \right)$$

   $$C_{\text{por gramo masa}} = \frac{C_{\text{receta base}}}{W_{\text{mezcla total gramos}}}$$
   *Ejemplo: Una mezcla de 1,080g de masa cuya suma de insumos da $9.00 USD tiene un $C_{\text{por gramo masa}} = \frac{\$9.00}{1,080\text{g}} = \$0.00833/\text{g}$.*

2. **Costo de Masa del Producto ($C_{\text{masa unidad}}$):**
   $$C_{\text{masa unidad}, P} = W_{\text{masa asignada}, P} \times C_{\text{por gramo masa}}$$
   *Ejemplo: Si una galleta lleva 120g de masa base, su costo de masa es $120\text{g} \times \$0.00833 = \$1.00 USD$.*

3. **Costo de Insumos Adicionales ($C_{\text{adicionales}}$):**
   $$C_{\text{adicionales}, P} = \sum_{j=1}^{m} \left( Q_{\text{adicional}, j} \times C_{\text{unidad}, j} \right)$$
   *Insumos específicos agregados al producto (ej. 20g de Nutella de relleno, toppings, adornos).*

4. **Costo Directo Total por Unidad ($C_{\text{directo total}, P}$):**
   $$C_{\text{directo total}, P} = C_{\text{masa unidad}, P} + C_{\text{adicionales}, P} + C_{\text{empaque}, P} + C_{\text{mano de obra}, P} + C_{\text{depreciacion}, P} + C_{\text{desperdicio}, P}$$

#### 1.1.3 Ganancia y Margen de Utilidad por Producto
$$G_{\text{bruta}, P} = P_{\text{venta}, P} - C_{\text{directo total}, P}$$

$$\text{Margen}_{\%}, P = \left( \frac{G_{\text{bruta}, P}}{P_{\text{venta}, P}} \right) \times 100$$

---

### 1.2 Reglas Estrictas del Sistema

1. **Regla R-01 (Restricción de Venta sin Stock):**  
   No se permite registrar la venta de un producto si su stock actual es igual a 0.

2. **Regla R-02 (Desacoplamiento de Recetas y Productos):**  
   Una Receta Base puede crearse sin estar asignada a ningún producto. Un Producto puede vincular una Receta Base existente (indicando los gramos de masa) y añadir insumos adicionales (rellenos/toppings).

3. **Regla R-03 (Deducción Automática de Stock por Venta):**  
   Al procesar una venta de $k$ unidades, el stock disponible de producto disminuye en $k$ unidades.

4. **Regla R-04 (Consumo Proporcional de Insumos en Producción):**  
   Al registrar la producción de lotes, el sistema descuenta del inventario de insumos la masa base y los adicionales requeridos.

5. **Regla R-05 (Actualización Dinámica de Costos en Cadena):**  
   Si el precio de compra de un insumo cambia, se recalcula el $C_{\text{por gramo masa}}$ de la Receta Base y automáticamente se actualizan todos los Productos que la utilizan.

---

## 2. Casos de Uso Principales

### UC-02A: Creación de Receta Base
- **Flujo:** Registrar nombre de la mezcla (ej. "Masa Base Vainilla"), agregar insumos e indicar peso total de la mezcla (1,080g). El sistema guarda la receta y calcula el costo por gramo.

### UC-02B: Definición de Producto y Costeo Completo
- **Flujo:** Registrar producto (ej. "Galleta Vainilla Rellena 120g"), seleccionar Receta Base e indicar gramos de masa (120g). Añadir insumos adicionales (20g Nutella) y costos indirectos. El sistema calcula $C_{\text{directo total}}$, sugiere precio y muestra el margen %.
