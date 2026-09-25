# API integration gaps

The uploaded `openapi.json` is the source of truth. The frontend does not invent unsupported endpoints.

## Gaps and workarounds

1. **No production API URL:** the documented production host ends in `.local` and is not publicly resolvable. The server bridge uses `API_BASE_URL` when configured and falls back to `http://localhost:8000` for local development.
2. **Bearer response vs HTTP-only-cookie requirement:** login/register return `access_token` JSON rather than setting a cookie. The TanStack server bridge immediately places that token in a secure HTTP-only, same-site cookie. Browser code never reads or stores the token.
3. **No household discovery endpoint:** there is no endpoint to list the signed-in user's households. The selected/created household ID is retained in an HTTP-only cookie. Existing households can be opened by UUID.
4. **No member removal endpoint:** roster additions work; removal controls are visibly unavailable rather than issuing an invented request.
5. **No profile update endpoint:** the account page can display auth methods and profile data but cannot edit it.
6. **No logout/revoke endpoint:** signing out clears the app's HTTP-only session cookie. Server-side token revocation is unavailable.
7. **Activity stack response has no schema:** the activity view safely renders the keys returned by the endpoint and uses the documented household-level undo endpoint.
8. **No currency field:** expense values are formatted as USD in the UI because the API provides plain numeric amounts without a currency code.