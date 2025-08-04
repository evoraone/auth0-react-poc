# Auth0 Custom Action
Post Login script in Auth0 that calls Ragnarok API 

## Secrets

### AddAccountContext

* `BACKEND_URL` - https://<Ragnarok API>/auth/get-user-context - returns basic account information that will be written into JWT
* `DOMAIN` - from Applications > (sandbox api) - Domain
* `CLIENT_ID` - from Applications > (sandbox api) - Client Id
* `CLIENT_SECRET` - from Applications > (sandbox api) - Client Id
* `AUDIENCE` - from APIs > sandbox api - Identifier