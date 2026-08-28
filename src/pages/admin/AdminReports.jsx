import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminNavbar from "../../components/AdminNavbar";

import {
  getBranches,
  getCategories,
  getCustomers,
  getServices,
} from "../../api/api";

import "./AdminReports.css";


function AdminReports() {
  const [branches, setBranches] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    atmFilter,
    setAtmFilter,
  ] = useState("all");

  const [
    serviceFilter,
    setServiceFilter,
  ] = useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState(
    new Date()
  );


  /*
  |--------------------------------------------------------------------------
  | LOAD REPORT DATA
  |--------------------------------------------------------------------------
  */

  const loadReportData =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          branchesResponse,
          categoriesResponse,
          servicesResponse,
          customersResponse,
        ] = await Promise.all([
          getBranches(),
          getCategories(),
          getServices(),
          getCustomers(),
        ]);

        setBranches(
          Array.isArray(
            branchesResponse.data
          )
            ? branchesResponse.data
            : []
        );

        setCategories(
          Array.isArray(
            categoriesResponse.data
          )
            ? categoriesResponse.data
            : []
        );

        setServices(
          Array.isArray(
            servicesResponse.data
          )
            ? servicesResponse.data
            : []
        );

        const allUsers =
          Array.isArray(
            customersResponse.data
          )
            ? customersResponse.data
            : [];

        /*
         * Reports count normal customers
         * only, not staff/superusers.
         */
        const normalCustomers =
          allUsers.filter(
            (user) =>
              user.is_staff !== true &&
              user.is_superuser !== true
          );

        setCustomers(
          normalCustomers
        );

        setGeneratedAt(
          new Date()
        );
      } catch (error) {
        console.error(
          "Failed to load report data:",
          error
        );

        setErrorMessage(
          error.response?.data
            ?.detail ||
            "Unable to load system report data."
        );
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    loadReportData();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | MANY-TO-MANY SERVICE BRANCH IDs
  |--------------------------------------------------------------------------
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
        (branchId) =>
          Number.isFinite(
            branchId
          )
      );
  };


  /*
  |--------------------------------------------------------------------------
  | CATEGORY
  |--------------------------------------------------------------------------
  */

  const getCategoryName = (
    categoryId
  ) => {
    const category =
      categories.find(
        (item) =>
          Number(item.id) ===
          Number(categoryId)
      );

    return (
      category?.category_name ||
      "Uncategorized"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | SERVICES FOR BRANCH
  |--------------------------------------------------------------------------
  */

  const getBranchServices = (
    branchId
  ) => {
    const numericBranchId =
      Number(branchId);

    return services.filter(
      (service) =>
        getServiceBranchIds(
          service
        ).includes(
          numericBranchId
        )
    );
  };


  /*
  |--------------------------------------------------------------------------
  | BASIC STATISTICS
  |--------------------------------------------------------------------------
  */

  const availableAtmCount =
    useMemo(
      () =>
        branches.filter(
          (branch) =>
            branch.atm_status ===
            true
        ).length,
      [branches]
    );


  const unavailableAtmCount =
    useMemo(
      () =>
        branches.filter(
          (branch) =>
            branch.atm_status ===
            false
        ).length,
      [branches]
    );


  const serviceAssignments =
    useMemo(() => {
      return services.reduce(
        (
          total,
          service
        ) =>
          total +
          getServiceBranchIds(
            service
          ).length,
        0
      );
    }, [services]);


  const activeCustomerCount =
    useMemo(() => {
      return customers.filter(
        (customer) =>
          customer.is_active !==
          false
      ).length;
    }, [customers]);


  const inactiveCustomerCount =
    customers.length -
    activeCustomerCount;


  /*
  |--------------------------------------------------------------------------
  | CATEGORY REPORT
  |--------------------------------------------------------------------------
  */

  const categoryReport =
    useMemo(() => {
      return categories
        .map((category) => {
          const categoryBranches =
            branches.filter(
              (branch) =>
                Number(
                  branch.category
                ) ===
                Number(
                  category.id
                )
            );

          return {
            id: category.id,

            name:
              category.category_name,

            count:
              categoryBranches.length,

            atmAvailable:
              categoryBranches.filter(
                (branch) =>
                  branch.atm_status ===
                  true
              ).length,
          };
        })
        .sort(
          (a, b) =>
            b.count -
            a.count
        );
    }, [
      categories,
      branches,
    ]);


  /*
  |--------------------------------------------------------------------------
  | SERVICE REPORT
  |--------------------------------------------------------------------------
  */

  const serviceReport =
    useMemo(() => {
      return services
        .map((service) => ({
          id: service.id,

          name:
            service.service_name,

          description:
            service.description ||
            "",

          branchCount:
            getServiceBranchIds(
              service
            ).length,
        }))
        .sort(
          (a, b) =>
            b.branchCount -
            a.branchCount
        );
    }, [services]);


  /*
  |--------------------------------------------------------------------------
  | SERVICE FILTER OPTIONS
  |--------------------------------------------------------------------------
  */

  const serviceOptions =
    useMemo(() => {
      return services
        .filter(
          (service) =>
            service.service_name
              ?.trim()
        )
        .map((service) => ({
          id: service.id,

          name:
            service.service_name,
        }))
        .sort((a, b) =>
          a.name.localeCompare(
            b.name
          )
        );
    }, [services]);


  /*
  |--------------------------------------------------------------------------
  | FILTER DETAILED BRANCH REPORT
  |--------------------------------------------------------------------------
  */

  const filteredBranches =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return branches.filter(
        (branch) => {
          const branchServices =
            getBranchServices(
              branch.id
            );

          const serviceNames =
            branchServices
              .map(
                (service) =>
                  service.service_name ||
                  ""
              )
              .join(" ")
              .toLowerCase();

          const categoryName =
            getCategoryName(
              branch.category
            ).toLowerCase();

          const searchableText = [
            branch.branch_name,
            branch.address,
            branch.phone,
            branch.opening_hours,
            categoryName,
            serviceNames,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !search ||
            searchableText.includes(
              search
            );

          const matchesCategory =
            categoryFilter ===
              "all" ||
            Number(
              branch.category
            ) ===
              Number(
                categoryFilter
              );

          const matchesAtm =
            atmFilter ===
              "all" ||
            (atmFilter ===
              "available" &&
              branch.atm_status ===
                true) ||
            (atmFilter ===
              "unavailable" &&
              branch.atm_status ===
                false);

          const matchesService =
            serviceFilter ===
              "all" ||
            branchServices.some(
              (service) =>
                Number(
                  service.id
                ) ===
                Number(
                  serviceFilter
                )
            );

          return (
            matchesSearch &&
            matchesCategory &&
            matchesAtm &&
            matchesService
          );
        }
      );
    }, [
      branches,
      categories,
      services,
      searchTerm,
      categoryFilter,
      atmFilter,
      serviceFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | CLEAR FILTERS
  |--------------------------------------------------------------------------
  */

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setAtmFilter("all");
    setServiceFilter("all");
  };


  /*
  |--------------------------------------------------------------------------
  | PRINT
  |--------------------------------------------------------------------------
  */

  const printReport = () => {
    window.print();
  };


  /*
  |--------------------------------------------------------------------------
  | EXPORT CSV
  |--------------------------------------------------------------------------
  */

  const exportCSV = () => {
    if (
      filteredBranches.length ===
      0
    ) {
      return;
    }

    const headers = [
      "Branch ID",
      "Branch Name",
      "Address",
      "Category",
      "Phone",
      "Opening Hours",
      "ATM Status",
      "Latitude",
      "Longitude",
      "Services",
    ];


    const rows =
      filteredBranches.map(
        (branch) => {
          const branchServices =
            getBranchServices(
              branch.id
            );

          return [
            branch.id,
            branch.branch_name,
            branch.address || "",
            getCategoryName(
              branch.category
            ),
            branch.phone || "",
            branch.opening_hours ||
              "",
            branch.atm_status
              ? "Available"
              : "Unavailable",
            branch.latitude || "",
            branch.longitude || "",
            branchServices
              .map(
                (service) =>
                  service.service_name
              )
              .join(" | "),
          ];
        }
      );


    const escapeCSV =
      (value) => {
        const stringValue =
          String(
            value ?? ""
          );

        return `"${stringValue.replace(
          /"/g,
          '""'
        )}"`;
      };


    const csvContent = [
      headers
        .map(escapeCSV)
        .join(","),

      ...rows.map((row) =>
        row
          .map(escapeCSV)
          .join(",")
      ),
    ].join("\n");


    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const downloadLink =
      document.createElement(
        "a"
      );


    downloadLink.href =
      url;

    downloadLink.download =
      `pbz-system-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;


    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();

    document.body.removeChild(
      downloadLink
    );

    URL.revokeObjectURL(
      url
    );
  };


  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const reportDate =
    generatedAt.toLocaleString();


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="admin-reports-page">

      <AdminNavbar />


      {/* =================================
          MAIN
      ================================= */}

      <main className="reports-main">

        {/* HEADER */}

        <header className="reports-header">

          <div>

            <span className="reports-overline">
              SYSTEM REPORTING
            </span>


            <h2>
              PBZ GIS System Report
            </h2>


            <p>
              Review operational information
              about branches, ATM status,
              banking services, categories and
              customer accounts.
            </p>

          </div>


          <div className="reports-header-actions">

            <button
              type="button"
              className="reports-refresh-button"
              onClick={
                loadReportData
              }
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>


            <button
              type="button"
              className="reports-export-button"
              onClick={
                exportCSV
              }
              disabled={
                filteredBranches.length ===
                0
              }
            >
              Export CSV
            </button>


            <button
              type="button"
              className="reports-print-button"
              onClick={
                printReport
              }
            >
              Print Report
            </button>

          </div>

        </header>


        {/* REPORT INFORMATION */}

        <section className="reports-document-header">

          <div>

            <span>
              REPORT
            </span>

            <strong>
              PBZ GIS Operational Summary
            </strong>

          </div>


          <div>

            <span>
              GENERATED
            </span>

            <strong>
              {reportDate}
            </strong>

          </div>


          <div>

            <span>
              STATUS
            </span>

            <strong className="report-status-ready">
              Current System Data
            </strong>

          </div>

        </section>


        {/* ERROR */}

        {errorMessage && (

          <div className="reports-error">

            <span>
              !
            </span>

            <div>

              <strong>
                Report could not be loaded.
              </strong>

              <p>
                {errorMessage}
              </p>

            </div>


            <button
              type="button"
              onClick={
                loadReportData
              }
            >
              Try Again
            </button>

          </div>

        )}


        {/* =================================
            SUMMARY
        ================================= */}

        <section className="reports-summary">

          <article>

            <div className="report-summary-icon branches">
              BR
            </div>

            <div>

              <span>
                Total Branches
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : branches.length}
              </strong>

              <small>
                Registered PBZ locations
              </small>

            </div>

          </article>


          <article>

            <div className="report-summary-icon atm">
              ATM
            </div>

            <div>

              <span>
                Available ATMs
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : availableAtmCount}
              </strong>

              <small>
                {unavailableAtmCount} unavailable
              </small>

            </div>

          </article>


          <article>

            <div className="report-summary-icon services">
              SV
            </div>

            <div>

              <span>
                Banking Services
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : services.length}
              </strong>

              <small>
                {serviceAssignments} branch assignments
              </small>

            </div>

          </article>


          <article>

            <div className="report-summary-icon customers">
              CU
            </div>

            <div>

              <span>
                Customers
              </span>

              <strong>
                {isLoading
                  ? "..."
                  : customers.length}
              </strong>

              <small>
                {activeCustomerCount} active accounts
              </small>

            </div>

          </article>

        </section>


        {/* =================================
            ANALYTICS
        ================================= */}

        <section className="reports-analytics-grid">

          {/* ATM */}

          <article className="reports-analysis-card">

            <div className="reports-card-heading">

              <div>

                <span>
                  ATM ANALYSIS
                </span>

                <h3>
                  ATM availability
                </h3>

              </div>


              <strong>
                {branches.length}
              </strong>

            </div>


            <div className="report-progress-group">

              <ReportProgress
                label="Available"
                value={
                  availableAtmCount
                }
                total={
                  branches.length
                }
                type="positive"
              />


              <ReportProgress
                label="Unavailable"
                value={
                  unavailableAtmCount
                }
                total={
                  branches.length
                }
                type="negative"
              />

            </div>

          </article>


          {/* CUSTOMERS */}

          <article className="reports-analysis-card">

            <div className="reports-card-heading">

              <div>

                <span>
                  CUSTOMER ACCOUNTS
                </span>

                <h3>
                  Account status
                </h3>

              </div>


              <strong>
                {customers.length}
              </strong>

            </div>


            <div className="report-progress-group">

              <ReportProgress
                label="Active accounts"
                value={
                  activeCustomerCount
                }
                total={
                  customers.length
                }
                type="positive"
              />


              <ReportProgress
                label="Inactive accounts"
                value={
                  inactiveCustomerCount
                }
                total={
                  customers.length
                }
                type="negative"
              />

            </div>

          </article>

        </section>


        {/* =================================
            CATEGORY + SERVICE REPORT
        ================================= */}

        <section className="reports-distribution-grid">

          {/* CATEGORY */}

          <article className="reports-data-card">

            <div className="reports-card-heading">

              <div>

                <span>
                  CATEGORY DISTRIBUTION
                </span>

                <h3>
                  Branches by category
                </h3>

              </div>

            </div>


            <div className="reports-ranked-list">

              {categoryReport.length >
              0 ? (

                categoryReport.map(
                  (
                    category,
                    index
                  ) => (

                    <div
                      key={
                        category.id
                      }
                      className="report-ranked-item"
                    >

                      <div className="report-rank-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>


                      <div className="report-rank-main">

                        <strong>
                          {
                            category.name
                          }
                        </strong>

                        <span>
                          {
                            category.atmAvailable
                          }{" "}
                          ATM available
                        </span>

                      </div>


                      <strong className="report-rank-value">
                        {
                          category.count
                        }
                      </strong>

                    </div>

                  )
                )

              ) : (

                <div className="reports-no-data">
                  No category information.
                </div>

              )}

            </div>

          </article>


          {/* SERVICES */}

          <article className="reports-data-card">

            <div className="reports-card-heading">

              <div>

                <span>
                  SERVICE DISTRIBUTION
                </span>

                <h3>
                  Branch availability
                </h3>

              </div>

            </div>


            <div className="reports-ranked-list">

              {serviceReport.length >
              0 ? (

                serviceReport.map(
                  (
                    service,
                    index
                  ) => (

                    <div
                      key={
                        service.id
                      }
                      className="report-ranked-item"
                    >

                      <div className="report-rank-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>


                      <div className="report-rank-main">

                        <strong>
                          {
                            service.name
                          }
                        </strong>

                        <span>
                          Available at PBZ branches
                        </span>

                      </div>


                      <strong className="report-rank-value">
                        {
                          service.branchCount
                        }
                      </strong>

                    </div>

                  )
                )

              ) : (

                <div className="reports-no-data">
                  No service information.
                </div>

              )}

            </div>

          </article>

        </section>


        {/* =================================
            DETAILED REPORT
        ================================= */}

        <section className="reports-detailed-card">

          <div className="reports-detailed-heading">

            <div>

              <span>
                DETAILED BRANCH REPORT
              </span>

              <h3>
                Branch operational records
              </h3>

              <p>
                Filter the report before printing
                or exporting the selected records.
              </p>

            </div>


            <strong>
              {
                filteredBranches.length
              }{" "}
              records
            </strong>

          </div>


          {/* FILTERS */}

          <div className="reports-filters">

            <div className="reports-search">

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
                placeholder="Search branch, address or service..."
              />

            </div>


            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event.target
                    .value
                )
              }
            >

              <option value="all">
                All categories
              </option>

              {categories.map(
                (category) => (

                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.category_name
                    }
                  </option>

                )
              )}

            </select>


            <select
              value={
                atmFilter
              }
              onChange={(
                event
              ) =>
                setAtmFilter(
                  event.target
                    .value
                )
              }
            >

              <option value="all">
                All ATM status
              </option>

              <option value="available">
                ATM available
              </option>

              <option value="unavailable">
                ATM unavailable
              </option>

            </select>


            <select
              value={
                serviceFilter
              }
              onChange={(
                event
              ) =>
                setServiceFilter(
                  event.target
                    .value
                )
              }
            >

              <option value="all">
                All services
              </option>

              {serviceOptions.map(
                (service) => (

                  <option
                    key={
                      service.id
                    }
                    value={
                      service.id
                    }
                  >
                    {
                      service.name
                    }
                  </option>

                )
              )}

            </select>


            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear
            </button>

          </div>


          {/* TABLE */}

          <div className="reports-table-wrapper">

            {isLoading ? (

              <div className="reports-loading">

                <div className="reports-spinner"></div>

                <p>
                  Generating system report...
                </p>

              </div>

            ) : filteredBranches.length ===
              0 ? (

              <div className="reports-empty">

                <div>
                  RP
                </div>

                <h3>
                  No records found
                </h3>

                <p>
                  Adjust the report filters and try
                  again.
                </p>

              </div>

            ) : (

              <table className="reports-table">

                <thead>

                  <tr>
                    <th>
                      Branch
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      ATM
                    </th>

                    <th>
                      Services
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Opening Hours
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {filteredBranches.map(
                    (branch) => {
                      const branchServices =
                        getBranchServices(
                          branch.id
                        );

                      return (

                        <tr
                          key={
                            branch.id
                          }
                        >

                          <td>

                            <div className="report-branch-cell">

                              <strong>
                                {
                                  branch.branch_name
                                }
                              </strong>

                              <span>
                                {branch.address ||
                                  "Address unavailable"}
                              </span>

                            </div>

                          </td>


                          <td>

                            <span className="report-category-badge">
                              {getCategoryName(
                                branch.category
                              )}
                            </span>

                          </td>


                          <td>

                            <span
                              className={`report-atm-badge ${
                                branch.atm_status
                                  ? "available"
                                  : "unavailable"
                              }`}
                            >
                              <i></i>

                              {branch.atm_status
                                ? "Available"
                                : "Unavailable"}
                            </span>

                          </td>


                          <td>

                            <div className="report-service-cell">

                              <strong>
                                {
                                  branchServices.length
                                }
                              </strong>

                              <span>
                                {branchServices
                                  .slice(
                                    0,
                                    2
                                  )
                                  .map(
                                    (service) =>
                                      service.service_name
                                  )
                                  .join(
                                    ", "
                                  ) ||
                                  "No services"}

                                {branchServices.length >
                                  2
                                  ? ` +${
                                      branchServices.length -
                                      2
                                    } more`
                                  : ""}
                              </span>

                            </div>

                          </td>


                          <td>
                            {branch.phone ||
                              "—"}
                          </td>


                          <td>
                            {branch.opening_hours ||
                              "—"}
                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            )}

          </div>


          <div className="reports-table-footer">

            <span>
              Generated from current PBZ GIS
              system data
            </span>

            <strong>
              {
                filteredBranches.length
              }{" "}
              of{" "}
              {
                branches.length
              }{" "}
              branches
            </strong>

          </div>

        </section>

      </main>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| PROGRESS COMPONENT
|--------------------------------------------------------------------------
*/

function ReportProgress({
  label,
  value,
  total,
  type,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) *
            100
        )
      : 0;


  return (
    <div className="report-progress-item">

      <div className="report-progress-heading">

        <span>
          {label}
        </span>

        <strong>
          {value} / {total}
        </strong>

      </div>


      <div className="report-progress-track">

        <div
          className={`report-progress-fill ${type}`}
          style={{
            width:
              `${percentage}%`,
          }}
        ></div>

      </div>


      <small>
        {percentage}% of total
      </small>

    </div>
  );
}


export default AdminReports;