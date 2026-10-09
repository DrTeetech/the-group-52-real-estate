require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const generateToken = require("./config/jwt");
const Notification = require("./models/notification");
const MaintenanceRequest = require("./models/maintenanceRequest");
require("./models/property");
const User = require("./models/user");

const baseUrl = process.env.NOTIFICATIONS_API_URL || "http://127.0.0.1:5015/api";
const results = [];

async function request(path, method = "GET", token = "", body = null) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  return { status: response.status, data };
}

function check(name, response, expectedStatus, predicate = true) {
  const passed = response.status === expectedStatus && predicate;
  results.push({
    name,
    status: response.status,
    expected: expectedStatus,
    passed,
    ...(response.data?.message ? { message: response.data.message } : {}),
  });
  return passed;
}

function authToken(user) {
  return generateToken({ _id: user._id, role: user.role });
}

async function verifyPersistedRecord(id) {
  const notification = await Notification.findById(id).lean();
  if (!notification) throw new Error(`Notification ${id} is missing from MongoDB.`);
  const owner = await User.findById(notification.recipient).lean();
  if (!owner) throw new Error(`Notification owner for ${id} is missing.`);

  const token = authToken(owner);
  const [detail, list] = await Promise.all([
    request(`/notifications/${id}`, "GET", token),
    request("/notifications", "GET", token),
  ]);
  const listed = (list.data.data || []).some((item) => item.id === String(id));
  const passed = detail.status === 200 && list.status === 200 && listed && detail.data.data?.read === notification.read;

  console.log(JSON.stringify({
    persistence: {
      mongoExists: true,
      id: String(notification._id),
      read: notification.read,
      readAt: notification.readAt,
      detailStatus: detail.status,
      listStatus: list.status,
      listed,
      passed,
    },
  }, null, 2));

  await mongoose.disconnect();
  if (!passed) process.exitCode = 1;
}

