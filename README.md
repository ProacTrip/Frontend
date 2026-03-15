# ProacTrip Frontend

Sistema de gestión de viajes y reservas - Interfaz de usuario construida con Next.js 16, React 19 y TypeScript.

## 🚀 Tecnologías Principales

El frontend utiliza un stack tecnológico moderno diseñado para desarrollo rápido, rendimiento óptimo y experiencia de usuario fluida:

**Next.js 16.0.5**: Framework React con App Router, Server Components, y optimizaciones automáticas de rendimiento. Elegido por su sistema de routing basado en archivos y capacidades de SSR/SSG.

**React 19.2.0**: Biblioteca principal de UI con Concurrent Rendering y Automatic Batching para mejorar el rendimiento de actualizaciones de estado.

**TypeScript 5**: Lenguaje principal del frontend. Proporciona type-safety, mejor autocompletado en IDEs y detección temprana de errores.

**Tailwind CSS 3.3.3**: Framework de utilidades CSS para diseño responsive rápido y consistente. Incluye configuración personalizada para los colores de marca ProacTrip.

**Framer Motion 12.31.0**: Biblioteca de animaciones declarativas para transiciones fluidas, gestos táctiles y elementos interactivos.

**Lucide React 0.563.0**: Set de iconos SVG modernos y optimizados con soporte para personalización de color y tamaño.

**Lottie Animations (@dotlottie/react-player 1.6.19)**: Animaciones vectoriales de alta calidad para loaders, splash screens y elementos visuales complejos.

## 🏗️ Arquitectura del Sistema

El frontend sigue la estructura de **App Router** de Next.js con separación clara de responsabilidades:

- **`/app`**: Rutas y layouts de la aplicación usando el sistema de archivos
- **`/components`**: Componentes reutilizables organizados por dominio (layout, home, ui, iconos)
- **`/lib`**: Lógica compartida (API client, utilidades, constantes, tipos)
- **`/hooks`**: React hooks personalizados para lógica reutilizable
- **`/public`**: Assets estáticos (imágenes, animaciones Lottie, fuentes)

La aplicación utiliza **Client Components** (`'use client'`) para interactividad y **Server Components** cuando es posible para optimizar el bundle size y mejorar el rendimiento inicial.

Para autenticación, los tokens **PASETO v4** se almacenan en `localStorage` y se envían en cada request mediante el header `Authorization: Bearer <token>`. El cliente API (`/app/lib/api.ts`) maneja automáticamente la renovación de tokens (5 minutos antes de expirar) y redirección en caso de sesión expirada.

### Path Aliases

El proyecto está configurado con path aliases en `tsconfig.json`:
```typescript
"paths": {
  "@/*": ["./*"]
}
```

Esto permite imports limpios desde la raíz:
```typescript
import { Button } from '@/components/ui/Button';
import { getUserProfile } from '@/app/lib/api';
```

> ⚠️ **Importante:** `@/` apunta a la raíz del proyecto, no a `/app`. Para acceder a archivos en `/app`, usa `@/app/...`

## 📁 Estructura de Carpetas
```
frontend/
├── app/                        # App Router de Next.js
│   ├── auth/                  # Páginas de autenticación
│   │   ├── login/            # Login con email/password y Google OAuth
│   │   ├── register/         # Registro de nuevos usuarios
│   │   ├── forgot-password/  # Recuperación de contraseña
│   │   ├── reset-password/   # Reseteo de contraseña con token
│   │   ├── verify-email/     # Verificación de email
│   │   ├── resend-verification/  # Reenvío de email de verificación
│   │   └── callback/         # Callback de Google OAuth
│   ├── home/                  # Dashboard principal (requiere auth)
│   │   ├── profile/          # Perfil de usuario
│   │   ├── hoteles/          # Búsqueda de hoteles (placeholder)
│   │   ├── vuelos/           # Búsqueda de vuelos (placeholder)
│   │   ├── ofertas/          # Ofertas especiales (placeholder)
│   │   ├── plan/             # Planificador de viajes (placeholder)
│   │   ├── contactanos/      # Formulario de contacto
│   │   ├── favoritos/        # Destinos y reservas favoritas (placeholder)
│   │   ├── carrito/          # Carrito de compras (placeholder)
│   │   └── mis-compras/      # Historial de reservas (placeholder)
│   ├── lib/                   # Código compartido
│   │   ├── constants/        # Constantes (países, monedas, avatares, destinos)
│   │   ├── types/            # TypeScript types e interfaces
│   │   ├── utils/            # Utilidades (detección de ubicación)
│   │   └── api.ts            # Cliente API con refresh automático de tokens
│   ├── layout.tsx            # Layout raíz con providers y LocationDetector
│   ├── page.tsx              # Splash screen de bienvenida
│   └── globals.css           # Estilos globales y configuración de Tailwind
├── components/                # Componentes React reutilizables
│   ├── home/                 # Componentes específicos del home
│   │   └── DestinationCard.tsx  # Tarjeta de destino con animaciones
│   ├── iconos/               # Iconos personalizados
│   │   └── GoogleIcon.tsx    # Logo de Google para OAuth
│   ├── layout/               # Componentes de layout
│   │   ├── Navbar.tsx        # Barra de navegación principal
│   │   └── CookieBanner.tsx  # Banner de consentimiento de cookies
│   ├── ui/                   # Componentes UI genéricos
│   │   ├── Button.tsx        # Botón reutilizable
│   │   ├── InputField.tsx    # Input de texto con validación
│   │   ├── Loader.tsx        # Indicador de carga animado
│   │   └── Divider.tsx       # Separador visual
│   ├── LocationDetector.tsx   # Detector de ubicación (usuarios anónimos)
│   └── LoginLocationDetector.tsx  # Detector de ubicación (usuarios autenticados)
├── hooks/                     # React hooks personalizados
│   └── useAuth.ts            # Hook de autenticación y gestión de sesión
├── public/                    # Assets estáticos
│   ├── animations/           # Archivos Lottie (.lottie)
│   │   ├── loader.lottie     # Animación de carga
│   │   └── lupa.lottie       # Animación de búsqueda
│   ├── assets/               # Imágenes de UI
│   │   └── loginRegister/    # Fondos de auth
│   └── images/               # Imágenes de contenido
│       └── destinations/     # Fotos de destinos turísticos
├── Dockerfile                 # Configuración de contenedor Docker
├── docker-compose.yml         # Orquestación de servicios
├── next.config.ts            # Configuración de Next.js
├── tailwind.config.ts        # Configuración de Tailwind CSS
├── tsconfig.json             # Configuración de TypeScript
├── .dockerignore             # Archivos excluidos de Docker
├── .gitignore                # Archivos excluidos de Git
├── .env.local                # Variables de entorno (no commitear)
├── .env.example              # Template de variables de entorno
└── package.json              # Dependencias y scripts
```

