
interface Configuration {
    isDebugging: boolean,
    backendServer: string,
}

const config = {
    isDebugging: process.env.REACT_APP_IS_DEBUGGING === 'true',
    backendServer: process.env.REACT_APP_BACKEND_URL,
} as Configuration;

export default config;