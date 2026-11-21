# 📝 US-020 - Creador Dinámico de Formularios (Form Builder)

> [!abstract] Descripción de la Historia
> **Como** administrador de un comercio con requerimientos de reserva específicos,
> **quiero** construir y ordenar campos personalizados en un formulario dinámico,
> **para** recopilar la información exacta que necesito de mis clientes antes de su llegada (alergias, comensales, preferencias).

---

## 🎯 Criterios de Aceptación (Gherkin)

### Escenario 1: Creación de un nuevo campo personalizado
- **Dado** que el administrador ingresa a `FormBuilderScreen`,
- **Cuando** presiona *"Agregar Campo"* y selecciona el tipo `select` con el título *"Zona Preferida"*,
- **Y** define las opciones *"Terraza"*, *"Salón Principal"* y *"Bar"*,
- **Entonces** el campo se agrega a la lista de componentes activos y queda habilitado para marcarse como obligatorio.

### Escenario 2: Previsualización en tiempo real
- **Dado** que se han configurado 3 campos en el formulario,
- **Cuando** el usuario presiona el botón *"Vista Previa"*,
- **Entonces** el sistema navega a `form-preview.tsx` y renderiza el formulario con `FormViewer` en modo diapositivas o scroll para evaluar la experiencia del cliente.

### Escenario 3: Validación en el llenado de clientes
- **Dado** que un campo está marcado como obligatorio (`required: true`),
- **Cuando** el cliente final intenta agendar sin completar dicho campo,
- **Entonces** el motor de validación bloquea el avance y señala el campo en rojo.

---

## 🖥️ Componentes y Pantallas Asociadas
- `FormBuilderScreen.tsx` — Diseñador visual de campos.
- `FormViewer.tsx` — Renderizador dinámico con soporte de modos.
- `form-preview.tsx` — Pantalla de prueba.

---

## 🔗 Referencias Relacionadas
- Feature de Formularios: [[Feature Dynamic Form Builder]]
- Componente FormViewer: [[FormViewer]]
- MOC Principal: [[Indice General]]
