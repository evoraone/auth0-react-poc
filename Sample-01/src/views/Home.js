import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { jwtDecode } from "jwt-decode";

import {
  Alert
} from "reactstrap";

const API_GATEWAY = 'https://kfbkl2611c.execute-api.eu-west-2.amazonaws.com';

const Home = () => {
  const [organizations, setOrganizations] = useState([]);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [activeOrg, setActiveOrg] = useState(null);

  const { getAccessTokenSilently, isAuthenticated, user, loginWithRedirect } = useAuth0();

  useEffect(() => {
    const setOrgId = async () => {
      const token = await getAccessTokenSilently();
      const decodedToken = jwtDecode(token);
      const newActiveOrg = decodedToken.organization?.name;

      setActiveOrg(newActiveOrg);
    }
    if (isAuthenticated) {
      setOrgId();
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  // This function runs once to fetch the user's available organizations
  useEffect(() => {
    const getOrganizations = async () => {
      try {
        console.log("calling getOrganizations!")
        const token = await getAccessTokenSilently();

        const response = await fetch(`${API_GATEWAY}/auth/organizations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_email: user.email }),
        });
        const data = await response.json();
        setOrganizations(data);
        setMessage({ text: '' });

      } catch (error) {
        setMessage({ text: error.message, type: 'danger'});
      }
    };

    if (isAuthenticated) {
      setMessage({ text: 'Loading organisations...', type: 'info'});
      getOrganizations();
    }
  }, [getAccessTokenSilently, isAuthenticated, user]);

  // This function handles the logic for switching organizations
  const handleOrgSwitch = async (newOrg) => {
    try {
      setMessage({ text: `Switching to ${newOrg.name}...`, type: 'info' });
      setActiveOrg(null); // Clear previous active org message

      const currentToken = await getAccessTokenSilently();

      // 1. Ask the backend for permission to switch
      await fetch(`${API_GATEWAY}/auth/prepare-switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ organization_id: newOrg.id, user_email: user.email }),
      });

      // await logout({ openUrl: false });
      // 2. If backend approves, get a new token from Auth0 with the new context
      const newToken = await getAccessTokenSilently({
        authorizationParams: {
          'organization_id': newOrg.id,
        },
        cacheMode: 'off' // Ensures we get a fresh token
      });

      // 3. Decode the new token to display the active organization
      const decodedToken = jwtDecode(newToken);
      const newActiveOrg = decodedToken.organization?.name;

      setActiveOrg(newActiveOrg);
      setMessage({ text: `Successfully switched to organisation: ${newActiveOrg}`, type: 'success'});

    } catch (error) {
      setMessage({ text: `Failed to switch organisation: ${error.message}`, type: 'danger'} );
    }
  };

  return (
    <div className="container mt-5">
      {message?.text && (
        <Alert color={message.type} className="my-2 px-2 py-2 rounded">
          {message.text}
        </Alert>
      )}

      {isAuthenticated ? (
        <h2>Hello, {user.name}!</h2>
      )
      : (<h2>Please log in to start</h2>)
      }

      {activeOrg && <p>Your active organisation: <strong>{activeOrg}</strong></p>}

      {isAuthenticated && organizations.length > 0 && (
        <div>
          <hr />
          {organizations.map((org) => (
            <button
              key={org.id}
              className="btn btn-primary m-1"
              disabled={activeOrg === org.name || !activeOrg}
              onClick={() => handleOrgSwitch(org)}
            >
              Switch to {org.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;