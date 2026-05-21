declare namespace google.accounts.oauth2 {
  interface TokenClient {
    callback: (response: TokenResponse) => void;
    requestAccessToken: () => void;
  }

  interface TokenResponse {
    access_token: string;
    error?: string;
    error_description?: string;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
}

interface Window {
  google?: {
    accounts: {
      oauth2: typeof google.accounts.oauth2;
    };
  };
}
