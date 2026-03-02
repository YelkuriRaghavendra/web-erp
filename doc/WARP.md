# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Architecture

This is a modern React admin dashboard template for the Angelis platform, built with React 19, TypeScript, and Vite. It's designed as a SaaS admin center featuring JWT authentication, role-based access control, and internationalization support.

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand (client/auth state) + TanStack React Query (server state)
- **Routing**: React Router DOM v7
- **Authentication**: JWT with refresh tokens and role-based access
- **Internationalization**: react-i18next (Spanish primary, English secondary)
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Package Manager**: pnpm (required)

### Application Structure

The application follows a single-page app pattern with:

- **Protected Routes**: All main routes wrapped in `<ProtectedRoute>` component
- **Persistent Sidebar**: `Sidebar` component with navigation menu
- **Role-Based Access**: `<RoleGuard>` components for role-specific features
- **Centralized Auth**: Zustand store with automatic token refresh
- **Server-Side Pagination**: All data fetching uses backend pagination and filtering

### Key Directories

```
src/
├── components/           # Business components organized by domain
│   ├── company/         # Company management (full CRUD)
│   ├── contractors/     # Contractor management (partial)
│   ├── ui/             # shadcn/ui components
│   └── ProtectedRoute.tsx, RoleGuard.tsx
├── hooks/              # React Query hooks for data fetching
├── store/              # Zustand stores (auth, companies, contractors)
├── lib/                # Configuration and utilities
├── i18n/               # Internationalization setup and locales
└── pages/              # Page components (login)
```

### Authentication & Authorization System

**Critical**: The auth system uses Zustand + JWT tokens with automatic refresh:

- **Auth Store**: `src/store/authStore.ts` - Persistent store with localStorage
- **Token Management**: Automatic refresh 15 minutes before expiry via `useAuthInit()` hook
- **Password Security**: All passwords encrypted with CryptoJS AES before sending to API
- **Role Hierarchy**: SUPERADMIN → COMPANYADMIN → ADMIN → MANAGER → EDITOR → USER → MODERATOR
- **Protected Routes**: Use `<ProtectedRoute>` wrapper for auth-required routes
- **Role Guards**: Use `<RoleGuard roles={['ROLE']}>` for role-specific UI

### State Management Pattern

- **Client/Auth State**: Zustand stores with Immer middleware for immutable updates
- **Server State**: TanStack React Query with 5min stale time, 1 retry, no refetch on window focus
- **API Client**: `useAuthenticatedApi()` hook automatically injects auth headers
- **Separation**: Auth/UI state in Zustand, server data caching in React Query

### Server-Side Pagination & Filtering

All data fetching uses server-side pagination with dynamic filters:

- **Filter State**: `useFilterState()` hook manages URL-based filters
- **API Response**: `{ data: { items: [] }, meta: { page, limit, total, totalPages, aggregations } }`
- **Query Pattern**: `useCompanies({ search, sort, page, limit, types, countries })`
- **Page Reset**: Automatically resets to page 1 when filters/search changes
- **Role-Based Endpoints**: SUPERADMIN sees all data, COMPANYADMIN only their company's data

### Internationalization (i18n)

- **Primary Language**: Spanish (Chile) - `es-CL` (fallback)
- **Secondary Language**: English (US) - `en-US`
- **Browser Detection**: Automatic language detection with localStorage persistence
- **Usage**: `useTranslation()` hook, `t('key.path')` syntax
- **Files**: Both `src/i18n/locales/en-US.json` and `es-CL.json` must be updated

## Development Commands

### Setup & Installation

```bash
# Install dependencies (must use pnpm)
pnpm install

# Set up environment variables
cp .env.example .env
# Configure: VITE_API_BASE_URL,

# Start development server (runs on http://localhost:3000)
pnpm run dev
```

### Development Workflow

```bash
# Development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### Testing

```bash
# Run unit tests (Vitest)
pnpm run test

# Run tests with UI
pnpm run test:ui

# Generate coverage report
pnpm run coverage

# Run E2E tests (Playwright)
pnpm run test:e2e

# Run E2E tests with UI
pnpm run test:e2e:ui
```

### Code Quality

```bash
# Run ESLint
pnpm run lint

# Fix ESLint issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format

# Check Prettier formatting
pnpm run format:check
```

### Adding shadcn/ui Components

```bash
# Add new UI component
pnpm dlx shadcn@latest add [component-name]

