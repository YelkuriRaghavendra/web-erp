# Angelis Admin Center - AI Coding Assistant Instructions

## Project Overview

Modern React admin dashboard (React 19, TypeScript, Vite) for the Angelis SaaS platform. Provides JWT authentication, role-based access control, server-side pagination/filtering, multi-step wizards, and i18n support.

**Critical**: Always use `pnpm` (not npm/yarn). Initialize auth with `useAuthInit()` in `App.tsx`.

## Architecture & Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (auth/UI) + TanStack React Query (server data)
- **Routing**: React Router DOM v7 with `<ProtectedRoute>` wrapper
- **Authentication**: JWT with automatic refresh (15min before expiry)
- **Internationalization**: react-i18next (Spanish primary, English secondary)
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Package Manager**: pnpm (required)

## Core Patterns

### Component Architecture

Single-page app with persistent `Sidebar`, protected routes, and domain-based component organization:

- **Routes**: Wrap in `<ProtectedRoute>` for auth, wrap UI in `<RoleGuard roles={['ROLE']}>` for access control
- **Component Organization**: By domain in `src/components/` (company/, contractors/, user/, project/)
- **UI Components**: shadcn/ui from `src/components/ui/` with `cn()` utility for conditional styling
- **Styling Pattern**: Use `cn(baseClass, condition && 'extra-class')` for Tailwind merging

### Multi-Step Wizard Pattern (Company Create/Edit)

**Critical**: Multi-step forms use state preservation across steps. See `COMPANY_WIZARD_README.md` for full details.

- **Main Container**: `CompanyCreateNew.tsx` / `CompanyEdit.tsx` manage wizard state and step navigation
- **Step Components**: Located in `src/components/company/wizard/` (CompanyInfoStep.tsx, CompanyContactsStep.tsx)
- **Validation**: React Hook Form + Zod per-step validation, forms submitted via `onComplete` callbacks
- **State Management**: Wizard state in component `useState`, file uploads tracked separately (`logoFile`, `logoPreviewUrl`)
- **Form Data Types**: `CompanyFormData` and `ContactFormData` defined in `useCompanyMutations.ts`
- **Step Flow**: Step 1 validates company info → Step 2 collects contacts → Final submission calls mutation
- **Edit Mode**: Both create and edit use identical step components with `isEditMode` prop for button text differences
- **Confirmation**: Edit mode shows confirmation dialog before final submission (`ConfirmationDialog` component)

### Authentication & Authorization

**Critical**: Must call `useAuthInit()` in `App.tsx` for automatic token refresh (15 min before expiry).

- **Auth Store**: `src/store/authStore.ts` - Zustand with localStorage persistence
- **Key Methods**: `login(email, password)`, `logout()`, `hasRole('SUPERADMIN')`, `getAccessToken()`
- **Password Encryption**: AES-encrypt before sending (CryptoJS with `VITE_ANGELIS_AES_KEY`)
- **API Calls**: Use `useAuthenticatedApi()` hook for auto auth headers
- **Protected Routes**: Wrap with `<ProtectedRoute>` component
- **Role-Based UI**: Use `<RoleGuard roles={['ROLE']}>` or `hasRole()` from store
- **Roles**: SUPERADMIN, COMPANYADMIN, ADMIN, MANAGER, EDITOR, USER, MODERATOR

### Data Management

- **Server State**: TanStack React Query with custom hooks in `src/hooks/`
- **Query Config**: `src/lib/react-query.ts` - 5min stale time, 1 retry, no refetch on window focus
- **Client State**: Zustand stores (`authStore`, `companiesStore`, `contractorsStore`) with Immer middleware
- **Store Pattern**: Use `produce(state => { /* mutations */ })` in store actions
- **API Client**: `useAuthenticatedApi()` hook provides axios with auto-injected auth headers
- **URLs**: Define in `src/lib/config.ts` using `{param}` format (replaced with `.replace('{param}', value)`)

### Pagination & Filtering

**Server-side** pagination with dynamic filters (see `PAGINATION_FILTER_IMPLEMENTATION.md`):

