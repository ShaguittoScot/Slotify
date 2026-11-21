# 🔍 Flujo de Exploración y Filtros de Negocio

> [!abstract] Resumen del Flujo
> Describe el proceso interactivo de descubrimiento comercial mediante el cual el cliente consumidor explora negocios cercanos, filtra por categoría de servicio en chips horizontales y busca en tiempo real por texto con retardo (*debounce*).

---

## ⚡ Diagrama de Interacción del Explorador

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente Consumidor
    participant H as ExploreHeader (Buscador & Chips)
    participant S as useExploreStore
    participant API as exploreApi (Axios .NET 8)
    participant UI as ExploreScreen (FlatList)

    C->>UI: Accede a pestaña Explorar
    UI->>S: fetchBusinesses()
    S-->>UI: Activa SkeletonCard (Carga progresiva)
    S->>API: GET /api/businesses
    API-->>S: Lista de comercios con calificaciones y servicios
    S->>S: Almacena businesses y filteredBusinesses
    S-->>UI: Desactiva carga y renderiza BusinessCards

    alt Filtrado por Categoría
        C->>H: Toca Chip "Barbería"
        H->>S: setSelectedCategory("Barbería")
        S->>S: Filtra en memoria: b.category === "Barbería"
        S-->>UI: Actualiza lista sin parpadeo de red
    else Búsqueda por Texto
        C->>H: Escribe "corte degradado"
        H->>S: setSearchQuery("corte degradado") (Debounce 300ms)
        S->>S: Evalúa coincidencia en nombre, dirección y servicios
        S-->>UI: Muestra tarjetas coincidentes o EmptyState si 0 resultados
    else Apertura de Reserva
        C->>UI: Presiona "Reservar" en una BusinessCard
        UI-->>C: Despliega modal de selección de turno y servicio
    end
```

---

## 🛡️ Rendimiento y Usabilidad

1. **Búsqueda Instantánea con Debounce:** Previene cálculos innecesarios al esperar 300 ms tras la última pulsación de tecla.
2. **Filtrado en Memoria (Zero Latency):** Las categorías y términos se resuelven en memoria local tras la primera descarga, logrando transiciones instantáneas a 60 fps.
3. **Pull-to-Refresh:** Permite al cliente deslizar hacia abajo para forzar una recarga fresca del catálogo desde el servidor.

---

## 🔗 Referencias Relacionadas
- Feature de Explorador: [[Feature Explore]]
- Micro-Onboarding: [[Feature Consumer Onboarding]]
- Calendario y Turnos: [[Feature Calendar & Booking]]
- MOC Principal: [[Indice General]]
