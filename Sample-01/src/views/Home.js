import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Home = () => {
  const [organizations, setOrganizations] = useState([]);
  const [message, setMessage] = useState('');
  const [activeOrg, setActiveOrg] = useState(null);

  const { getAccessTokenSilently, isAuthenticated, logout } = useAuth0();

  useEffect(() => {
    const setOrgId = async () => {
      const token = await getAccessTokenSilently();
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const newActiveOrg = decodedToken['organization_id'];

      setActiveOrg(newActiveOrg);
    }
    if (isAuthenticated) {
      setOrgId();
    }
  }, []);

  // This function runs once to fetch the user's available organizations
  useEffect(() => {
    const getOrganizations = async () => {
      try {
        console.log("calling getOrganizations!")
        const token = await getAccessTokenSilently();
        console.log("token: ", token);
        const response = await fetch('https://i4zhn3e4g0.execute-api.eu-west-1.amazonaws.com/dev/organizations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setOrganizations(data);
      } catch (error) {
        setMessage(error.message);
      }
    };

    if (isAuthenticated) {
      getOrganizations();
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  // This function handles the logic for switching organizations
  const handleOrgSwitch = async (newOrgId) => {
    try {
      setMessage(`Switching to ${newOrgId}...`);
      setActiveOrg(null); // Clear previous active org message

      const currentToken = await getAccessTokenSilently();

      // 1. Ask the backend for permission to switch
      await fetch('https://i4zhn3e4g0.execute-api.eu-west-1.amazonaws.com/dev/auth/prepare-switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ newOrganizationId: newOrgId }),
      });

      // await logout({ openUrl: false });
      // 2. If backend approves, get a new token from Auth0 with the new context
      const newToken = await getAccessTokenSilently({
        authorizationParams: {
          'organization_id': newOrgId,
        },
        cacheMode: 'off' // Ensures we get a fresh token
      });

      // 3. Decode the new token to display the active organization
      const decodedToken = JSON.parse(atob(newToken.split('.')[1]));
      const newActiveOrg = decodedToken['organization_id'];

      setActiveOrg(newActiveOrg);
      setMessage(`Successfully switched to organization: ${newActiveOrg}`);

    } catch (error) {
      setMessage(`Failed to switch organization: ${error.message}`);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Switch Organization</h2>
      {activeOrg && <p><strong>Currently active: {activeOrg}</strong></p>}

      {organizations.length > 0 ? (
        <div>
          <p>Select an organization to get a new token for:</p>
          {organizations.map((org) => (
            <button
              key={org.id}
              className="btn btn-primary m-1"
              onClick={() => handleOrgSwitch(org.id)}
            >
              Switch to {org.name}
            </button>
          ))}
        </div>
      ) : (
        <p>Loading organizations...</p>
      )}

      {/* Display success or error messages */}
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
};

export default Home;