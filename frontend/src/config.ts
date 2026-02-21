/**
 * Backend server URL. Set VITE_BACKEND_URL in .env or when running the app.
 */
export const backendUrl =
    import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';
