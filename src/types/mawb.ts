export interface Mawb {
  mawbId: string;
  mawbNumber: string;
  manifestNumber?: string;
  destinationCountryCode: string;
  clientId: string;
  clientCode: string;
  customsType: string;
  customsClearanceMode: string;
  totalPackagesDeclared: number;
  totalWeight: string;
  totalWeightUOM: string;
  totalValue: string;
  totalValueCurrency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MawbListResponse {
  data: Mawb[];
  meta: {
    page: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MawbQueryParams {
  page?: number;
  pageSize?: number;
  mawbNumber?: string;
  status?: string;
}

export const MAWB_STATUS_MAP = {
  ALL: {
    label: 'All Statuses',
    variant: 'default',
  },
  DRAFT: {
    label: 'Draft',
    variant: 'default',
  },
  CREATED: {
    label: 'Created',
    variant: 'info',
  },
  PENDING_AGENT_VALIDATION: {
    label: 'Pending Agent Validation',
    variant: 'pending',
  },
  FILE_GENERATION_INITIATED: {
    label: 'File Generation Initiated',
    variant: 'info',
  },
  READY_FOR_CUSTOM_DECLARATION: {
    label: 'Ready For Customs Declaration',
    variant: 'success',
  },
  CUSTOM_DECLARATION_REJECTED: {
    label: 'Customs Declaration Rejected',
    variant: 'destructive',
  },
  CUSTOM_DECLARATION_ACCEPTED: {
    label: 'Customs Declaration Accepted',
    variant: 'success',
  },
} as const;
