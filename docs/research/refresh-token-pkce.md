# Refresh Tokens with PKCE

## RS-03 Outcome

Decision: Droplet uses Dropbox authorization-code with PKCE and no client secret. Offline access is opt-in and adds a refresh token request with a bounded lifetime.

Verified request-shape rules implemented in the current auth layer:

- Authorization-code exchange sends `grant_type=authorization_code`, `code`, `code_verifier`, and `client_id`.
- Refresh sends `grant_type=refresh_token`, `refresh_token`, and `client_id`.
- No client secret is sent in either request.
- When offline access is enabled, the authorization-code exchange includes `refresh_token_expiration_seconds` with a 30-day bound.

Security result:

- A refresh token stored in a browser client is durable, but not meaningfully secret from other scripts on the same origin.
- Offline access therefore stays opt-in rather than the default.

Remaining live-validation spike:

- Verify against a real Dropbox development app that PKCE with `token_access_type=offline` returns a refresh token without a secret.
- Verify that the refresh grant succeeds with only `client_id` and `refresh_token`.
- Record request and response shapes with all secrets redacted.