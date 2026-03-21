const BASE_URL = '/api/v1'; // Using relative path for proxying

/**
 * Universal API calling function
 * @param endpoint - API endpoint (e.g., '/login')
 * @param method - HTTP Method (GET, POST, PUT, DELETE)
 * @param body - Request body (for POST/PUT)
 * @param customHeaders - Any extra headers you want to pass
 */

export const callApi = async (endpoint: string, method: string = 'GET', body: any = null, customHeaders: any = {}) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('AdminToken') : null;

        const isFormData = body instanceof FormData;
        
        const headers: any = {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...customHeaders,
        };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const config: RequestInit = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = isFormData ? body : JSON.stringify(body);
        }

        // Ensure leading slash for cleaning
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        const response = await fetch(`${BASE_URL}${cleanEndpoint}`, config);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but received ${contentType || 'text'}. Status: ${response.status}. ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error: any) {
        console.error('API Call Error:', error.message);
        throw error;
    }
};