## ⚙️ Configuración Inicial para Desarrollo

### Requisitos Previos

Asegúrate de tener instalado:
- **Node.js 20.x o superior**
- **npm 9.x o superior**
- **Docker y Docker Compose** (opcional, para desarrollo en contenedor)

### Opción 1: Desarrollo Local (Sin Docker)

#### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/ProacTrip/Frontend.git
cd frontend
```

#### Paso 2: Instalar Dependencias
```bash
npm install --legacy-peer-deps
```

> ⚠️ La flag `--legacy-peer-deps` es necesaria debido a que algunas dependencias aún no declaran compatibilidad explícita con React 19.

#### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:
```bash
cp .env.example .env.local
```

Contenido de `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Paso 4: Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

El servidor iniciará en **http://localhost:3000** con hot-reload habilitado.

### Opción 2: Desarrollo con Docker (Recomendado para Consistencia)

#### Paso 1: Verificar Docker

Asegúrate de tener Docker Desktop instalado y corriendo:
```bash
docker --version
docker compose version
```

#### Paso 2: Configurar Variables de Entorno

Crea `.env.local` como se indicó arriba.

#### Paso 3: Iniciar el Contenedor
```bash
docker compose up -d
```

La primera ejecución tomará unos minutos para construir la imagen.

#### Paso 4: Verificar Logs
```bash
docker compose logs -f frontend
```

Deberías ver:
```
✓ Ready in XXXms
○ Local:        http://localhost:3000
```

#### Comandos Útiles de Docker
```bash
# Ver logs en tiempo real
docker compose logs -f frontend

# Detener contenedor
docker compose down

# Reiniciar contenedor
docker compose restart frontend

# Entrar al contenedor
docker compose exec frontend sh

# Reconstruir imagen (si cambias Dockerfile)
docker compose up -d --build
```

### Verificación de Instalación

1. Abre http://localhost:3000 en tu navegador
2. Deberías ver el splash screen de ProacTrip con animación Lottie
3. Después de 5 segundos, redirige automáticamente a `/auth/login`

## 🔌 Integración con Backend

El frontend se comunica con el backend mediante un cliente API centralizado en `/app/lib/api.ts`.

### Cliente API (`api.ts`)

**Características principales:**

- ✅ **Refresh automático de tokens**: Detecta tokens expirados y los renueva usando refresh tokens
- ✅ **Renovación proactiva**: Renueva tokens 5 minutos antes de que expiren
- ✅ **Race condition prevention**: Evita múltiples requests simultáneos de refresh mediante promesas compartidas
- ✅ **Retry en 401**: Reintenta automáticamente requests fallidos después de renovar el token
- ✅ **Type-safe**: Interfaces TypeScript para todos los tipos de datos
- ✅ **Logout automático**: Limpia sesión y redirige si el refresh token también expira

**Ejemplo de uso:**
```typescript
import { apiFetch, getUserProfile, updateUserProfile } from '@/app/lib/api';

// GET request
const profile = await getUserProfile();

// PUT request
const updatedProfile = await updateUserProfile({
  first_name: 'Juan',
  last_name: 'Pérez'
});

// POST request genérico
const response = await apiFetch('/api/v1/custom-endpoint', {
  method: 'POST',
  body: JSON.stringify({ data: 'example' })
});
```

### Endpoints Implementados (Backend)

**Autenticación (públicos):**
```
POST   /api/v1/auth/register           - Registro de usuarios
POST   /api/v1/auth/login              - Login con email/password
POST   /api/v1/auth/refresh            - Renovación de access tokens
POST   /api/v1/auth/logout             - Cierre de sesión
GET    /api/v1/auth/verify-email       - Verificación de email
POST   /api/v1/auth/resend-verification - Reenvío de email de verificación
POST   /api/v1/auth/forgot-password    - Solicitud de reset de contraseña
POST   /api/v1/auth/reset-password     - Reseteo de contraseña
GET    /api/v1/auth/google             - Inicio de sesión con Google
GET    /api/v1/auth/google/callback    - Callback de Google OAuth
```

**Usuarios (protegidos - requieren token):**
```
GET    /api/v1/user/profile            - Obtener perfil completo
PUT    /api/v1/user/profile            - Actualizar perfil
POST   /api/v1/user/avatar             - Subir avatar (multipart/form-data)
GET    /api/v1/user/medical            - Obtener ficha médica
PUT    /api/v1/user/medical            - Actualizar ficha médica
```

