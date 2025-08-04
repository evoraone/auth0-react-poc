import { useState } from "react";
import { Button, Input, Alert } from "reactstrap";
import Highlight from "../components/Highlight";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { getConfig } from "../config";
import Loading from "../components/Loading";

export const ExternalApiComponent = () => {
  const { apiGateway } = getConfig();

  const [state, setState] = useState({
    showResult: false,
    apiMessage: "",
    error: null,
  });
  const [canSubmit, setCanSubmit] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [query, setQuery] = useState(`{
  "query": "query Users($options: ListOptions) { users(options: $options) { id email firstName lastName } }",
  "variables": {
    "options": {
        "limit": 10
    }
  }
}`);

  const { getAccessTokenSilently } = useAuth0();

  const callApi = async () => {
    try {
      const token = await getAccessTokenSilently();

      setState({
        ...state,
        showResult: false,
        apiMessage: {},
      });

      const response = await fetch(`${apiGateway}/public`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: query,
      });

      const responseData = await response.json();
      setState({
        ...state,
        showResult: true,
        apiMessage: responseData,
      });

      setMessage({ text: '' });

    } catch (error) {
      console.log(error);
      setMessage({ text: error.toString(), type: 'danger'} );
    }
  };

  const handleOnChange = (value) => {
    setQuery(value);

    if(!value){
      setCanSubmit(false);
    }

    try{
      const json = JSON.parse(value);
      if(json.query){
        setCanSubmit(true);
        setMessage({ text: ``} );
      }
    }
    catch(e){
      console.log(e);
      setMessage({ text: `Query must be JSON WITH "query" property.`, type: 'danger'} );
      setCanSubmit(false);
    }
  }

  return (
    <>
      <div className="mb-5">
        <p className="lead">
          Call Core API by submitting a query below.
        </p>
        <h6 className="muted">QUERY</h6>
        <Input
          type="textarea"
          id="queryInput"
          rows={8}
          value={query}
          className="my-2"
          onChange={e => handleOnChange(e.target.value)}
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#282C34',
            color: '#F8F8F2',
            fontSize: '1rem'
          }}
        />
        {message?.text && (
          <Alert color={message.type} className="my-2 px-2 py-2 rounded">
            {message.text}
          </Alert>
        )}

        <Button
          color="primary"

          onClick={callApi}
          disabled={!apiGateway || !canSubmit}
        >
          POST request
        </Button>
      </div>

      <div className="result-block-container">
        {state.showResult && (
          <div className="result-block" data-testid="api-result">
            <h6 className="muted">Result</h6>
            <Highlight>
              <span>{JSON.stringify(state.apiMessage, null, 2)}</span>
            </Highlight>
          </div>
        )}
      </div>
    </>
  );
};

export default withAuthenticationRequired(ExternalApiComponent, {
  onRedirecting: () => <Loading />,
});
