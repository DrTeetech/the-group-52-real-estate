import axios from 'axios';
import {
  applications as initialApplications,
  leases as initialLeases,
  maintenanceRequests as initialMaintenanceRequests,
  payments as initialPayments,
  properties as initialProperties,
  tenants as initialTenants,
} from '../data/mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// ============================================================
// JWT AUTHENTICATION
// Automatically attach the logged-in user's JWT token
// to API requests.
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('keyhouse-token') ||
      sessionStorage.getItem('keyhouse-token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// MOCK DATA HELPERS
// ============================================================

const wait = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let mockProperties = initialProperties.map((property) => ({
  ...property,
  amenities: [...(property.amenities || [])],
  images: [...(property.images || [property.image])],
}));

let mockApplications = initialApplications.map((application) => ({
  ...application,
  documents: [...(application.documents || [])],
}));

let mockTenants = initialTenants.map((tenant) => ({
  ...tenant,
}));

let mockLeases = initialLeases.map((lease) => ({
  ...lease,
}));

let mockPayments = initialPayments.map((payment) => ({
  ...payment,
}));

let mockMaintenanceRequests = initialMaintenanceRequests.map(
  (request) => ({
    ...request,
    attachments: [...(request.attachments || [])],
  })
);

const copyApplication = (application) => ({
  ...application,
  documents: [...(application.documents || [])],
});

// ============================================================
// AUTH API
// ============================================================

export const authApi = {
  login: async ({ email, password }) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    return response.data;
  },

  register: async ({
    firstName,
    lastName,
    email,
    phone,
    password,
  }) => {
    const response = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');

    return response.data;
  },
};

const propertyStatusToApi = {
  Available: 'available',
  Occupied: 'rented',
  Maintenance: 'maintenance',
  Unlisted: 'draft',
};

const propertyStatusFromApi = {
  available: 'Available',
  rented: 'Occupied',
  maintenance: 'Maintenance',
  unavailable: 'Maintenance',
  draft: 'Unlisted',
  reserved: 'Unlisted',
};

function toPropertyApiPayload(values) {
  const status = propertyStatusToApi[values.status] || 'available';
  const images = values.images?.length
    ? values.images
    : values.image
      ? [values.image]
      : [];

  return {
    title: values.name,
    description: values.description,
    propertyType: String(values.type || 'Apartment').toLowerCase(),
    rent: {
      amount: Number(values.monthlyRent),
      period: 'monthly',
      currency: 'NGN',
    },
    cautionFee: {
      amount: Number(values.securityDeposit || 0),
      currency: 'NGN',
    },
    location: {
      address: values.address,
      area: values.area || values.city,
      city: values.city,
      state: values.state,
      country: values.country || 'Nigeria',
    },
    bedrooms: Number(values.bedrooms),
    bathrooms: Number(values.bathrooms),
    units: Number(values.units || 1),
    propertySize: {
      value: Number(values.squareFootage),
      unit: 'sqft',
    },
    amenities: values.amenities || [],
    media: images.map((url, index) => ({
      type: 'image',
      url,
      isFeatured: index === 0,
      sortOrder: index,
    })),
    status,
    visibility: status === 'draft' ? 'private' : 'public',
  };
}

