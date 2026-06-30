import { api } from '@/lib/api';

export interface OAuthAuthorizePreview {
  clientId: string;
  clientName: string;
  redirectUri: string;
  scopes: string[];
  state?: string | null;
}

export interface OAuthAuthorizeConfirmInput {
  responseType: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string | null;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export const oauthService = {
  previewAuthorize(params: URLSearchParams): Promise<OAuthAuthorizePreview> {
    return api.get<OAuthAuthorizePreview>(`/api/oauth/authorize/preview?${params.toString()}`);
  },

  confirmAuthorize(input: OAuthAuthorizeConfirmInput): Promise<{ redirectUrl: string }> {
    return api.post<{ redirectUrl: string }>('/api/oauth/authorize/confirm', input);
  },
};