- **URL-Based State**: `useFilterState()` hook stores filters in query params
- **API Response**: `{ data: { companies: [] }, meta: { page, limit, total, totalPages, aggregations } }`
- **Filter Aggregations**: Backend returns available filter options in `meta.aggregations`
- **Page Reset**: Automatically resets to page 1 when filters/search change
- **Empty Filters**: Never include empty arrays in URL - only add non-empty values
- **Example Hook**: `useCompanies({ search, sort, page, limit, types, countries })`

### Internationalization

- **Primary Language**: Spanish (Chile) - `es-CL` (fallback)
- **Secondary**: English (US) - `en-US`
- **Usage**: Import `useTranslation` hook, use `t('key.path')` syntax
- **Files**: Add translations to both `src/i18n/locales/en-US.json` and `es-CL.json`
- **Browser Detection**: Automatic language detection with localStorage persistence (`i18nextLng` key)
- **Config**: `src/i18n/index.ts` uses i18next-browser-languagedetector

### Testing Strategy

- **Framework**: Vitest with jsdom environment
- **Test Location**: Components in `__tests__/` folders, use `.test.tsx` extension
- **Test Utils**: Custom render in `src/test/test-utils.tsx` provides QueryClient + Router wrapper
- **Store Mocking**: Mock Zustand stores in tests (see `FilterPopover.test.tsx` for example)
- **Coverage**: Run `pnpm run coverage` for coverage reports
- **UI Testing**: Available via `pnpm run test:ui`
- **Key Pattern**: Use `createMockQueryClient()` from test-utils for isolated query clients

## Development Workflows

### Initial Setup

```bash
# Install dependencies (must use pnpm)
pnpm install

# Set up environment variables
# Create .env with: VITE_SERHAFEN_BFF_DOMAIN_URL, VITE_ANGELIS_AES_KEY

# Start development server
pnpm run dev

# Run tests in watch mode
pnpm run test
```

### Adding New Features

1. Create component in appropriate `src/components/` subfolder by domain
2. Add route to `App.tsx` - wrap with `<ProtectedRoute>` if auth required
3. Add `<RoleGuard roles={['ROLE']}>` if role-specific
4. Create React Query hooks in `src/hooks/` for data fetching (follow `useCompanies.ts` pattern)
5. Use `useAuthenticatedApi()` for API calls that need auth headers
6. Add translations to both `en-US.json` and `es-CL.json` locale files
7. Write tests in `__tests__/` folder using custom render and mock stores
8. Update Zustand store if new domain state needed (follow `companiesStore.ts` pattern with Immer)

## Coding Guidelines

This project enforces strict code quality using ESLint and Prettier. All code must pass linting.

**Key Rules**: React hooks best practices, Fast Refresh compatibility, Prettier formatting (80 char width, 2 spaces, trailing commas, single quotes, LF line endings)

**Commands**:

- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues
- `pnpm run format` - Format with Prettier

**JSX Guidelines**: Keep JSX clean; no unwanted comments. Only add docs when necessary for clarity.

**Documentation Guidelines**: Do not create any Markdown (.md) documents without explicit user request.

### Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add [component-name]
```

Components auto-install to `src/components/ui/` with `@/` aliases. All use `cn()` for className merging.

### Package Management

**Required**: Use `pnpm` (not npm/yarn)

**Key Scripts**:

- `pnpm run dev` - Development server
- `pnpm run build` - TypeScript + production build
- `pnpm run test` - Tests in watch mode
- `pnpm run test:ui` - Vitest UI
- `pnpm run coverage` - Coverage reports

## Key Files Reference

**Core Setup**: `src/App.tsx` (routing, `useAuthInit()`), `src/lib/react-query.ts` (query client), `src/lib/config.ts` (API URLs with `{param}` format)

**Auth**: `src/store/authStore.ts` (JWT + password AES encryption), `src/hooks/useAuthInit.ts`, `src/hooks/useAuthenticatedApi.ts`, `src/components/ProtectedRoute.tsx`, `src/components/RoleGuard.tsx`

**Data**: `src/store/companiesStore.ts` (Zustand + Immer), `src/hooks/useCompanies.ts` (React Query + pagination), `src/hooks/useCompanyMutations.ts` (CRUD), `src/hooks/useFilterState.ts`

**Testing**: `src/test/test-utils.tsx` (custom render with QueryClient), `src/__tests__/App.test.tsx` (routing examples)

**i18n**: `src/i18n/index.ts`, `src/i18n/locales/{es-CL,en-US}.json` (primary Spanish, secondary English)

## Common Patterns

### Making Authenticated API Calls

```typescript
const authApi = useAuthenticatedApi();
const { data, isLoading } = useQuery({
  queryKey: ['myData', userId],
  queryFn: () =>
    authApi.get(`/api/endpoint/{userId}`.replace('{userId}', userId)),
});
```

### Multi-Step Wizard Implementation

```typescript
const [currentStep, setCurrentStep] = useState<1 | 2>(1);
const [wizardData, setWizardData] = useState<WizardData>({});
const [logoFile, setLogoFile] = useState<File | null>(null);

const handleStepOneComplete = (data: CompanyFormData) => {
  if (data.logo) {
    setLogoFile(data.logo);
    setLogoPreviewUrl(URL.createObjectURL(data.logo));
  }
  setWizardData(prev => ({ ...prev, companyInfo: data }));
  setCurrentStep(2);
};
```

### Role-Based Routing & Access

```typescript
// In routes
<Route path='/admin' element={<RoleGuard roles={['SUPERADMIN', 'ADMIN']}><Admin /></RoleGuard>} />

// In components
const { hasAccess } = useRoleAccess(['ADMIN']);
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

## Critical Gotchas & Conventions

1. **Missing `useAuthInit()`** in App.tsx → no automatic token refresh
2. **Using raw axios** instead of `useAuthenticatedApi()` → missing auth headers
3. **Incomplete i18n** → forget to update BOTH es-CL.json AND en-US.json
4. **Not resetting pagination** → empty results when changing filters on page 3
5. **Empty filter params in URL** → avoid `?types=` (check values exist first)
6. **Zustand store mocking in tests** → stores need explicit mocking, not auto-provided
7. **Wrong package manager** → using npm/yarn with pnpm-lock.yaml causes conflicts
8. **Path param format** → API URLs use `{param}` format, must `.replace('{param}', value)`
9. **File persistence in wizards** → File objects must be stored separately from form data
10. **Wizard step flow** → Each `onComplete` must update parent state AND advance to next step

## Current State & Context

- **Functional Features**: Dashboard, Companies (full CRUD with pagination/filters), Contractors (partial)
- **Auth Flow**: Complete JWT auth with login, refresh, role-based access
- **In Development**: Other modules show "En desarrollo" placeholders
- **API Integration**: Companies module fully integrated with BFF API, server-side pagination
- **Testing Coverage**: Partial coverage, focus on critical components (auth, filters, role guards)

## Architecture Decisions

### Why Zustand + React Query?

- **Zustand**: Lightweight, persistent auth state without provider hell
- **React Query**: Server state caching, automatic refetching, mutation management
- **Separation**: Auth/UI state in Zustand, server data in React Query

### Why Server-Side Pagination?

- Scalability for large datasets
- Filter aggregations provided by backend (dynamic options)
- Consistent with backend capabilities

### Why Path Aliases?

- Cleaner imports: `@/components` vs `../../../components`
- Easier refactoring when moving files
- Configured in `tsconfig.json`, `vite.config.ts`, and `components.json`

## MCP Tools Integration

This project integrates Model Context Protocol (MCP) tools to enhance development workflows. Use these tools when working with external resources and automation.

### Figma Integration

Use Figma MCP tools for UI/UX design implementation:

- **Code Generation**: Use `mcp_figma_get_code` to extract React/TypeScript code from Figma designs. Provide the file key and node ID to generate component code that matches the design system.
- **Design Metadata**: Use `mcp_figma_get_metadata` to understand the structure and hierarchy of Figma frames and components before implementation.
- **Screenshots**: Use `mcp_figma_get_screenshot` to capture visual references for design reviews or documentation.
- **Design System Rules**: Use `mcp_figma_create_design_system_rules` to generate consistent design tokens and rules from Figma files.

