import { apiRequest } from "./apiClient.js";

export async function getMyLeases() {
  const response = await apiRequest("/leases/me");
  if (!Array.isArray(response?.leases)) {
    throw new Error("The server returned an invalid lease history response.");
  }
  return response.leases;
}

export async function getMyLeaseById(leaseId) {
  const leases = await getMyLeases();
  return leases.find((lease) => lease._id === leaseId) || null;
}
