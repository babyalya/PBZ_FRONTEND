import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getBranchById,
  getCategories,
  getServices,
} from "../../api/api";

import "./CustomerBranchDetails.css";

function CustomerBranchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadBranchDetails = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        branchResponse,
        categoriesResponse,
        servicesResponse,
      ] = await Promise.all([
        getBranchById(id),
        getCategories(),
        getServices(),
      ]);

      setBranch(branchResponse.data);

      setCategories(
        Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : []
      );

      setServices(
        Array.isArray(servicesResponse.data)
          ? servicesResponse.data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load branch details:",
        error
      );

      if (error.response?.status === 404) {
        setErrorMessage(
          "The requested PBZ branch could not be found."
        );
      } else {
        setErrorMessage(
          error.response?.data?.detail ||
            "Unable to load branch information. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchDetails();
  }, [id]);

  const categoryName = useMemo(() => {
    if (!branch) {
      return "PBZ Branch";
    }

    const category = categories.find(
      (item) =>
        Number(item.id) ===
        Number(branch.category)
    );

    return (
      category?.category_name ||
      "PBZ Branch"
    );
  }, [branch, categories]);

  const branchServices = useMemo(() => {
    if (!branch) {
      return [];
    }

    return services.filter(
      (service) =>
        Number(service.branch) ===
        Number(branch.id)
    );
  }, [branch, services]);

  const openOnMap = () => {
    if (!branch) {
      return;
    }

    navigate(
      `/map?branch=${
        branch.id
      }&search=${encodeURIComponent(
        branch.branch_name
      )}`
    );
  };

  const openDirections = () => {
    if (
      !branch?.latitude ||
      !branch?.longitude
    ) {
      return;
    }

    const destination = `${branch.latitude},${branch.longitude}`;

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (isLoading) {
    return (
      <div className="branch-details-page">
        <header className="branch-details-navbar">
          <Link
            to="/"
            className="branch-details-brand"
          >
            <div className="branch-details-logo">
              PBZ
            </div>

            <div>
              <strong>PBZ GIS</strong>
              <span>
                Branch & ATM Locator
              </span>
            </div>
          </Link>
        </header>

        <main className="branch-details-loading">
          <div className="branch-details-spinner"></div>

          <h2>
            Loading branch information...
          </h2>

          <p>
            Please wait while we retrieve
            branch details and services.
          </p>
        </main>
      </div>
    );
  }

  if (errorMessage || !branch) {
    return (
      <div className="branch-details-page">
        <header className="branch-details-navbar">
          <Link
            to="/"
            className="branch-details-brand"
          >
            <div className="branch-details-logo">
              PBZ
            </div>

            <div>
              <strong>PBZ GIS</strong>
              <span>
                Branch & ATM Locator
              </span>
            </div>
          </Link>
        </header>

        <main className="branch-details-error-page">
          <div className="branch-details-error-icon">
            !
          </div>

          <span>BRANCH NOT AVAILABLE</span>

          <h1>
            We couldn't display this branch.
          </h1>

          <p>
            {errorMessage}
          </p>

          <div className="branch-details-error-actions">
            <button
              type="button"
              onClick={loadBranchDetails}
            >
              Try Again
            </button>

            <Link to="/branches">
              Back to Branches
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="branch-details-page">
      {/* Navbar */}

      <header className="branch-details-navbar">
        <Link
          to="/"
          className="branch-details-brand"
        >
          <div className="branch-details-logo">
            PBZ
          </div>

          <div>
            <strong>PBZ GIS</strong>

            <span>
              Branch & ATM Locator
            </span>
          </div>
        </Link>

        <nav className="branch-details-nav">
          <Link to="/">
            Home
          </Link>

          <Link
            to="/branches"
            className="is-active"
          >
            Branches
          </Link>

          <Link to="/services">
            Services
          </Link>

          <Link to="/map">
            Map
          </Link>
        </nav>

        <Link
          to="/map"
          className="branch-details-map-link"
        >
          Open GIS Map
          <span>→</span>
        </Link>
      </header>

      <main>
        {/* Breadcrumb */}

        <section className="branch-details-breadcrumb">
          <div>
            <Link to="/">
              Home
            </Link>

            <span>/</span>

            <Link to="/branches">
              Branches
            </Link>

            <span>/</span>

            <strong>
              {branch.branch_name}
            </strong>
          </div>
        </section>

        {/* Hero */}

        <section className="branch-details-hero">
          <div className="branch-details-hero-circle circle-one"></div>
          <div className="branch-details-hero-circle circle-two"></div>

          <div className="branch-details-hero-content">
            <div className="branch-details-hero-main">
              <div className="branch-details-category">
                {categoryName}
              </div>

              <h1>
                {branch.branch_name}
              </h1>

              <div className="branch-details-location">
                <span>LOC</span>

                <p>
                  {branch.address ||
                    "Branch address unavailable"}
                </p>
              </div>

              <div className="branch-details-hero-actions">
                <button
                  type="button"
                  onClick={openOnMap}
                  className="branch-details-primary-button"
                >
                  View on GIS Map
                  <span>→</span>
                </button>

                <button
                  type="button"
                  onClick={openDirections}
                  className="branch-details-secondary-button"
                  disabled={
                    !branch.latitude ||
                    !branch.longitude
                  }
                >
                  Get Directions
                </button>
              </div>
            </div>

            <div className="branch-details-status-panel">
              <span>
                ATM STATUS
              </span>

              <div
                className={`branch-details-atm-badge ${
                  branch.atm_status
                    ? "available"
                    : "unavailable"
                }`}
              >
                <i></i>

                {branch.atm_status
                  ? "ATM Available"
                  : "ATM Unavailable"}
              </div>

              <p>
                {branch.atm_status
                  ? "This branch currently shows an available ATM."
                  : "The ATM at this branch is currently marked unavailable."}
              </p>
            </div>
          </div>
        </section>

        {/* Main content */}

        <section className="branch-details-content">
          <div className="branch-details-main-column">
            {/* Branch information */}

            <section className="branch-details-card">
              <div className="branch-details-section-heading">
                <div>
                  <span>
                    BRANCH INFORMATION
                  </span>

                  <h2>
                    Contact and operating details
                  </h2>
                </div>

                <div className="branch-details-heading-icon">
                  PBZ
                </div>
              </div>

              <div className="branch-details-info-grid">
                <article>
                  <div className="branch-details-info-icon">
                    TEL
                  </div>

                  <div>
                    <span>
                      Phone Number
                    </span>

                    <strong>
                      {branch.phone ||
                        "Not available"}
                    </strong>
                  </div>
                </article>

                <article>
                  <div className="branch-details-info-icon">
                    HRS
                  </div>

                  <div>
                    <span>
                      Opening Hours
                    </span>

                    <strong>
                      {branch.opening_hours ||
                        "Not available"}
                    </strong>
                  </div>
                </article>

                <article>
                  <div className="branch-details-info-icon">
                    CAT
                  </div>

                  <div>
                    <span>
                      Branch Category
                    </span>

                    <strong>
                      {categoryName}
                    </strong>
                  </div>
                </article>

                <article>
                  <div className="branch-details-info-icon">
                    ATM
                  </div>

                  <div>
                    <span>
                      ATM Availability
                    </span>

                    <strong
                      className={
                        branch.atm_status
                          ? "branch-info-positive"
                          : "branch-info-negative"
                      }
                    >
                      {branch.atm_status
                        ? "Available"
                        : "Unavailable"}
                    </strong>
                  </div>
                </article>
              </div>
            </section>

            {/* Services */}

            <section className="branch-details-card branch-services-card">
              <div className="branch-details-section-heading">
                <div>
                  <span>
                    AVAILABLE SERVICES
                  </span>

                  <h2>
                    Banking services at this branch
                  </h2>
                </div>

                <div className="branch-services-count">
                  {branchServices.length}
                </div>
              </div>

              {branchServices.length > 0 ? (
                <div className="branch-details-services-grid">
                  {branchServices.map(
                    (service, index) => (
                      <article
                        key={service.id}
                        className="branch-details-service-item"
                      >
                        <div className="branch-service-number">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>

                        <div>
                          <h3>
                            {
                              service.service_name
                            }
                          </h3>

                          <p>
                            {service.description ||
                              "This banking service is available at this PBZ branch."}
                          </p>
                        </div>

                        <span className="branch-service-check">
                          ✓
                        </span>
                      </article>
                    )
                  )}
                </div>
              ) : (
                <div className="branch-details-no-services">
                  <div>SV</div>

                  <h3>
                    No services have been listed.
                  </h3>

                  <p>
                    Service information for this
                    branch is currently unavailable.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right column */}

          <aside className="branch-details-side-column">
            {/* Location card */}

            <section className="branch-details-location-card">
              <div className="branch-details-map-preview">
                <div className="branch-map-grid"></div>

                <div className="branch-map-road road-one"></div>
                <div className="branch-map-road road-two"></div>

                <div className="branch-map-pin">
                  <span></span>
                </div>

                <div className="branch-map-preview-label">
                  <span>
                    Branch location
                  </span>

                  <strong>
                    {branch.branch_name}
                  </strong>
                </div>
              </div>

              <div className="branch-details-location-content">
                <span>
                  GIS LOCATION
                </span>

                <h3>
                  Branch coordinates
                </h3>

                <div className="branch-coordinate-grid">
                  <div>
                    <span>
                      Latitude
                    </span>

                    <strong>
                      {branch.latitude ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Longitude
                    </span>

                    <strong>
                      {branch.longitude ||
                        "Not available"}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openOnMap}
                >
                  Explore on GIS Map
                  <span>→</span>
                </button>
              </div>
            </section>

            {/* Quick summary */}

            <section className="branch-details-summary-card">
              <span>
                QUICK SUMMARY
              </span>

              <h3>
                Before you visit
              </h3>

              <ul>
                <li>
                  <span>✓</span>

                  <div>
                    <strong>
                      Confirm services
                    </strong>

                    <p>
                      {branchServices.length}{" "}
                      banking service
                      {branchServices.length === 1
                        ? ""
                        : "s"}{" "}
                      listed.
                    </p>
                  </div>
                </li>

                <li>
                  <span>
                    {branch.atm_status
                      ? "✓"
                      : "!"}
                  </span>

                  <div>
                    <strong>
                      Check ATM status
                    </strong>

                    <p>
                      ATM is currently{" "}
                      {branch.atm_status
                        ? "available."
                        : "unavailable."}
                    </p>
                  </div>
                </li>

                <li>
                  <span>✓</span>

                  <div>
                    <strong>
                      Check opening hours
                    </strong>

                    <p>
                      {branch.opening_hours ||
                        "Opening hours unavailable."}
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <Link
              to="/branches"
              className="branch-details-back-link"
            >
              <span>←</span>
              Back to all branches
            </Link>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default CustomerBranchDetails;