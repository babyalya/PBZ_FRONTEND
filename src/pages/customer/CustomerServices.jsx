import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getBranches,
  getServices,
} from "../../api/api";

import "./CustomerServices.css";


function CustomerServices() {
  const navigate =
    useNavigate();

  const [branches, setBranches] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedService,
    setSelectedService,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  const loadServicesPageData =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          branchesResponse,
          servicesResponse,
        ] = await Promise.all([
          getBranches(),
          getServices(),
        ]);

        setBranches(
          Array.isArray(
            branchesResponse.data
          )
            ? branchesResponse.data
            : []
        );

        setServices(
          Array.isArray(
            servicesResponse.data
          )
            ? servicesResponse.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load services page:",
          error
        );

        setErrorMessage(
          error.response?.data
            ?.detail ||
            "Unable to load PBZ services. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    loadServicesPageData();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | GET SERVICE BRANCH IDS
  |--------------------------------------------------------------------------
  |
  | Supports both:
  |
  | branches: [1, 2, 3]
  |
  | and:
  |
  | branches: [
  |   { id: 1, branch_name: "..." }
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
  | PREPARE SERVICES FOR DISPLAY
  |--------------------------------------------------------------------------
  |
  | Since one service record can now have
  | many branches, we no longer need to
  | group repeated service names.
  |
  | Each backend service becomes one card.
  |
  */

  const preparedServices =
    useMemo(() => {
      return services
        .map((service) => {
          const branchIds =
            getServiceBranchIds(
              service
            );

          const serviceBranches =
            branchIds
              .map(
                (branchId) =>
                  branches.find(
                    (branch) =>
                      Number(
                        branch.id
                      ) ===
                      Number(
                        branchId
                      )
                  )
              )
              .filter(Boolean);

          return {
            ...service,

            branches:
              serviceBranches,
          };
        })
        .filter(
          (service) =>
            service.service_name
              ?.trim()
        );
    }, [
      services,
      branches,
    ]);


  /*
  |--------------------------------------------------------------------------
  | FILTER SERVICES
  |--------------------------------------------------------------------------
  */

  const filteredServices =
    useMemo(() => {
      const cleanedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      if (!cleanedSearch) {
        return preparedServices;
      }

      return preparedServices.filter(
        (service) => {
          const branchNames =
            service.branches
              .map(
                (branch) =>
                  branch.branch_name ||
                  ""
              )
              .join(" ")
              .toLowerCase();

          const branchAddresses =
            service.branches
              .map(
                (branch) =>
                  branch.address ||
                  ""
              )
              .join(" ")
              .toLowerCase();

          const searchableText = [
            service.service_name,
            service.description,
            branchNames,
            branchAddresses,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            cleanedSearch
          );
        }
      );
    }, [
      preparedServices,
      searchTerm,
    ]);


  /*
  |--------------------------------------------------------------------------
  | SELECT SERVICE
  |--------------------------------------------------------------------------
  */

  const openService = (
    service
  ) => {
    setSelectedService(
      service
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const closeService = () => {
    setSelectedService(
      null
    );
  };


  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const openBranchDetails = (
    branchId
  ) => {
    navigate(
      `/branches/${branchId}`
    );
  };


  const openBranchOnMap = (
    branch
  ) => {
    navigate(
      `/map?branch=${
        branch.id
      }&search=${encodeURIComponent(
        branch.branch_name
      )}`
    );
  };


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="customer-services-page">

      {/* =================================
          NAVBAR
      ================================= */}

      <header className="customer-services-navbar">

        <Link
          to="/"
          className="customer-services-brand"
        >
          <div className="customer-services-logo">
            PBZ
          </div>

          <div>
            <strong>
              PBZ GIS
            </strong>

            <span>
              Branch & ATM Locator
            </span>
          </div>
        </Link>


        <nav className="customer-services-nav">

          <Link to="/">
            Home
          </Link>

          <Link to="/branches">
            Branches
          </Link>

          <Link
            to="/services"
            className="is-active"
          >
            Services
          </Link>

          <Link to="/atms">
            ATMs
          </Link>

          <Link to="/map">
            Map
          </Link>

        </nav>


        <Link
          to="/map"
          className="customer-services-map-button"
        >
          Open GIS Map

          <span>
            →
          </span>
        </Link>

      </header>


      <main>

        {/* =================================
            HERO
        ================================= */}

        <section className="customer-services-hero">

          <div className="customer-services-circle circle-one"></div>

          <div className="customer-services-circle circle-two"></div>


          <div className="customer-services-hero-content">

            <div>

              <span className="customer-services-overline">
                PBZ BANKING SERVICES
              </span>


              <h1>
                Find the right banking
                service before visiting
                a branch.
              </h1>


              <p>
                Explore banking services
                offered by PBZ and find
                every branch where each
                service is available.
              </p>

            </div>


            <div className="customer-services-hero-summary">

              <article>

                <span>
                  Banking services
                </span>

                <strong>
                  {isLoading
                    ? "..."
                    : preparedServices.length}
                </strong>

              </article>


              <article>

                <span>
                  PBZ branches
                </span>

                <strong>
                  {isLoading
                    ? "..."
                    : branches.length}
                </strong>

              </article>


              <article>

                <span>
                  Service assignments
                </span>

                <strong>
                  {isLoading
                    ? "..."
                    : preparedServices.reduce(
                        (
                          total,
                          service
                        ) =>
                          total +
                          service.branches
                            .length,
                        0
                      )}
                </strong>

              </article>

            </div>

          </div>

        </section>


        {/* =================================
            CONTENT
        ================================= */}

        <section className="customer-services-content">

          {/* SEARCH */}

          <div className="customer-services-search-card">

            <div className="customer-services-search-input">

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
                placeholder="Search service, branch or location..."
                aria-label="Search PBZ services"
              />

            </div>


            {searchTerm && (

              <button
                type="button"
                onClick={() =>
                  setSearchTerm(
                    ""
                  )
                }
              >
                Clear
              </button>

            )}

          </div>


          {/* =================================
              SELECTED SERVICE
          ================================= */}

          {selectedService && (

            <section className="customer-selected-service">

              <div className="customer-selected-service-header">

                <div>

                  <span>
                    SELECTED SERVICE
                  </span>


                  <h2>
                    {
                      selectedService.service_name
                    }
                  </h2>


                  <p>
                    {selectedService.description ||
                      "This banking service is available at selected PBZ branches."}
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    closeService
                  }
                  aria-label="Close selected service"
                >
                  ×
                </button>

              </div>


              <div className="customer-selected-service-summary">

                <div>

                  <span>
                    Available at
                  </span>

                  <strong>
                    {
                      selectedService
                        .branches
                        .length
                    }{" "}
                    {selectedService
                      .branches
                      .length === 1
                      ? "branch"
                      : "branches"}
                  </strong>

                </div>

              </div>


              {selectedService
                .branches.length >
              0 ? (

                <div className="customer-service-branches-grid">

                  {selectedService.branches.map(
                    (branch) => (

                      <article
                        key={
                          branch.id
                        }
                        className="customer-service-branch-card"
                      >

                        <div className="customer-service-branch-top">

                          <div>
                            PBZ
                          </div>


                          <span
                            className={
                              branch.atm_status
                                ? "available"
                                : "unavailable"
                            }
                          >
                            <i></i>

                            {branch.atm_status
                              ? "ATM Available"
                              : "ATM Unavailable"}
                          </span>

                        </div>


                        <h3>
                          {
                            branch.branch_name
                          }
                        </h3>


                        <p>
                          {branch.address ||
                            "Address not available"}
                        </p>


                        <div className="customer-service-branch-info">

                          <div>

                            <span>
                              Phone
                            </span>

                            <strong>
                              {branch.phone ||
                                "Not available"}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Hours
                            </span>

                            <strong>
                              {branch.opening_hours || "Not available"}
                              {branch.closing_hours && ` - ${branch.closing_hours}`}
                            </strong>

                          </div>

                        </div>


                        <div className="customer-service-branch-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openBranchDetails(
                                branch.id
                              )
                            }
                          >
                            View Details
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              openBranchOnMap(
                                branch
                              )
                            }
                          >
                            View Map

                            <span>
                              →
                            </span>
                          </button>

                        </div>

                      </article>

                    )
                  )}

                </div>

              ) : (

                <div className="customer-service-no-branches">

                  This service is not
                  currently assigned to
                  any PBZ branch.

                </div>

              )}

            </section>

          )}


          {/* =================================
              TOOLBAR
          ================================= */}

          <div className="customer-services-toolbar">

            <div>

              <span>
                AVAILABLE SERVICES
              </span>


              <strong>
                {isLoading
                  ? "Loading..."
                  : `${filteredServices.length} ${
                      filteredServices.length ===
                      1
                        ? "service"
                        : "services"
                    } found`}
              </strong>

            </div>


            <Link to="/branches">

              Browse branches

              <span>
                →
              </span>

            </Link>

          </div>


          {/* =================================
              ERROR
          ================================= */}

          {errorMessage && (

            <div className="customer-services-error">

              <div>
                !
              </div>


              <div>

                <strong>
                  We couldn't load the
                  services.
                </strong>


                <p>
                  {
                    errorMessage
                  }
                </p>

              </div>


              <button
                type="button"
                onClick={
                  loadServicesPageData
                }
              >
                Try Again
              </button>

            </div>

          )}


          {/* =================================
              LOADING
          ================================= */}

          {!errorMessage &&
            isLoading && (

              <div className="customer-services-grid">

                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                  6,
                ].map(
                  (item) => (

                    <article
                      key={
                        item
                      }
                      className="customer-service-card service-loading-card"
                    >

                      <div className="service-skeleton service-skeleton-icon"></div>

                      <div className="service-skeleton service-skeleton-title"></div>

                      <div className="service-skeleton service-skeleton-line"></div>

                      <div className="service-skeleton service-skeleton-line short"></div>

                      <div className="service-skeleton service-skeleton-button"></div>

                    </article>

                  )
                )}

              </div>

            )}


          {/* =================================
              SERVICES GRID
          ================================= */}

          {!errorMessage &&
            !isLoading &&
            filteredServices.length >
              0 && (

              <div className="customer-services-grid">

                {filteredServices.map(
                  (
                    service,
                    index
                  ) => (

                    <article
                      key={
                        service.id
                      }
                      className="customer-service-card"
                    >

                      <div className="customer-service-card-top">

                        <div className="customer-service-icon">
                          SV
                        </div>


                        <span>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                      </div>


                      <div className="customer-service-card-body">

                        <h2>
                          {
                            service.service_name
                          }
                        </h2>


                        <p>
                          {service.description ||
                            "Explore PBZ branches that provide this banking service."}
                        </p>

                      </div>


                      <div className="customer-service-availability">

                        <span>
                          Available at
                        </span>


                        <strong>
                          {
                            service
                              .branches
                              .length
                          }{" "}
                          {service
                            .branches
                            .length === 1
                            ? "branch"
                            : "branches"}
                        </strong>

                      </div>


                      <div className="customer-service-branch-preview">

                        {service
                          .branches
                          .length >
                        0 ? (

                          <>

                            {service.branches
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  branch
                                ) => (

                                  <span
                                    key={
                                      branch.id
                                    }
                                  >
                                    {
                                      branch.branch_name
                                    }
                                  </span>

                                )
                              )}


                            {service
                              .branches
                              .length >
                              3 && (

                              <span className="more">

                                +
                                {service
                                  .branches
                                  .length -
                                  3}{" "}
                                more

                              </span>

                            )}

                          </>

                        ) : (

                          <span>
                            No branches
                            currently
                            assigned
                          </span>

                        )}

                      </div>


                      <button
                        type="button"
                        className="customer-service-view-button"
                        onClick={() =>
                          openService(
                            service
                          )
                        }
                      >

                        View Service Branches

                        <span>
                          →
                        </span>

                      </button>

                    </article>

                  )
                )}

              </div>

            )}


          {/* =================================
              EMPTY
          ================================= */}

          {!errorMessage &&
            !isLoading &&
            filteredServices.length ===
              0 && (

              <div className="customer-services-empty">

                <div>
                  ⌕
                </div>


                <span>
                  NO SERVICES FOUND
                </span>


                <h2>
                  No service matches
                  your search.
                </h2>


                <p>
                  Try another service
                  name, branch name or
                  branch location.
                </p>


                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm(
                      ""
                    )
                  }
                >
                  Clear Search
                </button>

              </div>

            )}

        </section>

      </main>

    </div>
  );
}


export default CustomerServices;