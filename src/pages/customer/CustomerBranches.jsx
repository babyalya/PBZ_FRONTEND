import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getBranches,
  getCategories,
  getServices,
} from "../../api/api";

import "./CustomerBranches.css";

function CustomerBranches() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [atmFilter, setAtmFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBranchesPageData = async () => {
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
      console.error(
        "Failed to load customer branches page:",
        error
      );

      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load PBZ branches. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchesPageData();
  }, []);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) =>
        Number(item.id) === Number(categoryId)
    );

    return category?.category_name || "PBZ Branch";
  };

  const getBranchServices = (branchId) => {
    return services.filter(
      (service) =>
        Number(service.branch) === Number(branchId)
    );
  };

  const filteredBranches = useMemo(() => {
    const cleanedSearch = searchTerm
      .trim()
      .toLowerCase();

    return branches.filter((branch) => {
      const categoryName = getCategoryName(
        branch.category
      ).toLowerCase();

      const branchServices = getBranchServices(
        branch.id
      );

      const serviceNames = branchServices
        .map((service) => service.service_name || "")
        .join(" ")
        .toLowerCase();

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
        !cleanedSearch ||
        searchableText.includes(cleanedSearch);

      const matchesCategory =
        categoryFilter === "all" ||
        Number(branch.category) ===
          Number(categoryFilter);

      const matchesAtm =
        atmFilter === "all" ||
        (atmFilter === "available" &&
          branch.atm_status === true) ||
        (atmFilter === "unavailable" &&
          branch.atm_status === false);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAtm
      );
    });
  }, [
    branches,
    categories,
    services,
    searchTerm,
    categoryFilter,
    atmFilter,
  ]);

  const availableAtmCount = useMemo(() => {
    return branches.filter(
      (branch) => branch.atm_status === true
    ).length;
  }, [branches]);

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setAtmFilter("all");
  };

  const openBranchDetails = (branchId) => {
    navigate(`/branches/${branchId}`);
  };

  const openBranchOnMap = (branch) => {
    navigate(
      `/map?branch=${branch.id}&search=${encodeURIComponent(
        branch.branch_name
      )}`
    );
  };

  return (
    <div className="customer-branches-page">
      <header className="customer-branches-navbar">
        <Link
          to="/"
          className="customer-branches-brand"
        >
          <div className="customer-branches-brand-logo">
            PBZ
          </div>

          <div>
            <strong>PBZ GIS</strong>
            <span>Branch & ATM Locator</span>
          </div>
        </Link>

        <nav className="customer-branches-nav">
          <Link to="/">Home</Link>
          <Link
            to="/branches"
            className="is-active"
          >
            Branches
          </Link>
          <Link to="/services">Services</Link>
          <Link to="/map">Map</Link>
        </nav>

        <Link
          to="/map"
          className="customer-branches-map-button"
        >
          Open GIS Map
          <span>→</span>
        </Link>
      </header>

      <main>
        <section className="customer-branches-hero">
          <div className="customer-branches-hero-orb orb-one"></div>
          <div className="customer-branches-hero-orb orb-two"></div>

          <div className="customer-branches-hero-content">
            <div>
              <span className="customer-branches-overline">
                PBZ BRANCH DIRECTORY
              </span>

              <h1>
                Explore all PBZ branches in one place.
              </h1>

              <p>
                Search branch locations, compare ATM
                availability, check branch categories and
                see the services provided before you travel.
              </p>
            </div>

            <div className="customer-branches-hero-stats">
              <article>
                <span>Total branches</span>
                <strong>
                  {isLoading ? "..." : branches.length}
                </strong>
              </article>

              <article>
                <span>Available ATMs</span>
                <strong>
                  {isLoading
                    ? "..."
                    : availableAtmCount}
                </strong>
              </article>

              <article>
                <span>Branch services</span>
                <strong>
                  {isLoading ? "..." : services.length}
                </strong>
              </article>
            </div>
          </div>
        </section>

        <section className="customer-branches-content">
          <div className="customer-branches-filter-card">
            <div className="customer-branches-search-wrap">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search branch, area, service or address..."
                aria-label="Search PBZ branches"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              aria-label="Filter by branch category"
            >
              <option value="all">
                All categories
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

            <select
              value={atmFilter}
              onChange={(event) =>
                setAtmFilter(event.target.value)
              }
              aria-label="Filter by ATM status"
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

            <button
              type="button"
              onClick={clearFilters}
              className="customer-branches-clear-button"
            >
              Clear filters
            </button>
          </div>

          <div className="customer-branches-toolbar">
            <div>
              <span>PBZ branches</span>
              <strong>
                {isLoading
                  ? "Loading..."
                  : `${filteredBranches.length} ${
                      filteredBranches.length === 1
                        ? "branch"
                        : "branches"
                    } found`}
              </strong>
            </div>

            <Link to="/map">
              View all on map
              <span>→</span>
            </Link>
          </div>

          {errorMessage && (
            <div className="customer-branches-error">
              <div>!</div>

              <div>
                <strong>
                  We couldn't load the branches.
                </strong>
                <p>{errorMessage}</p>
              </div>

              <button
                type="button"
                onClick={loadBranchesPageData}
              >
                Try again
              </button>
            </div>
          )}

          {!errorMessage && isLoading && (
            <div className="customer-branches-grid">
              {[1, 2, 3, 4, 5, 6].map(
                (placeholder) => (
                  <article
                    key={placeholder}
                    className="customer-branch-card customer-branch-card--loading"
                  >
                    <div className="skeleton skeleton-small"></div>
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-line"></div>
                    <div className="skeleton skeleton-line short"></div>
                    <div className="skeleton skeleton-footer"></div>
                  </article>
                )
              )}
            </div>
          )}

          {!errorMessage &&
            !isLoading &&
            filteredBranches.length > 0 && (
              <div className="customer-branches-grid">
                {filteredBranches.map((branch) => {
                  const branchServices =
                    getBranchServices(branch.id);

                  const categoryName =
                    getCategoryName(branch.category);

                  return (
                    <article
                      key={branch.id}
                      className="customer-branch-card"
                    >
                      <div className="customer-branch-card-top">
                        <div className="customer-branch-icon">
                          <span>PBZ</span>
                        </div>

                        <div
                          className={`customer-branch-atm-status ${
                            branch.atm_status
                              ? "is-available"
                              : "is-unavailable"
                          }`}
                        >
                          <i></i>
                          {branch.atm_status
                            ? "ATM Available"
                            : "ATM Unavailable"}
                        </div>
                      </div>

                      <div className="customer-branch-card-heading">
                        <span>{categoryName}</span>
                        <h2>{branch.branch_name}</h2>
                        <p>
                          {branch.address ||
                            "Address not available"}
                        </p>
                      </div>

                      <div className="customer-branch-meta">
                        <div>
                          <span>Phone</span>
                          <strong>
                            {branch.phone ||
                              "Not available"}
                          </strong>
                        </div>

                        <div>
                          <span>Opening hours</span>
                          <strong>
                            {branch.opening_hours ||
                              "Not available"}
                          </strong>
                        </div>
                      </div>

                      <div className="customer-branch-services">
                        <div className="customer-branch-services-heading">
                          <span>Services</span>
                          <strong>
                            {branchServices.length}
                          </strong>
                        </div>

                        <div className="customer-branch-service-tags">
                          {branchServices.length > 0 ? (
                            <>
                              {branchServices
                                .slice(0, 3)
                                .map((service) => (
                                  <span key={service.id}>
                                    {service.service_name}
                                  </span>
                                ))}

                              {branchServices.length > 3 && (
                                <span className="customer-branch-more-services">
                                  +
                                  {branchServices.length - 3}{" "}
                                  more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="customer-branch-no-services">
                              No services listed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="customer-branch-card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openBranchDetails(branch.id)
                          }
                          className="customer-branch-details-button"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openBranchOnMap(branch)
                          }
                          className="customer-branch-map-action"
                        >
                          View on Map
                          <span>→</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredBranches.length === 0 && (
              <div className="customer-branches-empty-state">
                <div className="customer-branches-empty-icon">
                  ⌕
                </div>

                <span>NO MATCHING BRANCHES</span>

                <h2>
                  We couldn't find a branch matching your
                  filters.
                </h2>

                <p>
                  Try another branch name, location,
                  category or ATM status.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Reset all filters
                </button>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

export default CustomerBranches;