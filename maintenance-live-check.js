require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/user');
const Property = require('./models/property');
const Lease = require('./models/lease');
const MaintenanceRequest = require('./models/maintenanceRequest');
const generateToken = require('./config/jwt');

async function api(url, method = 'GET', token = '', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: res.status,
    body: await res.text(),
  };
}

(async () => {
  try {
    await connectDB();
    const unique = Date.now();

    const ensureUser = async (email, firstName, lastName, role) => {
      let user = await User.findOne({ email }).lean();
      if (!user) {
        const created = await User.create({
          firstName,
          lastName,
          email,
          phone: `+234${String(Math.floor(1000000000 + Math.random() * 9000000000))}`,
          password: 'Password123!',
          role,
          status: 'active',
        });
        user = created.toObject();
      }
      return user;
    };

    const ensureProperty = async (title, ownerId, agentId) => {
      let existing = await Property.findOne({ title }).lean();
      if (existing) return existing;
      const created = await Property.create({
        propertyCode: `MNT-${unique}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        title,
        slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${unique}`,
        description: 'Live maintenance verification property.',
        propertyType: 'apartment',
        rent: { amount: 1200000, period: 'monthly', currency: 'NGN' },
        serviceCharge: { amount: 0, period: 'monthly', currency: 'NGN' },
        cautionFee: { amount: 250000, currency: 'NGN' },
        location: { address: '1 Test Street', area: 'Lekki', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
        owner: ownerId,
        assignedAgent: agentId,
        status: 'available',
        visibility: 'public',
        bedrooms: 2,
        bathrooms: 2,
        units: 1,
        squareFootage: 1200,
        amenities: ['Parking'],
      });
      return created.toObject();
    };

    const ensureLease = async (tenantId, propertyId) => {
      let existing = await Lease.findOne({ tenant: tenantId, property: propertyId, status: 'active' }).lean();
      if (existing) return existing;
      const created = await Lease.create({
        leaseNumber: `MNT-L-${unique}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        tenant: tenantId,
        property: propertyId,
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        rentAmount: 1200000,
        rentPeriod: 'monthly',
        securityDeposit: 250000,
        paymentDueDate: new Date(),
        lateFee: 50000,
        noticePeriodDays: 30,
        renewalTerms: 'Mutual renewal',
        occupancyLimit: 4,
        additionalNotes: 'Testing maintenance lease',
        status: 'active',
      });
      return created.toObject();
    };

    const tenantA = await ensureUser(`tenant_${unique}_a@example.test`, 'Tenant', 'Alpha', 'tenant');
    const tenantB = await ensureUser(`tenant_${unique}_b@example.test`, 'Tenant', 'Bravo', 'tenant');
    const managerA = await ensureUser(`manager_${unique}_a@example.test`, 'Manager', 'Alpha', 'property_manager');
    const managerB = await ensureUser(`manager_${unique}_b@example.test`, 'Manager', 'Beta', 'property_manager');
    const landlordA = await ensureUser(`landlord_${unique}_a@example.test`, 'Landlord', 'Alpha', 'landlord');
    const landlordB = await ensureUser(`landlord_${unique}_b@example.test`, 'Landlord', 'Bravo', 'landlord');
    const admin = await ensureUser(`admin_${unique}@example.test`, 'Admin', 'One', 'admin');

    const propA = await ensureProperty(`Maintenance Property A ${unique}`, landlordA._id, managerA._id);
    const propB = await ensureProperty(`Maintenance Property B ${unique}`, landlordB._id, managerB._id);
    const leaseA = await ensureLease(tenantA._id, propA._id);
    const leaseB = await ensureLease(tenantB._id, propB._id);

    const tenantAToken = generateToken({ _id: tenantA._id, role: 'tenant' });
    const tenantBToken = generateToken({ _id: tenantB._id, role: 'tenant' });
    const managerAToken = generateToken({ _id: managerA._id, role: 'property_manager' });
    const managerBToken = generateToken({ _id: managerB._id, role: 'property_manager' });
    const landlordAToken = generateToken({ _id: landlordA._id, role: 'landlord' });
    const landlordBToken = generateToken({ _id: landlordB._id, role: 'landlord' });
    const adminToken = generateToken({ _id: admin._id, role: 'admin' });

    const base = 'http://127.0.0.1:5015/api/maintenance';
    const results = [];
    const addResult = (name, status, body) => results.push({ name, status, body });

    const noJwt = await api(base, 'GET');
    addResult('No JWT', noJwt.status, noJwt.body);
    const badJwt = await api(base, 'GET', 'not-a-valid-token');
    addResult('Invalid JWT', badJwt.status, badJwt.body);

    const ownCreate = await api(base, 'POST', tenantAToken, {
      propertyId: String(propA._id),
      leaseId: String(leaseA._id),
      title: 'Tenant own request',
      description: 'This request is created by tenant A for their own property and must pass.',
      category: 'plumbing',
      priority: 'high',
    });
    addResult('Tenant creates own maintenance request', ownCreate.status, ownCreate.body);
    const ownRequest = (() => {
      try { return JSON.parse(ownCreate.body).data; } catch { return null; }
    })();

    const ownList = await api(base, 'GET', tenantAToken);
    addResult('Tenant lists own requests', ownList.status, ownList.body);
    const ownView = await api(`${base}/${(ownRequest && (ownRequest.id || ownRequest._id)) || 'missing'}`, 'GET', tenantAToken);
    addResult('Tenant views own request', ownView.status, ownView.body);

    const otherTenantRead = await api(`${base}/${(ownRequest && (ownRequest.id || ownRequest._id)) || 'missing'}`, 'GET', tenantBToken);
    addResult('Tenant cannot access another tenant request', otherTenantRead.status, otherTenantRead.body);

    const otherTenantUpdate = await api(`${base}/${(ownRequest && (ownRequest.id || ownRequest._id)) || 'missing'}`, 'PUT', tenantBToken, {
      title: 'Attempt by another tenant',
      description: 'This should not be allowed.'
    });
    addResult('Tenant cannot modify another tenant request', otherTenantUpdate.status, otherTenantUpdate.body);

    const createAgainstOtherTenantProperty = await api(base, 'POST', tenantAToken, {
      propertyId: String(propB._id),
      leaseId: String(leaseB._id),
      title: 'Wrong tenant property request',
      description: 'Tenant A should not create maintenance for tenant B property/lease.',
      category: 'electrical',
      priority: 'medium'
    });
    addResult('Tenant cannot create request against another tenant property/lease', createAgainstOtherTenantProperty.status, createAgainstOtherTenantProperty.body);

    const tenantPrivilegedStatus = await api(base, 'POST', tenantAToken, {
      propertyId: String(propA._id),
      leaseId: String(leaseA._id),
      title: 'Privileged status attempt',
      description: 'Tenant should not set completed status as part of their own request.',
      category: 'general',
      priority: 'medium',
      status: 'completed'
    });
    addResult('Tenant cannot arbitrarily set privileged status', tenantPrivilegedStatus.status, tenantPrivilegedStatus.body);

    const managerList = await api(base, 'GET', managerAToken);
    addResult('Manager can view maintenance requests for managed properties', managerList.status, managerList.body);

    const managerUpdate = await api(`${base}/${(ownRequest && (ownRequest.id || ownRequest._id)) || 'missing'}`, 'PUT', managerAToken, {
      status: 'assigned',
      assignedTo: managerA._id,
      resolutionNotes: 'Manager assigned the request.'
    });
    addResult('Manager can update an appropriate request/status', managerUpdate.status, managerUpdate.body);

    const unrelatedManagerRequest = await api(`${base}/${new mongoose.Types.ObjectId().toString()}`, 'GET', managerAToken);
    addResult('Manager cannot access unrelated property request', unrelatedManagerRequest.status, unrelatedManagerRequest.body);

    const landlordList = await api(base, 'GET', landlordAToken);
    addResult('Landlord can view requests for owned properties', landlordList.status, landlordList.body);

    const landlordUpdate = await api(`${base}/${(ownRequest && (ownRequest.id || ownRequest._id)) || 'missing'}`, 'PUT', landlordAToken, {
      status: 'under_review',
      resolutionNotes: 'Landlord reviewed the issue.'
    });
    addResult('Landlord can update appropriate requests', landlordUpdate.status, landlordUpdate.body);

    const otherLandlordRequest = await MaintenanceRequest.create({
      tenant: tenantB._id,
      property: propB._id,
      lease: leaseB._id,
      title: 'Other landlord property',
      description: 'This belongs to another landlord so landlord A should not access it.',
      category: 'general',
      priority: 'low',
      status: 'submitted',
      requestId: `MNT-${Date.now()}-OTHERLAND`,
    });
    const otherManagerAccess = await api(`${base}/${otherLandlordRequest._id}`, 'GET', managerAToken);
    addResult('Manager cannot access another manager property request', otherManagerAccess.status, otherManagerAccess.body);

    const otherLandlordAccess = await api(`${base}/${otherLandlordRequest._id}`, 'GET', landlordAToken);
    addResult('Landlord cannot access another landlord property request', otherLandlordAccess.status, otherLandlordAccess.body);

    const adminList = await api(base, 'GET', adminToken);
    addResult('Admin can list maintenance requests', adminList.status, adminList.body);

    const adminUpdate = await api(`${base}/${(ownRequest && (ownRequest.id || ownRequest._id)) || 'missing'}`, 'PUT', adminToken, {
      status: 'completed',
      resolutionNotes: 'Admin resolved the request.'
    });
    addResult('Admin can manage/update maintenance requests', adminUpdate.status, adminUpdate.body);

    const validation = [
      ['missing required fields', await api(base, 'POST', tenantAToken, { propertyId: String(propA._id) })],
      ['invalid maintenance request ID', await api(`${base}/invalid-id`, 'GET', tenantAToken)],
      ['nonexistent request', await api(`${base}/${new mongoose.Types.ObjectId().toString()}`, 'GET', tenantAToken)],
      ['invalid property', await api(base, 'POST', tenantAToken, { propertyId: 'not-valid', title: 'Bad property', description: 'Should fail', category: 'plumbing', priority: 'high' })],
      ['invalid lease', await api(base, 'POST', tenantAToken, { propertyId: String(propA._id), leaseId: 'not-valid', title: 'Bad lease', description: 'Should fail', category: 'plumbing', priority: 'high' })],
      ['invalid status', await api(base, 'POST', tenantAToken, { propertyId: String(propA._id), leaseId: String(leaseA._id), title: 'Bad status', description: 'Should fail', category: 'plumbing', priority: 'high', status: 'bogus-status' })],
      ['invalid priority', await api(base, 'POST', tenantAToken, { propertyId: String(propA._id), leaseId: String(leaseA._id), title: 'Bad priority', description: 'Should fail', category: 'plumbing', priority: 'bogus-priority' })],
      ['invalid category', await api(base, 'POST', tenantAToken, { propertyId: String(propA._id), leaseId: String(leaseA._id), title: 'Bad category', description: 'Should fail', category: 'bogus-category', priority: 'high' })],
    ];

    for (const [name, value] of validation) addResult(name, value.status, value.body);

    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