function fromPropertyApiResponse(property) {
  const media = [...(property.media || [])].sort(
    (left, right) => (left.sortOrder || 0) - (right.sortOrder || 0)
  );
  const images = media.map((item) => item.url).filter(Boolean);
  const featuredImage = media.find((item) => item.isFeatured)?.url;
  const location = property.location || {};
  const locationLabel = [...new Set([
    location.area,
    location.city,
    location.state,
  ].filter(Boolean))].join(', ');
  const propertyType = String(property.propertyType || 'apartment');

  return {
    id: String(property.id || property._id),
    name: property.title || '',
    type: propertyType.charAt(0).toUpperCase() + propertyType.slice(1),
    description: property.description || '',
    address: location.address || '',
    city: location.city || '',
    state: location.state || '',
    country: location.country || 'Nigeria',
    location: locationLabel,
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    units: property.units || 1,
    squareFootage: property.propertySize?.value || 0,
    monthlyRent: property.rent?.amount || 0,
    securityDeposit: property.cautionFee?.amount || 0,
    status: propertyStatusFromApi[property.status] || 'Unlisted',
    amenities: property.amenities || [],
    images,
    image: featuredImage || images[0] || '',
    occupancy: property.status === 'rented' ? 100 : 0,
    tenant: null,
    lease: null,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

// ============================================================
// PROPERTY API
// ============================================================

export const propertyApi = {
  getProperties: async () => {
    const response = await api.get('/properties');

    return {
      data: response.data.data.map(fromPropertyApiResponse),
    };
  },

  getProperty: async (id) => {
    const response = await api.get(`/properties/${id}`);

    return {
      data: fromPropertyApiResponse(response.data.data),
    };
  },

  createProperty: async (data) => {
    const response = await api.post(
      '/properties',
      toPropertyApiPayload(data)
    );

    return {
      data: fromPropertyApiResponse(response.data.data),
      success: true,
    };
  },

  updateProperty: async (id, data) => {
    const response = await api.put(
      `/properties/${id}`,
      toPropertyApiPayload(data)
    );

    return {
      data: fromPropertyApiResponse(response.data.data),
      success: true,
    };
  },

  deleteProperty: async (id) => {
    const response = await api.delete(`/properties/${id}`);

    return {
      success: response.data.success,
      id,
    };
  },
};

// ============================================================
// APPLICATION API
// ============================================================

const applicationStatusToApi = {
  Pending: 'submitted',
  'Under Review': 'under_review',
  Approved: 'approved',
  Rejected: 'rejected',
  Withdrawn: 'withdrawn',
};

const applicationEmploymentToApi = {
  'Full-time': 'full_time',
  'Part-time': 'part_time',
  'Self-employed': 'self_employed',
  Contract: 'contract',
  Unemployed: 'unemployed',
};

function toApplicationApiPayload(values) {
  const payload = {};

  if (values.propertyId) payload.propertyId = values.propertyId;
  if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth;
  if (values.employmentStatus) {
    payload.employmentStatus = applicationEmploymentToApi[values.employmentStatus] || values.employmentStatus;
  }
  if (values.employer !== undefined) payload.employer = values.employer;
  if (values.jobTitle !== undefined) payload.jobTitle = values.jobTitle;
  if (values.income !== undefined) payload.income = values.income;
  if (values.moveInDate) payload.moveInDate = values.moveInDate;
  if (values.occupants !== undefined) payload.occupants = values.occupants;
  if (values.currentAddress !== undefined) payload.currentAddress = values.currentAddress;
  if (values.additionalInfo !== undefined) payload.additionalInfo = values.additionalInfo;
  if (Array.isArray(values.documents)) payload.documents = values.documents;
  if (values.status) payload.status = applicationStatusToApi[values.status] || values.status;
  if (values.rejectionReason !== undefined) payload.rejectionReason = values.rejectionReason;

  return payload;
}

function fromApplicationApiResponse(application) {
  const property = application.propertyDetails || null;

  return {
    ...application,
    applicantEmail: application.applicantEmail || '',
    applicantPhone: application.applicantPhone || '',
    income: application.income || 0,
    propertyId: String(application.propertyId || property?.id || ''),
    property: application.property || property?.name || 'Property unavailable',
    location: application.location || property?.location || '',
    propertyRent: application.propertyRent || property?.monthlyRent || 0,
    date: application.date ? String(application.date).slice(0, 10) : '',
    lastUpdated: application.lastUpdated ? String(application.lastUpdated).slice(0, 10) : '',
    documents: application.documents || [],
  };
}

async function requestApplicationApi(request) {
  try {
    return (await request).data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Unable to complete the application request. Please try again.'
    );
  }
}

export const applicationApi = {
  getApplications: async () => {
    const response = await requestApplicationApi(api.get('/applications'));
    return {
      data: response.data.map(fromApplicationApiResponse),
    };
  },

  getApplication: async (id) => {
    const response = await requestApplicationApi(api.get(`/applications/${id}`));
    return {
      data: fromApplicationApiResponse(response.data),
    };
  },

  createApplication: async (values) => {
    const response = await requestApplicationApi(
      api.post('/applications', toApplicationApiPayload(values))
    );
    return {
      data: fromApplicationApiResponse(response.data),
      success: true,
    };
  },

  updateApplication: async (id, updates) => {
    const response = await requestApplicationApi(
      api.put(`/applications/${id}`, toApplicationApiPayload(updates))
    );
    return {
      data: fromApplicationApiResponse(response.data),
      success: true,
    };
  },

  deleteApplication: async (id) => {
    const response = await requestApplicationApi(api.delete(`/applications/${id}`));
    return {
      success: response.success,
      id,
    };
  },
};

// ============================================================
// TENANT API
// ============================================================

export const tenantApi = {
  getTenants: async () => {
    await wait(180);

    return {
      data: mockTenants.map((tenant) => ({
        ...tenant,
      })),
    };
  },

  getTenant: async (id) => {
    await wait(120);

    const tenant = mockTenants.find(
      (item) => item.id === id
    );

    if (!tenant) {
      throw new Error('Tenant not found.');
    }

    return {
      data: {
        ...tenant,
      },
    };
  },

  upsertFromApplication: async (values) => {
    await wait(160);

    const current = mockTenants.find(
      (tenant) =>
        tenant.applicationId ===
        values.applicationId
    );

    const tenant = {
      ...current,
      ...values,
      id:
        current?.id ||
        `tenant-${Date.now()}`,
      createdAt:
        current?.createdAt ||
        new Date()
          .toISOString()
          .slice(0, 10),
    };

    mockTenants = current
      ? mockTenants.map((item) =>
          item.id === current.id
            ? tenant
            : item
        )
      : [tenant, ...mockTenants];

    return {
      data: {
        ...tenant,
      },
      success: true,
    };
  },

  updateTenant: async (id, updates) => {
    await wait(120);

    const current = mockTenants.find(
      (item) => item.id === id
    );

    if (!current) {
      throw new Error('Tenant not found.');
    }

    const tenant = {
      ...current,
      ...updates,
      id,
    };

    mockTenants = mockTenants.map(
      (item) =>
        item.id === id
          ? tenant
          : item
    );

    return {
      data: {
        ...tenant,
      },
      success: true,
    };
  },
};

// ============================================================
// LEASE API
// ============================================================

const leaseStatusToApi = {
  Active: 'active',
  Draft: 'pending',
  'Expiring Soon': 'active',
  Expired: 'expired',
  Terminated: 'terminated',
  Cancelled: 'cancelled',
  Pending: 'pending',
};

const leaseStatusFromApi = {
  active: 'Active',
  pending: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
  cancelled: 'Terminated',
  draft: 'Draft',
};

function toLeaseApiPayload(values = {}) {
  const payload = {};

  if (values.tenantId) payload.tenantId = values.tenantId;
  if (values.propertyId) payload.propertyId = values.propertyId;
  if (values.applicationId) payload.applicationId = values.applicationId;
  if (values.startDate) payload.startDate = values.startDate;
  if (values.endDate) payload.endDate = values.endDate;
  if (values.monthlyRent !== undefined) payload.rentAmount = Number(values.monthlyRent);
  if (values.securityDeposit !== undefined) payload.securityDeposit = Number(values.securityDeposit);
  if (values.paymentDueDate) payload.paymentDueDate = values.paymentDueDate;
  if (values.lateFee !== undefined) payload.lateFee = Number(values.lateFee);
  if (values.noticePeriodDays !== undefined) payload.noticePeriodDays = Number(values.noticePeriodDays);
  if (values.renewalTerms !== undefined) payload.renewalTerms = values.renewalTerms;
  if (values.occupancyLimit !== undefined) payload.occupancyLimit = Number(values.occupancyLimit);
  if (values.additionalNotes !== undefined) payload.additionalNotes = values.additionalNotes;
  if (values.status) {
    payload.status = leaseStatusToApi[values.status] || String(values.status).toLowerCase();
  }

  return payload;
}

function fromLeaseApiResponse(lease = {}) {
  const tenant = lease.tenant || {};
  const property = lease.property || {};
  const application = lease.rentalApplication || {};
  const location = property.location || {};
  const propertyLocation = [location.area, location.city, location.state]
    .filter(Boolean)
    .join(', ');
  const status = leaseStatusFromApi[String(lease.status || 'active').toLowerCase()] || 'Active';

  return {
    id: String(lease.id || lease._id || ''),
    leaseNumber: lease.leaseNumber || '',
    tenantId: String(tenant._id || lease.tenantId || lease.tenant || ''),
    tenantName: [tenant.firstName, tenant.lastName].filter(Boolean).join(' ') || lease.tenantName || '',
    tenantEmail: tenant.email || lease.tenantEmail || '',
    propertyId: String(property._id || lease.propertyId || lease.property || ''),
    propertyName: property.title || lease.propertyName || 'Property unavailable',
    propertyLocation: propertyLocation || lease.propertyLocation || '',
    applicationId: String(application._id || lease.applicationId || lease.rentalApplication || ''),
    startDate: lease.startDate ? String(lease.startDate).slice(0, 10) : '',
    endDate: lease.endDate ? String(lease.endDate).slice(0, 10) : '',
    monthlyRent: Number(lease.monthlyRent || lease.rentAmount || 0),
    securityDeposit: Number(lease.securityDeposit || 0),
    paymentDueDate: lease.paymentDueDate ? String(lease.paymentDueDate).slice(0, 10) : '',
    lateFee: Number(lease.lateFee || 0),
    noticePeriodDays: Number(lease.noticePeriodDays || 30),
    renewalTerms: lease.renewalTerms || '',
    occupancyLimit: Number(lease.occupancyLimit || 1),
    additionalNotes: lease.additionalNotes || '',
    status,
    createdAt: lease.createdAt,
    updatedAt: lease.updatedAt,
    terminationReason: lease.terminationReason || '',
    terminatedAt: lease.terminatedAt || null,
  };
}

async function requestLeaseApi(request) {
  try {
    return (await request).data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Unable to complete the lease request. Please try again.'
    );
  }
}