**Ubicación (protegidos):**
```
POST   /api/v1/user/current-location   - Guardar ubicación actual (pendiente en backend)
```

> ⚠️ **Nota**: Algunos endpoints están pendientes de implementación en el backend. Ver sección de "Funcionalidades Pendientes" (esta mas abajo).

### Estructura de Requests

**Register (POST /api/v1/auth/register):**
```json
{
  "email": "user@example.com",
  "password": "12345678",
  "preferred_language": "es",
  "preferred_currency": "EUR",
  "timezone": "Europe/Madrid",
  "location": {
    "city": "Madrid",
    "region": "Madrid",
    "country": "ES",
    "country_name": "Spain",
    "latitude": 40.4165,
    "longitude": -3.7026,
    "postal": "28001"
  }
}
```

**Current Location (POST /api/v1/user/current-location):**
```json
{
  "location": {
    "city": "París",
    "region": "Île-de-France",
    "country": "FR",
    "country_name": "France",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "postal": "75001"
  }
}
```

## 🌍 Sistema de Detección de Ubicación

ProacTrip implementa un sistema de detección de ubicación en dos capas usando la API externa **ipapi.co**:

### API Externa Utilizada

- **Proveedor**: ipapi.co
- **Endpoint**: `https://ipapi.co/json/`
- **Método**: GET (sin API key requerida)
- **Límite**: 1000 requests/día (plan gratuito)
- **Documentación**: https://ipapi.co/api/

**Ventajas de usar API externa:**
- ✅ Datos más precisos que APIs nativas del navegador
- ✅ Incluye ciudad, región, país, coordenadas
- ✅ No requiere permisos de geolocalización del usuario
- ✅ Funciona en cualquier dispositivo/navegador

### 1. LocationDetector (Usuarios Anónimos)

**Componente:** `/components/LocationDetector.tsx`  
**Ubicación:** Layout raíz (`/app/layout.tsx`)  
**Función:** Detecta la ubicación del usuario mediante `ipapi.co` y la guarda en `localStorage`

**Flujo de detección:**

1. Llama a `https://ipapi.co/json/` (timeout: 3 segundos)
2. Si tiene éxito → guarda datos completos en `localStorage`
3. Si falla → usa **fallback** con APIs nativas del navegador:
   - `Intl.DateTimeFormat().resolvedOptions().timeZone` → timezone
   - `navigator.language` → idioma
   - Mapeo manual `timezone → moneda` usando `/app/lib/constants/currencies.ts`

**Datos detectados y guardados:**
```javascript
localStorage.setItem('user_location', JSON.stringify({
  timezone: "Europe/Madrid",
  currency: "EUR",
  language: "es",
  location: {
    city: "Madrid",
    region: "Madrid",
    country: "ES",
    country_name: "Spain",
    latitude: 40.4165,
    longitude: -3.7026,
    postal: "28001"
  }
}));
```

**Uso:** Estos datos se utilizan para **prellenar el formulario de registro** con valores sensatos (idioma, moneda, zona horaria, ubicación).

### 2. LoginLocationDetector (Usuarios Autenticados)

**Componente:** `/components/LoginLocationDetector.tsx`  
**Ubicación:** Layout de home (`/app/home/layout.tsx`)  
**Función:** Detecta la ubicación actual y **la envía al backend** para recomendaciones personalizadas

**Flujo:**

1. Usuario hace login y llega a `/home`
2. `LoginLocationDetector` detecta ubicación (API externa)
3. Envía **solo la ubicación** al backend:
```typescript
POST /api/v1/user/current-location
{
  "location": {
    "city": "Madrid",
    "region": "Madrid",
    "country": "ES",
    "country_name": "Spain",
    "latitude": 40.4165,
    "longitude": -3.7026,
    "postal": "28001"
  }
}
```

**Diferencia clave con LocationDetector:**
- LocationDetector: Guarda en `localStorage` (NO envía al backend)
- LoginLocationDetector: Envía al backend (para recomendaciones en tiempo real)

**Uso futuro (cuando backend lo implemente):**
- Recomendar hoteles/vuelos cerca de la ubicación actual
- Mostrar ofertas relevantes a la zona
- Ajustar búsquedas por proximidad

### 3. Cambio Permanente de Preferencias (Perfil)

**Página:** `/app/home/profile/page.tsx`  
**Endpoint:** `PUT /api/v1/user/profile`  
**Función:** Cambio manual de preferencias que se guarda en el backend

Campos editables:
- `preferred_language` (ej: "es", "en", "fr")
- `preferred_currency` (ej: "EUR", "USD", "GBP")
- `timezone` (ej: "Europe/Madrid")

Estos cambios son **permanentes** y afectan a todas las futuras sesiones del usuario.

## 📱 Páginas Principales

### Autenticación

**`/auth/login`**
- Login con email/password
- Botón de Google OAuth con ícono oficial
- Animaciones de transición con Framer Motion
- Validación de campos en tiempo real
- Redirección automática a `/home` después del login
- Link a "¿Olvidaste tu contraseña?"

**`/auth/register`**
- Registro de nuevos usuarios
- Prellenado automático de idioma/moneda/zona horaria usando `LocationDetector`
- Envía ubicación completa al backend (ciudad, país, coordenadas)
- Validación de contraseña con requisitos visuales
- Confirmación de contraseña
- Envío automático de email de verificación
- Redirección a `/auth/login` tras registro exitoso

**`/auth/verify-email`**
- Verificación automática de email mediante token en URL
- 3 estados: loading → success → error
- Animación Lottie durante la verificación
- Redirección automática a `/home` tras 2 segundos

