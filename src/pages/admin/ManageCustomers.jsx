import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../../api/api";

import "./ManageCustomers.css";

const initialFormData = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  is_active: true,
  is_staff: false,
};

function ManageCustomers() {
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingCustomerId, setEditingCustomerId] =
    useState(null);

  const [customerToDelete, setCustomerToDelete] =
    useState(null);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getCustomers();

      setCustomers(response.data);
    } catch (error) {
      console.error("Failed to load customers:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to load customers."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return customers.filter((customer) => {
      const fullName = `${customer.first_name || ""} ${
        customer.last_name || ""
      }`.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        customer.username
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        customer.email
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        customer.phone
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          customer.is_active === true) ||
        (statusFilter === "inactive" &&
          customer.is_active === false);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "staff" &&
          customer.is_staff === true) ||
        (roleFilter === "customer" &&
          customer.is_staff === false);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRole
      );
    });
  }, [
    customers,
    searchTerm,
    statusFilter,
    roleFilter,
  ]);

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const openAddModal = () => {
    clearMessages();

    setEditingCustomerId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (customer) => {
    clearMessages();

    setEditingCustomerId(customer.id);

    setFormData({
      first_name: customer.first_name || "",
      last_name: customer.last_name || "",
      username: customer.username || "",
      email: customer.email || "",
      phone: customer.phone || "",
      password: "",
      is_active: Boolean(customer.is_active),
      is_staff: Boolean(customer.is_staff),
    });

    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setShowFormModal(false);
    setEditingCustomerId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const openDeleteModal = (customer) => {
    clearMessages();

    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  const handleInputChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

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

    if (!formData.first_name.trim()) {
      errors.first_name =
        "First name is required.";
    }

    if (!formData.last_name.trim()) {
      errors.last_name =
        "Last name is required.";
    }

    if (!formData.username.trim()) {
      errors.username =
        "Username is required.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone =
        "Phone number is required.";
    }

    if (
      !editingCustomerId &&
      !formData.password.trim()
    ) {
      errors.password =
        "Password is required.";
    }

    if (
      formData.password &&
      formData.password.length < 8
    ) {
      errors.password =
        "Password must contain at least 8 characters.";
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

    const customerPayload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      is_active: formData.is_active,
      is_staff: formData.is_staff,
    };

    if (!editingCustomerId) {
      customerPayload.password =
        formData.password;
    }

    try {
      setIsSaving(true);

      if (editingCustomerId) {
        const existingCustomer =
          customers.find(
            (customer) =>
              customer.id === editingCustomerId
          );

        const updatePayload = {
          ...existingCustomer,
          ...customerPayload,
        };

        delete updatePayload.password;

        const response = await updateCustomer(
          editingCustomerId,
          updatePayload
        );

        setCustomers((previousCustomers) =>
          previousCustomers.map((customer) =>
            customer.id === editingCustomerId
              ? response.data
              : customer
          )
        );

        setSuccessMessage(
          "Customer updated successfully."
        );
      } else {
        const response =
          await createCustomer(customerPayload);

        setCustomers((previousCustomers) => [
          response.data,
          ...previousCustomers,
        ]);

        setSuccessMessage(
          "Customer added successfully."
        );
      }

      setShowFormModal(false);
      setEditingCustomerId(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      console.error(
        "Failed to save customer:",
        error
      );

      const backendErrors =
        error.response?.data;

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
            "Failed to save customer."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) {
      return;
    }

    try {
      setDeletingId(customerToDelete.id);
      setErrorMessage("");

      await deleteCustomer(customerToDelete.id);

      setCustomers((previousCustomers) =>
        previousCustomers.filter(
          (customer) =>
            customer.id !== customerToDelete.id
        )
      );

      setSuccessMessage(
        "Customer deleted successfully."
      );

      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error(
        "Failed to delete customer:",
        error
      );

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to delete customer."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const activeCustomers = customers.filter(
    (customer) => customer.is_active
  ).length;

  const staffCustomers = customers.filter(
    (customer) => customer.is_staff
  ).length;

  return (
    <div className="manage-customers-page">
      <aside className="customers-sidebar">
        <div className="customers-sidebar-brand">
          <div className="customers-brand-logo">
            PBZ
          </div>

          <div>
            <h1>PBZ GIS</h1>
            <p>Administration</p>
          </div>
        </div>

        <nav className="customers-navigation">
          <p className="customers-navigation-title">
            MAIN MENU
          </p>

          <Link
            to="/admin/dashboard"
            className="customers-nav-link"
          >
            <span>DB</span>
            Dashboard
          </Link>

          <Link
            to="/admin/branches"
            className="customers-nav-link"
          >
            <span>BR</span>
            Branches
          </Link>

          <Link
            to="/admin/categories"
            className="customers-nav-link"
          >
            <span>CT</span>
            Categories
          </Link>

          <Link
            to="/admin/services"
            className="customers-nav-link"
          >
            <span>SV</span>
            Services
          </Link>

          <Link
            to="/admin/customers"
            className="customers-nav-link active"
          >
            <span>CU</span>
            Customers
          </Link>
        </nav>
      </aside>

      <main className="customers-main">
        <header className="customers-header">
          <div>
            <p className="customers-overline">
              CUSTOMER MANAGEMENT
            </p>

            <h2>Manage Customers</h2>

            <p>
              Add, update and manage PBZ GIS
              customer accounts.
            </p>
          </div>

          <button
            type="button"
            className="add-customer-button"
            onClick={openAddModal}
          >
            <span>+</span>
            Add Customer
          </button>
        </header>

        {successMessage && (
          <div className="customers-alert success-alert">
            <span>✓</span>
            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="customers-alert error-alert">
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

        <section className="customers-summary">
          <article>
            <span>Total Customers</span>
            <strong>{customers.length}</strong>
          </article>

          <article>
            <span>Active Accounts</span>
            <strong>{activeCustomers}</strong>
          </article>

          <article>
            <span>Inactive Accounts</span>
            <strong>
              {customers.length -
                activeCustomers}
            </strong>
          </article>

          <article>
            <span>Staff Accounts</span>
            <strong>{staffCustomers}</strong>
          </article>
        </section>

        <section className="customers-content-card">
          <div className="customers-toolbar">
            <div className="customers-search-box">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search name, username, email or phone..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="customers-filter"
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              className="customers-filter"
            >
              <option value="all">
                All account types
              </option>

              <option value="customer">
                Customers
              </option>

              <option value="staff">
                Staff
              </option>
            </select>

            <button
              type="button"
              className="refresh-customers-button"
              onClick={loadCustomers}
              disabled={isLoading}
            >
              {isLoading
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          <div className="customers-table-wrapper">
            {isLoading ? (
              <div className="customers-loading-state">
                <div className="customers-spinner"></div>
                <p>Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="customers-empty-state">
                <div>CU</div>

                <h3>No customers found</h3>

                <p>
                  No customer matches the current
                  search or filters.
                </p>

                <button
                  type="button"
                  onClick={openAddModal}
                >
                  Add first customer
                </button>
              </div>
            ) : (
              <table className="manage-customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Username</th>
                    <th>Contact</th>
                    <th>Account Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div className="customer-information">
                            <div className="customer-avatar">
                              {`${customer.first_name?.[0] || ""}${
                                customer.last_name?.[0] || ""
                              }`.toUpperCase() ||
                                "CU"}
                            </div>

                            <div>
                              <strong>
                                {customer.first_name}{" "}
                                {customer.last_name}
                              </strong>

                              <span>
                                Customer ID:{" "}
                                {customer.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="customer-username">
                            @{customer.username}
                          </span>
                        </td>

                        <td>
                          <div className="customer-contact">
                            <span>
                              {customer.email}
                            </span>

                            <small>
                              {customer.phone}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              customer.is_staff
                                ? "customer-role staff"
                                : "customer-role normal"
                            }
                          >
                            {customer.is_staff
                              ? "Staff"
                              : "Customer"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              customer.is_active
                                ? "customer-status active"
                                : "customer-status inactive"
                            }
                          >
                            <span></span>

                            {customer.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="customer-actions">
                            <button
                              type="button"
                              className="edit-customer-button"
                              onClick={() =>
                                openEditModal(
                                  customer
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-customer-button"
                              onClick={() =>
                                openDeleteModal(
                                  customer
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading &&
            filteredCustomers.length > 0 && (
              <div className="customers-table-footer">
                Showing{" "}
                {filteredCustomers.length} of{" "}
                {customers.length} customers
              </div>
            )}
        </section>
      </main>

      {showFormModal && (
        <div
          className="customer-modal-overlay"
          onMouseDown={closeFormModal}
        >
          <section
            className="customer-form-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="customer-modal-header">
              <div>
                <p>
                  {editingCustomerId
                    ? "UPDATE CUSTOMER"
                    : "NEW CUSTOMER"}
                </p>

                <h2>
                  {editingCustomerId
                    ? "Edit Customer"
                    : "Add Customer"}
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
              className="customer-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="customer-form-grid">
                <CustomerInput
                  label="First name"
                  name="first_name"
                  value={formData.first_name}
                  error={formErrors.first_name}
                  onChange={handleInputChange}
                  placeholder="Fatma"
                />

                <CustomerInput
                  label="Last name"
                  name="last_name"
                  value={formData.last_name}
                  error={formErrors.last_name}
                  onChange={handleInputChange}
                  placeholder="Suleiman"
                />

                <CustomerInput
                  label="Username"
                  name="username"
                  value={formData.username}
                  error={formErrors.username}
                  onChange={handleInputChange}
                  placeholder="fatma"
                />

                <CustomerInput
                  label="Phone number"
                  name="phone"
                  value={formData.phone}
                  error={formErrors.phone}
                  onChange={handleInputChange}
                  placeholder="+255712345678"
                />

                <div className="customer-form-group full-width">
                  <label htmlFor="email">
                    Email address
                  </label>

                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="fatma@example.com"
                    className={
                      formErrors.email
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.email && (
                    <small>
                      {formErrors.email}
                    </small>
                  )}
                </div>

                {!editingCustomerId && (
                  <div className="customer-form-group full-width">
                    <label htmlFor="password">
                      Password
                    </label>

                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="At least 8 characters"
                      className={
                        formErrors.password
                          ? "field-has-error"
                          : ""
                      }
                    />

                    {formErrors.password && (
                      <small>
                        {formErrors.password}
                      </small>
                    )}
                  </div>
                )}

                <div className="customer-form-group full-width">
                  <div className="customer-options">
                    <label className="customer-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={
                          formData.is_active
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <span></span>

                      <div>
                        <strong>
                          Active account
                        </strong>

                        <small>
                          Customer can access the
                          system.
                        </small>
                      </div>
                    </label>

                    <label className="customer-checkbox">
                      <input
                        type="checkbox"
                        name="is_staff"
                        checked={
                          formData.is_staff
                        }
                        onChange={
                          handleInputChange
                        }
                      />

                      <span></span>

                      <div>
                        <strong>
                          Staff account
                        </strong>

                        <small>
                          Give staff-level account
                          status.
                        </small>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="customer-form-actions">
                <button
                  type="button"
                  className="cancel-customer-form"
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-customer-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingCustomerId
                      ? "Update Customer"
                      : "Add Customer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showDeleteModal &&
        customerToDelete && (
          <div
            className="customer-modal-overlay"
            onMouseDown={closeDeleteModal}
          >
            <section
              className="customer-delete-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="customer-delete-icon">
                !
              </div>

              <h2>Delete customer?</h2>

              <p>
                You are about to delete{" "}
                <strong>
                  {customerToDelete.first_name}{" "}
                  {customerToDelete.last_name}
                </strong>
                . This action cannot be undone.
              </p>

              <div className="customer-delete-actions">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={Boolean(
                    deletingId
                  )}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={Boolean(
                    deletingId
                  )}
                >
                  {deletingId
                    ? "Deleting..."
                    : "Delete Customer"}
                </button>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

function CustomerInput({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
}) {
  return (
    <div className="customer-form-group">
      <label htmlFor={name}>{label}</label>

      <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={
          error ? "field-has-error" : ""
        }
      />

      {error && <small>{error}</small>}
    </div>
  );
}

export default ManageCustomers;