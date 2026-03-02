import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// User Types - Mapped from API profile response
export interface User {
  id: string; // profile_id
  firstName?: string; // derived from name
  lastName?: string; // derived from name
  fullName: string; // name
  rut: string; // national_id
  role: string; // type (WORKER, etc)
  jobTitle: string | null; // position_title
  company: { id: string; name: string } | null; // company_name
  project: { id: string; name: string } | null; // project_name
  lastAccessAt: string | null; // last_login
  status: 'ACTIVE' | 'INACTIVE'; // status
  licenses?: number | null; // licenses
  specialization?: string; // specialization
  gender?: string; // gender
  country?: string; // country
  language?: string; // language
}

// API Response Types
export interface ApiUsersResponse {
  data: {
    profiles: ApiProfile[];
    count: number;
  };
  error_code: string | null;
  message: string;
  success: boolean;
}

// Raw API profile response
export interface ApiProfile {
  profile_id: number;
  name: string;
  national_id: string;
  type: string;
  position_title: string | null;
  company_name: string;
  company_id: string | null;
  project_name: string;
  contract_id: string | null;
  last_login: string | null;
  licenses: number | null;
  status: string | null;
  specialization: string;
  gender: string;
  country: string;
  language: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  hire_date: string | null;
  date_of_birth: string | null;
  contact_email: string | null;
  contact_mobile: string | null;
  contact_whatsapp: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export interface MetaData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  aggregations?: {
    roles: Array<{ key: string; doc_count: number }>;
    companies: Array<{ key: string; doc_count: number }>;
    projects: Array<{ key: string; doc_count: number }>;
  };
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface FilterAggregation {
  key: string;
  doc_count: number;
}

export interface FilterAggregations {
  roles: FilterAggregation[];
  companies: FilterAggregation[];
  projects: FilterAggregation[];
}

export interface UsersState {
  users: User[];
  pagination: PaginationState;
  filterAggregations: FilterAggregations;
  isLoading: boolean;
  error: string | null;
  selectedUserIds: string[];

  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setPaginationFromMeta: (meta: MetaData) => void;
  setFilterAggregations: (aggregations: FilterAggregations) => void;

  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  deleteUsers: (ids: string[]) => void;
  getUserById: (id: string) => User | undefined;

  resetPagination: () => void;

  // Selection actions
  selectUser: (id: string) => void;
  deselectUser: (id: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;
  toggleUserSelection: (id: string) => void;
}

const calculateTotalPages = (total: number, perPage: number): number => {
  return Math.ceil(total / perPage);
};

export const useUsersStore = create<UsersState>()(
  immer((set, get) => ({
    users: [],
    pagination: {
      page: 1,
      perPage: 10,
      total: 0,
      totalPages: 0,
    },
    filterAggregations: {
      roles: [],
      companies: [],
      projects: [],
    },
    isLoading: false,
    error: null,
    selectedUserIds: [],

    // Pagination actions
    setPage: (page: number) => {
      set(state => {
        state.pagination.page = Math.max(
          1,
          Math.min(page, state.pagination.totalPages)
        );
      });
    },

    setPerPage: (perPage: number) => {
      set(state => {
        state.pagination.perPage = Math.max(1, perPage);
        state.pagination.totalPages = calculateTotalPages(
          state.pagination.total,
          perPage
        );
        if (state.pagination.page > state.pagination.totalPages) {
          state.pagination.page = 1;
        }
      });
    },

    setPaginationFromMeta: (meta: MetaData) => {
      set(state => {
        state.pagination.page = meta.page;
        state.pagination.perPage = meta.limit;
        state.pagination.total = meta.total;
        state.pagination.totalPages = meta.totalPages;
      });
    },

    setFilterAggregations: (aggregations: FilterAggregations) => {
      set(state => {
        state.filterAggregations = aggregations;
      });
    },

    updateUser: (id, updates) => {
      set(state => {
        const index = state.users.findIndex(user => user.id === id);
        if (index !== -1) {
          Object.assign(state.users[index], updates);
        }
      });
    },

    deleteUser: id => {
      set(state => {
        state.users = state.users.filter(user => user.id !== id);
        state.selectedUserIds = state.selectedUserIds.filter(
          userId => userId !== id
        );
        state.pagination.total = state.users.length;
        state.pagination.totalPages = calculateTotalPages(
          state.pagination.total,
          state.pagination.perPage
        );
        if (
          state.pagination.page > state.pagination.totalPages &&
          state.pagination.totalPages > 0
        ) {
          state.pagination.page = state.pagination.totalPages;
        }
      });
    },

    deleteUsers: ids => {
      set(state => {
        state.users = state.users.filter(user => !ids.includes(user.id));
        state.selectedUserIds = [];
        state.pagination.total = state.users.length;
        state.pagination.totalPages = calculateTotalPages(
          state.pagination.total,
          state.pagination.perPage
        );
        if (
          state.pagination.page > state.pagination.totalPages &&
          state.pagination.totalPages > 0
        ) {
          state.pagination.page = state.pagination.totalPages;
        }
      });
    },

    getUserById: id => {
      return get().users.find(user => user.id === id);
    },

    resetPagination: () => {
      set(state => {
        state.pagination.page = 1;
      });
    },

    // Selection actions
    selectUser: id => {
      set(state => {
        if (!state.selectedUserIds.includes(id)) {
          state.selectedUserIds.push(id);
        }
      });
    },

    deselectUser: id => {
      set(state => {
        state.selectedUserIds = state.selectedUserIds.filter(
          userId => userId !== id
        );
      });
    },

    selectAllUsers: () => {
      set(state => {
        state.selectedUserIds = state.users.map(user => user.id);
      });
    },

    clearSelection: () => {
      set(state => {
        state.selectedUserIds = [];
      });
    },

    toggleUserSelection: id => {
      set(state => {
        if (state.selectedUserIds.includes(id)) {
          state.selectedUserIds = state.selectedUserIds.filter(
            userId => userId !== id
          );
        } else {
          state.selectedUserIds.push(id);
        }
      });
    },
  }))
);