**`/auth/forgot-password`**
- Formulario de recuperación de contraseña
- 2 vistas: formulario → confirmación de envío
- Validación de email

**`/auth/reset-password`**
- Formulario de nueva contraseña
- Validación de token en URL
- Requisitos de contraseña visibles
- Confirmación de contraseña
- Redirección a login tras éxito

**`/auth/callback`**
- Callback de Google OAuth
- Procesamiento automático de tokens
- Redirección a `/home`

### Dashboard

**`/home` (Página Principal)**
- Carrusel animado de 7 destinos turísticos
- Fondo con transiciones suaves (Framer Motion)
- Controles de navegación (flechas izquierda/derecha)
- Botón "Buscar" con animación de relleno
- Botón de favoritos con estado persistente (localStorage)
- Totalmente responsive (mobile-first)
- Auto-play del carrusel (opcional)

**`/home/profile`**
- Visualización y edición de perfil completo
- Selector de avatar con 20 emojis predefinidos
- Campos editables:
  - Nombre y apellido
  - Nacionalidad (selector con banderas)
  - Teléfono (prefijo auto-actualizado según país)
  - Email (no editable)
- Visualización de preferencias:
  - Idioma preferido
  - Moneda preferida
  - Zona horaria
- Botón "Guardar cambios" con animación de carga

**`/home/contactanos`**
- Formulario de contacto funcional
- Diseño de 2 columnas: formulario + información de contacto
- Tarjetas informativas:
  - Teléfono de contacto
  - Dirección física
  - Horario de atención
- Animación de envío con `Loader` component
- Validación de campos
- Mensaje de confirmación tras envío

**Páginas Placeholder (Pendientes de Backend):**

Estas páginas muestran un mensaje "Próximamente..." con emoji relacionado:

- `/home/hoteles` 🏨 - Búsqueda de hoteles
- `/home/vuelos` ✈️ - Búsqueda de vuelos
- `/home/ofertas` 🎉 - Ofertas especiales
- `/home/plan` 📋 - Planificador de viajes
- `/home/favoritos` ❤️ - Favoritos guardados
- `/home/carrito` 🛒 - Carrito de compras
- `/home/mis-compras` 🛍️ - Historial de reservas

### Splash Screen

**`/` (Página de Inicio)**
- Animación Lottie de bienvenida (búsqueda con lupa)
- Timer de 5 segundos con redirección automática a `/auth/login`
- Responsive con layout flexible
- Optimizado para carga rápida
- Fondo con gradiente de marca

## 🧩 Componentes Reutilizables

### UI Components

**`/components/ui/Loader.tsx`**

Indicador de carga con animación Lottie profesional.
```typescript

```

Props:
- `text?: string` - Texto debajo de la animación
- `size?: 'sm' | 'md' | 'lg'` - Tamaño (default: 'md')

**`/components/ui/InputField.tsx`**

Input de texto con validación y soporte para iconos.
```typescript
<InputField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  icon={}
/>
```

Props:
- `label: string` - Etiqueta del campo
- `type?: string` - Tipo de input (default: 'text')
- `value: string` - Valor controlado
- `onChange: (e) => void` - Handler de cambio
- `error?: string` - Mensaje de error
- `icon?: ReactNode` - Ícono prefijo
- `disabled?: boolean` - Estado deshabilitado

**`/components/ui/Button.tsx`**

Botón reutilizable con variantes y estados.
```typescript
}
>
  Continuar

```

Props:
- `variant?: 'primary' | 'google'` - Estilo del botón
- `onClick?: () => void` - Handler de click
- `isLoading?: boolean` - Muestra spinner
- `icon?: ReactNode` - Ícono opcional
- `disabled?: boolean` - Estado deshabilitado
- `children: ReactNode` - Contenido del botón

**`/components/ui/Divider.tsx`**

Separador visual con texto opcional.
```typescript

```

### Layout Components

**`/components/layout/Navbar.tsx`**

Barra de navegación principal del dashboard.

Características:
- Links animados con efecto de subrayado progresivo
- Dropdown de perfil de usuario (avatar + nombre)
- Opciones: Ver perfil, Cerrar sesión
- Responsive con menú hamburguesa en móvil
- Logo de ProacTrip clicable (va a `/home`)
- Links principales:
  - Plan ProacTrip
  - Home
  - Hoteles
  - Vuelos
  - Ofertas
  - Contáctanos

**`/components/layout/CookieBanner.tsx`**

Banner de consentimiento de cookies (GDPR).

Características:
- Mensaje informativo sobre uso de cookies
- Botones "Aceptar" y "Rechazar"
- Persistencia en `localStorage` (`cookies_accepted`)
- Animación de entrada desde abajo
- Se oculta automáticamente tras aceptar/rechazar

### Home Components

**`/components/home/DestinationCard.tsx`**

Tarjeta de destino turístico con animaciones.
```typescript
<DestinationCard
  destination={{
    id: 1,
    name: "España",
    place: "Barcelona",
    description: "Ciudad de arte y arquitectura",
    image: "/images/destinations/espana.jpg"
  }}
  isFavorite={false}
  onToggleFavorite={() => {}}
/>
```

Props:
- `destination: Destination` - Objeto con datos del destino
- `isFavorite: boolean` - Estado de favorito
- `onToggleFavorite: () => void` - Toggle favorito

Características:
- Imagen de fondo con overlay
- Botón de favorito (corazón animado)
- Título, lugar y descripción
- Animación hover (escala + sombra)
- Totalmente responsive

## 📊 Constantes y Datos Estáticos

### `/app/lib/constants/countries.ts`

Array de 65+ países con información completa.

