import axios from 'axios';

// The base URL is relative, so it will use the same host and port
// as the frontend. This works perfectly when the Go backend serves the UI.
const api = axios.create({
  baseURL: '/api/v1',
});

// Admin API does not have authentication, so no interceptors are needed.

export default api;