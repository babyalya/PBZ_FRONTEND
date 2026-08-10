import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import L from "leaflet";

import {
  getBranches,
  getCategories,
  getServices,
} from "../../api/api";

import "leaflet/dist/leaflet.css";
import "./GISMap.css";

const DEFAULT_CENTER = [-6.1659, 39.2026];
const DEFAULT_ZOOM = 12;

function GISMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [serviceFilter, setServiceFilter] =
    useState("all");

  const [selectedBranch, setSelectedBranch] =
    useState(null);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(true);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const markerRefs = useRef({});

  const requestedBranchId =
    searchParams.get("branch");

  const requestedSearch =
    searchParams.get("search");

  const loadMapData = async () => {
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
        "Failed to load GIS information:",
        error
      );

      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load branch locations. Please make sure the API is available."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    if (requestedSearch) {
      setSearchTerm(requestedSearch);
    }
  }, [requestedSearch]);

  const validBranches = useMemo(() => {
    return branches.filter((branch) => {
      const latitude = Number(branch.latitude);
      const longitude = Number(branch.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    });
  }, [branches]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) =>
        Number(item.id) ===
        Number(categoryId)
    );

    return (
      category?.category_name ||
      "PBZ Branch"
    );
  };

  const getBranchServices = (branchId) => {
    return services.filter(
      (service) =>
        Number(service.branch) ===
        Number(branchId)
    );
  };

  const uniqueServices = useMemo(() => {
    const serviceMap = new Map();

    services.forEach((service) => {
      const name =
        service.service_name?.trim();

      if (!name) {
        return;
      }

      const key = name.toLowerCase();

      if (!serviceMap.has(key)) {
        serviceMap.set(key, {
          name,
        });
      }
    });

    return Array.from(serviceMap.values());
  }, [services]);

  const filteredBranches = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return validBranches.filter(
      (branch) => {
        const branchServices =
          getBranchServices(branch.id);

        const serviceNames =
          branchServices
            .map(
              (service) =>
                service.service_name || ""
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
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch
          );

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "available" &&
            branch.atm_status === true) ||
          (statusFilter ===
            "unavailable" &&
            branch.atm_status === false);

        const matchesCategory =
          categoryFilter === "all" ||
          Number(branch.category) ===
            Number(categoryFilter);

        const matchesService =
          serviceFilter === "all" ||
          branchServices.some(
            (service) =>
              service.service_name
                ?.trim()
                .toLowerCase() ===
              serviceFilter.toLowerCase()
          );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesService
        );
      }
    );
  }, [
    validBranches,
    searchTerm,
    statusFilter,
    categoryFilter,
    serviceFilter,
    categories,
    services,
  ]);

  const availableCount =
    validBranches.filter(
      (branch) =>
        branch.atm_status === true
    ).length;

  const unavailableCount =
    validBranches.filter(
      (branch) =>
        branch.atm_status === false
    ).length;

  useEffect(() => {
    if (
      !requestedBranchId ||
      validBranches.length === 0
    ) {
      return;
    }

    const branch =
      validBranches.find(
        (item) =>
          Number(item.id) ===
          Number(requestedBranchId)
      );

    if (branch) {
      setSelectedBranch(branch);
      setIsSidebarOpen(true);

      setTimeout(() => {
        markerRefs.current[
          branch.id
        ]?.openPopup();
      }, 350);
    }
  }, [
    requestedBranchId,
    validBranches,
  ]);

  const handleSelectBranch = (
    branch
  ) => {
    setSelectedBranch(branch);

    const marker =
      markerRefs.current[branch.id];

    if (marker) {
      marker.openPopup();
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setServiceFilter("all");
    setSelectedBranch(null);
  };

  const openBranchDetails = (
    branchId
  ) => {
    navigate(
      `/branches/${branchId}`
    );
  };

  return (
    <div className="gis-page">
      <header className="gis-topbar">
        <Link
          to="/"
          className="gis-brand"
        >
          <div className="gis-brand-logo">
            PBZ
          </div>

          <div>
            <h1>PBZ GIS</h1>

            <p>
              Branch & ATM Locator
            </p>
          </div>
        </Link>

        <nav className="gis-main-navigation">
          <Link to="/">
            Home
          </Link>

          <Link to="/branches">
            Branches
          </Link>

          <Link to="/services">
            Services
          </Link>

          <Link
            to="/map"
            className="active"
          >
            Map
          </Link>
        </nav>

        <div className="gis-topbar-actions">
          <div className="gis-live-status">
            <span></span>

            Live branch information
          </div>

          <button
            type="button"
            className="gis-refresh-button"
            onClick={loadMapData}
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>
      </header>

      <main className="gis-layout">
        <aside
          className={`gis-sidebar ${
            isSidebarOpen
              ? "open"
              : "closed"
          }`}
        >
          <div className="gis-sidebar-header">
            <div>
              <p className="gis-overline">
                PBZ BRANCH LOCATOR
              </p>

              <h2>
                Find a PBZ Branch
              </h2>

              <p>
                Search branches,
                services and ATM
                availability from the map.
              </p>
            </div>

            <button
              type="button"
              className="gis-close-sidebar"
              onClick={() =>
                setIsSidebarOpen(false)
              }
              aria-label="Close branch panel"
            >
              ×
            </button>
          </div>

          <section className="gis-statistics">
            <article>
              <div className="gis-stat-icon total">
                PB
              </div>

              <div>
                <span>
                  Total branches
                </span>

                <strong>
                  {
                    validBranches.length
                  }
                </strong>
              </div>
            </article>

            <article>
              <div className="gis-stat-icon available">
                ✓
              </div>

              <div>
                <span>
                  ATM available
                </span>

                <strong>
                  {availableCount}
                </strong>
              </div>
            </article>

            <article>
              <div className="gis-stat-icon unavailable">
                !
              </div>

              <div>
                <span>
                  ATM unavailable
                </span>

                <strong>
                  {unavailableCount}
                </strong>
              </div>
            </article>
          </section>

          <section className="gis-filters">
            <label
              className="gis-field-label"
              htmlFor="branch-search"
            >
              Search
            </label>

            <div className="gis-search-box">
              <span>⌕</span>

              <input
                id="branch-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Branch, location or service..."
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="gis-filter-grid">
              <div>
                <label htmlFor="status-filter">
                  ATM Status
                </label>

                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All statuses
                  </option>

                  <option value="available">
                    Available
                  </option>

                  <option value="unavailable">
                    Unavailable
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="category-filter">
                  Category
                </label>

                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
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
              </div>
            </div>

            <div className="gis-service-filter">
              <label htmlFor="service-filter">
                Banking Service
              </label>

              <select
                id="service-filter"
                value={serviceFilter}
                onChange={(event) =>
                  setServiceFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All services
                </option>

                {uniqueServices.map(
                  (service) => (
                    <option
                      key={service.name}
                      value={service.name}
                    >
                      {service.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              className="gis-clear-filter"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          </section>

          <div className="gis-results-heading">
            <div>
              <h3>
                Available locations
              </h3>

              <span>
                {
                  filteredBranches.length
                }{" "}
                result
                {filteredBranches.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>

          <section className="gis-branch-list">
            {isLoading ? (
              <div className="gis-loading">
                <div className="gis-spinner"></div>

                <p>
                  Loading branches...
                </p>
              </div>
            ) : errorMessage ? (
              <div className="gis-error-state">
                <div>!</div>

                <h3>
                  Map information
                  unavailable
                </h3>

                <p>
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={loadMapData}
                >
                  Try Again
                </button>
              </div>
            ) : filteredBranches.length ===
              0 ? (
              <div className="gis-empty-state">
                <div>⌕</div>

                <h3>
                  No branch found
                </h3>

                <p>
                  Try changing your
                  search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredBranches.map(
                (branch) => {
                  const branchServices =
                    getBranchServices(
                      branch.id
                    );

                  return (
                    <button
                      type="button"
                      key={branch.id}
                      className={`gis-branch-card ${
                        selectedBranch?.id ===
                        branch.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectBranch(
                          branch
                        )
                      }
                    >
                      <div
                        className={`gis-branch-card-icon ${
                          branch.atm_status
                            ? "available"
                            : "unavailable"
                        }`}
                      >
                        <span></span>
                      </div>

                      <div className="gis-branch-card-content">
                        <div className="gis-branch-card-title">
                          <strong>
                            {
                              branch.branch_name
                            }
                          </strong>

                          <span
                            className={
                              branch.atm_status
                                ? "available"
                                : "unavailable"
                            }
                          >
                            {branch.atm_status
                              ? "ATM Available"
                              : "ATM Unavailable"}
                          </span>
                        </div>

                        <p>
                          {
                            branch.address
                          }
                        </p>

                        <div className="gis-branch-meta">
                          <span>
                            {getCategoryName(
                              branch.category
                            )}
                          </span>

                          <span>
                            {
                              branchServices.length
                            }{" "}
                            service
                            {branchServices.length ===
                            1
                              ? ""
                              : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="gis-card-arrow">
                        ›
                      </div>
                    </button>
                  );
                }
              )
            )}
          </section>
        </aside>

        <section className="gis-map-section">
          {!isSidebarOpen && (
            <button
              type="button"
              className="gis-open-sidebar"
              onClick={() =>
                setIsSidebarOpen(true)
              }
            >
              ☰ View Branches
            </button>
          )}

          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            className="gis-leaflet-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              branches={
                filteredBranches
              }
              selectedBranch={
                selectedBranch
              }
            />

            {filteredBranches.map(
              (branch) => {
                const latitude =
                  Number(
                    branch.latitude
                  );

                const longitude =
                  Number(
                    branch.longitude
                  );

                const markerColor =
                  branch.atm_status
                    ? "#16a565"
                    : "#d54b4b";

                const branchServices =
                  getBranchServices(
                    branch.id
                  );

                return (
                  <CircleMarker
                    key={branch.id}
                    center={[
                      latitude,
                      longitude,
                    ]}
                    radius={
                      selectedBranch?.id ===
                      branch.id
                        ? 14
                        : 10
                    }
                    pathOptions={{
                      color: "#ffffff",
                      weight: 4,
                      fillColor:
                        markerColor,
                      fillOpacity: 1,
                    }}
                    eventHandlers={{
                      click: () =>
                        setSelectedBranch(
                          branch
                        ),
                    }}
                    ref={(marker) => {
                      if (marker) {
                        markerRefs.current[
                          branch.id
                        ] = marker;
                      }
                    }}
                  >
                    <Popup
                      className="gis-branch-popup"
                      minWidth={300}
                    >
                      <BranchPopup
                        branch={branch}
                        categoryName={getCategoryName(
                          branch.category
                        )}
                        services={
                          branchServices
                        }
                        onViewDetails={() =>
                          openBranchDetails(
                            branch.id
                          )
                        }
                      />
                    </Popup>
                  </CircleMarker>
                );
              }
            )}
          </MapContainer>

          <div className="gis-map-legend">
            <div className="gis-legend-title">
              ATM Status
            </div>

            <div>
              <span className="gis-legend-dot available"></span>
              Available
            </div>

            <div>
              <span className="gis-legend-dot unavailable"></span>
              Unavailable
            </div>
          </div>

          <div className="gis-map-results">
            Showing{" "}
            <strong>
              {
                filteredBranches.length
              }
            </strong>{" "}
            branch
            {filteredBranches.length ===
            1
              ? ""
              : "es"}
          </div>
        </section>
      </main>
    </div>
  );
}

function MapController({
  branches,
  selectedBranch,
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedBranch) {
      map.flyTo(
        [
          Number(
            selectedBranch.latitude
          ),
          Number(
            selectedBranch.longitude
          ),
        ],
        16,
        {
          duration: 0.8,
        }
      );

      return;
    }

    if (!branches.length) {
      map.setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM
      );

      return;
    }

    const coordinates =
      branches.map((branch) => [
        Number(branch.latitude),
        Number(branch.longitude),
      ]);

    if (coordinates.length === 1) {
      map.setView(
        coordinates[0],
        15
      );

      return;
    }

    const bounds =
      L.latLngBounds(
        coordinates
      );

    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 15,
    });
  }, [
    branches,
    selectedBranch,
    map,
  ]);

  return null;
}

function BranchPopup({
  branch,
  categoryName,
  services,
  onViewDetails,
}) {
  const googleMapsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;

  return (
    <div className="branch-popup-content">
      <div
        className={`branch-popup-status ${
          branch.atm_status
            ? "available"
            : "unavailable"
        }`}
      >
        <span></span>

        {branch.atm_status
          ? "ATM currently available"
          : "ATM currently unavailable"}
      </div>

      <h3>
        {branch.branch_name}
      </h3>

      <span className="branch-popup-category">
        {categoryName}
      </span>

      <div className="branch-popup-details">
        <div>
          <span className="popup-detail-icon">
            LOC
          </span>

          <div>
            <small>
              Address
            </small>

            <p>
              {branch.address ||
                "Not available"}
            </p>
          </div>
        </div>

        <div>
          <span className="popup-detail-icon">
            TEL
          </span>

          <div>
            <small>
              Phone
            </small>

            <p>
              {branch.phone ||
                "Not available"}
            </p>
          </div>
        </div>

        <div>
          <span className="popup-detail-icon">
            HRS
          </span>

          <div>
            <small>
              Opening Hours
            </small>

            <p>
              {branch.opening_hours ||
                "Not available"}
            </p>
          </div>
        </div>
      </div>

      <div className="branch-popup-services">
        <div>
          <span>
            Services
          </span>

          <strong>
            {services.length}
          </strong>
        </div>

        <div className="branch-popup-service-tags">
          {services.length > 0 ? (
            <>
              {services
                .slice(0, 3)
                .map((service) => (
                  <span
                    key={service.id}
                  >
                    {
                      service.service_name
                    }
                  </span>
                ))}

              {services.length > 3 && (
                <span>
                  +
                  {services.length - 3}{" "}
                  more
                </span>
              )}
            </>
          ) : (
            <span>
              No services listed
            </span>
          )}
        </div>
      </div>

      <div className="branch-popup-actions">
        <button
          type="button"
          onClick={
            onViewDetails
          }
        >
          View Details
        </button>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
}

export default GISMap;