**Estructura:**
```typescript
interface Country {
  code: string;      // Código ISO-2 (ES, FR, US)
  name: string;      // Nombre completo
  flag: string;      // Emoji de bandera
  phone: string;     // Prefijo telefónico (+34, +33, +1)
}
```

**Helpers disponibles:**
```typescript
getCountryByCode('ES')
// { code: 'ES', name: 'España', flag: '🇪🇸', phone: '+34' }

getCountryByName('España')
// { code: 'ES', name: 'España', flag: '🇪🇸', phone: '+34' }
```

### `/app/lib/constants/currencies.ts`

Mapeo de 150+ zonas horarias a sus monedas correspondientes.

**Estructura:**
```typescript
export const TIMEZONE_CURRENCY_MAP: Record = {
  'Europe/Madrid': 'EUR',
  'America/New_York': 'USD',
  'Asia/Tokyo': 'JPY',
  // ... 150+ más
};
```

**Helper disponible:**
```typescript
getCurrencyFromTimezone('Europe/Madrid')  // 'EUR'
getCurrencyFromTimezone('America/New_York')  // 'USD'
getCurrencyFromTimezone('Asia/Tokyo')  // 'JPY'
```

Este mapeo se usa en el **fallback** de `LocationDetector` cuando la API externa falla.

### `/app/lib/constants/avatars.ts`

20 emojis predefinidos para avatares de usuario.
```typescript
export const AVATARS = [
  '😀', '😎', '🚀', '🌟', '💼', 
  '🎨', '🎭', '🎪', '🎯', '🎲',
  // ... 10 más
];

export const DEFAULT_AVATAR = '😎';
```

**Helper disponible:**
```typescript
isValidAvatar('😎')  // true
isValidAvatar('🦄')  // false (no está en la lista)
```

### `/app/lib/constants/destinations.ts`

7 destinos turísticos destacados para el carrusel del home.

**Estructura:**
```typescript
interface Destination {
  id: number;
  name: string;         // "España"
  place: string;        // "Barcelona"
  description: string;  // "Ciudad de arte y arquitectura"
  image: string;        // "/images/destinations/espana.jpg"
}
```

Destinos incluidos:
1. España - Barcelona
2. Francia - París
3. Italia - Roma
4. Grecia - Atenas
5. Japón - Tokio
6. Brasil - Río de Janeiro
7. Estados Unidos - Nueva York

## 🎨 Estilos y Diseño

### Paleta de Colores
```css
/* Colores de marca ProacTrip */
--primary: #FF6B6B;         /* Rojo coral principal */
--primary-dark: #ff5252;    /* Hover/Active state */
--primary-light: #ff8a80;   /* Gradientes y fondos suaves */

/* Navbar */
--navbar-bg: #c54141;       /* Fondo de la barra de navegación */

/* Auth pages */
--auth-primary: #8d6e63;    /* Tonos marrones cálidos */
--auth-secondary: #795548;  /* Variante oscura */

/* Neutrales (Tailwind) */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Estados */
--success: #10b981;         /* Verde éxito */
--error: #ef4444;           /* Rojo error */
--warning: #f59e0b;         /* Amarillo warning */
```

### Responsive Breakpoints (Tailwind)
```css
sm: 640px   /* Móvil grande / Phablet */
md: 768px   /* Tablet vertical */
lg: 1024px  /* Desktop / Tablet horizontal */
xl: 1280px  /* Desktop grande */
2xl: 1536px /* Desktop extra grande */
```

### Convención de Diseño Mobile-First

El proyecto usa el patrón **mobile-first** de Tailwind:
```typescript
// ✅ CORRECTO (mobile-first)
className="text-sm md:text-base lg:text-lg"
// Por defecto text-sm, tablet text-base, desktop text-lg

// ❌ INCORRECTO (desktop-first)
className="text-lg md:text-base sm:text-sm"
```

### Animaciones Principales

**Transiciones de página (Framer Motion):**
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

**Botones con hover:**
```typescript
whileTap={{ scale: 0.98 }}
whileHover={{ scale: 1.02 }}
transition={{ duration: 0.2 }}
```

**Efecto de relleno progresivo (botón Buscar del home):**
```css
/* Pseudo-elemento que se desliza de izquierda a derecha */
.group:hover .bg-fill {
  transform: translateX(0);
  transition: transform 700ms ease-out;
}

.bg-fill {
  transform: translateX(-100%);
}
```

**Carrusel de destinos:**
```typescript
// Cambio de slide con animación
animate={{ x: -currentSlide * 100 + '%' }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

## 🛠️ Comandos Disponibles

### NPM Scripts
```bash
# Desarrollo local
npm run dev           # Inicia servidor en localhost:3000 con hot-reload

# Producción
npm run build         # Genera build optimizado para producción
npm start             # Inicia servidor de producción (requiere build previo)

# Linting
npm run lint          # Ejecuta ESLint en todo el proyecto
```

### Docker Commands
```bash
# Iniciar servicios
docker compose up -d              # Inicia contenedor en background
docker compose up                 # Inicia con logs en foreground

# Detener servicios
docker compose down               # Detiene y elimina contenedores

# Logs
docker compose logs -f frontend   # Ver logs en tiempo real
docker compose logs frontend      # Ver logs históricos

# Reiniciar
docker compose restart frontend   # Reinicia solo el servicio frontend

# Reconstruir
docker compose up -d --build      # Reconstruye la imagen (tras cambios en Dockerfile)

# Acceder al contenedor
docker compose exec frontend sh   # Abre shell dentro del contenedor
docker compose exec frontend npm run build  # Ejecuta comando dentro del contenedor

