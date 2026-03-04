export const DEFAULT_PAGEINATION = {
  Page: 1,
  PageSize: 10,
};

export const Roles = {
  EXECUTOR: 'EXECUTOR',
  BROKER: 'BROKER',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ALLOWED_ROLES = ['EXECUTOR', 'BROKER', 'ADMIN'] as const;
