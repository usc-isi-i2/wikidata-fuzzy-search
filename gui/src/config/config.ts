
interface Configuration {
    isDebugging: boolean,
    backendServer: string,
    sparqlQuery: string,
}

const config = {
    isDebugging: process.env.REACT_APP_IS_DEBUGGING == 'true',
    backendServer: process.env.REACT_APP_BACKEND_URL,
    sparqlQuery: process.env.REACT_APP_SPARQL_URL,
} as Configuration;

export default config;