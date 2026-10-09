import { apiRequest } from "./apiClient.js";

export async function getMyPayments() {
  const response = await apiRequest("/payments/me");
  if (!Array.isArray(response?.payments)) {
    throw new Error("The server returned an invalid payment history response.");
  }
  return response.payments;
}
