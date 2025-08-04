# Aeris organisation-less Auth0 React Application

This sample demonstrates the following use cases:

- Login
- Loading user's available Organisations
- Switch organisation (SSO)
- Logout
- Showing the user profile
- Calling Core API

## Project setup

Use `yarn` to install the project dependencies:

```bash
yarn install
```

## Configuration

### Create an API

An API is configured in the Auth0 Dashboard with "Allow Offline Access" enabled.

- “offline-access” is required to get the refresh token together with the access token. It might not be essential for now to think about this but, it would be better not to have long-lived access tokens but rather short-lived ones and utilize the refresh token mechanism to have more secure application.

### Create an Application

A Machine-to-Machine (M2M) Application is created with the following Management API scopes: `read:users`, `update:users`, `update:users_app_metadata`.

- scopes might increase or new M2M APIs needs to be created based on the operations needs to be performed with certain set of actions like new user creation (collaborator), updating user permission scopes etc.

### Configure credentials

The project needs to be configured with your Auth0 domain and client ID in order for the authentication flow to work.

To do this, first copy `src/auth_config.json.example` into a new file in the same folder called `src/auth_config.json`, and replace the values with your own Auth0 application credentials, and optionally the base URLs of your application and API:

```json
{
  "domain": "{Auth0 > sandbox api Application DOMAIN}",
  "clientId": "{Auth0 > sandbox api Application CLIENT ID}",
  "audience": "{Auth0 > sandbox api API_IDENTIFIER}",
  "apiGateway": "{Ragnarok API Gateway}"
}
```

## Run the sample

### Compile and hot-reload for development

This compiles and serves the React app and starts the backend API server on port 3001.

```bash
HTTPS=true yarn start
```

## Deployment

### Compiles and minifies for production

```bash
yarn run build
```

### Docker build

To build and run the Docker image, run `exec.sh`, or `exec.ps1` on Windows.

### Run your tests

```bash
yarn run test
```