export const leaseApi = {
  getLeases: async () => {
    const response = await requestLeaseApi(api.get('/leases'));

    return {
      data: (response.data || []).map(fromLeaseApiResponse),
    };
  },

  getLease: async (id) => {
    const response = await requestLeaseApi(api.get(`/leases/${id}`));

    return {
      data: fromLeaseApiResponse(response.data),
    };
  },

  createLease: async (values) => {
    const response = await requestLeaseApi(
      api.post('/leases', toLeaseApiPayload(values))
    );

    return {
      data: fromLeaseApiResponse(response.data),
      success: true,
    };
  },

  updateLease: async (id, updates) => {
    const response = await requestLeaseApi(
      api.put(`/leases/${id}`, toLeaseApiPayload(updates))
    );

    return {
      data: fromLeaseApiResponse(response.data),
      success: true,
    };
  },

  deleteLease: async (id) => {
    const response = await requestLeaseApi(api.delete(`/leases/${id}`));

    return {
      success: response.success,
      id,
    };
  },
};

// ============================================================
// PAYMENT API
// ============================================================

const paymentTypeMapping = {
  Rent: 'rent',
  'Security Deposit': 'security_deposit',
  'Service Charge': 'service_charge',
  'Application Fee': 'application_fee',
  Other: 'other',
  rent: 'rent',
  security_deposit: 'security_deposit',
  service_charge: 'service_charge',
  application_fee: 'application_fee',
  other: 'other',
};

