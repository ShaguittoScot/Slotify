# Slotify Web Booking Mini App

Mini aplicación web estática (HTML/CSS/JS sin dependencias de compilación) para explorar negocios y agendar citas reales mediante los endpoints públicos de `Slotify_back`.

## Endpoints consumidos

- `GET /api/businesses` — Catálogo de establecimientos para el directorio.
- `GET /api/public/businesses/{slug}` — Detalle del negocio, servicios, horarios base y `formConfig`.
- `GET /api/public/businesses/{slug}/availability?date=YYYY-MM-DD` — Horarios e intervalos ocupados del día en la zona horaria del negocio.
- `POST /api/public/businesses/{slug}/appointments` — Registro de cita confirmada en el backend.

## Ejecución local

1. Inicia la API de backend (`Slotify_back`, puerto por defecto `5272`):

   ```powershell
   dotnet run --project src/Slotify.API --launch-profile http
   ```

2. Sirve esta carpeta con cualquier servidor estático desde `c:\Users\richi\.gemini\antigravity-ide\scratch\Slotify\web-booking`:

   ```powershell
   npx serve . -l 3000
   ```

   O con Python:

   ```powershell
   python -m http.server 3000
   ```

3. Abre en el navegador:
   - Directorio de negocios: `http://localhost:3000`
   - Formulario directo de un negocio: `http://localhost:3000/?slug=<slug-del-negocio>`
   - API personalizada en otra URL: `http://localhost:3000/?slug=<slug>&api=http://192.168.8.59:5272/api`

## Configuración de CORS y enlace compartido

- **Backend (`Slotify_back`)**: En desarrollo (`ASPNETCORE_ENVIRONMENT=Development`), `SlotifyCors` permite orígenes locales. Para producción, configura `Cors:AllowedOrigins` (o la variable `CORS_ALLOWED_ORIGINS`) con los dominios autorizados separados por coma.
- **App móvil (`Slotify`)**: Define `EXPO_PUBLIC_BOOKING_BASE_URL` en el `.env` del proyecto móvil con la URL HTTPS donde publiques este portal (por ejemplo `https://reservas.tu-dominio.example`) para que el botón **Compartir** del Dashboard genere el enlace `${EXPO_PUBLIC_BOOKING_BASE_URL}/book/<slug>`.
