export interface AuthTokenProvider {
  getToken(): string | null;
}
