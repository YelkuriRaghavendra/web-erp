import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { Endpoints } from '@/lib/config';
import type { MawbListResponse, MawbQueryParams } from '@/types/mawb';
import { DEFAULT_PAGEINATION } from '@/lib/constants';

export function useMawbs(params: MawbQueryParams = {}) {
  const authApi = useAuthenticatedApi();
  const {
    page = DEFAULT_PAGEINATION.Page,
    pageSize = DEFAULT_PAGEINATION.PageSize,
    mawbNumber = '',
    status = '',
  } = params;

  const queryKey = ['mawbs', page, pageSize, mawbNumber, status];

  const queryFn = async (): Promise<MawbListResponse> => {
    const queryParams = new URLSearchParams();

    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());

    if (mawbNumber.trim()) {
      queryParams.append('mawbNumber', mawbNumber.trim());
    }

    if (status.trim()) {
      queryParams.append('status', status.trim());
    }

    const url = `${Endpoints.listMawbs}?${queryParams.toString()}`;
    const response = await authApi.get<MawbListResponse>(url);

    return response;
  };

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