# Limpiar todo
docker compose down -v            # Detiene y elimina volúmenes
```

## 🔧 Configuración Avanzada

### Next.js Config (`next.config.ts`)

**Configuración de Webpack para Docker:**
```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      fs: false,  // Desactiva módulo fs en cliente
    };
  }
  
  // Hot reload en Docker mediante polling
  config.watchOptions = {
    poll: 1000,          // Revisa cambios cada segundo
    aggregateTimeout: 300 // Espera 300ms antes de recargar
  };

  return config;
}
```

**¿Por qué polling?**

Docker monta archivos mediante volúmenes, lo que puede no disparar eventos de cambio de archivo nativos. El polling fuerza a Next.js a revisar cambios periódicamente.

### TypeScript Config (`tsconfig.json`)

**Path Aliases:**
```json
"paths": {
  "@/*": ["./*"]
}
```

Permite imports desde la raíz:
```typescript
import { Button } from '@/components/ui/Button';
import { COUNTRIES } from '@/app/lib/constants/countries';
```

**JSX Runtime:**
```json
"jsx": "react-jsx"
```

Usa el nuevo JSX transform de React 19 (no requiere `import React`).

### Tailwind Config (`tailwind.config.ts`)

**Content Paths:**
```typescript
content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
]
```

Tailwind escanea estos archivos para generar solo las clases CSS usadas.

### Docker Compose (`docker-compose.yml`)

**Volúmenes:**
```yaml
volumes:
  - .:/app                           # Monta código fuente
  - frontend_node_modules:/app/node_modules  # Volumen nombrado para node_modules

volumes:
  frontend_node_modules:  # Crea volumen persistente gestionado por Docker
```

**¿Por qué volumen nombrado para node_modules?**

Evita que `node_modules` de tu máquina local sobrescriba el del contenedor. Docker gestiona `node_modules` internamente, mejorando compatibilidad entre sistemas operativos.

## 🔐 Variables de Entorno

### Archivo `.env.local`
```env
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Archivo `.env.example`
```env
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> ⚠️ **Seguridad:**
> - Variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente (browser)
> - NO incluyas API keys privadas, secrets o credenciales con este prefijo
> - `.env.local` está en `.gitignore` y NO debe commitearse

### Variables para Producción
```env
NEXT_PUBLIC_API_URL=https://api.proactrip.com
```

## 🐛 Resolución de Problemas Comunes

### Error: "legacy-peer-deps" requerido

**Síntoma:** `npm install` falla con:
```
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^18.0.0" from ...
```

**Causa:** React 19 es relativamente nuevo y algunas dependencias aún no declaran compatibilidad explícita.

**Solución:**
```bash
npm install --legacy-peer-deps
```

Esta flag le dice a npm que ignore conflictos de peer dependencies.

---

### Hot reload no funciona en Docker

**Síntoma:** Haces cambios en el código pero el navegador no se actualiza automáticamente.

**Solución 1:** Verifica que `next.config.ts` incluye `watchOptions`:
```typescript
config.watchOptions = {
  poll: 1000,
  aggregateTimeout: 300
};
```

**Solución 2:** Reinicia el contenedor:
```bash
docker compose restart frontend
```

**Solución 3:** Reconstruye la imagen:
```bash
docker compose up -d --build
```

---

### Error de CORS al llamar al backend

**Síntoma:** Requests fallan con error en consola:
```
Access to fetch at 'http://localhost:8080/api/v1/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Causa:** El backend no permite requests desde `http://localhost:3000`.

**Solución (Backend - Marco Aurelio debe hacer esto):**

En el backend (Go + Echo), configurar CORS:
```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
  AllowOrigins: []string{"http://localhost:3000"},
  AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
  AllowHeaders: []string{"Authorization", "Content-Type"},
}))
```

**Verificación:**

1. Backend corriendo en `http://localhost:8080`
2. Variable `NEXT_PUBLIC_API_URL=http://localhost:8080` en `.env.local`
3. CORS habilitado en backend

---

### Tokens expiran muy rápido

**Síntoma:** La sesión se cierra frecuentemente sin razón aparente.

**Solución:**

El cliente API debería manejar esto automáticamente. Verifica en DevTools → Network:

1. Busca requests a `/api/v1/auth/refresh`
2. Deberían ejecutarse automáticamente 5 min antes de que expire el access token
3. Si ves que fallan con 401, significa que el refresh token también expiró

**Configuración del backend:**

- Access token: 1 hora de duración
- Refresh token: 30 días de duración
- Frontend renueva access token 5 min antes de expirar

Si refresh token expira, el usuario debe volver a hacer login.

---

### Imágenes de destinos no cargan

**Síntoma:** Placeholders o imágenes rotas en el carrusel del home.

**Solución:**

Verifica que existen los archivos en `/public/images/destinations/`:
```bash
ls public/images/destinations/
```

Deberías ver:
```
espana.jpg
francia.jpg
italia.jpg
grecia.jpg
japon.jpg
brasil.jpg
estadosunidos.jpg
```

Si faltan, añade las imágenes correspondientes.

---

### Error 404 al hacer login

**Síntoma:** Después de hacer login exitoso, aparece error 404.

**Causa posible:** El backend no está corriendo o la URL es incorrecta.

**Verificación:**
```bash
# Verifica que el backend responde
curl http://localhost:8080/api/v1/health

# Si da error, inicia el backend
cd ../backend
go run main.go
```

---

### localStorage no persiste entre recargas

**Síntoma:** LocationDetector detecta ubicación cada vez que recargas la página.

**Causa:** Navegación privada/incógnito borra localStorage al cerrar la pestaña.

**Solución:** Usa el navegador en modo normal (no incógnito) para desarrollo.

---

### Build de producción falla

