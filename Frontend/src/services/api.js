import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Auto logout user if token expires or is invalid
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        // Return the error message if present, otherwise the error object
        const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(errorMessage);
    }
);

export default api;
