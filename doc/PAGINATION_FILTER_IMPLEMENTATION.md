# Pagination and Filter Implementation for Companies

## Overview

This document describes the implementation of server-side pagination and filtering for the companies feature in the Angelis Admin Center.

## Changes Summary

### 1. Updated `companiesStore.ts`

**New Types:**

- `MetaData`: Interface for API response metadata containing pagination and aggregation data
- `FilterAggregations`: Interface for filter options (types, countries, parentCompanies)

**New State:**

- `filterAggregations`: Stores available filter options from API
- `setPaginationFromMeta()`: Updates pagination from API meta response
- `setFilterAggregations()`: Updates filter aggregations from API

**API Response Structure:**

```typescript
{
  data: {
    companies: TCompany[]
  },
  meta: {
    page: 1,
    limit: 10,
    total: 19,
    totalPages: 2,
    aggregations: {
      types: ['CONTRACTOR', 'SUBSIDIARY', 'HOLDING'],
      countries: ['Peru', 'India', 'Suriname', 'Chile'],
      parentCompanies: [
        { id: 1, name: 'Angelis' },
        { id: 2, name: 'angelis' }
      ],
      sortBy: 'company_name',
      orderBy: 'asc'
    }
  }
}
```

### 2. Updated `useFilterState.ts` Hook

**Changes:**

- Changed filter keys from `companyType` to `type` (matches API)
- Made filter properties optional in `FilterState`
- Only includes filters with values in URL params
- Resets to page 1 when filters change

**Filter State Structure:**

```typescript
{
  type?: string[],        // Optional: ['HOLDING', 'SUBSIDIARY']
  parentCompany?: string[], // Optional: ['1', '2']
  country?: string[]       // Optional: ['Chile', 'Peru']
}
```

### 3. Updated `useCompanies.ts` Hook

**New Options:**

```typescript
{
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  type?: string[];
  parentCompany?: string[];
  country?: string[];
}
```

**Query Parameters:**
The hook now builds URL query parameters based on options:

- `page=1&limit=10` - Pagination
- `search=angelis` - Search term
- `sortBy=company_name&orderBy=asc` - Sorting
- `type=HOLDING,SUBSIDIARY` - Filter by types (only if values exist)
- `country=Chile,Peru` - Filter by countries (only if values exist)
- `parentCompany=1,2` - Filter by parent companies (only if values exist)

**Return Value:**

```typescript
{
  data: TCompany[],        // Companies array
  meta: MetaData,          // Pagination and aggregation metadata
  isLoading: boolean,
  error: Error,
  refetch: () => void,
  updateCompany: () => void,
  deleteCompany: () => void,
  resetPagination: () => void
}
```

### 4. Updated `Companies.tsx` Component

**Changes:**

- Integrated `useFilterState` hook for filter management
- Uses `filterAggregations` from store for filter options
- Passes pagination params (`page`, `limit`) to `useCompanies`
- Passes filter params (`type`, `parentCompany`, `country`) to `useCompanies`
- Uses `meta` from API for pagination totals (not client-side calculation)
- Resets to page 1 when search changes

**Filter Options:**
Filter options are now sourced from API aggregations:

```typescript
{
  parentCompanyOptions: filterAggregations.parentCompanies.map(...),
  countryOptions: filterAggregations.countries.map(...),
  typeOptions: filterAggregations.types.map(...)
}
```

### 5. Updated `FilterPopover.tsx` Component

**Changes:**

- Removed `useEffect` that caused infinite loop
- Uses `filterAggregations` from store for company types
- Changed filter key from `companyType` to `type`
- Handles optional filter arrays safely
- Only renders filter sections if options are available

**Filter Sections:**

- **Tipo de compañía**: Populated from `filterAggregations.types`
- **Compañía padre**: Populated from `filterAggregations.parentCompanies`
- **País**: Populated from `filterAggregations.countries`

### 6. Updated Tests

**`FilterPopover.test.tsx`:**

- Added mock for `useCompaniesStore` with sample filter aggregations
- Removed test for "Ubicación" (location) filter
- Updated expectations to match new filter structure

## URL Structure

The URL now contains all state for pagination and filtering:

```
/companies?page=2&limit=10&type=HOLDING,SUBSIDIARY&country=Chile&sort=nombre-asc
```

**Parameters:**

- `page`: Current page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Comma-separated company types (optional)
- `parentCompany`: Comma-separated parent company IDs (optional)
- `country`: Comma-separated country names (optional)
- `sort`: Sort field and direction (optional, e.g., `nombre-asc`)

## Data Flow

1. **Component Mount:**
   - `Companies` component reads URL params
   - Calls `useCompanies` hook with page, limit, and filters
   - Hook fetches data from API with query params

2. **API Response:**
   - Returns companies array + meta object
   - `useCompanies` syncs data to Zustand store
   - Updates `filterAggregations` if available

3. **Filter Change:**
   - User selects filters in `FilterPopover`
   - Calls `updateFilters()` from `useFilterState`
   - Updates URL params and resets to page 1
   - Triggers re-fetch with new filters

4. **Page Change:**
   - User clicks pagination button
   - Updates `page` URL param
   - Triggers re-fetch with new page

## Key Benefits

1. **Server-Side Processing:** All filtering, sorting, and pagination handled by API
2. **URL State:** Full state preserved in URL (shareable, bookmark-able)
3. **Performance:** Only fetches needed page of data
4. **Dynamic Filters:** Filter options come from API aggregations
5. **Clean Separation:** React Query for server state, Zustand for client state

## Testing

All tests pass successfully:

- ✓ FilterPopover tests (4)
- ✓ CompanyList tests (2)
- ✓ All other existing tests (27)

**Total:** 33 tests passing

## Future Enhancements

1. Add loading states for filter changes
2. Implement filter count badges
3. Add "clear all" functionality
4. Persist filter preferences
5. Add more filter types (date ranges, status, etc.)
