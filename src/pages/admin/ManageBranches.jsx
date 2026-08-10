import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  createBranch,
  deleteBranch,
  getBranches,
  getCategories,
  updateBranch,
} from "../../api/api";

import "./ManageBranches.css";

const initialFormData = {
  branch_name: "",
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
  opening_hours: "",
  atm_status: true,
  category: "",
};

function ManageBranches() {
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [atmFilter, setAtmFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingBranchId, setEditingBranchId] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadBranchesAndCategories = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [branchesResponse, categoriesResponse] =
        await Promise.all([
          getBranches(),
          getCategories(),
        ]);

      setBranches(branchesResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error("Failed to load branches:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to load branch information."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchesAndCategories();
  }, []);

  const filteredBranches = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return branches.filter((branch) => {
      const matchesSearch =
        !normalizedSearch ||
        branch.branch_name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        branch.address
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        branch.phone
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesAtmStatus =
        atmFilter === "all" ||
        (atmFilter === "available" &&
          branch.atm_status === true) ||
        (atmFilter === "unavailable" &&
          branch.atm_status === false);

      return matchesSearch && matchesAtmStatus;
    });
  }, [branches, searchTerm, atmFilter]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) =>
        Number(item.id) === Number(categoryId)
    );

    return category
      ? category.category_name
      : "Not assigned";
  };

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const openAddModal = () => {
    resetMessages();
    setEditingBranchId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (branch) => {
    resetMessages();

    setEditingBranchId(branch.id);

    setFormData({
      branch_name: branch.branch_name || "",
      address: branch.address || "",
      latitude: branch.latitude || "",
      longitude: branch.longitude || "",
      phone: branch.phone || "",
      opening_hours: branch.opening_hours || "",
      atm_status: Boolean(branch.atm_status),
      category: branch.category || "",
    });

    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;

    setShowFormModal(false);
    setEditingBranchId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const openDeleteModal = (branch) => {
    resetMessages();
    setBranchToDelete(branch);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deletingId) return;

    setShowDeleteModal(false);
    setBranchToDelete(null);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.branch_name.trim()) {
      errors.branch_name =
        "Branch name is required.";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required.";
    }

    if (!formData.latitude.trim()) {
      errors.latitude = "Latitude is required.";
    } else {
      const latitude = Number(formData.latitude);

      if (
        Number.isNaN(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.latitude =
          "Enter a valid latitude between -90 and 90.";
      }
    }

    if (!formData.longitude.trim()) {
      errors.longitude =
        "Longitude is required.";
    } else {
      const longitude = Number(
        formData.longitude
      );

      if (
        Number.isNaN(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        errors.longitude =
          "Enter a valid longitude between -180 and 180.";
      }
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    }

    if (!formData.opening_hours.trim()) {
      errors.opening_hours =
        "Opening hours are required.";
    }

    if (!formData.category) {
      errors.category =
        "Please select a category.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    resetMessages();

    if (!validateForm()) {
      return;
    }

    const branchPayload = {
      branch_name: formData.branch_name.trim(),
      address: formData.address.trim(),
      latitude: formData.latitude.trim(),
      longitude: formData.longitude.trim(),
      phone: formData.phone.trim(),
      opening_hours:
        formData.opening_hours.trim(),
      atm_status: formData.atm_status,
      category: Number(formData.category),
    };

    try {
      setIsSaving(true);

      if (editingBranchId) {
        const response = await updateBranch(
          editingBranchId,
          branchPayload
        );

        setBranches((previousBranches) =>
          previousBranches.map((branch) =>
            branch.id === editingBranchId
              ? response.data
              : branch
          )
        );

        setSuccessMessage(
          "Branch updated successfully."
        );
      } else {
        const response =
          await createBranch(branchPayload);

        setBranches((previousBranches) => [
          response.data,
          ...previousBranches,
        ]);

        setSuccessMessage(
          "Branch added successfully."
        );
      }

      closeFormModal();
    } catch (error) {
      console.error("Failed to save branch:", error);

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
            "Failed to save branch. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;

    try {
      setDeletingId(branchToDelete.id);
      setErrorMessage("");

      await deleteBranch(branchToDelete.id);

      setBranches((previousBranches) =>
        previousBranches.filter(
          (branch) =>
            branch.id !== branchToDelete.id
        )
      );

      setSuccessMessage(
        "Branch deleted successfully."
      );

      setShowDeleteModal(false);
      setBranchToDelete(null);
    } catch (error) {
      console.error("Failed to delete branch:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to delete branch."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="manage-branches-page">
      <aside className="branches-sidebar">
        <div className="branches-sidebar-brand">
          <div className="branches-brand-logo">
            PBZ
          </div>

          <div>
            <h1>PBZ GIS</h1>
            <p>Administration</p>
          </div>
        </div>

        <nav className="branches-navigation">
          <p className="branches-navigation-title">
            MAIN MENU
          </p>

          <Link
            to="/admin/dashboard"
            className="branches-nav-link"
          >
            <span>DB</span>
            Dashboard
          </Link>

          <Link
            to="/admin/branches"
            className="branches-nav-link active"
          >
            <span>BR</span>
            Branches
          </Link>

          <Link
            to="/admin/categories"
            className="branches-nav-link"
          >
            <span>CT</span>
            Categories
          </Link>

          <Link
            to="/admin/services"
            className="branches-nav-link"
          >
            <span>SV</span>
            Services
          </Link>

          <Link
            to="/admin/customers"
            className="branches-nav-link"
          >
            <span>CU</span>
            Customers
          </Link>
        </nav>
      </aside>

      <main className="branches-main">
        <header className="branches-header">
          <div>
            <p className="branches-overline">
              BRANCH MANAGEMENT
            </p>

            <h2>Manage Branches</h2>

            <p>
              Add, update and manage PBZ branch
              information.
            </p>
          </div>

          <button
            type="button"
            className="add-branch-button"
            onClick={openAddModal}
          >
            <span>+</span>
            Add Branch
          </button>
        </header>

        {successMessage && (
          <div
            className="branches-alert success-alert"
            role="status"
          >
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
          <div
            className="branches-alert error-alert"
            role="alert"
          >
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

        <section className="branches-summary">
          <article>
            <span>Total Branches</span>
            <strong>{branches.length}</strong>
          </article>

          <article>
            <span>ATM Available</span>
            <strong>
              {
                branches.filter(
                  (branch) => branch.atm_status
                ).length
              }
            </strong>
          </article>

          <article>
            <span>ATM Unavailable</span>
            <strong>
              {
                branches.filter(
                  (branch) => !branch.atm_status
                ).length
              }
            </strong>
          </article>

          <article>
            <span>Categories Used</span>
            <strong>
              {
                new Set(
                  branches.map(
                    (branch) => branch.category
                  )
                ).size
              }
            </strong>
          </article>
        </section>

        <section className="branches-content-card">
          <div className="branches-toolbar">
            <div className="branches-search-box">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search branch, address or phone..."
              />
            </div>

            <select
              value={atmFilter}
              onChange={(event) =>
                setAtmFilter(event.target.value)
              }
              className="atm-filter"
            >
              <option value="all">
                All ATM statuses
              </option>

              <option value="available">
                ATM available
              </option>

              <option value="unavailable">
                ATM unavailable
              </option>
            </select>

            <button
              type="button"
              className="refresh-branches-button"
              onClick={loadBranchesAndCategories}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="branches-table-wrapper">
            {isLoading ? (
              <div className="branches-loading-state">
                <div className="branches-spinner"></div>
                <p>Loading branches...</p>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="branches-empty-state">
                <div>BR</div>

                <h3>No branches found</h3>

                <p>
                  No branches match your current
                  search or filter.
                </p>

                <button
                  type="button"
                  onClick={openAddModal}
                >
                  Add first branch
                </button>
              </div>
            ) : (
              <table className="manage-branches-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Category</th>
                    <th>Contact</th>
                    <th>Coordinates</th>
                    <th>ATM Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBranches.map((branch) => (
                    <tr key={branch.id}>
                      <td>
                        <div className="branch-information">
                          <div className="branch-avatar">
                            {branch.branch_name
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {branch.branch_name}
                            </strong>

                            <span>
                              {branch.address}
                            </span>

                            <small>
                              {branch.opening_hours}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="branch-category-badge">
                          {getCategoryName(
                            branch.category
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="branch-phone">
                          {branch.phone}
                        </span>
                      </td>

                      <td>
                        <div className="branch-coordinates">
                          <span>
                            Lat: {branch.latitude}
                          </span>

                          <span>
                            Lng: {branch.longitude}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            branch.atm_status
                              ? "branch-atm-status available"
                              : "branch-atm-status unavailable"
                          }
                        >
                          <span></span>

                          {branch.atm_status
                            ? "Available"
                            : "Unavailable"}
                        </span>
                      </td>

                      <td>
                        <div className="branch-actions">
                          <button
                            type="button"
                            className="edit-branch-button"
                            onClick={() =>
                              openEditModal(branch)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-branch-button"
                            onClick={() =>
                              openDeleteModal(branch)
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
            filteredBranches.length > 0 && (
              <div className="branches-table-footer">
                Showing {filteredBranches.length} of{" "}
                {branches.length} branches
              </div>
            )}
        </section>
      </main>

      {showFormModal && (
        <div
          className="branch-modal-overlay"
          onMouseDown={closeFormModal}
        >
          <section
            className="branch-form-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="branch-modal-header">
              <div>
                <p>
                  {editingBranchId
                    ? "UPDATE BRANCH"
                    : "NEW BRANCH"}
                </p>

                <h2>
                  {editingBranchId
                    ? "Edit Branch"
                    : "Add Branch"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={isSaving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              className="branch-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="branch-form-grid">
                <div className="branch-form-group full-width">
                  <label htmlFor="branch_name">
                    Branch name
                  </label>

                  <input
                    type="text"
                    id="branch_name"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleInputChange}
                    placeholder="Example: PBZ Mwanakwerekwe"
                    className={
                      formErrors.branch_name
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.branch_name && (
                    <small>
                      {formErrors.branch_name}
                    </small>
                  )}
                </div>

                <div className="branch-form-group full-width">
                  <label htmlFor="address">
                    Address
                  </label>

                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter branch address"
                    className={
                      formErrors.address
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.address && (
                    <small>
                      {formErrors.address}
                    </small>
                  )}
                </div>

                <div className="branch-form-group">
                  <label htmlFor="latitude">
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="-6.16500000"
                    className={
                      formErrors.latitude
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.latitude && (
                    <small>
                      {formErrors.latitude}
                    </small>
                  )}
                </div>

                <div className="branch-form-group">
                  <label htmlFor="longitude">
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="39.20200000"
                    className={
                      formErrors.longitude
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.longitude && (
                    <small>
                      {formErrors.longitude}
                    </small>
                  )}
                </div>

                <div className="branch-form-group">
                  <label htmlFor="phone">
                    Phone number
                  </label>

                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+255 24 223 0000"
                    className={
                      formErrors.phone
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.phone && (
                    <small>
                      {formErrors.phone}
                    </small>
                  )}
                </div>

                <div className="branch-form-group">
                  <label htmlFor="category">
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={
                      formErrors.category
                        ? "field-has-error"
                        : ""
                    }
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.category_name}
                      </option>
                    ))}
                  </select>

                  {formErrors.category && (
                    <small>
                      {formErrors.category}
                    </small>
                  )}
                </div>

                <div className="branch-form-group full-width">
                  <label htmlFor="opening_hours">
                    Opening hours
                  </label>

                  <input
                    type="text"
                    id="opening_hours"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleInputChange}
                    placeholder="Monday - Friday, 8:00 AM - 4:00 PM"
                    className={
                      formErrors.opening_hours
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.opening_hours && (
                    <small>
                      {formErrors.opening_hours}
                    </small>
                  )}
                </div>

                <div className="branch-form-group full-width">
                  <label className="atm-checkbox">
                    <input
                      type="checkbox"
                      name="atm_status"
                      checked={formData.atm_status}
                      onChange={handleInputChange}
                    />

                    <span className="atm-checkbox-control"></span>

                    <span>
                      <strong>ATM available</strong>
                      <small>
                        Mark this when the branch ATM
                        is currently available.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="branch-form-actions">
                <button
                  type="button"
                  className="cancel-branch-form"
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-branch-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingBranchId
                      ? "Update Branch"
                      : "Add Branch"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showDeleteModal && branchToDelete && (
        <div
          className="branch-modal-overlay"
          onMouseDown={closeDeleteModal}
        >
          <section
            className="delete-confirmation-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-warning-icon">
              !
            </div>

            <h2>Delete branch?</h2>

            <p>
              You are about to delete{" "}
              <strong>
                {branchToDelete.branch_name}
              </strong>
              . This action cannot be undone.
            </p>

            <div className="delete-confirmation-actions">
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
                  : "Delete Branch"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ManageBranches;