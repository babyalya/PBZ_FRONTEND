import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";

import { getATMs, getBranches, getCategories } from "../../api/api";

import "leaflet/dist/leaflet.css";
import "../customer/GISMap.css";
import "./GISMap.atm-additions.css";

const DEFAULT_CENTER = [-6.1659, 39.2026];
const DEFAULT_ZOOM = 12;

const standaloneATMIcon = L.divIcon({
  className: "gis-standalone-atm-div-icon",
  html: '<div class="gis-standalone-atm-marker"><span>ATM</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 38],
  popupAnchor: [0, -35],
});

function GISMap() {
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [atms, setAtms] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationType, setLocationType] = useState(
    searchParams.get("type") === "atm" ? "atm" : "all"
  );
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const markerRefs = useRef({});

  const loadMapData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [branchesResponse, categoriesResponse, atmsResponse] =
        await Promise.all([getBranches(), getCategories(), getATMs()]);

      setBranches(Array.isArray(branchesResponse.data) ? branchesResponse.data : []);
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      setAtms(Array.isArray(atmsResponse.data) ? atmsResponse.data : []);
    } catch (error) {
      console.error("Failed to load GIS information:", error);
      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load branch and ATM locations. Make sure the Django API is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  const hasValidCoordinates = (item) => {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  };

  const validBranches = useMemo(
    () => branches.filter(hasValidCoordinates),
    [branches]
  );
  const validATMs = useMemo(() => atms.filter(hasValidCoordinates), [atms]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => Number(item.id) === Number(categoryId)
    );
    return category?.category_name || "Uncategorized";
  };

  const filteredBranches = useMemo(() => {
    if (locationType === "atm") return [];
    const search = searchTerm.trim().toLowerCase();

    return validBranches.filter((branch) => {
      const searchableText = [
        branch.branch_name,
        branch.address,
        branch.phone,
        branch.opening_hours,
        getCategoryName(branch.category),
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && branch.atm_status === true) ||
        (statusFilter === "unavailable" && branch.atm_status === false);
      const matchesCategory =
        categoryFilter === "all" ||
        Number(branch.category) === Number(categoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [
    validBranches,
    searchTerm,
    statusFilter,
    categoryFilter,
    locationType,
    categories,
  ]);

  const filteredATMs = useMemo(() => {
    if (locationType === "branch") return [];
    const search = searchTerm.trim().toLowerCase();

    return validATMs.filter((atm) => {
      const searchableText = [
        atm.atm_name,
        atm.address,
        atm.opening_hours,
        atm.description,
      ].filter(Boolean).join(" ").toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && atm.atm_status === true) ||
        (statusFilter === "unavailable" && atm.atm_status === false);

      return matchesSearch && matchesStatus;
    });
  }, [validATMs, searchTerm, statusFilter, locationType]);

  const visibleLocations = useMemo(
    () => [
      ...filteredBranches.map((branch) => ({ ...branch, locationType: "branch" })),
      ...filteredATMs.map((atm) => ({ ...atm, locationType: "atm" })),
    ],
    [filteredBranches, filteredATMs]
  );

  const availableCount = visibleLocations.filter(
    (location) => location.atm_status === true
  ).length;

  const unavailableCount = visibleLocations.filter(
    (location) => location.atm_status === false
  ).length;

  useEffect(() => {
    if (isLoading) return;

    const atmId = searchParams.get("atm");
    const branchId = searchParams.get("branch");

    if (atmId) {
      const atm = validATMs.find((item) => Number(item.id) === Number(atmId));
      if (atm) {
        setLocationType("atm");
        setSelectedLocation({ ...atm, locationType: "atm" });
      }
      return;
    }

    if (branchId) {
      const branch = validBranches.find(
        (item) => Number(item.id) === Number(branchId)
      );
      if (branch) {
        setLocationType("branch");
        setSelectedLocation({ ...branch, locationType: "branch" });
      }
    }
  }, [isLoading, searchParams, validATMs, validBranches]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    const marker = markerRefs.current[`${location.locationType}-${location.id}`];
    if (marker) marker.openPopup();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setLocationType("all");
    setSelectedLocation(null);
  };

  return (
    <div className="gis-page">
      <header className="gis-topbar">
        <Link to="/" className="gis-brand">
          <div className="gis-brand-logo">PBZ</div>
          <div>
            <h1>PBZ GIS System</h1>
            <p>Branch and ATM Locator</p>
          </div>
        </Link>

        <nav className="gis-main-navigation" aria-label="Customer navigation">
          <Link to="/">Home</Link>
          <Link to="/branches">Branches</Link>
          <Link to="/services">Services</Link>
          <Link to="/atms">ATMs</Link>
          <Link to="/map" className="active">Map</Link>
        </nav>

        <div className="gis-topbar-actions">
          <div className="gis-live-status"><span></span>Live location information</div>
          <button
            type="button"
            className="gis-refresh-button"
            onClick={loadMapData}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh Map"}
          </button>
        </div>
      </header>

      <main className="gis-layout">
        <aside className={`gis-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
          <div className="gis-sidebar-header">
            <div>
              <p className="gis-overline">LOCATION FINDER</p>
              <h2>Find PBZ Locations</h2>
              <p>
                Search branches and standalone ATMs while keeping each location
                type clearly identified.
              </p>
            </div>
            <button
              type="button"
              className="gis-close-sidebar"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close location panel"
            >
              ×
            </button>
          </div>

          <section className="gis-statistics">
            <article><div className="gis-stat-icon total">LOC</div><div><span>Locations</span><strong>{visibleLocations.length}</strong></div></article>
            <article><div className="gis-stat-icon available">✓</div><div><span>Available</span><strong>{availableCount}</strong></div></article>
            <article><div className="gis-stat-icon unavailable">!</div><div><span>Unavailable</span><strong>{unavailableCount}</strong></div></article>
          </section>

          <section className="gis-filters">
            <label className="gis-field-label" htmlFor="location-search">Search location</label>
            <div className="gis-search-box">
              <span>⌕</span>
              <input
                id="location-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Branch, ATM, address or area..."
              />
              {searchTerm && <button type="button" onClick={() => setSearchTerm("")}>×</button>}
            </div>

            <div className="gis-location-type-filter">
              <button type="button" className={locationType === "all" ? "active" : ""} onClick={() => setLocationType("all")}>All</button>
              <button type="button" className={locationType === "branch" ? "active" : ""} onClick={() => setLocationType("branch")}>Branches</button>
              <button type="button" className={locationType === "atm" ? "active" : ""} onClick={() => setLocationType("atm")}>Standalone ATMs</button>
            </div>

            <div className="gis-filter-grid">
              <div>
                <label htmlFor="status-filter">ATM status</label>
                <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label htmlFor="category-filter">Branch category</label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  disabled={locationType === "atm"}
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.category_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" className="gis-clear-filter" onClick={clearFilters}>Clear all filters</button>
          </section>

          <div className="gis-results-heading">
            <div>
              <h3>Available locations</h3>
              <span>{visibleLocations.length} result{visibleLocations.length === 1 ? "" : "s"}</span>
            </div>
          </div>

          <section className="gis-branch-list">
            {isLoading ? (
              <div className="gis-loading"><div className="gis-spinner"></div><p>Loading locations...</p></div>
            ) : errorMessage ? (
              <div className="gis-error-state"><div>!</div><h3>Map information unavailable</h3><p>{errorMessage}</p><button onClick={loadMapData}>Try again</button></div>
            ) : visibleLocations.length === 0 ? (
              <div className="gis-empty-state"><div>⌕</div><h3>No location found</h3><p>Try changing the search or filters.</p><button onClick={clearFilters}>Reset filters</button></div>
            ) : (
              visibleLocations.map((location) => {
                const isATM = location.locationType === "atm";
                return (
                  <button
                    type="button"
                    key={`${location.locationType}-${location.id}`}
                    className={`gis-branch-card ${
                      selectedLocation?.id === location.id &&
                      selectedLocation?.locationType === location.locationType
                        ? "selected"
                        : ""
                    } ${isATM ? "gis-atm-location-card" : ""}`}
                    onClick={() => handleSelectLocation(location)}
                  >
                    <div className={`gis-branch-card-icon ${
                      location.atm_status ? "available" : "unavailable"
                    } ${isATM ? "standalone-atm" : ""}`}>
                      {isATM ? <b>ATM</b> : <span></span>}
                    </div>

                    <div className="gis-branch-card-content">
                      <div className="gis-branch-card-title">
                        <strong>{isATM ? location.atm_name : location.branch_name}</strong>
                        <span className={location.atm_status ? "available" : "unavailable"}>
                          {location.atm_status ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <p>{location.address}</p>
                      <div className="gis-branch-meta">
                        <span className={isATM ? "gis-location-type-atm" : "gis-location-type-branch"}>
                          {isATM ? "Standalone ATM" : getCategoryName(location.category)}
                        </span>
                        <span>{location.opening_hours || "Hours not specified"}</span>
                      </div>
                    </div>
                    <div className="gis-card-arrow">›</div>
                  </button>
                );
              })
            )}
          </section>
        </aside>

        <section className="gis-map-section">
          {!isSidebarOpen && (
            <button type="button" className="gis-open-sidebar" onClick={() => setIsSidebarOpen(true)}>
              ☰ View locations
            </button>
          )}

          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="gis-leaflet-map">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitMapToLocations locations={visibleLocations} selectedLocation={selectedLocation} />

            {filteredBranches.map((branch) => (
              <CircleMarker
                key={`branch-${branch.id}`}
                center={[Number(branch.latitude), Number(branch.longitude)]}
                radius={
                  selectedLocation?.locationType === "branch" &&
                  selectedLocation?.id === branch.id ? 14 : 11
                }
                pathOptions={{
                  color: "#ffffff",
                  weight: 4,
                  fillColor: branch.atm_status ? "#16a565" : "#d54b4b",
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () => setSelectedLocation({ ...branch, locationType: "branch" }),
                }}
                ref={(marker) => {
                  if (marker) markerRefs.current[`branch-${branch.id}`] = marker;
                }}
              >
                <Popup className="gis-branch-popup" minWidth={280}>
                  <BranchPopup branch={branch} categoryName={getCategoryName(branch.category)} />
                </Popup>
              </CircleMarker>
            ))}

            {filteredATMs.map((atm) => (
              <Marker
                key={`atm-${atm.id}`}
                position={[Number(atm.latitude), Number(atm.longitude)]}
                icon={standaloneATMIcon}
                eventHandlers={{
                  click: () => setSelectedLocation({ ...atm, locationType: "atm" }),
                }}
                ref={(marker) => {
                  if (marker) markerRefs.current[`atm-${atm.id}`] = marker;
                }}
              >
                <Popup className="gis-atm-popup" minWidth={280}>
                  <StandaloneATMPopup atm={atm} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="gis-map-legend">
            <div className="gis-legend-title">Map markers</div>
            <div><span className="gis-legend-dot available"></span>Branch ATM available</div>
            <div><span className="gis-legend-dot unavailable"></span>Branch ATM unavailable</div>
            <div><span className="gis-legend-atm-marker">ATM</span>Standalone ATM</div>
          </div>

          <div className="gis-map-results">
            Showing <strong>{visibleLocations.length}</strong> location{visibleLocations.length === 1 ? "" : "s"}
          </div>
        </section>
      </main>
    </div>
  );
}

function FitMapToLocations({ locations, selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedLocation &&
      Number.isFinite(Number(selectedLocation.latitude)) &&
      Number.isFinite(Number(selectedLocation.longitude))
    ) {
      map.flyTo(
        [Number(selectedLocation.latitude), Number(selectedLocation.longitude)],
        16,
        { duration: 0.7 }
      );
      return;
    }

    if (!locations.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const coordinates = locations.map((location) => [
      Number(location.latitude),
      Number(location.longitude),
    ]);

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 15);
      return;
    }

    map.fitBounds(L.latLngBounds(coordinates), {
      padding: [60, 60],
      maxZoom: 15,
    });
  }, [locations, selectedLocation, map]);

  return null;
}

function BranchPopup({ branch, categoryName }) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;
  return (
    <div className="branch-popup-content">
      <div className={`branch-popup-status ${branch.atm_status ? "available" : "unavailable"}`}>
        <span></span>
        {branch.atm_status ? "Branch ATM currently available" : "Branch ATM currently unavailable"}
      </div>
      <h3>{branch.branch_name}</h3>
      <span className="branch-popup-category">{categoryName}</span>
      <div className="branch-popup-details">
        <PopupDetail icon="LOC" label="Address" value={branch.address} />
        <PopupDetail icon="TEL" label="Phone" value={branch.phone} />
        <PopupDetail icon="HRS" label="Opening hours" value={branch.opening_hours} />
      </div>
      <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="branch-directions-button">Get Directions</a>
    </div>
  );
}

function StandaloneATMPopup({ atm }) {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${atm.latitude},${atm.longitude}`;
  return (
    <div className="branch-popup-content gis-standalone-atm-popup-content">
      <div className={`branch-popup-status ${atm.atm_status ? "available" : "unavailable"}`}>
        <span></span>
        {atm.atm_status ? "Standalone ATM available" : "Standalone ATM unavailable"}
      </div>
      <h3>{atm.atm_name}</h3>
      <span className="branch-popup-category gis-atm-popup-category">Standalone ATM</span>
      <div className="branch-popup-details">
        <PopupDetail icon="LOC" label="Address" value={atm.address} />
        <PopupDetail icon="HRS" label="Opening hours" value={atm.opening_hours || "Not specified"} />
        {atm.description && <PopupDetail icon="INF" label="Description" value={atm.description} />}
      </div>
      <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="branch-directions-button">Get Directions</a>
    </div>
  );
}

function PopupDetail({ icon, label, value }) {
  return (
    <div>
      <span className="popup-detail-icon">{icon}</span>
      <div><small>{label}</small><p>{value || "Not available"}</p></div>
    </div>
  );
}

export default GISMap;