const paymentMethodMapping = {
  Card: 'paystack',
  'Bank Transfer': 'bank_transfer',
  Cash: 'cash',
  paystack: 'paystack',
  bank_transfer: 'bank_transfer',
  cash: 'cash',
};

function toPaymentApiPayload(values = {}) {
  const payload = {};

  if (values.userId) payload.user = values.userId;
  if (values.tenantId) payload.user = values.tenantId;
  if (values.propertyId) payload.property = values.propertyId;
  if (values.leaseId) payload.lease = values.leaseId;
  if (values.amount !== undefined) payload.amount = Number(values.amount);
  if (values.currency) payload.currency = values.currency;
  if (values.type || values.paymentType) {
    payload.type = paymentTypeMapping[values.type || values.paymentType] || String(values.type || values.paymentType || 'rent').toLowerCase();
  }
  if (values.provider || values.paymentMethod) {
    payload.provider = paymentMethodMapping[values.provider || values.paymentMethod] || String(values.provider || values.paymentMethod || 'paystack').toLowerCase();
  }
  if (values.reference) payload.reference = values.reference;
  if (values.transactionReference) payload.providerReference = values.transactionReference;
  if (values.description || values.notes) payload.metadata = { description: values.description || values.notes };
  if (values.dueDate) payload.metadata = { ...(payload.metadata || {}), dueDate: values.dueDate };
  return payload;
}