async function runSuite() {
  await connectDB();

  if (process.argv[2] === "verify" && process.argv[3]) {
    await verifyPersistedRecord(process.argv[3]);
    return;
  }

  const tenantUsers = await User.find({ role: "tenant" }).sort({ createdAt: 1 }).limit(2).lean();
  const manager = await User.findOne({ role: "property_manager" }).sort({ createdAt: -1 }).lean();
  const landlord = await User.findOne({ role: "landlord" }).sort({ createdAt: -1 }).lean();
  const admin = await User.findOne({ role: "admin" }).sort({ createdAt: -1 }).lean();
  const tenantA = tenantUsers[0];
  const tenantB = tenantUsers[1];
  if (!tenantA || !tenantB || !manager || !landlord || !admin) {
    throw new Error("Live verification requires two tenants and one user for each staff role.");
  }

  const tokens = {
    tenantA: authToken(tenantA),
    tenantB: authToken(tenantB),
    manager: authToken(manager),
    landlord: authToken(landlord),
    admin: authToken(admin),
  };

  const noToken = await request("/notifications");
  check("No JWT", noToken, 401);
  const invalidToken = await request("/notifications", "GET", "invalid.notification.token");
  check("Invalid JWT", invalidToken, 401);

  const initialList = await request("/notifications", "GET", tokens.tenantA);
  check("Tenant A lists own notifications", initialList, 200);
  const initialUnreadCount = initialList.data.unreadCount || 0;

  const makeNotification = (title, token, extra = {}) => request("/notifications", "POST", token, {
    title,
    message: `${title} live verification message.`,
    type: "Payment",
    ...extra,
  });

  const createdA = await makeNotification("Tenant A notification one", tokens.tenantA);
  const createdA2 = await makeNotification("Tenant A notification two", tokens.tenantA);
  const createdA3 = await makeNotification("Tenant A notification three", tokens.tenantA);
  check("Tenant creates notification", createdA, 201, createdA.data.data?.userId === String(tenantA._id) && createdA.data.data?.read === false);
  check("Tenant creates second unread notification", createdA2, 201, createdA2.data.data?.userId === String(tenantA._id));
  check("Tenant creates third unread notification", createdA3, 201, createdA3.data.data?.userId === String(tenantA._id));
  const notificationAId = createdA.data.data?.id;
  if (!notificationAId) {
    throw new Error(`Notification creation did not return an ID: ${JSON.stringify({ createdA, createdA2, createdA3 })}`);
  }

  const ownDetail = await request(`/notifications/${notificationAId}`, "GET", tokens.tenantA);
  check("Tenant gets own notification", ownDetail, 200, ownDetail.data.data?.id === notificationAId);

  const spoofRecipient = await makeNotification("Spoofed recipient attempt", tokens.tenantA, { recipient: String(tenantB._id) });
  check("Tenant cannot spoof another recipient", spoofRecipient, 403);

  const createdB = await makeNotification("Tenant B private notification", tokens.tenantB);
  check("Tenant B creates own private notification", createdB, 201, createdB.data.data?.userId === String(tenantB._id));
  const notificationBId = createdB.data.data?.id;
  if (!notificationBId) throw new Error("Tenant B notification creation did not return an ID.");

  const otherDetail = await request(`/notifications/${notificationAId}`, "GET", tokens.tenantB);
  check("Tenant cannot access another user's notification", otherDetail, 403);
  const otherRead = await request(`/notifications/${notificationAId}/read`, "PUT", tokens.tenantB, {});
  check("Tenant cannot mark another user's notification as read", otherRead, 403);
  const otherDelete = await request(`/notifications/${notificationAId}`, "DELETE", tokens.tenantB);
  check("Tenant cannot delete another user's notification", otherDelete, 403);

  const invalidId = await request("/notifications/not-an-object-id", "GET", tokens.tenantA);
  check("Invalid notification ID", invalidId, 400);
  const missingId = new mongoose.Types.ObjectId().toString();
  const nonexistent = await request(`/notifications/${missingId}`, "GET", tokens.tenantA);
  check("Nonexistent notification", nonexistent, 404);
  const missingFields = await request("/notifications", "POST", tokens.tenantA, { type: "general" });
  check("Missing required fields", missingFields, 400);
  const invalidType = await makeNotification("Invalid type", tokens.tenantA, { type: "bogus" });
  check("Invalid notification type", invalidType, 400);
  const invalidRelatedId = await makeNotification("Invalid related ID", tokens.tenantA, { relatedEntity: "payment", relatedEntityId: "not-an-object-id" });
  check("Invalid related entity ID", invalidRelatedId, 400);
  const invalidLink = await makeNotification("External link", tokens.tenantA, { link: "https://example.invalid" });
  check("External notification link rejected", invalidLink, 400);
  const invalidReadFilter = await request("/notifications?read=sometimes", "GET", tokens.tenantA);
  check("Invalid read filter", invalidReadFilter, 400);

  const listBeforeRead = await request("/notifications", "GET", tokens.tenantA);
  check("Tenant A list after creation", listBeforeRead, 200, (listBeforeRead.data.data || []).some((item) => item.id === notificationAId));
  const unreadBeforeRead = await request("/notifications?read=false", "GET", tokens.tenantA);
  check("Unread filter", unreadBeforeRead, 200, unreadBeforeRead.data.unreadCount === initialUnreadCount + 3);
  const readBeforeRead = await request("/notifications?read=true", "GET", tokens.tenantA);
  check("Read filter", readBeforeRead, 200);

  const markRead = await request(`/notifications/${notificationAId}/read`, "PUT", tokens.tenantA, {});
  check("Tenant marks own notification as read", markRead, 200, markRead.data.data?.read === true && Boolean(markRead.data.data?.readAt));
  const unreadAfterOne = await request("/notifications", "GET", tokens.tenantA);
  check("Unread count decreases after mark-read", unreadAfterOne, 200, unreadAfterOne.data.unreadCount === initialUnreadCount + 2);

  const tenantBUnreadBefore = await request("/notifications", "GET", tokens.tenantB);
  const tenantBRecord = await Notification.findById(notificationBId).lean();
  const markAll = await request("/notifications/read-all", "PUT", tokens.tenantA, {});
  check("Mark all as read", markAll, 200, markAll.data.unreadCount === 0 && (markAll.data.data || []).every((item) => item.read));
  const tenantAUnreadAfter = await request("/notifications", "GET", tokens.tenantA);
  check("Mark-all only clears authenticated user's unread count", tenantAUnreadAfter, 200, tenantAUnreadAfter.data.unreadCount === 0);
  const tenantBUnreadAfter = await request("/notifications", "GET", tokens.tenantB);
  const tenantBRecordAfter = await Notification.findById(notificationBId).lean();
  check("Mark-all does not change another user's read state", tenantBUnreadAfter, 200,
    tenantBUnreadBefore.data.unreadCount === tenantBUnreadAfter.data.unreadCount &&
    tenantBRecord?.read === false && tenantBRecordAfter?.read === false);

  for (const [role, user, token] of [
    ["Property manager", manager, tokens.manager],
    ["Landlord", landlord, tokens.landlord],
    ["Admin", admin, tokens.admin],
  ]) {
    const created = await makeNotification(`${role} own notification`, token);
    check(`${role} creates own notification`, created, 201, created.data.data?.userId === String(user._id));
    const ownList = await request("/notifications", "GET", token);
    check(`${role} lists only own notifications`, ownList, 200,
      (ownList.data.data || []).every((item) => item.userId === String(user._id)));
    const privateDetail = await request(`/notifications/${notificationAId}`, "GET", token);
    check(`${role} cannot view a tenant's private notification`, privateDetail, 403);
    const privateRead = await request(`/notifications/${notificationAId}/read`, "PUT", token, {});
    check(`${role} cannot mark a tenant's private notification as read`, privateRead, 403);
    const privateDelete = await request(`/notifications/${notificationAId}`, "DELETE", token);
    check(`${role} cannot delete a tenant's private notification`, privateDelete, 403);
  }

  const resolvedMaintenance = await MaintenanceRequest.findOne({ status: { $in: ["completed", "resolved"] } })
    .populate("property", "owner assignedAgent")
    .lean();
  if (resolvedMaintenance?.property?.assignedAgent) {
    const maintenanceManager = await User.findById(resolvedMaintenance.property.assignedAgent).lean();
    const maintenanceToken = authToken(maintenanceManager);
    const tenantId = String(resolvedMaintenance.tenant);
    const maintenanceNotification = await request("/notifications", "POST", maintenanceToken, {
      title: "Maintenance request resolved",
      message: "The related maintenance request has been resolved.",
      type: "Maintenance",
      userId: tenantId,
      relatedId: String(resolvedMaintenance._id),
      relatedRoute: `/maintenance/${resolvedMaintenance._id}`,
    });
    check("Resolved maintenance producer creates tenant notification", maintenanceNotification, 201,
      maintenanceNotification.data.data?.userId === tenantId && maintenanceNotification.data.data?.relatedId === String(resolvedMaintenance._id));

    const spoofedMaintenanceRecipient = await request("/notifications", "POST", maintenanceToken, {
      title: "Spoofed maintenance recipient",
      message: "This recipient does not own the related request.",
      type: "Maintenance",
      userId: String(tenantA._id),
      relatedId: String(resolvedMaintenance._id),
      relatedRoute: `/maintenance/${resolvedMaintenance._id}`,
    });
    check("Maintenance producer cannot choose unrelated recipient", spoofedMaintenanceRecipient, 403);
  } else {
    results.push({ name: "Resolved maintenance producer fixture", status: 0, expected: "resolved maintenance record with assigned manager", passed: false });
  }

  const deleteOwn = await request(`/notifications/${notificationBId}`, "DELETE", tokens.tenantB);
  check("User deletes own notification", deleteOwn, 200, deleteOwn.data.id === notificationBId);
  const deletedRecord = await Notification.findById(notificationBId).lean();
  check("Deleted notification removed from MongoDB", { status: deletedRecord ? 500 : 200 }, 200, !deletedRecord);

  const persistenceRecord = await Notification.findById(notificationAId).lean();
  if (!persistenceRecord) throw new Error("Created notification is missing from MongoDB.");
  const failures = results.filter((result) => !result.passed);
  console.log(JSON.stringify({
    results,
    persistenceRecordId: notificationAId,
    persistedReadState: persistenceRecord.read,
    failureCount: failures.length,
  }, null, 2));

  await mongoose.disconnect();
  if (failures.length) process.exitCode = 1;
}

runSuite().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});