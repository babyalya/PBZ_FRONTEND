import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  customerLogout,
  getBranches,
  getCategories,
  getServices,
} from "../../api/api";
import {
  clearCustomerSession,
  getLoggedInCustomer,
  isCustomerLoggedIn,
} from "../../utils/customerSession";

import "./CustomerHome.css";

function CustomerHome() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [loggedInCustomer, setLoggedInCustomer] =
    useState(() => getLoggedInCustomer());
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const loadHomeData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        branchesResponse,
        categoriesResponse,
        servicesResponse,
      ] = await Promise.all([
        getBranches(),
        getCategories(),
        getServices(),
      ]);

      setBranches(
        Array.isArray(branchesResponse.data)
          ? branchesResponse.data
          : []
      );

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
      console.error("Failed to load homepage data:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load branch information."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const availableBranches = branches.filter(
    (branch) => branch.atm_status === true
  );

  const unavailableBranches = branches.filter(
    (branch) => branch.atm_status === false
  );

  const featuredBranches = useMemo(() => {
    return [...branches]
      .sort((firstBranch, secondBranch) => {
        return Number(secondBranch.atm_status) -
          Number(firstBranch.atm_status);
      })
      .slice(0, 4);
  }, [branches]);

  const featuredServices = useMemo(() => {
    const uniqueServices = [];

    services.forEach((service) => {
      const alreadyExists = uniqueServices.some(
        (item) =>
          item.service_name?.toLowerCase() ===
          service.service_name?.toLowerCase()
      );

      if (!alreadyExists) {
        uniqueServices.push(service);
      }
    });

    return uniqueServices.slice(0, 6);
  }, [services]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) =>
        Number(item.id) === Number(categoryId)
    );

    return category?.category_name || "PBZ Branch";
  };

  const getBranchServiceCount = (branchId) => {
    return services.filter(
      (service) =>
        Number(service.branch) === Number(branchId)
    ).length;
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const cleanedSearch = searchTerm.trim();

    if (cleanedSearch) {
      navigate(
        `/map?search=${encodeURIComponent(cleanedSearch)}`
      );
    } else {
      navigate("/map");
    }
  };

  const openBranchOnMap = (branch) => {
    navigate(
      `/map?branch=${branch.id}&search=${encodeURIComponent(
        branch.branch_name
      )}`
    );
  };

  const customerIsLoggedIn =
    isCustomerLoggedIn() && loggedInCustomer;

  const customerDisplayName =
    loggedInCustomer?.first_name?.trim() ||
    loggedInCustomer?.username ||
    "Customer";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await customerLogout();
    } catch (error) {
      console.error("Customer logout failed:", error);
    } finally {
      clearCustomerSession();
      setLoggedInCustomer(null);
      setIsLoggingOut(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="customer-home-page">
      <header className="customer-home-navbar">
        <Link
          to="/"
          className="customer-home-brand"
        >
          <div className="customer-home-logo">
            PBZ
          </div>

          <div>
            <strong>PBZ GIS</strong>
            <span>Branch & ATM Locator</span>
          </div>
        </Link>

        <div className="customer-home-navbar-actions">
          {customerIsLoggedIn ? (
            <>
              <span className="customer-header-welcome">
                Hi, {customerDisplayName}
              </span>

              <button
                type="button"
                className="customer-header-link customer-header-link--ghost"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="customer-header-link customer-header-link--ghost"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="customer-header-link customer-header-link--soft"
              >
                Register
              </Link>
            </>
          )}

          <Link
            to="/map"
            className="customer-header-link customer-header-link--primary"
          >
            Open Map
          </Link>
        </div>
      </header>

      <main>
        <section className="customer-hero-section">
          <div className="customer-hero-decoration decoration-one"></div>
          <div className="customer-hero-decoration decoration-two"></div>

          <div className="customer-hero-content">
            <div className="customer-hero-text">
              <div className="customer-hero-badge">
                <span></span>
                Smart PBZ branch locator
              </div>

              <h1>
                Find the nearest
                <span> PBZ branch and ATM </span>
                with confidence.
              </h1>

              <p>
                Search available PBZ branches, explore
                services, check ATM availability and get
                directions using our interactive GIS map.
              </p>

              <form
                className="customer-hero-search"
                onSubmit={handleSearch}
              >
                <div className="customer-search-input">
                  <span className="customer-search-icon">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search branch, location or service..."
                    aria-label="Search branch, location or service"
                  />
                </div>

                <button type="submit">
                  Search on Map
                </button>
              </form>

              <div className="customer-hero-links">
                <Link to="/map">
                  Explore all branches
                  <span>→</span>
                </Link>

                <div className="customer-availability-message">
                  <span></span>
                  {availableBranches.length} ATMs currently
                  available
                </div>
              </div>
            </div>

            <div className="customer-hero-visual">
              <div className="customer-map-preview">
                <div className="customer-map-grid"></div>

                <div className="customer-map-road road-one"></div>
                <div className="customer-map-road road-two"></div>
                <div className="customer-map-road road-three"></div>

                <div className="customer-map-pin pin-one available">
                  <span></span>
                </div>

                <div className="customer-map-pin pin-two available">
                  <span></span>
                </div>

                <div className="customer-map-pin pin-three unavailable">
                  <span></span>
                </div>

                <div className="customer-map-pin pin-four available">
                  <span></span>
                </div>

                <div className="customer-map-preview-card">
                  <div className="customer-preview-card-header">
                    <div>
                      <span>Nearest branch</span>
                      <strong>
                        {branches[0]?.branch_name ||
                          "PBZ Branch"}
                      </strong>
                    </div>

                    <div
                      className={`customer-preview-status ${
                        branches[0]?.atm_status
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <span></span>
                      {branches[0]?.atm_status
                        ? "ATM Available"
                        : "Checking"}
                    </div>
                  </div>

                  <p>
                    {branches[0]?.address ||
                      "Zanzibar, Tanzania"}
                  </p>

                  <Link to="/map">
                    View on map
                    <span>→</span>
                  </Link>
                </div>

                <div className="customer-map-floating-stat">
                  <span>Branches mapped</span>
                  <strong>{branches.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="customer-statistics-section">
          <article>
            <div className="customer-stat-icon branches">
              BR
            </div>

            <div>
              <strong>
                {isLoading ? "..." : branches.length}
              </strong>
              <span>Total PBZ branches</span>
            </div>
          </article>

          <article>
            <div className="customer-stat-icon available">
              ✓
            </div>

            <div>
              <strong>
                {isLoading
                  ? "..."
                  : availableBranches.length}
              </strong>
              <span>Available ATMs</span>
            </div>
          </article>

          <article>
            <div className="customer-stat-icon unavailable">
              !
            </div>

            <div>
              <strong>
                {isLoading
                  ? "..."
                  : unavailableBranches.length}
              </strong>
              <span>Unavailable ATMs</span>
            </div>
          </article>

          <article>
            <div className="customer-stat-icon services">
              SV
            </div>

            <div>
              <strong>
                {isLoading ? "..." : services.length}
              </strong>
              <span>Branch services</span>
            </div>
          </article>
        </section>

        <section className="customer-how-section">
          <div className="customer-section-heading">
            <div>
              <span className="customer-section-overline">
                EASY TO USE
              </span>

              <h2>
                Find the right branch in three steps
              </h2>
            </div>

            <p>
              PBZ GIS helps you avoid visiting the wrong
              branch or unavailable ATM.
            </p>
          </div>

          <div className="customer-steps-grid">
            <article>
              <div className="customer-step-number">
                01
              </div>

              <div className="customer-step-icon">
                ⌕
              </div>

              <h3>Search your location</h3>

              <p>
                Enter a branch name, area, address or
                service you need.
              </p>
            </article>

            <article>
              <div className="customer-step-number">
                02
              </div>

              <div className="customer-step-icon">
                MAP
              </div>

              <h3>Explore the GIS map</h3>

              <p>
                View all available PBZ branches using
                their accurate map coordinates.
              </p>
            </article>

            <article>
              <div className="customer-step-number">
                03
              </div>

              <div className="customer-step-icon">
                GO
              </div>

              <h3>Choose and get directions</h3>

              <p>
                Check ATM status, branch services and
                navigate to the selected branch.
              </p>
            </article>
          </div>
        </section>

        <section className="customer-featured-section">
          <div className="customer-section-heading">
            <div>
              <span className="customer-section-overline">
                AVAILABLE LOCATIONS
              </span>

              <h2>Featured PBZ branches</h2>
            </div>

            <Link to="/map">
              View all branches
              <span>→</span>
            </Link>
          </div>

          {errorMessage && (
            <div className="customer-home-error">
              <span>!</span>
              <p>{errorMessage}</p>

              <button
                type="button"
                onClick={loadHomeData}
              >
                Try again
              </button>
            </div>
          )}

          <div className="customer-featured-grid">
            {isLoading
              ? Array.from({ length: 4 }).map(
                  (_, index) => (
                    <div
                      className="customer-branch-skeleton"
                      key={index}
                    >
                      <div></div>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )
                )
              : featuredBranches.map((branch) => (
                  <article
                    className="customer-featured-card"
                    key={branch.id}
                  >
                    <div className="customer-featured-card-top">
                      <div
                        className={`customer-featured-marker ${
                          branch.atm_status
                            ? "available"
                            : "unavailable"
                        }`}
                      >
                        <span></span>
                      </div>

                      <div
                        className={`customer-atm-badge ${
                          branch.atm_status
                            ? "available"
                            : "unavailable"
                        }`}
                      >
                        <span></span>

                        {branch.atm_status
                          ? "ATM Available"
                          : "ATM Unavailable"}
                      </div>
                    </div>

                    <div className="customer-featured-card-body">
                      <span className="customer-branch-category">
                        {getCategoryName(
                          branch.category
                        )}
                      </span>

                      <h3>{branch.branch_name}</h3>

                      <p>{branch.address}</p>

                      <div className="customer-featured-details">
                        <div>
                          <span>Opening hours</span>
                          <strong>
                            {branch.opening_hours}
                          </strong>
                        </div>

                        <div>
                          <span>Services</span>
                          <strong>
                            {getBranchServiceCount(
                              branch.id
                            )}{" "}
                            available
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="customer-featured-card-footer">
                      <span>{branch.phone}</span>

                      <button
                        type="button"
                        onClick={() =>
                          openBranchOnMap(branch)
                        }
                      >
                        View branch
                        <span>→</span>
                      </button>
                    </div>
                  </article>
                ))}
          </div>
        </section>

        <section
          className="customer-services-section"
          id="services"
        >
          <div className="customer-section-heading light">
            <div>
              <span className="customer-section-overline">
                BANKING SERVICES
              </span>

              <h2>
                Services you can find at PBZ branches
              </h2>
            </div>

            <p>
              Browse branch services before visiting your
              preferred PBZ location.
            </p>
          </div>

          <div className="customer-services-grid">
            {featuredServices.length > 0 ? (
              featuredServices.map(
                (service, index) => (
                  <article key={service.id}>
                    <div className="customer-service-icon">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div>
                      <h3>
                        {service.service_name}
                      </h3>

                      <p>
                        {service.description ||
                          "Available at selected PBZ branches."}
                      </p>
                    </div>
                  </article>
                )
              )
            ) : (
              <>
                <ServiceCard
                  number="01"
                  title="Account Opening"
                  description="Open savings, current and business accounts."
                />

                <ServiceCard
                  number="02"
                  title="Money Transfer"
                  description="Send and receive money through PBZ services."
                />

                <ServiceCard
                  number="03"
                  title="Cash Deposit"
                  description="Deposit money securely at available branches."
                />

                <ServiceCard
                  number="04"
                  title="Cash Withdrawal"
                  description="Withdraw cash through branch or ATM services."
                />

                <ServiceCard
                  number="05"
                  title="Customer Support"
                  description="Receive assistance for banking enquiries."
                />

                <ServiceCard
                  number="06"
                  title="Business Banking"
                  description="Access banking support for your business."
                />
              </>
            )}
          </div>

          <div className="customer-service-action">
            <Link to="/map">
              Find branches by service
              <span>→</span>
            </Link>
          </div>
        </section>

        <section
          className="customer-about-section"
          id="about"
        >
          <div className="customer-about-visual">
            <div className="customer-about-circle circle-one"></div>
            <div className="customer-about-circle circle-two"></div>

            <div className="customer-about-map-card">
              <div className="customer-about-map-header">
                <span>GIS LOCATION SYSTEM</span>

                <strong>Unguja, Zanzibar</strong>
              </div>

              <div className="customer-about-map-body">
                <div className="customer-about-route"></div>

                <span className="customer-about-pin pin-a"></span>
                <span className="customer-about-pin pin-b"></span>
                <span className="customer-about-pin pin-c"></span>
              </div>

              <div className="customer-about-map-footer">
                <div>
                  <strong>{branches.length}</strong>
                  <span>Locations</span>
                </div>

                <div>
                  <strong>
                    {availableBranches.length}
                  </strong>
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>

          <div className="customer-about-content">
            <span className="customer-section-overline">
              ABOUT PBZ GIS
            </span>

            <h2>
              Better branch information before you travel.
            </h2>

            <p>
              PBZ GIS is designed to help customers locate
              bank branches and ATMs accurately. The system
              provides branch positions, contact details,
              opening hours, services and ATM status.
            </p>

            <div className="customer-about-benefits">
              <div>
                <span>✓</span>
                Accurate branch locations
              </div>

              <div>
                <span>✓</span>
                Current ATM availability
              </div>

              <div>
                <span>✓</span>
                Branch service information
              </div>

              <div>
                <span>✓</span>
                Easy directions and navigation
              </div>
            </div>

            <Link to="/map">
              Explore the GIS map
              <span>→</span>
            </Link>
          </div>
        </section>

        <section className="customer-call-to-action">
          <div>
            <span className="customer-section-overline">
              START EXPLORING
            </span>

            <h2>
              Your nearest PBZ branch is only a few
              clicks away.
            </h2>

            <p>
              Open the interactive GIS map to view
              available branches, ATMs and banking
              services.
            </p>
          </div>

          <Link to="/map">
            Open GIS Map
            <span>→</span>
          </Link>
        </section>
      </main>

      <footer className="customer-home-footer">
        <div className="customer-footer-main">
          <div className="customer-footer-brand">
            <div className="customer-home-logo">
              PBZ
            </div>

            <div>
              <strong>PBZ GIS System</strong>

              <p>
                Helping customers locate PBZ branches and
                ATM services across Zanzibar.
              </p>
            </div>
          </div>

          <div className="customer-footer-links">
            <div>
              <strong>Navigation</strong>
              <Link to="/">Home</Link>
              <Link to="/map">GIS Map</Link>
              <a href="#services">Services</a>
            </div>

            <div>
              <strong>Information</strong>
              <a href="#about">About system</a>
              <Link to="/map">Branch locations</Link>
              <Link to="/admin/login">
                Administrator
              </Link>
            </div>
          </div>
        </div>

        <div className="customer-footer-bottom">
          <span>
            © 2026 PBZ GIS System. All rights reserved.
          </span>

          <span>
            Branch and ATM Service Locator
          </span>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({
  number,
  title,
  description,
}) {
  return (
    <article>
      <div className="customer-service-icon">
        {number}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

export default CustomerHome;