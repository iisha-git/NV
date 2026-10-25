import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ""}/api`,
  withCredentials: true,
});



// RESPONSE INTERCEPTOR
api.interceptors.response.use(

  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    // Access token expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {

      originalRequest._retry = true;

      try {

        // Request new access token
        await api.post("/auth/refresh-token");

        // Retry original request
        return api(originalRequest);

      } catch (refreshError) {

        console.log("Refresh token expired");

        // logout user here later

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;