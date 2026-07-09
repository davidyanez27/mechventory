import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// The serverless API behind API Gateway. Auth is a Cognito JWT per request —
// no cookies, so no withCredentials.
const InventoryApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}`,
});

// Attach the Cognito ID token. fetchAuthSession refreshes it automatically
// when it is close to expiry; when there is no session the request goes out
// bare and the API answers 401.
InventoryApi.interceptors.request.use(
    async (config) => {
        const session = await fetchAuthSession().catch(() => null);
        const token = session?.tokens?.idToken?.toString();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

InventoryApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/login')) window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default InventoryApi;
