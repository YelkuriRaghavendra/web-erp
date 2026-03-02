# Testing Setup

This project uses **Vitest** for unit testing React components and hooks.

## Test Configuration

- **Testing Framework**: Vitest v2.1.8
- **Testing Library**: @testing-library/react v16.0.1 (React 19 compatible)
- **Environment**: jsdom
- **Test Setup**: Configured with global test functions and jest-dom matchers

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

## Test Structure

Tests are organized as follows:

- Component tests: `src/components/**/__tests__/*.test.tsx`
- Hook tests: `src/hooks/**/__tests__/*.test.tsx`
- Test utilities: `src/test/test-utils.tsx`

## Available Test Files

### Component Tests

1. **Dashboard.test.tsx** - Tests the main Dashboard component
   - Loading state rendering
   - Error state handling
   - Data rendering
   - No data fallback

2. **DashboardContainer.test.tsx** - Tests the DashboardContainer component
   - Data display with stats and recent activity
   - Loading skeleton
   - Error handling
   - No data state

3. **StatsGrid.test.tsx** - Tests the StatsGrid component
   - Stat card rendering
   - i18n key translation
   - Change percentage display
   - Trend badges (Growing/Declining)
   - Progress bar rendering
   - Empty state handling

### Hook Tests

1. **useDashboard.test.tsx** - Tests dashboard-related hooks
   - `useDashboardData` hook for fetching data
   - `useUpdateStats` hook for mutations
   - Query key generation
   - Error handling for both hooks

## Test Utilities

The `test-utils.tsx` file provides:

- Custom render function with React Query and Router providers
- Mock dashboard data for consistent testing
- Query client factory for isolated test environments

## Mocking Strategy

- **API calls**: Mocked using Vitest's `vi.fn()`
- **i18n**: Mocked to return translation keys directly
- **Hooks**: Custom hooks are mocked at the module level
- **Icons**: Lucide React icons are imported normally

## Key Testing Patterns

1. **Provider Wrapping**: All components are rendered with necessary providers (React Query, Router)
2. **Mock Data**: Consistent mock data structure matches the application's type definitions
3. **Async Testing**: Uses `waitFor` for async operations like API calls
4. **Error Boundaries**: Tests both success and error states
5. **User Interactions**: Tests user interactions where applicable

## Notes

- Tests may show i18n warnings in console - this is expected with the current mock setup
- All tests are designed to be isolated and can run independently
- Mock data includes realistic dashboard statistics and activity data
