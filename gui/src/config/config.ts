
interface Configuration {
    isDebugging: boolean,
    backendServer: string,
    queryServer: string,
    sparqlQuery: string,
}

const config = {
    isDebugging: process.env.REACT_APP_IS_DEBUGGING == 'true',
    backendServer: process.env.REACT_APP_BACKEND_URL,
    queryServer: "https://dsbox02.isi.edu:8888",
    sparqlQuery: process.env.REACT_APP_SPARQL_URL,
} as Configuration;

export default config;