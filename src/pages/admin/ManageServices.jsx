import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  createService,
  deleteService,
  getBranches,
  getServices,
  updateService,
} from "../../api/api";

import "./ManageServices.css";

const initialFormData = {
  service_name: "",
  description: "",
  branch: "",
};

function ManageServices() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadServicesAndBranches = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [servicesResponse, branchesResponse] =
        await Promise.all([
          getServices(),
          getBranches(),
        ]);

      setServices(servicesResponse.data);
      setBranches(branchesResponse.data);
    } catch (error) {
      console.error("Failed to load services:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to load services."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServicesAndBranches();
  }, []);

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !normalizedSearch ||
        service.service_name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        service.description
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesBranch =
        branchFilter === "all" ||
        Number(service.branch) === Number(branchFilter);

      return matchesSearch && matchesBranch;
    });
  }, [services, searchTerm, branchFilter]);

  const getBranchName = (branchId) => {
    const branch = branches.find(
      (item) => Number(item.id) === Number(branchId)
    );

    return branch
      ? branch.branch_name
      : "Unknown branch";
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const openAddModal = () => {
    clearMessages();
    setEditingServiceId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (service) => {
    clearMessages();

    setEditingServiceId(service.id);

    setFormData({
      service_name: service.service_name || "",
      description: service.description || "",
      branch: service.branch || "",
    });

    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setShowFormModal(false);
    setEditingServiceId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const openDeleteModal = (service) => {
    clearMessages();
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.service_name.trim()) {
      errors.service_name =
        "Service name is required.";
    }

    if (!formData.branch) {
      errors.branch = "Please select a branch.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    const servicePayload = {
      service_name: formData.service_name.trim(),
      description:
        formData.description.trim() || null,
      branch: Number(formData.branch),
    };

    try {
      setIsSaving(true);

      if (editingServiceId) {
        const response = await updateService(
          editingServiceId,
          servicePayload
        );

        setServices((previousServices) =>
          previousServices.map((service) =>
            service.id === editingServiceId
              ? response.data
              : service
          )
        );

        setSuccessMessage(
          "Service updated successfully."
        );
      } else {
        const response =
          await createService(servicePayload);

        setServices((previousServices) => [
          response.data,
          ...previousServices,
        ]);

        setSuccessMessage(
          "Service added successfully."
        );
      }

      setShowFormModal(false);
      setEditingServiceId(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      console.error("Failed to save service:", error);

      const backendErrors = error.response?.data;

      if (
        backendErrors &&
        typeof backendErrors === "object" &&
        !backendErrors.detail
      ) {
        const convertedErrors = {};

        Object.entries(backendErrors).forEach(
          ([field, messages]) => {
            convertedErrors[field] =
              Array.isArray(messages)
                ? messages[0]
                : String(messages);
          }
        );

        setFormErrors(convertedErrors);
      } else {
        setErrorMessage(
          backendErrors?.detail ||
            "Failed to save service."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) {
      return;
    }

    try {
      setDeletingId(serviceToDelete.id);
      setErrorMessage("");

      await deleteService(serviceToDelete.id);

      setServices((previousServices) =>
        previousServices.filter(
          (service) =>
            service.id !== serviceToDelete.id
        )
      );

      setSuccessMessage(
        "Service deleted successfully."
      );

      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error("Failed to delete service:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to delete service."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const branchesWithServices = new Set(
    services.map((service) => service.branch)
  ).size;

  return (
    <div className="manage-services-page">
      <aside className="services-sidebar">
        <div className="services-sidebar-brand">
          <div className="services-brand-logo">
            PBZ
          </div>

          <div>
            <h1>PBZ GIS</h1>
            <p>Administration</p>
          </div>
        </div>

        <nav className="services-navigation">
          <p className="services-navigation-title">
            MAIN MENU
          </p>

          <Link
            to="/admin/dashboard"
            className="services-nav-link"
          >
            <span>DB</span>
            Dashboard
          </Link>

          <Link
            to="/admin/branches"
            className="services-nav-link"
          >
            <span>BR</span>
            Branches
          </Link>

          <Link
            to="/admin/categories"
            className="services-nav-link"
          >
            <span>CT</span>
            Categories
          </Link>

          <Link
            to="/admin/services"
            className="services-nav-link active"
          >
            <span>SV</span>
            Services
          </Link>

          <Link
            to="/admin/customers"
            className="services-nav-link"
          >
            <span>CU</span>
            Customers
          </Link>
        </nav>
      </aside>

      <main className="services-main">
        <header className="services-header">
          <div>
            <p className="services-overline">
              SERVICE MANAGEMENT
            </p>

            <h2>Manage Services</h2>

            <p>
              Add and manage services available at
              each PBZ branch.
            </p>
          </div>

          <button
            type="button"
            className="add-service-button"
            onClick={openAddModal}
          >
            <span>+</span>
            Add Service
          </button>
        </header>

        {successMessage && (
          <div className="services-alert success-alert">
            <span>✓</span>
            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="services-alert error-alert">
            <span>!</span>
            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="services-summary">
          <article>
            <span>Total Services</span>
            <strong>{services.length}</strong>
          </article>

          <article>
            <span>Total Branches</span>
            <strong>{branches.length}</strong>
          </article>

          <article>
            <span>Branches With Services</span>
            <strong>{branchesWithServices}</strong>
          </article>

          <article>
            <span>Displayed Results</span>
            <strong>{filteredServices.length}</strong>
          </article>
        </section>

        <section className="services-content-card">
          <div className="services-toolbar">
            <div className="services-search-box">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search service or description..."
              />
            </div>

            <select
              value={branchFilter}
              onChange={(event) =>
                setBranchFilter(event.target.value)
              }
              className="services-branch-filter"
            >
              <option value="all">
                All branches
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.branch_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="refresh-services-button"
              onClick={loadServicesAndBranches}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="services-table-wrapper">
            {isLoading ? (
              <div className="services-loading-state">
                <div className="services-spinner"></div>
                <p>Loading services...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="services-empty-state">
                <div>SV</div>

                <h3>No services found</h3>

                <p>
                  Add services offered by PBZ
                  branches.
                </p>

                <button
                  type="button"
                  onClick={openAddModal}
                >
                  Add first service
                </button>
              </div>
            ) : (
              <table className="manage-services-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th>Branch</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div className="service-information">
                          <div className="service-avatar">
                            {service.service_name
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {service.service_name}
                            </strong>

                            <span>
                              Service ID: {service.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <p className="service-description">
                          {service.description ||
                            "No description provided."}
                        </p>
                      </td>

                      <td>
                        <span className="service-branch-badge">
                          {getBranchName(
                            service.branch
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="service-actions">
                          <button
                            type="button"
                            className="edit-service-button"
                            onClick={() =>
                              openEditModal(service)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-service-button"
                            onClick={() =>
                              openDeleteModal(service)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading &&
            filteredServices.length > 0 && (
              <div className="services-table-footer">
                Showing {filteredServices.length} of{" "}
                {services.length} services
              </div>
            )}
        </section>
      </main>

      {showFormModal && (
        <div
          className="service-modal-overlay"
          onMouseDown={closeFormModal}
        >
          <section
            className="service-form-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="service-modal-header">
              <div>
                <p>
                  {editingServiceId
                    ? "UPDATE SERVICE"
                    : "NEW SERVICE"}
                </p>

                <h2>
                  {editingServiceId
                    ? "Edit Service"
                    : "Add Service"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={isSaving}
              >
                ×
              </button>
            </div>

            <form
              className="service-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="service-form-group">
                <label htmlFor="service_name">
                  Service name
                </label>

                <input
                  type="text"
                  id="service_name"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleInputChange}
                  placeholder="Example: Money Transfer"
                  className={
                    formErrors.service_name
                      ? "field-has-error"
                      : ""
                  }
                />

                {formErrors.service_name && (
                  <small>
                    {formErrors.service_name}
                  </small>
                )}
              </div>

              <div className="service-form-group">
                <label htmlFor="branch">
                  Branch
                </label>

                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className={
                    formErrors.branch
                      ? "field-has-error"
                      : ""
                  }
                >
                  <option value="">
                    Select branch
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.branch_name}
                    </option>
                  ))}
                </select>

                {formErrors.branch && (
                  <small>{formErrors.branch}</small>
                )}
              </div>

              <div className="service-form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the service..."
                  rows="5"
                />

                {formErrors.description && (
                  <small>
                    {formErrors.description}
                  </small>
                )}
              </div>

              <div className="service-form-actions">
                <button
                  type="button"
                  className="cancel-service-form"
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-service-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingServiceId
                      ? "Update Service"
                      : "Add Service"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showDeleteModal && serviceToDelete && (
        <div
          className="service-modal-overlay"
          onMouseDown={closeDeleteModal}
        >
          <section
            className="service-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="service-delete-icon">
              !
            </div>

            <h2>Delete service?</h2>

            <p>
              You are about to delete{" "}
              <strong>
                {serviceToDelete.service_name}
              </strong>{" "}
              from{" "}
              <strong>
                {getBranchName(
                  serviceToDelete.branch
                )}
              </strong>
              .
            </p>

            <div className="service-delete-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId
                  ? "Deleting..."
                  : "Delete Service"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ManageServices;