**Usage Pattern**:

```typescript
// Extract node ID from Figma URL: https://figma.com/design/:fileKey/:fileName?node-id=1-2
// Use fileKey and nodeId="1:2" in the tool
```

### Context7 Library Documentation

Use Context7 MCP tools for accessing up-to-date library documentation:

- **Library Resolution**: Always use `mcp_upstash_conte_resolve-library-id` first to get the correct Context7-compatible library ID before fetching documentation.
- **Documentation Fetch**: Use `mcp_upstash_conte_get-library-docs` to retrieve current documentation, examples, and usage patterns for libraries.

**When to Use**:

- Researching new libraries or frameworks
- Getting up-to-date API documentation
- Finding code examples for complex integrations
- Understanding library-specific patterns and best practices

**Usage Pattern**:

```typescript
// First resolve the library ID
const libraryId = await resolveLibraryId('react-query'); // Returns '/tanstack/react-query'

// Then fetch documentation
const docs = await getLibraryDocs(libraryId, { topic: 'mutations' });
```

### Playwright Browser Automation

Use Playwright MCP tools for web automation, testing, and data extraction. The application runs on `http://localhost:3000` during development.

- **Navigation & Interaction**: Use `mcp_microsoft_pla_browser_navigate`, `mcp_microsoft_pla_browser_click`, `mcp_microsoft_pla_browser_type` for automated browsing and form filling.
- **Screenshots & Snapshots**: Use `mcp_microsoft_pla_browser_take_screenshot` or `mcp_microsoft_pla_browser_snapshot` for visual testing and documentation.
- **Network Monitoring**: Use `mcp_microsoft_pla_browser_network_requests` to analyze API calls and performance.
- **Accessibility Testing**: Use `mcp_microsoft_pla_browser_snapshot` for accessibility audits.

**When to Use**:

- Automated testing of user flows
- Data scraping from external sources
- Visual regression testing
- API endpoint testing and documentation
- Accessibility compliance checks
- **UI Issue Investigation**: When reporting UI issues or modification requests, use Playwright to inspect the current state at `http://localhost:3000` to capture screenshots, element snapshots, or analyze the DOM structure

**Usage Pattern**:

```typescript
// Navigate to the running application
await navigate('http://localhost:3000');
// user name:admin@angelis.com
// password: adminPass
// Server runs most of the time, check it before requesting new server start
// Interact with the app as needed

// Inspect UI elements for issue reporting
await snapshot(); // Get accessibility snapshot of current page
await takeScreenshot({
  element: 'Problematic Component',
  ref: '.component-selector',
});

// Interact with elements
await click({ element: 'Login Button', ref: 'button#login' });
await type({
  element: 'Username Field',
  ref: 'input#username',
  text: 'user@example.com',
});

// Capture results
const screenshot = await takeScreenshot();
```

## Current State & Context

- **Functional Features**: Dashboard, Companies (full CRUD with pagination/filters), Contractors (partial)
- **Auth Flow**: Complete JWT auth with login, refresh, role-based access
- **In Development**: Other modules show "En desarrollo" placeholders
- **API Integration**: Companies module fully integrated with BFF API, server-side pagination
- **Testing Coverage**: Partial coverage, focus on critical components (auth, filters, role guards)

## Architecture Decisions

### Why Zustand + React Query?

- **Zustand**: Lightweight, persistent auth state without provider hell
- **React Query**: Server state caching, automatic refetching, mutation management
- **Separation**: Auth/UI state in Zustand, server data in React Query

### Why Server-Side Pagination?

- Scalability for large datasets
- Filter aggregations provided by backend (dynamic options)
- Consistent with backend capabilities

### Why Path Aliases?

- Cleaner imports: `@/components` vs `../../../components`
- Easier refactoring when moving files
- Configured in `tsconfig.json`, `vite.config.ts`, and `components.json`
