# 🔍 Feature Explore (Catálogo y Descubrimiento)

> [!abstract] Resumen del Módulo
> `src/features/explore/` proporciona el motor de descubrimiento de comercios y reserva de servicios para usuarios consumidores (`CLIENTE`). Diseñado bajo arquitectura limpia y desacoplada, incluye búsqueda reactiva con retardo (*debounce*), carrusel horizontal de categorías, tarjetas con estado de disponibilidad, carga progresiva con *Skeletons* y estilos desacoplados basados en tokens.

---

## 📁 Estructura del Módulo

```
src/features/explore/
├── api/
│   └── index.ts                 # fetchBusinesses() con soporte para caché y demo
├── model/
│   └── index.ts                 # useExploreStore (Zustand) con filtrado y búsqueda
├── types/
│   └── index.ts                 # Interfaces BusinessItem y ServiceItem
├── ui/
│   ├── components/
│   │   ├── BusinessCard.tsx     # Tarjeta de comercio con calificación y botón de reserva
│   │   ├── ExploreHeader.tsx    # Barra superior con buscador y chips de categoría
│   │   ├── SkeletonCard.tsx     # Indicador de carga progresiva
│   │   ├── EmptyState.tsx       # Estado sin resultados de búsqueda
│   │   └── ErrorState.tsx       # Estado de fallo con botón de reintento
│   ├── screens/
│   │   └── ExploreScreen.tsx    # Pantalla principal del catálogo
│   └── styles/
│       ├── businessCard.styles.ts
│       ├── exploreHeader.styles.ts
│       ├── exploreScreen.styles.ts
│       └── feedbackStates.styles.ts
└── index.ts
```

---

## 🏢 Modelo de Datos (`BusinessItem` y `ServiceItem`)

Ubicado en `src/features/explore/types/index.ts`:

```typescript
export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  nextAvailableSlot: string; // ej. "Hoy, 16:30"
  services: ServiceItem[];
  accentColor: string;
  imageUrl?: string;
}
```

---

## ⚡ Lógica de Filtrado y Estado (`useExploreStore`)

El store `useExploreStore` implementa filtrado combinado en memoria:
1. **Filtro de Categoría:** Si la categoría seleccionada es `'Todos'`, no aplica restricción; de lo contrario, coteja contra `b.category`.
2. **Búsqueda por Texto:** Busca coincidencias insensibles a mayúsculas/minúsculas en el nombre del negocio (`name`), dirección (`address`) y nombres de sus servicios (`services.some(...)`).

```mermaid
graph TD
    User["Usuario"] -->|Escribe texto| Header["ExploreHeader (Buscador)"]
    User -->|Selecciona Chip| Chips["Chips de Sector (Barbería, Spa, Salud)"]
    
    Header -->|setSearchQuery(q)| Store["useExploreStore"]
    Chips -->|setSelectedCategory(cat)| Store
    
    Store --> FilterFn["applyFilters(businesses, category, query)"]
    FilterFn --> UIList["ExploreScreen (FlatList renderiza BusinessCard)"]
```

---

## 🎨 Desacoplamiento de Estilos y Temas

Cada componente delega su maquetación a hojas de estilo exportadas en `ui/styles/*`:
- `createBusinessCardStyles(colors)`
- `createExploreHeaderStyles(colors)`
- `createFeedbackStyles(colors)`

Esto evita la recreación de objetos de estilo en cada fotograma y garantiza alto rendimiento durante el scroll de listas largas.

---

## 🧪 Pruebas Unitarias Asociadas

En `__tests__/exploreFilter.test.ts`:
- Filtrado exacto por categoría.
- Búsqueda por subcadena en nombre y catálogo de servicios.
- Retorno de lista completa al restablecer filtros.

---

## 🔗 Referencias Relacionadas
- Flujo de Usuario: [[Flujo de Exploracion y Filtros de Negocio]]
- Micro-Onboarding: [[Feature Consumer Onboarding]]
- Agenda de Citas: [[Feature Calendar & Booking]]
- MOC Principal: [[Indice General]]
