import { api } from "./api"; // Imports your team's central api.js configuration

export const applicationService = {
  /**
   * Submit a new rental application for a specific property (Customer role)
   * @param {string} propertyId - The ID of the property
   * @param {Object} applicationData - { monthlyIncome, employmentStatus, occupantsCount, notes }
   */
  createApplication: async (propertyId, applicationData) => {
    try {
      // Calls POST /api/rental-applications/properties/:id
      return await api.createApplication(propertyId, applicationData);
    } catch (error) {
      throw error.response?.data || { message: "Failed to submit rental application" };
    }
  },

  /**
   * Fetch all rental applications submitted by the logged-in customer (Customer role)
   */
  getMyApplications: async () => {
    try {
      // Calls GET /api/rental-applications/me
      return await api.getMyApplications();
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch your rental applications" };
    }
  },

  /**
   * Fetch all rental applications across properties (Management/Staff roles)
   * @param {string} [status=''] - Optional status query filter ('pending', 'approved', 'rejected')
   */
  getAllApplications: async (status = "") => {
    try {
      // Calls GET /api/rental-applications?status=...
      return await api.getAllApplications(status);
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch applications list" };
    }
  },

  /**
   * Update an application's status or details (Management/Admin role)
   * @param {string} id - The unique application ID
   * @param {Object} updateData - e.g. { status: "approved" }
   */
  updateApplication: async (id, updateData) => {
    try {
      // Calls PATCH /api/rental-applications/:id
      return await api.updateApplication(id, updateData);
    } catch (error) {
      throw error.response?.data || { message: "Failed to update rental application" };
    }
  },
};