**Síntoma:** `npm run build` muestra errores de TypeScript.

**Solución:**
```bash
# Limpia caché de Next.js
rm -rf .next

# Reinstala dependencias
rm -rf node_modules
npm install --legacy-peer-deps

# Vuelve a intentar el build
npm run build
```

Si persiste el error, revisa los mensajes de TypeScript y corrige los tipos.

## 📐 Estructura de Datos (TypeScript Interfaces)

### UserProfile
```typescript
interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  nationality: string | null;
  date_of_birth: string | null;      // Formato: "YYYY-MM-DD"
  phone: string | null;
  avatar_url: string | null;         // Emoji o URL
  preferred_language: string | null; // Código ISO (es, en, fr)
  preferred_currency: string | null; // Código ISO (EUR, USD, GBP)
  timezone: string | null;           // IANA timezone (Europe/Madrid)
  travel_preferences: Record | null;
  created_at: string;                // ISO 8601 timestamp
  updated_at: string;                // ISO 8601 timestamp
}
```

### Destination
```typescript
interface Destination {
  id: number;
  name: string;        // "España"
  place: string;       // "Barcelona"
  description: string; // "Ciudad de arte y arquitectura"
  image: string;       // "/images/destinations/espana.jpg"
}
```

### UserLocationData
```typescript
interface UserLocationData {
  timezone: string;      // "Europe/Madrid"
  currency: string;      // "EUR"
  language: string;      // "es"
  location?: {
    city: string;        // "Madrid"
    region: string;      // "Madrid"
    country: string;     // "ES" (código ISO-2)
    country_name: string; // "Spain"
    latitude: number;    // 40.4165
    longitude: number;   // -3.7026
    postal: string;      // "28001"
  };
}
```

### Country
```typescript
interface Country {
  code: string;  // "ES" (código ISO-2)
  name: string;  // "España"
  flag: string;  // "🇪🇸" (emoji)
  phone: string; // "+34"
}
```

### AuthResponse
```typescript
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}
```

## 🚧 Funcionalidades Pendientes (Backend)

### Bugs Conocidos del Backend

Marco Aurelio está trabajando en resolver estos issues:

- ⏸️ **Google OAuth**: Error de duplicate key al registrar usuarios con Google
- ⏸️ **Google OAuth**: No devuelve refresh_token en algunos casos
- ⏸️ **Verify Email**: Login permite acceso sin verificar email (debería rechazar)
- ⏸️ **Current Location**: Endpoint `/api/v1/user/current-location` no implementado (404)

### Endpoints Pendientes de Implementación

Las siguientes funcionalidades están **completamente preparadas en el frontend** pero esperan implementación del backend:

#### 1. Reestructuración de Account

**Actual:** `/api/v1/user/*`  
**Futuro:** `/api/v1/account/*`
```
/api/v1/account/
  ├── personal          (perfil + datos médicos)
  ├── connections       (Google OAuth, redes sociales)
  ├── messaging         (notificaciones, preferencias)
  ├── security          (contraseña, 2FA)
  ├── history           (reservas, búsquedas)
  ├── payments          (métodos de pago, Stripe)
  └── documents         (pasaportes, visas)
```

**Tiempo estimado frontend:** 3-4 horas (cuando backend esté listo)

#### 2. Sistema de Roles

**Roles propuestos:**
- `client` → Usuario normal (hace reservas)
- `admin` → Administrador (hace todo)

**Frontend pendiente:**
- Dashboard de admin (`/app/admin/*`)
- Protección de rutas por rol
- Componentes condicionales según rol

**Tiempo estimado frontend:** 6-8 horas

#### 3. Búsqueda de Hoteles

**Endpoints necesarios:**
```
GET  /api/v1/hotels/search?city=Paris&checkin=2025-06-01&checkout=2025-06-05
GET  /api/v1/hotels/:id
POST /api/v1/hotels/:id/reserve
```

**Frontend pendiente:**
- Formulario de búsqueda avanzada
- Grid de resultados con filtros
- Página de detalle de hotel
- Integración con carrito

**Tiempo estimado frontend:** 8-10 horas

#### 4. Búsqueda de Vuelos

**Endpoints necesarios:**
```
GET  /api/v1/flights/search?from=MAD&to=CDG&date=2025-06-01
GET  /api/v1/flights/:id
POST /api/v1/flights/:id/reserve
```

**Frontend pendiente:**
- Formulario de búsqueda (origen, destino, fechas, pasajeros)
- Lista de resultados
- Comparador de precios
- Integración con carrito

**Tiempo estimado frontend:** 8-10 horas

#### 5. Ofertas

**Endpoints necesarios:**
```
GET /api/v1/offers
GET /api/v1/offers/:id
```

**Frontend pendiente:**
- Grid de ofertas destacadas
- Filtros por tipo (hoteles, vuelos, paquetes)
- Countdown timer para ofertas limitadas

**Tiempo estimado frontend:** 3-4 horas

#### 6. Favoritos

**Endpoints necesarios:**
```
GET    /api/v1/favorites
POST   /api/v1/favorites    (añadir)
DELETE /api/v1/favorites/:id (eliminar)
```

**Frontend pendiente:**
- Página de favoritos funcional
- Toggle favorito en hoteles/vuelos
- Persistencia en backend

**Tiempo estimado frontend:** 4-5 horas

#### 7. Carrito y Reservas

**Endpoints necesarios:**
```
GET    /api/v1/cart
POST   /api/v1/cart          (añadir item)
DELETE /api/v1/cart/:id      (eliminar item)
POST   /api/v1/cart/checkout (procesar pago)
```

