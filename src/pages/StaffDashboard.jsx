import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function StaffDashboard() {
  const [data, setData] = useState({});
  const [properties, setProperties] = useState([]);
  const [showProperties, setShowProperties] = useState(false);
  const [error, setError] = useState("");

  const [applications, setApplications] = useState([]);
  const [showApplications, setShowApplications] = useState(false);

  const [viewings, setViewings] = useState([]);
  const [showViewings, setShowViewings] = useState(false);

  const [inquiries, setInquiries] = useState([]);
  const [showInquiries, setShowInquiries] = useState(false);

  const [leases, setLeases] = useState([]);
  const [showLeases, setShowLeases] = useState(false);

  const [payments, setPayments] = useState([]);
  const [showPayments, setShowPayments] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setError("");

        const results = await Promise.allSettled([
          api.getAllPropertiesForStaff(),
          api.getAllApplications(),
          api.getAllViewings(),
          api.getAllInquiries(),
          api.getAllLeases(),
          api.getAllPayments()
        ]);

        const [
          propertiesResult,
          applicationsResult,
          viewingsResult,
          inquiriesResult,
          leasesResult,
          paymentsResult
        ] = results;

        console.log("Staff properties:", propertiesResult);
        console.log("Staff applications:", applicationsResult);
        console.log("Staff viewings:", viewingsResult);
        console.log("Staff inquiries:", inquiriesResult);
        console.log("Staff leases:", leasesResult);
        console.log("Staff payments:", paymentsResult);

        const properties =
          propertiesResult.status === "fulfilled"
            ? propertiesResult.value.properties || []
            : [];

        const applications =
          applicationsResult.status === "fulfilled"
            ? applicationsResult.value.applications || []
            : [];

        const viewings =
          viewingsResult.status === "fulfilled"
            ? viewingsResult.value.viewings || []
            : [];

        const inquiries =
          inquiriesResult.status === "fulfilled"
            ? inquiriesResult.value.inquiries || []
            : [];

        const leases =
          leasesResult.status === "fulfilled"
            ? leasesResult.value.leases || []
            : [];

        const payments =
          paymentsResult.status === "fulfilled"
            ? paymentsResult.value.payments || []
            : [];

        setProperties(properties);
        setApplications(applications);
        setViewings(viewings);
        setInquiries(inquiries);
        setLeases(leases);
        setPayments(payments);

        setData({
          properties: properties.length,
          applications: applications.length,
          viewings: viewings.length,
          inquiries: inquiries.length,
          leases: leases.length,
          payments: payments.length
        });

        const failedRequests = results.filter(
          (result) => result.status === "rejected"
        );

        if (failedRequests.length > 0) {
  setError("Some dashboard data could not be loaded.");
}
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError(err.message || "Failed to load dashboard data.");
      }
    };

    loadDashboardData();
  }, []);

  return (
    <main className="section">
      <span className="eyebrow">MANAGEMENT PORTAL</span>

      <h1>Staff Dashboard</h1>

      <p className="muted">
        This dashboard reads the existing staff endpoints and displays
        management data according to staff permissions.
      </p>

      {error && <div className="alert error">{error}</div>}

      <div className="stats-grid">
        {Object.entries(data).map(([key, value]) => (
          <div className="stat-card" key={key}>
            <strong>{value}</strong>
            <span>{key}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Management areas</h2>

        <div className="management-grid">
          <div
            className="management-card clickable"
            onClick={() => setShowProperties((old) => !old)}
          >
            <h3>Properties</h3>

            <p>
              Create, update, publish, change status and delete listings
              according to staff role.
            </p>

            <span>
              {showProperties ? "Hide properties" : "View properties"}
            </span>
          </div>

          <div
            className="management-card clickable"
            onClick={() => setShowApplications((old) => !old)}
          >
            <h3>Applications</h3>

            <p>
              Review customer rental applications and approve/reject them.
            </p>

            <span>
              {showApplications ? "Hide applications" : "View applications"}
            </span>
          </div>

          <div
            className="management-card clickable"
            onClick={() => setShowViewings((old) => !old)}
          >
            <h3>Viewings</h3>

            <p>
              Confirm, reschedule or manage viewing requests.
            </p>

            <span>
              {showViewings ? "Hide viewings" : "View viewings"}
            </span>
          </div>

          <div
            className="management-card clickable"
            onClick={() => setShowInquiries((old) => !old)}
          >
            <h3>Inquiries</h3>

            <p>
              Track and update customer inquiries.
            </p>

            <span>
              {showInquiries ? "Hide inquiries" : "View inquiries"}
            </span>
          </div>

          <div
            className="management-card clickable"
            onClick={() => setShowLeases((old) => !old)}
          >
            <h3>Leases</h3>

            <p>
              Create leases from approved applications and
              activate/terminate them.
            </p>

            <span>
              {showLeases ? "Hide leases" : "View leases"}
            </span>
          </div>

          <div
            className="management-card clickable"
            onClick={() => setShowPayments((old) => !old)}
          >
            <h3>Payments</h3>

            <p>
              Review payment records and statuses.
            </p>

            <span>
              {showPayments ? "Hide payments" : "View payments"}
            </span>
          </div>
        </div>

        {showProperties && (
          <div>
            <h2>Property Listings</h2>

            {properties.length === 0 ? (
              <p className="muted">No properties found.</p>
            ) : (
              properties.map((property) => (
                <div
                  key={property._id}
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px"
                  }}
                >
                  <h3>{property.title}</h3>

                  <p>
                    <strong>Property code:</strong>{" "}
                    {property.propertyCode}
                  </p>

                  <p>
                    <strong>Type:</strong>{" "}
                    {property.propertyType}
                  </p>

                  <p>
                    <strong>Location:</strong>{" "}
                    {property.location?.area},{" "}
                    {property.location?.city},{" "}
                    {property.location?.state}
                  </p>

                  <p>
                    <strong>Rent:</strong>{" "}
                    ₦{property.rent?.amount?.toLocaleString()} /{" "}
                    {property.rent?.period}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {property.status}
                  </p>

                  <p>
                    <strong>Visibility:</strong>{" "}
                    {property.visibility}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {showApplications && (
          <div>
            <h2>Rental Applications</h2>

            {applications.length === 0 ? (
              <p className="muted">No applications found.</p>
            ) : (
              applications.map((application) => (
                <div
                  key={application._id}
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px"
                  }}
                >
                  <h3>
                    {application.property?.title || "Rental Application"}
                  </h3>

                  <p>
                    <strong>Status:</strong>{" "}
                    {application.status}
                  </p>

                  <p>
                    <strong>Application ID:</strong>{" "}
                    {application._id}
                  </p>

                  <p>
                    <strong>Applicant:</strong>{" "}
                    {application.applicant?.firstName || ""}{" "}
                    {application.applicant?.lastName || ""}
                  </p>

                  <p>
                    <strong>Property:</strong>{" "}
                    {application.property?.title || "Not available"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {showViewings && (
          <div>
            <h2>Property Viewings</h2>

            {viewings.length === 0 ? (
              <p className="muted">No viewings found.</p>
            ) : (
              viewings.map((viewing) => (
                <div
                  key={viewing._id}
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px"
                  }}
                >
                  <h3>
                    {viewing.property?.title || "Property Viewing"}
                  </h3>

                  <p>
                    <strong>Status:</strong>{" "}
                    {viewing.status}
                  </p>

                  <p>
                    <strong>Customer:</strong>{" "}
                    {viewing.user?.firstName || ""}{" "}
                    {viewing.user?.lastName || ""}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {viewing.user?.email || "Not available"}
                  </p>

                  <p>
                    <strong>Scheduled for:</strong>{" "}
                    {viewing.scheduledFor
                      ? new Date(viewing.scheduledFor).toLocaleString()
                      : "Not scheduled"}
                  </p>

                  <p>
                    <strong>Type:</strong>{" "}
                    {viewing.type}
                  </p>

                  <p>
                    <strong>Notes:</strong>{" "}
                    {viewing.notes || "No notes"}
                  </p>

                  <p>
                    <strong>Viewing ID:</strong>{" "}
                    {viewing._id}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {showInquiries && (
          <div>
            <h2>Customer Inquiries</h2>

            {inquiries.length === 0 ? (
              <p className="muted">No inquiries found.</p>
            ) : (
              inquiries.map((inquiry) => (
                <div
                  key={inquiry._id}
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px"
                  }}
                >
                  <h3>
                    {inquiry.subject || "Customer Inquiry"}
                  </h3>

                  <p>
                    <strong>Status:</strong>{" "}
                    {inquiry.status}
                  </p>

                  <p>
                    <strong>Customer:</strong>{" "}
                    {inquiry.user?.firstName || ""}{" "}
                    {inquiry.user?.lastName || ""}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {inquiry.user?.email || "Not available"}
                  </p>

                  <p>
                    <strong>Message:</strong>{" "}
                    {inquiry.message || "No message"}
                  </p>

                  <p>
                    <strong>Inquiry ID:</strong>{" "}
                    {inquiry._id}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {showLeases && (
          <div>
            <h2>Leases</h2>

            {leases.length === 0 ? (
              <p className="muted">No leases found.</p>
            ) : (
              leases.map((lease) => (
                <div
                  key={lease._id}
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px"
                  }}
                >
                  <h3>
                    {lease.property?.title || "Lease"}
                  </h3>

                  <p>
                    <strong>Lease Number:</strong>{" "}
                    {lease.leaseNumber}
                  </p>

                  <p>
                    <strong>Property Code:</strong>{" "}
                    {lease.property?.propertyCode || "Not available"}
                  </p>

                  <p>
                    <strong>Tenant:</strong>{" "}
                    {lease.tenant?.firstName || ""}{" "}
                    {lease.tenant?.lastName || ""}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {lease.tenant?.email || "Not available"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {lease.tenant?.phone || "Not available"}
                  </p>

                  <p>
                    <strong>Start Date:</strong>{" "}
                    {lease.startDate
                      ? new Date(lease.startDate).toLocaleDateString()
                      : "Not available"}
                  </p>

                  <p>
                    <strong>End Date:</strong>{" "}
                    {lease.endDate
                      ? new Date(lease.endDate).toLocaleDateString()
                      : "Not available"}
                  </p>

                  <p>
                    <strong>Rent:</strong>{" "}
                    {lease.currency}{" "}
                    {lease.rentAmount?.toLocaleString()}{" "}
                    / {lease.rentPeriod}
                  </p>

                  <p>
                    <strong>Service Charge:</strong>{" "}
                    {lease.currency}{" "}
                    {lease.serviceCharge?.toLocaleString()}
                  </p>

                  <p>
                    <strong>Security Deposit:</strong>{" "}
                    {lease.currency}{" "}
                    {lease.securityDeposit?.toLocaleString()}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {lease.status}
                  </p>

                  <p>
                    <strong>Application Status:</strong>{" "}
                    {lease.rentalApplication?.status || "Not available"}
                  </p>

                  <p>
                    <strong>Lease ID:</strong>{" "}
                    {lease._id}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {showPayments && (
          <div>
            <h2>Payments</h2>

            {payments.length === 0 ? (
              <p className="muted">No payments found.</p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment._id}
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px"
                  }}
                >
                  <h3>Payment Record</h3>

                  {Object.entries(payment).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong>{" "}
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