function fromPaymentApiResponse(payment = {}) {
  return {
    id: String(payment.id || payment._id || ''),
    paymentId: payment.paymentId || payment.reference || String(payment.id || payment._id || ''),
    reference: payment.reference || payment.paymentId || String(payment.id || payment._id || ''),
    tenantId: String(payment.userId || payment.user || payment.tenantId || ''),
    tenantName: payment.tenantName || [payment.user?.firstName, payment.user?.lastName].filter(Boolean).join(' ') || '',
    tenantEmail: payment.tenantEmail || payment.user?.email || '',
    propertyId: String(payment.propertyId || payment.property || ''),
    propertyName: payment.propertyName || payment.property?.title || '',
    leaseId: String(payment.leaseId || payment.lease || ''),
    amount: Number(payment.amount || 0),
    currency: payment.currency || 'NGN',
    type: payment.type || payment.paymentType || 'rent',
    paymentType: payment.paymentType || payment.type || 'Rent',
    provider: payment.provider || 'paystack',
    paymentMethod: payment.paymentMethod || payment.provider || 'Card',
    status: payment.status || 'pending',
    paymentStatus: payment.paymentStatus || payment.status || 'Pending',
    transactionReference: payment.transactionReference || payment.providerReference || payment.reference || '',
    dueDate: payment.dueDate || payment.metadata?.dueDate || '',
    paidDate: payment.paidDate || payment.metadata?.paidDate || '',
    description: payment.description || payment.metadata?.description || '',
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

async function requestPaymentApi(request) {
  try {
    return (await request).data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Unable to complete the payment request. Please try again.'
    );
  }
}

export const paymentApi = {
  getPayments: async () => {
    const response = await requestPaymentApi(api.get('/payments'));

    return {
      data: (response.data || []).map(fromPaymentApiResponse),
    };
  },

  getPayment: async (id) => {
    const response = await requestPaymentApi(api.get(`/payments/${id}`));
    return {
      data: fromPaymentApiResponse(response.data || response),
    };
  },

  createPayment: async (values) => {
    const response = await requestPaymentApi(api.post('/payments', toPaymentApiPayload(values)));
    return {
      data: fromPaymentApiResponse(response.data || response),
      success: true,
    };
  },

  updatePayment: async (id, updates) => {
    const response = await requestPaymentApi(api.put(`/payments/${id}`, toPaymentApiPayload(updates)));
    return {
      data: fromPaymentApiResponse(response.data || response),
      success: true,
    };
  },

  deletePayment: async (id) => {
    const response = await requestPaymentApi(api.delete(`/payments/${id}`));
    return {
      success: response.success,
      id,
    };
  },
};

// ============================================================
// MAINTENANCE API
// ============================================================

const maintenanceStatusFlow = {
  Submitted: 'submitted',
  'Under Review': 'under_review',
  Assigned: 'assigned',
  'In Progress': 'in_progress',
  Resolved: 'completed',
  Closed: 'completed',
  submitted: 'submitted',
  under_review: 'under_review',
  assigned: 'assigned',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const maintenancePriorityFlow = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Emergency: 'urgent',
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
};

const maintenanceCategoryFlow = {
  Plumbing: 'plumbing',
  Electrical: 'electrical',
  HVAC: 'hvac',
  Appliance: 'appliance',
  Security: 'security',
  Structural: 'structural',
  General: 'general',
  Other: 'other',
  plumbing: 'plumbing',
  electrical: 'electrical',
  hvac: 'hvac',
  appliance: 'appliance',
  security: 'security',
  structural: 'structural',
  general: 'general',
  other: 'other',
};

const maintenanceStatusLabels = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Resolved',
  resolved: 'Resolved',
  cancelled: 'Closed',
  closed: 'Closed',
};

const maintenancePriorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Emergency',
};

const maintenanceCategoryLabels = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  appliance: 'Appliance',
  security: 'Security',
  structural: 'Structural',
  general: 'General',
  other: 'Other',
};