**Frontend pendiente:**
- Carrito funcional con cálculo de total
- Botón "Pagar" → Stripe
- Resumen de compra

**Tiempo estimado frontend:** 6-8 horas

#### 8. Historial de Compras

**Endpoints necesarios:**
```
GET /api/v1/reservations
GET /api/v1/reservations/:id
```

**Frontend pendiente:**
- Lista de reservas pasadas
- Detalle de reserva
- Descargar PDF de confirmación

**Tiempo estimado frontend:** 4-5 horas

#### 9. Pagos con Stripe

**Confirmación necesaria:** ¿Se usará Stripe?

**Endpoints necesarios:**
```
POST /api/v1/payments/create-intent
POST /api/v1/payments/confirm
GET  /api/v1/payments/methods
```

**Frontend pendiente:**
- Instalar `@stripe/stripe-js` y `@stripe/react-stripe-js`
- Componente de pago (CheckoutForm)
- Gestión de métodos de pago guardados

**Tiempo estimado frontend:** 6-8 horas

#### 10. Chat con IA

**Confirmación necesaria:** ¿Es obligatorio para el TFG?

**Opciones:**
- OpenAI API (ChatGPT)
- Anthropic API (Claude)
- Widget de terceros (Drift, Intercom)

**Tiempo estimado frontend:** 4-6 horas (si se implementa)

---

**Tiempo total estimado frontend pendiente:** 50-70 horas

> ⚠️ **Importante:** Todo esto depende 100% de que Marco Aurelio implemente los endpoints correspondientes en el backend.

## 📚 Buenas Prácticas de Desarrollo

### TypeScript

✅ **Hacer:**
- Definir interfaces para props de componentes
- Usar tipos explícitos para objetos complejos
- Aprovechar type inference cuando es obvio
- Usar `unknown` en lugar de `any` cuando sea necesario

❌ **Evitar:**
- Usar `any` sin justificación
- Dejar `implicit any` en funciones
- Ignorar errores de tipo con `@ts-ignore`

**Ejemplo:**
```typescript
// ✅ BIEN
interface ButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button = ({ text, onClick, disabled = false }: ButtonProps) => {
  // ...
}

// ❌ MAL
const Button = ({ text, onClick, disabled }: any) => {
  // ...
}
```

### React

✅ **Hacer:**
- Usar `'use client'` solo cuando sea necesario (interactividad)
- Mantener componentes pequeños (Single Responsibility)
- Extraer lógica compleja a custom hooks
- Memorizar valores costosos con `useMemo`
- Evitar re-renders con `React.memo` cuando sea apropiado

❌ **Evitar:**
- Poner toda la lógica en un solo componente gigante
- Calcular valores costosos en cada render
- Abusar de `useEffect` para lógica que puede ser síncrona

**Ejemplo:**
```typescript
// ✅ BIEN
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => /* cálculo costoso */);
  }, [data]);

  return {/* render */};
});

// ❌ MAL
const ExpensiveComponent = ({ data }) => {
  const processedData = data.map(item => /* cálculo costoso */);
  // Se recalcula en CADA render
  return {/* render */};
};
```

### Tailwind CSS

✅ **Hacer:**
- Usar clases utilitarias en lugar de CSS personalizado
- Seguir el patrón mobile-first (`sm:`, `md:`, `lg:`)
- Extraer componentes si repites las mismas clases frecuentemente
- Usar `group` y `peer` para estados hover complejos

❌ **Evitar:**
- Escribir CSS custom cuando Tailwind lo ofrece
- Usar `!important` (ajusta la especificidad correctamente)
- Ignorar el sistema de diseño (usa los breakpoints estándar)

**Ejemplo:**
```typescript
// ✅ BIEN (mobile-first)

  {/* text-sm por defecto, text-base en tablet, text-lg en desktop */}


// ❌ MAL (desktop-first)

  {/* confuso y no sigue el patrón de Tailwind */}

```

### Git

✅ **Hacer:**
- Commits atómicos (un cambio lógico por commit)
- Mensajes descriptivos (`feat: añadir búsqueda de hoteles`)
- Usar ramas feature (`feature/search-hotels`)
- Pull requests para code review
- Rebase antes de merge para historial limpio

❌ **Evitar:**
- Commits gigantes con múltiples cambios no relacionados
- Mensajes vagos (`fix`, `update`, `wip`)
- Commitear archivos sensibles (`.env.local`)
- Merge directo a `main` sin review

**Ejemplo de nombres de commits:**
```bash
feat: añadir formulario de búsqueda de hoteles
fix: corregir validación de email en register
refactor: extraer lógica de auth a custom hook
docs: actualizar README con nuevos endpoints
style: formatear componentes con Prettier
```

## 📞 Soporte y Documentación

### Equipo del Proyecto

- **Frontend:** [Tu nombre]
- **Backend:** Marco Aurelio
- **TFG:** Desarrollo de Aplicaciones Web (DAW) 2025

### Documentación Externa

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion
- **Lucide Icons**: https://lucide.dev
- **ipapi.co API**: https://ipapi.co/api

### Recursos Adicionales

- **Next.js Examples**: https://github.com/vercel/next.js/tree/canary/examples
- **Tailwind UI Components**: https://tailwindui.com (de pago, pero con ejemplos gratuitos)
- **React Patterns**: https://reactpatterns.com

---

**Proyecto:** ProacTrip - Sistema de Gestión de Viajes  
**TFG:** Desarrollo de Aplicaciones Web 2025  
**Equipo Frontend:** Marcos Casas
**Equipo Backend:** Marco Aurelio  
**Última actualización:** Marzo 2026  
**Versión:** 1.0.0  
**Licencia:** Privado - Proyecto Académico