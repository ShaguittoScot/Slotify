# 📄 Documentación Corporativa y Estratégica de Slotify

Esta carpeta reúne la documentación formal de negocio, arquitectura y planificación estratégica del ecosistema **Slotify**.

---

## 📚 Documentos Disponibles

### 1. 📘 Documento Maestro de Negocio y Propuesta de Valor (`modelo_negocio_slotify.tex`)
Documento ejecutivo completo y formal (8 páginas) con:
- **Portada Ejecutiva:** Diseño con identidad corporativa Slotify (Azul `#2563EB`, Slate `#0F172A`, Teal `#0D9488`), metadatos de versión y repositorios.
- **Índice General:** Estructurado con tabla de contenidos numerada.
- **Resumen Ejecutivo:** Justificación del proyecto e impacto esperado.
- **Identidad Corporativa:** Quiénes somos, Misión, Visión y Valores.
- **Definición Exhaustiva del Problema:** Análisis de fricciones y pérdidas por *No-Shows* tanto para comercios (B2B) como para clientes (B2C).
- **Propuesta de Solución:** Tabla comparativa de beneficios y funcionalidades para ambas partes.
- **Segmentación de Mercado:** Análisis de sectores objetivos (estética, salud, deportes, servicios profesionales).
- **Business Model Canvas Detallado:** Desglose profundo de los 9 bloques del Canvas de Osterwalder.
- **Estrategia de Monetización:** Planes SaaS (Freemium, Pro, Enterprise), comisiones y posicionamiento.
- **Arquitectura Tecnológica y Seguridad:** Estándares React Native / Expo, .NET 8 Clean Architecture, PostgreSQL, concurrencia ACID y principio Zero Trust.
- **Roadmap y Próximos Pasos:** Hitos de desarrollo y plan de validación en mercado.

**Compilar a PDF:**
```bash
cd documentos
pdflatex modelo_negocio_slotify.tex
```

---

### 2. 📊 Lámina Visual del Business Model Canvas (`business_model_canvas.tex`)
Lámina en formato horizontal (*Landscape A4*) diseñada en `TikZ` para presentaciones, exposiciones o impresión en una sola página.

**Compilar a PDF:**
```bash
cd documentos
pdflatex business_model_canvas.tex
```

---

## 🛠️ Herramientas Recomendadas para Edición y Lectura
- **VS Code:** Con la extensión **LaTeX Workshop** instalada para previsualización en vivo.
- **MiKTeX / TeXworks:** Ya instalado y configurado en tu sistema.
- **Visores de PDF:** Adobe Acrobat, SumatraPDF o el visor integrado de VS Code.
