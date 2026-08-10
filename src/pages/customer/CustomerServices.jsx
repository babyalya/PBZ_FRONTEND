import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getBranches,
  getServices,
} from "../../api/api";

import "./CustomerServices.css";

function CustomerServices() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] =
    useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadServicesPageData = async () => {
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
        Array.isArray(branchesResponse.data)
          ? branchesResponse.data
          : []
      );

      setServices(
        Array.isArray(servicesResponse.data)
          ? servicesResponse.data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load services page:",
        error
      );

      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load PBZ services. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServicesPageData();
  }, []);

  const groupedServices = useMemo(() => {
    const grouped = {};

    services.forEach((service) => {
      const normalizedName =
        service.service_name
          ?.trim()
          .toLowerCase();

      if (!normalizedName) {
        return;
      }

      if (!grouped[normalizedName]) {
        grouped[normalizedName] = {
          service_name:
            service.service_name.trim(),

          description:
            service.description || "",

          branches: [],
        };
      }

      const branch = branches.find(
        (item) =>
          Number(item.id) ===
          Number(service.branch)
      );

      if (
        branch &&
        !grouped[
          normalizedName
        ].branches.some(
          (item) =>
            Number(item.id) ===
            Number(branch.id)
        )
      ) {
        grouped[
          normalizedName
        ].branches.push(branch);
      }
    });

    return Object.values(grouped);
  }, [services, branches]);

  const filteredServices = useMemo(() => {
    const cleanedSearch =
      searchTerm.trim().toLowerCase();

    if (!cleanedSearch) {
      return groupedServices;
    }

    return groupedServices.filter((service) => {
      const branchNames =
        service.branches
          .map((branch) => branch.branch_name)
          .join(" ")
          .toLowerCase();

      const searchableText = [
        service.service_name,
        service.description,
        branchNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(cleanedSearch);
    });
  }, [groupedServices, searchTerm]);

  const openService = (service) => {
    setSelectedService(service);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeService = () => {
    setSelectedService(null);
  };

  const openBranchDetails = (branchId) => {
    navigate(`/branches/${branchId}`);
  };

  const openBranchOnMap = (branch) => {
    navigate(
      `/map?branch=${
        branch.id
      }&search=${encodeURIComponent(
        branch.branch_name
      )}`
    );
  };

  return (
    <div className="customer-services-page">
      {/* Navbar */}

      <header className="customer-services-navbar">
        <Link
          to="/"
          className="customer-services-brand"
        >
          <div className="customer-services-logo">
            PBZ
          </div>

          <div>
            <strong>PBZ GIS</strong>

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

          <Link to="/map">
            Map
          </Link>
        </nav>

        <Link
          to="/map"
          className="customer-services-map-button"
        >
          Open GIS Map
          <span>→</span>
        </Link>
      </header>

      <main>
        {/* Hero */}

        <section className="customer-services-hero">
          <div className="customer-services-circle circle-one"></div>
          <div className="customer-services-circle circle-two"></div>

          <div className="customer-services-hero-content">
            <div>
              <span className="customer-services-overline">
                PBZ BANKING SERVICES
              </span>

              <h1>
                Find the right banking service
                before visiting a branch.
              </h1>

              <p>
                Explore the services available
                across PBZ branches and identify
                where each service is offered.
              </p>
            </div>

            <div className="customer-services-hero-summary">
              <article>
                <span>
                  Unique services
                </span>

                <strong>
                  {isLoading
                    ? "..."
                    : groupedServices.length}
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
                  Service records
                </span>

                <strong>
                  {isLoading
                    ? "..."
                    : services.length}
                </strong>
              </article>
            </div>
          </div>
        </section>

        {/* Content */}

        <section className="customer-services-content">
          {/* Search */}

          <div className="customer-services-search-card">
            <div className="customer-services-search-input">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search service or branch..."
                aria-label="Search PBZ services"
              />
            </div>

            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm("")
                }
              >
                Clear
              </button>
            )}
          </div>

          {/* Selected Service */}

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
                  onClick={closeService}
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
                      selectedService.branches
                        .length
                    }{" "}
                    {selectedService.branches
                      .length === 1
                      ? "branch"
                      : "branches"}
                  </strong>
                </div>
              </div>

              {selectedService.branches.length >
              0 ? (
                <div className="customer-service-branches-grid">
                  {selectedService.branches.map(
                    (branch) => (
                      <article
                        key={branch.id}
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
                          {branch.branch_name}
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
                              {branch.opening_hours ||
                                "Not available"}
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
                            <span>→</span>
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="customer-service-no-branches">
                  No branch information is
                  currently available for this
                  service.
                </div>
              )}
            </section>
          )}

          {/* Toolbar */}

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
              <span>→</span>
            </Link>
          </div>

          {/* Error */}

          {errorMessage && (
            <div className="customer-services-error">
              <div>!</div>

              <div>
                <strong>
                  We couldn't load the
                  services.
                </strong>

                <p>
                  {errorMessage}
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

          {/* Loading */}

          {!errorMessage &&
            isLoading && (
              <div className="customer-services-grid">
                {[1, 2, 3, 4, 5, 6].map(
                  (item) => (
                    <article
                      key={item}
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

          {/* Services Grid */}

          {!errorMessage &&
            !isLoading &&
            filteredServices.length > 0 && (
              <div className="customer-services-grid">
                {filteredServices.map(
                  (service, index) => (
                    <article
                      key={
                        service.service_name
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
                          ).padStart(2, "0")}
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
                            service.branches
                              .length
                          }{" "}
                          {service.branches
                            .length === 1
                            ? "branch"
                            : "branches"}
                        </strong>
                      </div>

                      <div className="customer-service-branch-preview">
                        {service.branches.length >
                        0 ? (
                          service.branches
                            .slice(0, 3)
                            .map((branch) => (
                              <span
                                key={
                                  branch.id
                                }
                              >
                                {
                                  branch.branch_name
                                }
                              </span>
                            ))
                        ) : (
                          <span>
                            No branches listed
                          </span>
                        )}

                        {service.branches.length >
                          3 && (
                          <span className="more">
                            +
                            {service.branches
                              .length - 3}{" "}
                            more
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="customer-service-view-button"
                        onClick={() =>
                          openService(service)
                        }
                      >
                        View Service Branches
                        <span>→</span>
                      </button>
                    </article>
                  )
                )}
              </div>
            )}

          {/* Empty */}

          {!errorMessage &&
            !isLoading &&
            filteredServices.length ===
              0 && (
              <div className="customer-services-empty">
                <div>⌕</div>

                <span>
                  NO SERVICES FOUND
                </span>

                <h2>
                  No service matches your
                  search.
                </h2>

                <p>
                  Try searching using another
                  service or branch name.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
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