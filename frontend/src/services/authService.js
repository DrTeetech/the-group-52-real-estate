import { apiRequest } from "./apiClient.js";

export async function login(email, password) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response?.token || !response?.user) {
    throw new Error("The login response did not include a token and user.");
  }

  return { token: response.token, user: response.user };
}

export async function register({
  firstName,
  lastName,
  email,
  phone,
  password,
}) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, phone, password }),
  });
}
