const assert = require("node:assert/strict");
const { test } = require("node:test");
const Payment = require("../models/payment");
const Property = require("../models/property");
const Lease = require("../models/lease");
const User = require("../models/user");
const paymentController = require("../controllers/paymentController");

const tenantId = "64b000000000000000000001";
const propertyId = "64b000000000000000000002";
const leaseId = "64b000000000000000000003";
const paymentId = "64b000000000000000000004";

function query(value) {
  return { select: async () => value };
}

function setupMocks(t, lease = null) {
  const tenant = {
    _id: tenantId,
    role: "tenant",
    firstName: "Test",
    lastName: "Tenant",
    email: "tenant@example.test",
  };
  const property = { _id: propertyId, title: "Test Property" };
  let createdPayment;

  t.mock.method(User, "findById", () => query(tenant));
  t.mock.method(Property, "findById", () => query(property));
  t.mock.method(Lease, "findById", () => query(lease));
  t.mock.method(Payment, "findOne", () => query(null));
  t.mock.method(Payment, "create", async (input) => {
    createdPayment = input;
    return { _id: paymentId };
  });
  t.mock.method(Payment, "findById", () => ({
    populate: async () => ({
      ...createdPayment,
      _id: paymentId,
      user: tenant,
      property,
      lease: createdPayment.lease ? { _id: leaseId } : null,
    }),
  }));

  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  return {
    response,
    get createdPayment() {
      return createdPayment;
    },
    request(body) {
      return {
        user: { id: tenantId, role: "tenant" },
        body: { propertyId, amount: 500, ...body },
      };
    },
  };
}

test("tenant-supplied status and paid dates cannot mark a payment successful", async (t) => {
  const state = setupMocks(t, {
    _id: leaseId,
    tenant: tenantId,
    property: propertyId,
    status: "active",
  });

  await paymentController.createPayment(state.request({
    type: "rent",
    leaseId,
    status: "successful",
    paidAt: "2026-10-01T00:00:00.000Z",
    paidDate: "2026-10-01",
    metadata: {
      status: "successful",
      paidAt: "2026-10-01T00:00:00.000Z",
      paidDate: "2026-10-01",
      description: "Rent",
    },
  }), state.response);

  assert.equal(state.response.statusCode, 201);
  assert.equal(state.createdPayment.status, "pending");
  assert.equal(state.createdPayment.paidAt, null);
  assert.deepEqual(state.createdPayment.metadata, { description: "Rent" });
  assert.equal(state.response.body.data.status, "pending");
  assert.equal(state.response.body.data.paidDate, "");
});

test("ordinary payment updates cannot change status or paidAt", async (t) => {
  const managerId = "64b000000000000000000005";
  const tenant = { _id: tenantId, role: "tenant", firstName: "Test", lastName: "Tenant", email: "tenant@example.test" };
  const property = { _id: propertyId, title: "Test Property", assignedAgent: managerId };
  const payment = {
    _id: paymentId,
    user: tenant,
    property,
    lease: null,
    amount: 500,
    type: "rent",
    provider: "paystack",
    reference: "PAY-EXISTING",
    status: "pending",
    paidAt: null,
    metadata: {},
    async save() {},
  };
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  t.mock.method(Payment, "findById", () => ({ populate: async () => payment }));
  t.mock.method(User, "findById", () => query(tenant));
  t.mock.method(Property, "findById", () => query(property));
  t.mock.method(Payment, "findOne", () => query(null));

  await paymentController.updatePayment({
    params: { id: paymentId },
    user: { id: managerId, role: "property_manager" },
    body: { status: "successful", paidAt: "2026-10-01T00:00:00.000Z" },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(payment.status, "pending");
  assert.equal(payment.paidAt, null);
});

test("rent payment rejects a lease for a different property", async (t) => {
  const state = setupMocks(t, {
    _id: leaseId,
    tenant: tenantId,
    property: "64b000000000000000000099",
    status: "active",
  });

  await paymentController.createPayment(state.request({ type: "rent", leaseId }), state.response);

  assert.equal(state.response.statusCode, 400);
  assert.match(state.response.body.message, /selected property/);
});

test("rent payment rejects a lease for a different tenant", async (t) => {
  const state = setupMocks(t, {
    _id: leaseId,
    tenant: "64b000000000000000000099",
    property: propertyId,
    status: "active",
  });

  await paymentController.createPayment(state.request({ type: "rent", leaseId }), state.response);

  assert.equal(state.response.statusCode, 400);
  assert.match(state.response.body.message, /selected tenant/);
});

test("rent payment rejects a lease that is not active", async (t) => {
  const state = setupMocks(t, {
    _id: leaseId,
    tenant: tenantId,
    property: propertyId,
    status: "terminated",
  });

  await paymentController.createPayment(state.request({ type: "rent", leaseId }), state.response);

  assert.equal(state.response.statusCode, 400);
  assert.match(state.response.body.message, /lease status/);
});

test("application fee can be recorded without a lease", async (t) => {
  const state = setupMocks(t);

  await paymentController.createPayment(state.request({ type: "application_fee" }), state.response);

  assert.equal(state.response.statusCode, 201);
  assert.equal(state.createdPayment.type, "application_fee");
  assert.equal(state.createdPayment.lease, null);
  assert.equal(state.createdPayment.status, "pending");
});

test("rent payment requires a lease", async (t) => {
  const state = setupMocks(t);

  await paymentController.createPayment(state.request({ type: "rent" }), state.response);

  assert.equal(state.response.statusCode, 400);
  assert.match(state.response.body.message, /lease is required/);
});