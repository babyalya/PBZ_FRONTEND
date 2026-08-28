import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  branches: [],
};


function ManageServices() {
  const [services, setServices] =
    useState([]);

  const [branches, setBranches] =
    useState([]);

  const [formData, setFormData] =
    useState(initialFormData);

  const [formErrors, setFormErrors] =
    useState({});

  const [searchTerm, setSearchTerm] =
    useState("");

  const [branchFilter, setBranchFilter] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [
    editingServiceId,
    setEditingServiceId,
  ] = useState(null);

  const [
    serviceToDelete,
    setServiceToDelete,
  ] = useState(null);

  const [
    showFormModal,
    setShowFormModal,
  ] = useState(false);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | NORMALIZE SERVICE BRANCHES
  |--------------------------------------------------------------------------
  |
  | Supports backend response such as:
  |
  | branches: [1, 2, 3]
  |
  | and also:
  |
  | branches: [
  |   { id: 1, branch_name: "..." },
  |   { id: 2, branch_name: "..." }
  | ]
  |
  */

  const getServiceBranchIds = (
    service
  ) => {
    if (
      !Array.isArray(
        service?.branches
      )
    ) {
      return [];
    }

    return service.branches
      .map((branch) => {
        if (
          typeof branch ===
          "object"
        ) {
          return Number(
            branch.id
          );
        }

        return Number(branch);
      })
      .filter(
        (id) =>
          Number.isFinite(id)
      );
  };


  /*
  |--------------------------------------------------------------------------
  | LOAD SERVICES + BRANCHES
  |--------------------------------------------------------------------------
  */

  const loadServicesAndBranches =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          servicesResponse,
          branchesResponse,
        ] = await Promise.all([
          getServices(),
          getBranches(),
        ]);

        setServices(
          Array.isArray(
            servicesResponse.data
          )
            ? servicesResponse.data
            : []
        );

        setBranches(
          Array.isArray(
            branchesResponse.data
          )
            ? branchesResponse.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load services:",
          error
        );

        setErrorMessage(
          error.response?.data
            ?.detail ||
            "Failed to load services."
        );
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    loadServicesAndBranches();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | FILTER SERVICES
  |--------------------------------------------------------------------------
  */

  const filteredServices =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return services.filter(
        (service) => {
          const matchesSearch =
            !normalizedSearch ||
            service.service_name
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            service.description
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          const serviceBranchIds =
            getServiceBranchIds(
              service
            );

          const matchesBranch =
            branchFilter ===
              "all" ||
            serviceBranchIds.includes(
              Number(
                branchFilter
              )
            );

          return (
            matchesSearch &&
            matchesBranch
          );
        }
      );
    }, [
      services,
      searchTerm,
      branchFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | GET BRANCH
  |--------------------------------------------------------------------------
  */

  const getBranchName = (
    branchId
  ) => {
    const branch =
      branches.find(
        (item) =>
          Number(item.id) ===
          Number(branchId)
      );

    return branch
      ? branch.branch_name
      : `Branch ${branchId}`;
  };


  const getServiceBranchNames = (
    service
  ) => {
    return getServiceBranchIds(
      service
    ).map(
      (branchId) =>
        getBranchName(
          branchId
        )
    );
  };


  /*
  |--------------------------------------------------------------------------
  | MESSAGES
  |--------------------------------------------------------------------------
  */

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };


  /*
  |--------------------------------------------------------------------------
  | ADD SERVICE
  |--------------------------------------------------------------------------
  */

  const openAddModal = () => {
    clearMessages();

    setEditingServiceId(
      null
    );

    setFormData({
      ...initialFormData,
      branches: [],
    });

    setFormErrors({});

    setShowFormModal(true);
  };


  /*
  |--------------------------------------------------------------------------
  | EDIT SERVICE
  |--------------------------------------------------------------------------
  */

  const openEditModal = (
    service
  ) => {
    clearMessages();

    setEditingServiceId(
      service.id
    );

    setFormData({
      service_name:
        service.service_name ||
        "",

      description:
        service.description ||
        "",

      branches:
        getServiceBranchIds(
          service
        ),
    });

    setFormErrors({});

    setShowFormModal(true);
  };


  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setShowFormModal(
      false
    );

    setEditingServiceId(
      null
    );

    setFormData({
      ...initialFormData,
      branches: [],
    });

    setFormErrors({});
  };


  /*
  |--------------------------------------------------------------------------
  | DELETE MODAL
  |--------------------------------------------------------------------------
  */

  const openDeleteModal = (
    service
  ) => {
    clearMessages();

    setServiceToDelete(
      service
    );

    setShowDeleteModal(
      true
    );
  };


  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setShowDeleteModal(
      false
    );

    setServiceToDelete(
      null
    );
  };


  /*
  |--------------------------------------------------------------------------
  | NORMAL INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,

        [name]: value,
      })
    );

    setFormErrors(
      (previousErrors) => ({
        ...previousErrors,

        [name]: "",
      })
    );
  };


  /*
  |--------------------------------------------------------------------------
  | BRANCH CHECKBOX
  |--------------------------------------------------------------------------
  */

  const handleBranchToggle = (
    branchId
  ) => {
    const numericBranchId =
      Number(branchId);

    setFormData(
      (previousData) => {
        const currentlySelected =
          previousData.branches.includes(
            numericBranchId
          );

        return {
          ...previousData,

          branches:
            currentlySelected
              ? previousData.branches.filter(
                  (id) =>
                    Number(id) !==
                    numericBranchId
                )
              : [
                  ...previousData.branches,
                  numericBranchId,
                ],
        };
      }
    );

    setFormErrors(
      (previousErrors) => ({
        ...previousErrors,

        branches: "",
      })
    );
  };


  /*
  |--------------------------------------------------------------------------
  | SELECT ALL BRANCHES
  |--------------------------------------------------------------------------
  */

  const handleSelectAllBranches =
    () => {
      setFormData(
        (previousData) => ({
          ...previousData,

          branches:
            branches.map(
              (branch) =>
                Number(branch.id)
            ),
        })
      );

      setFormErrors(
        (previousErrors) => ({
          ...previousErrors,

          branches: "",
        })
      );
    };


  /*
  |--------------------------------------------------------------------------
  | CLEAR ALL BRANCHES
  |--------------------------------------------------------------------------
  */

  const handleClearBranches =
    () => {
      setFormData(
        (previousData) => ({
          ...previousData,

          branches: [],
        })
      );
    };


  /*
  |--------------------------------------------------------------------------
  | VALIDATE
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const errors = {};


    if (
      !formData.service_name.trim()
    ) {
      errors.service_name =
        "Service name is required.";
    }


    if (
      !Array.isArray(
        formData.branches
      ) ||
      formData.branches.length ===
        0
    ) {
      errors.branches =
        "Please select at least one branch.";
    }


    setFormErrors(errors);

    return (
      Object.keys(errors).length ===
      0
    );
  };


  /*
  |--------------------------------------------------------------------------
  | SAVE SERVICE
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      clearMessages();


      if (!validateForm()) {
        return;
      }


      /*
       * Backend expects:
       *
       * {
       *   service_name: "...",
       *   description: "...",
       *   branches: [1, 2, 3]
       * }
       */

      const servicePayload = {
        service_name:
          formData.service_name.trim(),

        description:
          formData.description.trim() ||
          null,

        branches:
          formData.branches.map(
            (branchId) =>
              Number(branchId)
          ),
      };


      try {
        setIsSaving(true);


        if (
          editingServiceId
        ) {
          const response =
            await updateService(
              editingServiceId,
              servicePayload
            );


          setServices(
            (
              previousServices
            ) =>
              previousServices.map(
                (service) =>
                  service.id ===
                  editingServiceId
                    ? response.data
                    : service
              )
          );


          setSuccessMessage(
            "Service updated successfully."
          );
        } else {
          const response =
            await createService(
              servicePayload
            );


          setServices(
            (
              previousServices
            ) => [
              response.data,
              ...previousServices,
            ]
          );


          setSuccessMessage(
            "Service added successfully."
          );
        }


        setShowFormModal(
          false
        );

        setEditingServiceId(
          null
        );

        setFormData({
          ...initialFormData,
          branches: [],
        });

        setFormErrors({});
      } catch (error) {
        console.error(
          "Failed to save service:",
          error
        );


        const backendErrors =
          error.response?.data;


        if (
          backendErrors &&
          typeof backendErrors ===
            "object" &&
          !backendErrors.detail
        ) {
          const convertedErrors =
            {};


          Object.entries(
            backendErrors
          ).forEach(
            ([
              field,
              messages,
            ]) => {
              convertedErrors[
                field
              ] =
                Array.isArray(
                  messages
                )
                  ? messages[0]
                  : String(
                      messages
                    );
            }
          );


          setFormErrors(
            convertedErrors
          );
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


  /*
  |--------------------------------------------------------------------------
  | DELETE SERVICE
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async () => {
      if (!serviceToDelete) {
        return;
      }


      try {
        setDeletingId(
          serviceToDelete.id
        );

        setErrorMessage("");


        await deleteService(
          serviceToDelete.id
        );


        setServices(
          (
            previousServices
          ) =>
            previousServices.filter(
              (service) =>
                service.id !==
                serviceToDelete.id
            )
        );


        setSuccessMessage(
          "Service deleted successfully."
        );


        setShowDeleteModal(
          false
        );

        setServiceToDelete(
          null
        );
      } catch (error) {
        console.error(
          "Failed to delete service:",
          error
        );


        setErrorMessage(
          error.response?.data
            ?.detail ||
            "Failed to delete service."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const branchesWithServices =
    useMemo(() => {
      const branchIds =
        new Set();


      services.forEach(
        (service) => {
          getServiceBranchIds(
            service
          ).forEach(
            (branchId) =>
              branchIds.add(
                branchId
              )
          );
        }
      );


      return branchIds.size;
    }, [services]);


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="manage-services-page">

      {/* =================================
          SIDEBAR
      ================================= */}

      <aside className="services-sidebar">

        <div className="services-sidebar-brand">

          <div className="services-brand-logo">
            PBZ
          </div>


          <div>
            <h1>
              PBZ GIS
            </h1>

            <p>
              Administration
            </p>
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
            <span>
              DB
            </span>

            Dashboard
          </Link>


          <Link
            to="/admin/branches"
            className="services-nav-link"
          >
            <span>
              BR
            </span>

            Branches
          </Link>


          <Link
            to="/admin/categories"
            className="services-nav-link"
          >
            <span>
              CT
            </span>

            Categories
          </Link>


          <Link
            to="/admin/services"
            className="services-nav-link active"
          >
            <span>
              SV
            </span>

            Services
          </Link>


          <Link
            to="/admin/customers"
            className="services-nav-link"
          >
            <span>
              CU
            </span>

            Customers
          </Link>

        </nav>

      </aside>


      {/* =================================
          MAIN
      ================================= */}

      <main className="services-main">

        <header className="services-header">

          <div>

            <p className="services-overline">
              SERVICE MANAGEMENT
            </p>


            <h2>
              Manage Services
            </h2>


            <p>
              Create banking services
              and assign each service to
              one or multiple PBZ
              branches.
            </p>

          </div>


          <button
            type="button"
            className="add-service-button"
            onClick={
              openAddModal
            }
          >
            <span>
              +
            </span>

            Add Service
          </button>

        </header>


        {/* SUCCESS */}

        {successMessage && (

          <div className="services-alert success-alert">

            <span>
              ✓
            </span>

            <p>
              {
                successMessage
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage(
                  ""
                )
              }
            >
              ×
            </button>

          </div>

        )}


        {/* ERROR */}

        {errorMessage && (

          <div className="services-alert error-alert">

            <span>
              !
            </span>

            <p>
              {
                errorMessage
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setErrorMessage(
                  ""
                )
              }
            >
              ×
            </button>

          </div>

        )}


        {/* =================================
            SUMMARY
        ================================= */}

        <section className="services-summary">

          <article>
            <span>
              Total Services
            </span>

            <strong>
              {
                services.length
              }
            </strong>
          </article>


          <article>
            <span>
              Total Branches
            </span>

            <strong>
              {
                branches.length
              }
            </strong>
          </article>


          <article>
            <span>
              Branches With Services
            </span>

            <strong>
              {
                branchesWithServices
              }
            </strong>
          </article>


          <article>
            <span>
              Displayed Results
            </span>

            <strong>
              {
                filteredServices.length
              }
            </strong>
          </article>

        </section>


        {/* =================================
            CONTENT
        ================================= */}

        <section className="services-content-card">

          <div className="services-toolbar">

            <div className="services-search-box">

              <span>
                ⌕
              </span>


              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                placeholder="Search service or description..."
              />

            </div>


            <select
              value={
                branchFilter
              }
              onChange={(
                event
              ) =>
                setBranchFilter(
                  event.target
                    .value
                )
              }
              className="services-branch-filter"
            >
              <option value="all">
                All branches
              </option>


              {branches.map(
                (branch) => (

                  <option
                    key={
                      branch.id
                    }
                    value={
                      branch.id
                    }
                  >
                    {
                      branch.branch_name
                    }
                  </option>

                )
              )}

            </select>


            <button
              type="button"
              className="refresh-services-button"
              onClick={
                loadServicesAndBranches
              }
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>


          <div className="services-table-wrapper">

            {isLoading ? (

              <div className="services-loading-state">

                <div className="services-spinner"></div>

                <p>
                  Loading services...
                </p>

              </div>

            ) : filteredServices.length ===
              0 ? (

              <div className="services-empty-state">

                <div>
                  SV
                </div>


                <h3>
                  No services found
                </h3>


                <p>
                  Add banking services
                  and assign them to PBZ
                  branches.
                </p>


                <button
                  type="button"
                  onClick={
                    openAddModal
                  }
                >
                  Add first service
                </button>

              </div>

            ) : (

              <table className="manage-services-table">

                <thead>

                  <tr>
                    <th>
                      Service
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      Available Branches
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {filteredServices.map(
                    (service) => {

                      const serviceBranchIds =
                        getServiceBranchIds(
                          service
                        );

                      const serviceBranchNames =
                        getServiceBranchNames(
                          service
                        );


                      return (

                        <tr
                          key={
                            service.id
                          }
                        >

                          {/* SERVICE */}

                          <td>

                            <div className="service-information">

                              <div className="service-avatar">
                                {service.service_name
                                  ?.substring(
                                    0,
                                    2
                                  )
                                  .toUpperCase()}
                              </div>


                              <div>

                                <strong>
                                  {
                                    service.service_name
                                  }
                                </strong>


                                <span>
                                  Service ID:{" "}
                                  {
                                    service.id
                                  }
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* DESCRIPTION */}

                          <td>

                            <p className="service-description">
                              {service.description ||
                                "No description provided."}
                            </p>

                          </td>


                          {/* BRANCHES */}

                          <td>

                            <div className="service-branches-table-cell">

                              <div className="service-branch-count">
                                {
                                  serviceBranchIds.length
                                }{" "}
                                {serviceBranchIds.length ===
                                1
                                  ? "branch"
                                  : "branches"}
                              </div>


                              <div className="service-table-branch-tags">

                                {serviceBranchNames.length >
                                0 ? (

                                  <>

                                    {serviceBranchNames
                                      .slice(
                                        0,
                                        3
                                      )
                                      .map(
                                        (
                                          branchName,
                                          index
                                        ) => (

                                          <span
                                            key={`${service.id}-${branchName}-${index}`}
                                            className="service-branch-badge"
                                          >
                                            {
                                              branchName
                                            }
                                          </span>

                                        )
                                      )}


                                    {serviceBranchNames.length >
                                      3 && (

                                      <span className="service-branch-badge more">
                                        +
                                        {serviceBranchNames.length -
                                          3}{" "}
                                        more
                                      </span>

                                    )}

                                  </>

                                ) : (

                                  <span className="service-no-branches">
                                    No branches
                                  </span>

                                )}

                              </div>

                            </div>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="service-actions">

                              <button
                                type="button"
                                className="edit-service-button"
                                onClick={() =>
                                  openEditModal(
                                    service
                                  )
                                }
                              >
                                Edit
                              </button>


                              <button
                                type="button"
                                className="delete-service-button"
                                onClick={() =>
                                  openDeleteModal(
                                    service
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            )}

          </div>


          {!isLoading &&
            filteredServices.length >
              0 && (

              <div className="services-table-footer">
                Showing{" "}
                {
                  filteredServices.length
                }{" "}
                of{" "}
                {
                  services.length
                }{" "}
                services
              </div>

            )}

        </section>

      </main>


      {/* =================================
          ADD / EDIT MODAL
      ================================= */}

      {showFormModal && (

        <div
          className="service-modal-overlay"
          onMouseDown={
            closeFormModal
          }
        >

          <section
            className="service-form-modal"
            onMouseDown={(
              event
            ) =>
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
                onClick={
                  closeFormModal
                }
                disabled={
                  isSaving
                }
              >
                ×
              </button>

            </div>


            <form
              className="service-form"
              onSubmit={
                handleSubmit
              }
              noValidate
            >

              {/* SERVICE NAME */}

              <div className="service-form-group">

                <label htmlFor="service_name">
                  Service name
                </label>


                <input
                  type="text"
                  id="service_name"
                  name="service_name"
                  value={
                    formData.service_name
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Example: Money Transfer"
                  className={
                    formErrors.service_name
                      ? "field-has-error"
                      : ""
                  }
                />


                {formErrors.service_name && (

                  <small>
                    {
                      formErrors.service_name
                    }
                  </small>

                )}

              </div>


              {/* DESCRIPTION */}

              <div className="service-form-group">

                <label htmlFor="description">
                  Description
                </label>


                <textarea
                  id="description"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Describe the banking service..."
                  rows="4"
                />


                {formErrors.description && (

                  <small>
                    {
                      formErrors.description
                    }
                  </small>

                )}

              </div>


              {/* =================================
                  MULTIPLE BRANCHES
              ================================= */}

              <div className="service-form-group">

                <div className="service-branches-label-row">

                  <div>

                    <label>
                      Available branches
                    </label>


                    <p>
                      Select one or more PBZ
                      branches that provide
                      this service.
                    </p>

                  </div>


                  <div className="service-branch-selection-actions">

                    <button
                      type="button"
                      onClick={
                        handleSelectAllBranches
                      }
                    >
                      Select All
                    </button>


                    <button
                      type="button"
                      onClick={
                        handleClearBranches
                      }
                    >
                      Clear
                    </button>

                  </div>

                </div>


                <div
                  className={`service-branches-selector ${
                    formErrors.branches
                      ? "has-error"
                      : ""
                  }`}
                >

                  {branches.length ===
                  0 ? (

                    <div className="service-no-branch-options">
                      No PBZ branches are
                      available.
                    </div>

                  ) : (

                    branches.map(
                      (branch) => {

                        const selected =
                          formData.branches.includes(
                            Number(
                              branch.id
                            )
                          );


                        return (

                          <label
                            key={
                              branch.id
                            }
                            className={`service-branch-checkbox ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={
                                selected
                              }
                              onChange={() =>
                                handleBranchToggle(
                                  branch.id
                                )
                              }
                            />


                            <span className="service-checkbox-control">

                              {selected &&
                                "✓"}

                            </span>


                            <div className="service-checkbox-branch-info">

                              <strong>
                                {
                                  branch.branch_name
                                }
                              </strong>


                              <small>
                                {branch.address ||
                                  "PBZ Branch"}
                              </small>

                            </div>

                          </label>

                        );
                      }
                    )

                  )}

                </div>


                <div className="service-selected-branches-summary">

                  <span>
                    Selected
                  </span>

                  <strong>
                    {
                      formData.branches.length
                    }{" "}
                    {formData.branches.length ===
                    1
                      ? "branch"
                      : "branches"}
                  </strong>

                </div>


                {formErrors.branches && (

                  <small className="service-branches-error">
                    {
                      formErrors.branches
                    }
                  </small>

                )}

              </div>


              {/* ACTIONS */}

              <div className="service-form-actions">

                <button
                  type="button"
                  className="cancel-service-form"
                  onClick={
                    closeFormModal
                  }
                  disabled={
                    isSaving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-service-button"
                  disabled={
                    isSaving
                  }
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


      {/* =================================
          DELETE MODAL
      ================================= */}

      {showDeleteModal &&
        serviceToDelete && (

        <div
          className="service-modal-overlay"
          onMouseDown={
            closeDeleteModal
          }
        >

          <section
            className="service-delete-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="service-delete-icon">
              !
            </div>


            <h2>
              Delete service?
            </h2>


            <p>
              You are about to
              permanently delete{" "}

              <strong>
                {
                  serviceToDelete.service_name
                }
              </strong>

              .
            </p>


            <div className="service-delete-branch-info">

              <span>
                Currently available at
              </span>

              <strong>
                {
                  getServiceBranchIds(
                    serviceToDelete
                  ).length
                }{" "}
                {getServiceBranchIds(
                  serviceToDelete
                ).length ===
                1
                  ? "branch"
                  : "branches"}
              </strong>

            </div>


            <div className="service-delete-actions">

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
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