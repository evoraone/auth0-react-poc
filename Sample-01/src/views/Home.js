import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { jwtDecode } from "jwt-decode";
import { getConfig } from "../config";

import {
  Alert
} from "reactstrap";

const Home = () => {
  const [organisations, setOrganisations] = useState([]);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [activeOrg, setActiveOrg] = useState(null);
  const { apiGateway } = getConfig();

  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();

  useEffect(() => {
    const setOrgId = async () => {
      const token = await getAccessTokenSilently();
      const decodedToken = jwtDecode(token);
      const newActiveOrg = decodedToken.organisation?.name;

      setActiveOrg(newActiveOrg);
    }
    if (isAuthenticated) {
      setOrgId();
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  // This function runs once to fetch the user's available organisations
  useEffect(() => {
    const getOrganisations = async () => {
      try {
        console.log("calling getOrganisations!")
        const token = await getAccessTokenSilently();

        const response = await fetch(`${apiGateway}/auth/organisations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_email: user.email }),
        });

        const data = await response.json();
        const orgs = data.data.map((item) => item.organisation );
        setOrganisations(orgs);

        setMessage({ text: '' });

      } catch (error) {
        setMessage({ text: error.message, type: 'danger'});
      }
    };

    if (isAuthenticated) {
      setMessage({ text: 'Loading organisations...', type: 'info'});
      getOrganisations();
    }
  }, [getAccessTokenSilently, isAuthenticated, user]);

  // This function handles the logic for switching organisations
  const handleOrgSwitch = async (newOrg) => {
    try {
      setMessage({ text: `Switching to ${newOrg.name}...`, type: 'info' });
      setActiveOrg(null); // Clear previous active org message

      const currentToken = await getAccessTokenSilently();

      // 1. Ask the backend for permission to switch
      await fetch(`${apiGateway}/auth/prepare-switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ organisation_id: newOrg.id, user_email: user.email }),
      });

      // await logout({ openUrl: false });
      // 2. If backend approves, get a new token from Auth0 with the new context
      const newToken = await getAccessTokenSilently({
        authorizationParams: {
          'organisation_id': newOrg.id,
        },
        cacheMode: 'off' // Ensures we get a fresh token
      });

      // 3. Decode the new token to display the active organisation
      const decodedToken = jwtDecode(newToken);
      const newActiveOrg = decodedToken.organisation?.name;

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

      {isAuthenticated && organisations.length > 0 && (
        <div>
          <hr />
          {organisations.map((org) => (
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