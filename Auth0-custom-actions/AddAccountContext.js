/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  const { BACKEND_URL, DOMAIN, CLIENT_ID, CLIENT_SECRET, AUDIENCE } = event.secrets;

  if (!BACKEND_URL || !DOMAIN || !CLIENT_ID || !CLIENT_SECRET || !AUDIENCE) {
    console.error("Secrets not properly configured.");
    return;
  }

  const tokenRequestBody = {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience: AUDIENCE
  }

  let accessToken = null;
  try {
    const tokenResponse = await fetch(`${DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequestBody),
    });

    if (!tokenResponse.ok) {
      console.error(`Getting client_credentials failed with status: ${tokenResponse.status}`);
      return;
    }

    const { access_token } = await tokenResponse.json();
    accessToken = access_token;
  } catch (error) {
    console.log(error);
    return;
  }

  const orgIdFromFrontend = event.request?.query?.organization_id ?? null;
  console.log("orgIdFromFrontend: ", JSON.stringify(orgIdFromFrontend));

  try {
    const requestBody = {
      user_email: event.user.email
    };

    if (orgIdFromFrontend) {
      requestBody.organization_id = orgIdFromFrontend;
    }

    const response = await fetch(`${BACKEND_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`Backend hook failed with status: ${response.status}`);
      return;
    }
    
    const { accountId, organisation, roles, isSystemLevel } = await response.json();
    console.log("accountId: ", accountId);
    console.log("org: ", organisation);
    console.log("roles: ", roles);
    console.log("isSystemLevel: ", isSystemLevel);

    // dummy to make Aeris happy
    api.idToken.setCustomClaim('metry_user', true);
    api.idToken.setCustomClaim('metry', "ABCDXYZ");

    // accessToken is used by lambda middleware
    // idToken is used in the FE (eliminates the need to decode access token)
    if(accountId){
      api.accessToken.setCustomClaim(`account_id`, accountId);
      api.idToken.setCustomClaim(`account_id`, accountId);
    }
    if (organisation) {
      api.accessToken.setCustomClaim(`organisation`, organisation);
      api.idToken.setCustomClaim(`organszation`, organisation);
    }
    if (roles && roles.length > 0) {
      api.accessToken.setCustomClaim(`account_roles`, roles);
      api.idToken.setCustomClaim(`account_roles`, roles);
    }
    if(isSystemLevel){
      api.accessToken.setCustomClaim(`isSystemLevel`, isSystemLevel);
      api.idToken.setCustomClaim(`isSystemLevel`, isSystemLevel);
    }
  } catch (error) {
    console.error("Error calling the backend context hook:", error);
  }
};


/**
* Handler that will be invoked when this action is resuming after an external redirect. If your
* onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
// exports.onContinuePostLogin = async (event, api) => {
// };
