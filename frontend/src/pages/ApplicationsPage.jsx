import React, { useState, useEffect } from "react";
import { applicationService } from "../services/applicationService";
import { api } from "../services/api";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter state for management view
  const [statusFilter, setStatusFilter] = useState("");

  // Customer application form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: "",
    monthlyIncome: "",
    employmentStatus: "employed",
    occupantsCount: 1,
    notes: "",
  });

  const staffRoles = ["agent", "property_manager", "admin", "super_admin"];

  useEffect(() => {
    initializePage();
  }, [statusFilter]);

  const initializePage = async () => {
    try {
      setLoading(true);
      
      // Fetch authenticated user profile to determine role
      const userRes = await api.me();
      const user = userRes.data || userRes;
      setCurrentUser(user);

      const isStaff = staffRoles.includes(user.role);

      // Fetch appropriate data based on role
      const response = isStaff 
        ? await applicationService.getAllApplications(statusFilter) 
        : await applicationService.getMyApplications();

      setApplications(response.applications || response.data || response);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    try {
      await applicationService.createApplication(formData.propertyId, {
        monthlyIncome: Number(formData.monthlyIncome),
        employmentStatus: formData.employmentStatus,
        occupantsCount: Number(formData.occupantsCount),
        notes: formData.notes,
      });

      setShowForm(false);
      setFormData({
        propertyId: "",
        monthlyIncome: "",
        employmentStatus: "employed",
        occupantsCount: 1,
        notes: "",
      });
      initializePage();
    } catch (err) {
      alert(err.message || "Failed to submit application.");
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await applicationService.updateApplication(id, { status: newStatus });
      initializePage();
    } catch (err) {
      alert(err.message || "Failed to update application status.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading applications...</div>;
  }

  const isStaffUser = currentUser && staffRoles.includes(currentUser.role);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isStaffUser ? "Management: Rental Applications" : "My Rental Applications"}
          </h1>
          <p className="text-sm text-gray-600">
            {isStaffUser
              ? "Review prospective tenant submissions, filter by status, and approve or reject."
              : "Track the status of your submitted property applications or apply for a new home."}
          </p>
        </div>

        {/* Customer Action Toggle */}
        {!isStaffUser && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? "Cancel" : "+ New Application"}
          </button>
        )}

        {/* Staff Filter Dropdown */}
        {isStaffUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg p-2 text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>\n              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      {/* Customer Submission Form */}
      {showForm && !isStaffUser && (
        <form onSubmit={handleSubmitApplication} className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Submit Rental Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
              <input
                type="text"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleInputChange}
                required
                placeholder="Enter Property ID"
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income ($)</label>
              <input
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleInputChange}
                required
                placeholder="5000"
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
              <select
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupants Count</label>
              <input
                type="number"
                name="occupantsCount"
                min="1"
                value={formData.occupantsCount}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Additional Info</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any details you'd like the property manager to know..."
              className="w-full border rounded p-2"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">
            Submit Application
          </button>
        </form>
      )}

      {/* Applications Data Table */}
      {applications.length === 0 ? (
        <div className="bg-gray-50 text-center p-8 rounded-lg border border-gray-200 text-gray-500">
          No applications found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                {isStaffUser && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {app.propertyId?.title || app.propertyId}
                  </td>
                  {isStaffUser && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.userId?.name || app.userId?.email || "Applicant"}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${app.monthlyIncome?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {app.employmentStatus}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {app.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isStaffUser ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(app._id, "approved")}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app._id, "rejected")}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Under Review</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}