# Unused Components

This document tracks components that are currently not used in the Angelis Admin Center codebase. These components may be candidates for removal if they're not planned for future features.

**Last Updated**: October 24, 2025  
**Total Unused Components**: 3 out of 68 components

---

## Unused Components

### 1. AccessLogs

- **Path**: `src/components/user/AccessLogs.tsx`
- **Type**: User module component
- **Status**: ❌ Not Used
- **Description**: Component for displaying access logs/audit trail
- **Exports**: Named export `AccessLogs` (React.FC component)
- **Interface**: `AccessLogsProps`
- **Notes**:
  - No imports found anywhere in the codebase
  - Could be used in a future "Access Logs" feature for user management
  - Consider removing if this feature is not planned

### 2. AccountConfiguration

- **Path**: `src/components/user/AccountConfiguration.tsx`
- **Type**: User module component
- **Status**: ❌ Not Used
- **Description**: Component for account configuration settings
- **Exports**: Named export `AccountConfiguration` (React.FC component)
- **Interface**: `AccountConfigurationProps`
- **Notes**:
  - No imports found anywhere in the codebase
  - Related component `UserSettingsCard` is also unused
  - Could be part of user account settings feature
  - Consider removing if not planned for user management enhancements

### 3. UserSettingsCard

- **Path**: `src/components/user/UserSettingsCard.tsx`
- **Type**: User module component
- **Status**: ❌ Not Used
- **Description**: Card component for displaying user settings
- **Exports**: Named export `UserSettingsCard` (React.FC component)
- **Interface**: `UserSettingsCardProps`
- **Notes**:
  - No imports found anywhere in the codebase
  - Appears to be a UI card component for settings display
  - Related to `AccountConfiguration` component
  - Consider removing if not planned for user settings UI

---

## Analysis Summary

### By Module

| Module       | Total Components | Unused | Usage Rate |
| ------------ | ---------------- | ------ | ---------- |
| User         | ~25              | 3      | 88%        |
| Company      | ~8               | 0      | 100%       |
| Contractor   | ~9               | 0      | 100%       |
| Project      | ~7               | 0      | 100%       |
| Subscription | ~6               | 0      | 100%       |
| Login        | 1                | 0      | 100%       |
| Core         | ~12              | 0      | 100%       |
| **Total**    | **68**           | **3**  | **95.6%**  |

### Usage Statistics

- ✅ **Used Components**: 65
- ❌ **Unused Components**: 3
- **Overall Coverage**: 95.6% of components are actively used

---

## Recommendations for Action

### High Priority

- Review the User module for feature completeness
- Determine if AccessLogs will be implemented for audit trails
- Decide on AccountConfiguration and UserSettingsCard future use

### Before Removal

1. ✅ Verify no test files depend on these components
2. ✅ Check if there are any commented-out imports
3. ✅ Review git history to see if they were recently removed from usage
4. ✅ Confirm with product team that these features won't be needed
5. ✅ Remove from codebase and run test suite to ensure no breakage

### For Future Prevention

- Implement ESLint rules to detect unused exports
- Add pre-commit hooks to warn about dead code
- Regular code audits (quarterly or bi-annually)
- Document planned but unimplemented features separately

---

## Related Files

### Test Files

- `src/components/user/__tests__/` - Check for any test files related to unused components

### Hook Files

- `src/hooks/useUserMutations.ts` - Verify no mutations related to unused components

### Store Files

- `src/store/` - Check if any store actions reference unused components

---

## Component Dependency Analysis

### AccessLogs

**Depends on**: (UI components not listed)
**Depended by**: None

### AccountConfiguration

**Depends on**: (UI components not listed)
**Depended by**: None

### UserSettingsCard

**Depends on**: (UI components not listed)
**Depended by**: None

---

## Notes

- Analysis conducted on all `.tsx` files in `src/components/` excluding `ui/` and `__tests__/` directories
- Search excluded test files (`__tests__/`, `.test.tsx`, `.spec.tsx`)
- All 3 components are located in the User module
- No breaking changes expected if these components are removed
- Consider creating a separate "Planned Features" document if needed

---

## Version History

| Date       | Author   | Status  | Notes                          |
| ---------- | -------- | ------- | ------------------------------ |
| 2025-10-24 | Analysis | Initial | 3 unused components identified |
