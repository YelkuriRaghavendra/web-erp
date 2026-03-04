const rawBase = import.meta.env.VITE_API_BASE_URL as string | '';
const keyCloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | '';
const aesKey = import.meta.env.VITE_AES_ENCRYPTION_KEY as string | '';
const redirectUrl = import.meta.env.VITE_REDIRECT_URI as string | '';
const relam = import.meta.env.VITE_KEYCLOAK_REALM;
const customsDeclerationService = import.meta.env
  .VITE_CUSTOM_DECLARATION_SERVICE as string | '';
const iamService = import.meta.env.VITE_IAM_SERVICE as string | '';

export const API_BASE: string = rawBase;
export const AES_ENCRYPTION_KEY = aesKey;
export const Endpoints = {
  login: `${iamService}/v0/auth/login`,
  refreshToken: `${iamService}/v0/auth/refresh`,
  googleExchange: `${iamService}/v0/auth/google/exchange`,
  listMawbs: `${customsDeclerationService}/v0/mawbs`,
};

export const AUTH_ENDPOINTS = [
  Endpoints.login,
  Endpoints.refreshToken,
  Endpoints.googleExchange,
];

export const keyCloakConfig = {
  clientId: keyCloakClientId,
  // keycloakBaseUrl:keycloakBaseUrl,
  redirectUrl: redirectUrl,
  relam: relam,
};

export function getApiBase(): string {
  return API_BASE;
}

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export const buildGoogleLoginUrl = () => {
  const baseUrl = `${rawBase}/realms/${keyCloakConfig.relam}/protocol/openid-connect/auth`;
  const params = new URLSearchParams({
    client_id: keyCloakConfig.clientId,
    response_type: 'code',
    redirect_uri: keyCloakConfig.redirectUrl,
    scope: 'openid email profile',
    kc_idp_hint: 'google',
  });
  return `${baseUrl}?${params.toString()}`;
};

export const countryLabels: Record<string, string> = {
  CL: 'Chile',
  AG: 'Argentina',
  PE: 'Peru',
};

export const BusinessUnits: string = 'SERHAFEN';