# Components auto-install to src/components/ui/
# Uses @ alias for imports (configured in components.json)
```

## Development Patterns

### Adding New Features

1. Create component in appropriate `src/components/` subfolder by domain
2. Add route to `App.tsx` - wrap with `<ProtectedRoute>` if auth required
3. Add `<RoleGuard roles={['ROLE']}>` if role-specific access needed
4. Create React Query hooks in `src/hooks/` for data fetching
5. Use `useAuthenticatedApi()` for API calls that need auth headers
6. Add translations to both `en-US.json` and `es-CL.json`
7. Write tests in `__tests__/` folder using custom render and mock stores
8. Update Zustand store if new domain state needed (follow `companiesStore.ts` pattern)

### Authenticated API Endpoints

1. Add URL pattern to `src/lib/config.ts` `Endpoints` object (use `{param}` for path params)
2. Create custom hook in `src/hooks/` using `useAuthenticatedApi()` and `useQuery()`
3. Handle role-based endpoint selection (SUPERADMIN vs COMPANYADMIN logic)
4. Build query params with URLSearchParams, only include non-empty values
5. Extract `meta` from response and update store pagination/aggregations

### Component Development Best Practices

- Use TypeScript interfaces for all props and data structures
- Follow shadcn/ui patterns for consistent styling
- Use `cn()` utility from `src/lib/utils.ts` for conditional className logic
- Include proper loading and error states for data-dependent components
- Add i18n support - use `t('key')` for all user-facing text
- Check `hasRole()` or use `<RoleGuard>` for protected content

## Critical Files

### Core Configuration

- `src/App.tsx` - Main routing, layout, auth initialization with `useAuthInit()`
- `src/lib/react-query.ts` - Query client configuration
- `src/lib/config.ts` - API URLs and environment config
- `components.json` - shadcn/ui configuration and path aliases
- `vite.config.ts` - Vite config with optimized chunk splitting

### Authentication & State

- `src/store/authStore.ts` - JWT auth with persistent Zustand store
- `src/hooks/useAuthInit.ts` - Token refresh timer (call in App.tsx)
- `src/hooks/useAuthenticatedApi.ts` - Axios client with auto auth headers
- `src/components/ProtectedRoute.tsx` - Auth guard wrapper
- `src/components/RoleGuard.tsx` - Role-based access control

### Data Management Examples

- `src/store/companiesStore.ts` - Zustand store with Immer middleware
- `src/hooks/useCompanies.ts` - React Query hook with pagination/filters
- `src/hooks/useFilterState.ts` - URL-based filter state management
- `src/components/company/Companies.tsx` - Complete pagination + filters + search

### Testing Setup

- `src/test/test-utils.tsx` - Custom render with QueryClient + Router wrapper
- `src/test/setup.ts` - Vitest configuration
- `playwright.config.ts` - Playwright E2E configuration

### Internationalization

- `src/i18n/index.ts` - i18next setup with browser detection
- `src/i18n/locales/es-CL.json` - Spanish (primary) translations
- `src/i18n/locales/en-US.json` - English translations

## Common Patterns

### Making Authenticated API Calls

```typescript
const authApi = useAuthenticatedApi();
const { data, isLoading } = useQuery({
  queryKey: ['myData', userId],
  queryFn: () => authApi.get(`/api/endpoint/${userId}`),
});
```

### Role-Based Access Control

```typescript
// In routes
<RoleGuard roles={['SUPERADMIN', 'ADMIN']}>
  <AdminPanel />
</RoleGuard>

// In components
const { hasAccess } = useRoleAccess(['ADMIN', 'SUPERADMIN']);
return hasAccess ? <DeleteButton /> : null;
```

### Server-Side Pagination with Filters

```typescript
const { filters } = useFilterState();
const { data, meta } = useCompanies({
  page: currentPage,
  limit: perPage,
  search: searchQuery,
  types: filters.types,
  countries: filters.countries,
});
```

## Development Notes

### Package Management

- **Required**: Use `pnpm` as package manager (not npm/yarn)
- Lockfile is `pnpm-lock.yaml`

### Environment Setup

- Development server runs on `http://localhost:3000` (fixed port)
- CORS configured for allowed hosts including andinolabs.com domains
- Environment variables prefixed with `VITE_` for client-side access

### Authentication Requirements

- All passwords must be AES encrypted before sending to API
- Access tokens refresh 15 minutes before expiry (not at expiry)
- Auth initialization must be called in App.tsx with `useAuthInit()`

### Styling Conventions

- Use Tailwind CSS with shadcn/ui components
- Use `cn()` utility for merging classes with conditional logic
- Path alias `@/` configured for clean imports

### Testing Strategy

- Unit tests in `__tests__/` folders with `.test.tsx` extension
- Mock Zustand stores in tests (see existing examples)
- Use custom `test-utils.tsx` for consistent test setup
- E2E tests with Playwright for user flow validation

### Current Development Status

- **Complete**: Dashboard, Companies (full CRUD with pagination/filters), Authentication flow
- **Partial**: Contractors module
- **In Development**: Users, Products, Subscriptions, Audit, Notifications modules show "En desarrollo" placeholders

## Common Pitfalls

1. **Forgot `useAuthInit()`** - Required in App.tsx for token refresh
2. **Wrong package manager** - Must use `pnpm`, not npm/yarn
3. **Missing translations** - Add to BOTH `es-CL.json` and `en-US.json`
4. **Page not resetting** - Reset to page 1 when filters/search changes
5. **Empty filter params** - Check values exist before including in query params
6. **Store mocking in tests** - Zustand stores need explicit mocking
7. **Plain text passwords** - Always encrypt with CryptoJS before API calls
8. **Path params format** - Use `{param}` in URLs, replace with `.replace('{param}', value)`