function toMaintenanceApiPayload(values = {}) {
  const payload = {};

  if (values.tenantId) payload.tenant = values.tenantId;
  if (values.propertyId) payload.property = values.propertyId;
  if (values.leaseId) payload.lease = values.leaseId;
  if (values.issue || values.title) payload.title = values.issue || values.title;
  if (values.description) payload.description = values.description;
  if (values.category) {
    payload.category = maintenanceCategoryFlow[values.category] || String(values.category).toLowerCase();
  }
  if (values.priority) {
    payload.priority = maintenancePriorityFlow[values.priority] || String(values.priority).toLowerCase();
  }
  if (values.status) {
    payload.status = maintenanceStatusFlow[values.status] || String(values.status).toLowerCase();
  }
  if (values.assignedTo) payload.assignedTo = values.assignedTo;
  if (values.resolutionNotes !== undefined) payload.resolutionNotes = values.resolutionNotes;
  if (Array.isArray(values.attachments)) payload.attachments = values.attachments;

  return payload;
}

function fromMaintenanceApiResponse(request = {}) {
  const rawStatus = request.status || 'submitted';
  const normalizedStatus = String(rawStatus).trim().toLowerCase().replace(/\s+/g, '_');
  const rawPriority = request.priority || 'medium';
  const rawCategory = request.category || 'general';

  return {
    id: String(request.id || request._id || ''),
    requestId: request.requestId || `MNT-${String(request.id || request._id || '').slice(-6).toUpperCase()}`,
    tenantId: String(request.tenantId || request.tenant || ''),
    tenantName: request.tenantName || [request.tenant?.firstName, request.tenant?.lastName].filter(Boolean).join(' ') || '',
    tenantEmail: request.tenantEmail || request.tenant?.email || '',
    propertyId: String(request.propertyId || request.property || ''),
    propertyName: request.propertyName || request.property?.title || '',
    leaseId: String(request.leaseId || request.lease || ''),
    issue: request.issue || request.title || '',
    title: request.title || request.issue || '',
    category: maintenanceCategoryLabels[rawCategory] || 'General',
    priority: maintenancePriorityLabels[rawPriority] || 'Medium',
    status: maintenanceStatusLabels[normalizedStatus] || 'Submitted',
    description: request.description || '',
    submittedDate: request.submittedDate || (request.createdAt ? String(request.createdAt).slice(0, 10) : ''),
    updatedDate: request.updatedDate || (request.updatedAt ? String(request.updatedAt).slice(0, 10) : ''),
    resolvedDate: request.resolvedDate || '',
    assignedTo: request.assignedTo || request.assignedToName || '',
    assignedToName: request.assignedToName || [request.assignedTo?.firstName, request.assignedTo?.lastName].filter(Boolean).join(' ') || '',
    resolutionNotes: request.resolutionNotes || '',
    attachments: Array.isArray(request.attachments) ? request.attachments : [],
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

async function requestMaintenanceApi(request) {
  try {
    return (await request).data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Unable to complete the maintenance request. Please try again.'
    );
  }
}

export const maintenanceApi = {
  getMaintenanceRequests: async () => {
    const response = await requestMaintenanceApi(api.get('/maintenance'));

    return {
      data: (response.data || []).map(fromMaintenanceApiResponse),
    };
  },

  getMaintenanceRequest: async (id) => {
    const response = await requestMaintenanceApi(api.get(`/maintenance/${id}`));
    return {
      data: fromMaintenanceApiResponse(response.data || response),
    };
  },

  createMaintenanceRequest: async (values) => {
    const response = await requestMaintenanceApi(api.post('/maintenance', toMaintenanceApiPayload(values)));
    return {
      data: fromMaintenanceApiResponse(response.data || response),
      success: true,
    };
  },

  updateMaintenanceRequest: async (id, updates) => {
    const response = await requestMaintenanceApi(api.put(`/maintenance/${id}`, toMaintenanceApiPayload(updates)));
    return {
      data: fromMaintenanceApiResponse(response.data || response),
      success: true,
    };
  },

  assignMaintenanceRequest: async (id, assignedTo) => {
    const response = await requestMaintenanceApi(api.put(`/maintenance/${id}`, { assignedTo }));
    return {
      data: fromMaintenanceApiResponse(response.data || response),
      success: true,
    };
  },

  resolveMaintenanceRequest: async (id, resolutionNotes, assignedTo = null) => {
    const response = await requestMaintenanceApi(api.put(`/maintenance/${id}`, {
      status: 'Resolved',
      resolutionNotes,
      assignedTo,
    }));
    return {
      data: fromMaintenanceApiResponse(response.data || response),
      success: true,
    };
  },

  deleteMaintenanceRequest: async (id) => {
    const response = await requestMaintenanceApi(api.delete(`/maintenance/${id}`));
    return {
      success: response.success,
      id,
    };
  },
};

// ============================================================
// NOTIFICATION API
// ============================================================

const notificationTypeLabels = {
  application: 'Application',
  lease: 'Lease',
  payment: 'Payment',
  maintenance: 'Maintenance',
  rent: 'Rent',
  system: 'System',
  general: 'General',
};

function toNotificationApiPayload(values = {}) {
  const payload = {};
  if (values.title !== undefined) payload.title = values.title;
  if (values.message !== undefined) payload.message = values.message;
  if (values.type) payload.type = String(values.type).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (values.userId) payload.userId = values.userId;
  if (values.recipientId) payload.recipientId = values.recipientId;

  const relatedEntity = values.relatedEntity || (String(values.type || '').toLowerCase() === 'maintenance' && values.relatedId ? 'maintenance' : '');
  if (relatedEntity) payload.relatedEntity = String(relatedEntity).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (values.relatedEntityId || values.relatedId) payload.relatedEntityId = values.relatedEntityId || values.relatedId;
  if (values.link || values.relatedRoute) payload.link = values.link || values.relatedRoute;

  return payload;
}

function fromNotificationApiResponse(notification = {}) {
  const rawType = String(notification.type || 'general').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const rawRole = notification.userRole || notification.recipient?.role || '';
  const roleLabels = {
    tenant: 'TENANT',
    property_manager: 'PROPERTY_MANAGER',
    landlord: 'LANDLORD',
    admin: 'ADMIN',
  };
  const id = String(notification.id || notification._id || '');

  return {
    id,
    notificationId: notification.notificationId || `NOT-${id.slice(-8).toUpperCase()}`,
    userId: String(notification.userId || notification.recipient?._id || notification.recipient || ''),
    userRole: roleLabels[String(rawRole).toLowerCase()] || rawRole,
    type: notificationTypeLabels[rawType] || 'General',
    title: notification.title || '',
    message: notification.message || '',
    read: Boolean(notification.read),
    readAt: notification.readAt || null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
    relatedEntity: notification.relatedEntity || '',
    relatedId: String(notification.relatedId || notification.relatedEntityId || ''),
    relatedRoute: notification.relatedRoute || notification.link || '',
  };
}

async function requestNotificationApi(request) {
  try {
    return (await request).data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Unable to complete the notification request. Please try again.'
    );
  }
}

