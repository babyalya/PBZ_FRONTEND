import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getATMs } from "../../api/api";
import "./CustomerATMs.css";

function CustomerATMs() {
  const navigate = useNavigate();
  const [atms, setAtms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedATM, setSelectedATM] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadATMs = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await getATMs();
      setAtms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load standalone ATMs:", error);
      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load PBZ standalone ATMs. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadATMs();
  }, []);

  const filteredATMs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return atms.filter((atm) => {
      const searchableText = [
        atm.atm_name,
        atm.address,
        atm.opening_hours,
        atm.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && atm.atm_status === true) ||
        (statusFilter === "unavailable" && atm.atm_status === false);

      return matchesSearch && matchesStatus;
    });
  }, [atms, searchTerm, statusFilter]);

  const availableCount = useMemo(
    () => atms.filter((atm) => atm.atm_status === true).length,
    [atms]
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const openOnMap = (atm) => {
    navigate(
      `/map?type=atm&atm=${atm.id}&search=${encodeURIComponent(atm.atm_name)}`
    );
  };

  const openDirections = (atm) => {
    const latitude = Number(atm.latitude);
    const longitude = Number(atm.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${latitude},${longitude}`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="customer-atms-page">
      <header className="customer-atms-navbar">
        <Link to="/" className="customer-atms-brand">
          <div className="customer-atms-logo">PBZ</div>
          <div>
            <strong>PBZ GIS</strong>
            <span>Branch & ATM Locator</span>
          </div>
        </Link>

        <nav className="customer-atms-nav">
          <Link to="/">Home</Link>
          <Link to="/branches">Branches</Link>
          <Link to="/services">Services</Link>
          <Link to="/atms" className="is-active">ATMs</Link>
          <Link to="/map">Map</Link>
        </nav>

        <Link to="/map?type=atm" className="customer-atms-map-button">
          View ATM Map <span>→</span>
        </Link>
      </header>

      <main>
        <section className="customer-atms-hero">
          <div className="customer-atms-orb atm-orb-one"></div>
          <div className="customer-atms-orb atm-orb-two"></div>

          <div className="customer-atms-hero-content">
            <div>
              <span className="customer-atms-overline">STANDALONE PBZ ATMS</span>
              <h1>Find PBZ ATMs located outside bank branches.</h1>
              <p>
                Browse standalone ATM locations, check their current availability
                and opening hours, then open the exact location on the GIS map.
              </p>
            </div>

            <div className="customer-atms-hero-stats">
              <article>
                <span>Standalone ATMs</span>
                <strong>{isLoading ? "..." : atms.length}</strong>
              </article>
              <article>
                <span>Available</span>
                <strong>{isLoading ? "..." : availableCount}</strong>
              </article>
              <article>
                <span>Unavailable</span>
                <strong>{isLoading ? "..." : atms.length - availableCount}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className="customer-atms-content">
          <div className="customer-atms-filter-card">
            <div className="customer-atms-search">
              <span>⌕</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search ATM name, area or address..."
                aria-label="Search standalone PBZ ATMs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter standalone ATMs by status"
            >
              <option value="all">All ATM statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <button type="button" onClick={clearFilters}>Clear filters</button>
          </div>

          <div className="customer-atms-toolbar">
            <div>
              <span>ATM DIRECTORY</span>
              <strong>
                {isLoading
                  ? "Loading..."
                  : `${filteredATMs.length} ${
                      filteredATMs.length === 1 ? "ATM" : "ATMs"
                    } found`}
              </strong>
            </div>
            <Link to="/map?type=atm">View all on map <span>→</span></Link>
          </div>

          {errorMessage && (
            <div className="customer-atms-error">
              <div>!</div>
              <div>
                <strong>We couldn't load the ATM directory.</strong>
                <p>{errorMessage}</p>
              </div>
              <button type="button" onClick={loadATMs}>Try again</button>
            </div>
          )}

          {!errorMessage && isLoading && (
            <div className="customer-atms-grid">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <article key={item} className="customer-atm-card customer-atm-card--loading">
                  <div className="atm-skeleton atm-skeleton-icon"></div>
                  <div className="atm-skeleton atm-skeleton-title"></div>
                  <div className="atm-skeleton atm-skeleton-line"></div>
                  <div className="atm-skeleton atm-skeleton-line short"></div>
                  <div className="atm-skeleton atm-skeleton-footer"></div>
                </article>
              ))}
            </div>
          )}

          {!errorMessage && !isLoading && filteredATMs.length > 0 && (
            <div className="customer-atms-grid">
              {filteredATMs.map((atm) => (
                <article key={atm.id} className="customer-atm-card">
                  <div className="customer-atm-card-top">
                    <div className="customer-atm-icon">ATM</div>
                    <span className={`customer-atm-status ${
                      atm.atm_status ? "available" : "unavailable"
                    }`}>
                      <i></i>
                      {atm.atm_status ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="customer-atm-card-body">
                    <span className="customer-atm-type">STANDALONE ATM</span>
                    <h2>{atm.atm_name}</h2>
                    <p className="customer-atm-address">
                      {atm.address || "Address not available"}
                    </p>
                    <p className="customer-atm-description">
                      {atm.description || "PBZ standalone ATM location."}
                    </p>
                  </div>

                  <div className="customer-atm-meta">
                    <div>
                      <span>Opening hours</span>
                      <strong>{atm.opening_hours || "Not specified"}</strong>
                    </div>
                    <div>
                      <span>Coordinates</span>
                      <strong>{atm.latitude}, {atm.longitude}</strong>
                    </div>
                  </div>

                  <div className="customer-atm-actions">
                    <button type="button" onClick={() => setSelectedATM(atm)}>
                      View Details
                    </button>
                    <button type="button" onClick={() => openOnMap(atm)}>
                      View Map <span>→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!errorMessage && !isLoading && filteredATMs.length === 0 && (
            <div className="customer-atms-empty">
              <div>ATM</div>
              <span>NO MATCHING ATMS</span>
              <h2>No standalone ATM matches your search.</h2>
              <p>Try another ATM name, location or status.</p>
              <button type="button" onClick={clearFilters}>Reset filters</button>
            </div>
          )}
        </section>
      </main>

      {selectedATM && (
        <div
          className="customer-atm-modal-overlay"
          onMouseDown={() => setSelectedATM(null)}
        >
          <section
            className="customer-atm-details-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="customer-atm-modal-header">
              <div>
                <span>STANDALONE ATM</span>
                <h2>{selectedATM.atm_name}</h2>
              </div>
              <button type="button" onClick={() => setSelectedATM(null)}>×</button>
            </div>

            <div className="customer-atm-modal-status">
              <span className={selectedATM.atm_status ? "available" : "unavailable"}>
                <i></i>
                {selectedATM.atm_status ? "ATM Available" : "ATM Unavailable"}
              </span>
            </div>

            <div className="customer-atm-modal-grid">
              <article><span>Address</span><strong>{selectedATM.address}</strong></article>
              <article><span>Opening hours</span><strong>{selectedATM.opening_hours || "Not specified"}</strong></article>
              <article><span>Latitude</span><strong>{selectedATM.latitude}</strong></article>
              <article><span>Longitude</span><strong>{selectedATM.longitude}</strong></article>
            </div>

            <div className="customer-atm-modal-description">
              <span>Description</span>
              <p>{selectedATM.description || "No description has been provided for this ATM."}</p>
            </div>

            <div className="customer-atm-modal-actions">
              <button type="button" onClick={() => openOnMap(selectedATM)}>Open GIS Map</button>
              <button type="button" onClick={() => openDirections(selectedATM)}>Get Directions</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default CustomerATMs;
