const API_BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("group52_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  health: () => request("/health"),

  register: (body) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  login: (body) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  me: () => request("/auth/me"),

  getProperties: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        query.set(key, value);
      }
    });
    const qs = query.toString();
    return request(`/properties${qs ? `?${qs}` : ""}`);
  },

  getAllPropertiesForStaff: () =>
  request("/properties/staff/all"),

  getProperty: (slug) => request(`/properties/${slug}`),

 addFavorite: (propertyId) =>
  request(`/favourites/properties/${propertyId}/favorite`, {
    method: "POST"
  }),

removeFavorite: (propertyId) =>
  request(`/favourites/properties/${propertyId}/favorite`, {
    method: "DELETE"
  }),

getFavorites: () => request("/favourites/me/favorites"),
  createInquiry: (propertyId, message) =>
    request(`/inquiries/properties/${propertyId}`, {
      method: "POST",
      body: JSON.stringify({ message })
    }),

  getMyInquiries: () => request("/inquiries/me"),

  createViewing: (propertyId, body) =>
    request(`/viewings/properties/${propertyId}`, {
      method: "POST",
      body: JSON.stringify(body)
    }),

  getMyViewings: () => request("/viewings/me"),

  createApplication: (propertyId, body) =>
    request(`/rental-applications/properties/${propertyId}`, {
      method: "POST",
      body: JSON.stringify(body)
    }),

  getMyApplications: () => request("/rental-applications/me"),

  getMyLeases: () => request("/leases/me"),

  createPayment: (body) =>
    request("/payments", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  getMyPayments: () => request("/payments/me"),

  // Staff endpoints
  createProperty: (body) =>
    request("/properties", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateProperty: (id, body) =>
    request(`/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  updatePropertyStatus: (id, status) =>
    request(`/properties/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),

  publishProperty: (id) =>
    request(`/properties/${id}/publish`, {
      method: "POST"
    }),

  deleteProperty: (id) =>
    request(`/properties/${id}`, {
      method: "DELETE"
    }),

  getAllInquiries: (status = "") =>
    request(`/inquiries${status ? `?status=${status}` : ""}`),

  updateInquiry: (id, body) =>
    request(`/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  getAllViewings: (status = "") =>
    request(`/viewings${status ? `?status=${status}` : ""}`),

  updateViewing: (id, body) =>
    request(`/viewings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  getAllApplications: (status = "") =>
    request(`/rental-applications${status ? `?status=${status}` : ""}`),

  updateApplication: (id, body) =>
    request(`/rental-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  getAllLeases: (status = "") =>
    request(`/leases${status ? `?status=${status}` : ""}`),

  createLease: (body) =>
    request("/leases", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateLeaseStatus: (id, status) =>
    request(`/leases/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),

  getAllPayments: (status = "") =>
    request(`/payments${status ? `?status=${status}` : ""}`)
};