export const notificationApi = {
  getNotifications: async (filters = {}) => {
    const params = {};
    if (filters.read !== undefined) params.read = String(filters.read);
    const response = await requestNotificationApi(api.get('/notifications', { params }));
    return {
      data: (response.data || []).map(fromNotificationApiResponse),
      count: response.count || 0,
      unreadCount: response.unreadCount || 0,
    };
  },

  getNotification: async (id) => {
    const response = await requestNotificationApi(api.get(`/notifications/${id}`));
    return {
      data: fromNotificationApiResponse(response.data || response),
    };
  },

  addNotification: async (values) => {
    const response = await requestNotificationApi(api.post('/notifications', toNotificationApiPayload(values)));
    return {
      data: fromNotificationApiResponse(response.data || response),
      success: true,
    };
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await requestNotificationApi(api.put(`/notifications/${notificationId}/read`));
    return {
      data: fromNotificationApiResponse(response.data || response),
      success: true,
    };
  },

  markAllNotificationsAsRead: async () => {
    const response = await requestNotificationApi(api.put('/notifications/read-all'));
    return {
      ...response,
      data: (response.data || []).map(fromNotificationApiResponse),
    };
  },

  deleteNotification: async (notificationId) => {
    const response = await requestNotificationApi(api.delete(`/notifications/${notificationId}`));
    return {
      success: response.success,
      id: notificationId,
    };
  },
};

// ============================================================
// DEFAULT AXIOS INSTANCE
// ============================================================

export default api;
