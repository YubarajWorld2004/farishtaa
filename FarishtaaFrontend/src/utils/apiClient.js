import store from "../store/index.js";
import { setUnauthorized } from "../store/slices/authSlice";

export const handleApiResponse = async (response) => {
  if (response.status === 401) {
    store.dispatch(setUnauthorized("Your session has expired. Please log in again."));
    throw new Error("Unauthorized - Session expired");
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
};

export const fetchWithAuthCheck = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
};
