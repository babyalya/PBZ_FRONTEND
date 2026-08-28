import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import AdminNavbar from "../../components/AdminNavbar";
import { createATM, deleteATM, getATMs, updateATM } from "../../api/api";
import "leaflet/dist/leaflet.css";
import "./ManageATMs.css";
import "./ManageATMs.location.css";

const DEFAULT_MAP_CENTER = [-6.1659, 39.2026];
const DEFAULT_MAP_ZOOM = 12;

const initialFormData = {
  atm_name: "",
  address: "",
  latitude: "",
  longitude: "",
  atm_status: true,
  opening_hours: "",
  description: "",
  location_mode: "map",
};

function ManageATMs() {
  const [atms, setAtms] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingATMId, setEditingATMId] = useState(null);
  const [selectedATM, setSelectedATM] = useState(null);
  const [atmToDelete, setATMToDelete] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDetectingAddress, setIsDetectingAddress] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

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
          "Failed to load standalone ATM information."
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
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        (!search || searchableText.includes(search)) &&
        (statusFilter === "all" ||
          (statusFilter === "available" && atm.atm_status === true) ||
          (statusFilter === "unavailable" && atm.atm_status === false))
      );
    });
  }, [atms, searchTerm, statusFilter]);

  const availableCount = useMemo(
    () => atms.filter((atm) => atm.atm_status === true).length,
    [atms]
  );

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const openAddModal = () => {
    clearMessages();
    setEditingATMId(null);
    setFormData({ ...initialFormData });
    setFormErrors({});
    setIsDetectingAddress(false);
    setLocationMessage("");
    setShowFormModal(true);
  };

  const openEditModal = (atm) => {
    clearMessages();
    setEditingATMId(atm.id);
    setFormData({
      atm_name: atm.atm_name || "",
      address: atm.address || "",
      latitude: atm.latitude ?? "",
      longitude: atm.longitude ?? "",
      atm_status: atm.atm_status !== false,
      opening_hours: atm.opening_hours || "",
      description: atm.description || "",
      location_mode: "manual",
    });
    setFormErrors({});
    setIsDetectingAddress(false);
    setLocationMessage("");
    setShowViewModal(false);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;
    setShowFormModal(false);
    setEditingATMId(null);
    setFormData({ ...initialFormData });
    setFormErrors({});
    setIsDetectingAddress(false);
    setLocationMessage("");
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const changeLocationMode = (mode) => {
    setFormData((previous) => ({ ...previous, location_mode: mode }));
    setLocationMessage("");
    setFormErrors((previous) => ({
      ...previous,
      address: "",
      latitude: "",
      longitude: "",
    }));
  };

  const handleMapLocationSelected = async (latitude, longitude) => {
    const formattedLatitude = Number(latitude).toFixed(8);
    const formattedLongitude = Number(longitude).toFixed(8);

    setFormData((previous) => ({
      ...previous,
      latitude: formattedLatitude,
      longitude: formattedLongitude,
    }));
    setFormErrors((previous) => ({ ...previous, latitude: "", longitude: "" }));
    setLocationMessage("Location selected. Detecting address...");
    setIsDetectingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(formattedLatitude)}&lon=${encodeURIComponent(formattedLongitude)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error("Address lookup failed.");
      const data = await response.json();

      if (data?.display_name) {
        setFormData((previous) => ({ ...previous, address: data.display_name }));
        setFormErrors((previous) => ({ ...previous, address: "" }));
        setLocationMessage("Location and address detected successfully.");
      } else {
        setLocationMessage("Coordinates selected. Please enter the ATM address.");
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setLocationMessage("Coordinates selected. Address could not be detected automatically, so enter it manually.");
    } finally {
      setIsDetectingAddress(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.atm_name.trim()) errors.atm_name = "ATM name is required.";
    if (formData.atm_name.trim().length > 100) errors.atm_name = "ATM name must be 100 characters or fewer.";
    if (!formData.address.trim()) errors.address = "Address is required.";
    if (formData.address.trim().length > 255) errors.address = "Address must be 255 characters or fewer.";

    const latitude = Number(formData.latitude);
    if (formData.latitude === "" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      errors.latitude = "Enter a valid latitude between -90 and 90.";
    }

    const longitude = Number(formData.longitude);
    if (formData.longitude === "" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      errors.longitude = "Enter a valid longitude between -180 and 180.";
    }

    if (formData.opening_hours.trim().length > 100) {
      errors.opening_hours = "Opening hours must be 100 characters or fewer.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    if (!validateForm()) return;

    const payload = {
      atm_name: formData.atm_name.trim(),
      address: formData.address.trim(),
      latitude: formData.latitude.trim(),
      longitude: formData.longitude.trim(),
      atm_status: Boolean(formData.atm_status),
      opening_hours: formData.opening_hours.trim(),
      description: formData.description.trim() || null,
    };

    try {
      setIsSaving(true);
      if (editingATMId) {
        const response = await updateATM(editingATMId, payload);
        setAtms((prev) => prev.map((atm) => atm.id === editingATMId ? response.data : atm));
        setSuccessMessage("Standalone ATM updated successfully.");
      } else {
        const response = await createATM(payload);
        setAtms((prev) => [response.data, ...prev]);
        setSuccessMessage("Standalone ATM added successfully.");
      }
      setShowFormModal(false);
      setEditingATMId(null);
      setFormData({ ...initialFormData });
      setFormErrors({});
    } catch (error) {
      console.error("Failed to save standalone ATM:", error);
      const backendErrors = error.response?.data;
      if (backendErrors && typeof backendErrors === "object" && !backendErrors.detail) {
        const converted = {};
        Object.entries(backendErrors).forEach(([field, messages]) => {
          converted[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFormErrors(converted);
      } else {
        setErrorMessage(backendErrors?.detail || "Failed to save standalone ATM.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!atmToDelete) return;
    try {
      setDeletingId(atmToDelete.id);
      await deleteATM(atmToDelete.id);
      setAtms((prev) => prev.filter((atm) => atm.id !== atmToDelete.id));
      setSuccessMessage("Standalone ATM deleted successfully.");
      setShowDeleteModal(false);
      setATMToDelete(null);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || "Failed to delete standalone ATM.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="manage-atms-page">
      <AdminNavbar />

      <main className="atms-main">
        <header className="atms-header">
          <div>
            <p className="atms-overline">STANDALONE ATM MANAGEMENT</p>
            <h2>Manage Standalone ATMs</h2>
            <p>Manage PBZ ATM locations that operate outside bank branches.</p>
          </div>
          <button type="button" className="add-atm-button" onClick={openAddModal}><span>+</span>Add ATM</button>
        </header>

        {successMessage && <div className="atms-alert success"><span>✓</span><p>{successMessage}</p><button onClick={() => setSuccessMessage("")}>×</button></div>}
        {errorMessage && <div className="atms-alert error"><span>!</span><p>{errorMessage}</p><button onClick={() => setErrorMessage("")}>×</button></div>}

        <section className="atms-summary">
          <article><span>Total Standalone ATMs</span><strong>{atms.length}</strong></article>
          <article><span>Available</span><strong>{availableCount}</strong></article>
          <article><span>Unavailable</span><strong>{atms.length - availableCount}</strong></article>
          <article><span>Displayed Results</span><strong>{filteredATMs.length}</strong></article>
        </section>

        <section className="atms-content-card">
          <div className="atms-toolbar">
            <div className="atms-search-box"><span>⌕</span><input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search ATM name, address or description..." /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <button type="button" className="refresh-atms-button" onClick={loadATMs} disabled={isLoading}>{isLoading ? "Loading..." : "Refresh"}</button>
          </div>

          <div className="atms-table-wrapper">
            {isLoading ? (
              <div className="atms-loading"><div className="atms-spinner"></div><p>Loading standalone ATMs...</p></div>
            ) : filteredATMs.length === 0 ? (
              <div className="atms-empty"><div>ATM</div><h3>No standalone ATMs found</h3><p>Add an ATM location or adjust the current filters.</p><button type="button" onClick={openAddModal}>Add ATM</button></div>
            ) : (
              <table className="manage-atms-table">
                <thead><tr><th>ATM</th><th>Address</th><th>Status</th><th>Opening Hours</th><th>Coordinates</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredATMs.map((atm) => (
                    <tr key={atm.id}>
                      <td><div className="atm-table-name"><div>ATM</div><span><strong>{atm.atm_name}</strong><small>ATM ID: {atm.id}</small></span></div></td>
                      <td><p className="atm-table-address">{atm.address}</p></td>
                      <td><span className={`atm-table-status ${atm.atm_status ? "available" : "unavailable"}`}><i></i>{atm.atm_status ? "Available" : "Unavailable"}</span></td>
                      <td>{atm.opening_hours || "Not specified"}</td>
                      <td><span className="atm-coordinate">{atm.latitude}, {atm.longitude}</span></td>
                      <td>
                        <div className="atm-table-actions">
                          <button className="view-atm-button" onClick={() => { setSelectedATM(atm); setShowViewModal(true); }}>View</button>
                          <button className="edit-atm-button" onClick={() => openEditModal(atm)}>Edit</button>
                          <button className="delete-atm-button" onClick={() => { setATMToDelete(atm); setShowDeleteModal(true); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!isLoading && filteredATMs.length > 0 && <div className="atms-table-footer">Showing {filteredATMs.length} of {atms.length} standalone ATMs</div>}
        </section>
      </main>

      {showFormModal && (
        <div className="atm-modal-overlay" onMouseDown={closeFormModal}>
          <section className="atm-form-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="atm-modal-header">
              <div><p>{editingATMId ? "UPDATE ATM" : "NEW ATM"}</p><h2>{editingATMId ? "Edit Standalone ATM" : "Add Standalone ATM"}</h2></div>
              <button onClick={closeFormModal} disabled={isSaving}>×</button>
            </div>
            <form className="atm-form" onSubmit={handleSubmit} noValidate>
              <div className="atm-form-grid">
                <Field label="ATM name" name="atm_name" value={formData.atm_name} onChange={handleInputChange} error={formErrors.atm_name} placeholder="PBZ Darajani ATM" />
                <Field label="Opening hours" name="opening_hours" value={formData.opening_hours} onChange={handleInputChange} error={formErrors.opening_hours} placeholder="24 Hours" />
                <div className="atm-form-group full">
                  <label>ATM location</label>
                  <div className="atm-location-mode">
                    <button type="button" className={formData.location_mode === "map" ? "active" : ""} onClick={() => changeLocationMode("map")}>
                      <span>MAP</span><div><strong>Pick from Map</strong><small>Select the exact ATM location visually.</small></div>
                    </button>
                    <button type="button" className={formData.location_mode === "manual" ? "active" : ""} onClick={() => changeLocationMode("manual")}>
                      <span>GPS</span><div><strong>Enter Manually</strong><small>Type the address and coordinates yourself.</small></div>
                    </button>
                  </div>
                </div>

                {formData.location_mode === "map" ? (
                  <>
                    <div className="atm-form-group full">
                      <div className="atm-location-map-wrapper">
                        <MapContainer
                          center={formData.latitude && formData.longitude ? [Number(formData.latitude), Number(formData.longitude)] : DEFAULT_MAP_CENTER}
                          zoom={formData.latitude && formData.longitude ? 16 : DEFAULT_MAP_ZOOM}
                          scrollWheelZoom
                          className="atm-location-map"
                        >
                          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <ATMLocationPicker latitude={formData.latitude} longitude={formData.longitude} onLocationSelected={handleMapLocationSelected} />
                          <ATMMapResizeHandler />
                        </MapContainer>
                        <div className="atm-map-help-overlay">Click anywhere on the map to select the ATM location</div>
                      </div>
                      {locationMessage && <div className={`atm-location-message ${isDetectingAddress ? "loading" : "success"}`}><span>{isDetectingAddress ? "..." : "✓"}</span>{locationMessage}</div>}
                    </div>
                    <Field label="Address" name="address" value={formData.address} onChange={handleInputChange} error={formErrors.address} placeholder={isDetectingAddress ? "Detecting address..." : "Address will appear after selecting the map location"} full />
                    <Field label="Latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} error={formErrors.latitude} placeholder="Select on map" readOnly />
                    <Field label="Longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} error={formErrors.longitude} placeholder="Select on map" readOnly />
                  </>
                ) : (
                  <>
                    <Field label="Address" name="address" value={formData.address} onChange={handleInputChange} error={formErrors.address} placeholder="Enter ATM address" full />
                    <Field label="Latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} error={formErrors.latitude} placeholder="-6.16590000" />
                    <Field label="Longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} error={formErrors.longitude} placeholder="39.20260000" />
                  </>
                )}
                <div className="atm-form-group full">
                  <label htmlFor="atm-description">Description</label>
                  <textarea id="atm-description" name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Optional information about this standalone ATM..." />
                  {formErrors.description && <small>{formErrors.description}</small>}
                </div>
                <label className="atm-status-toggle full">
                  <input type="checkbox" name="atm_status" checked={formData.atm_status} onChange={handleInputChange} />
                  <span className="atm-toggle-control"></span>
                  <div><strong>ATM available</strong><p>Mark this standalone ATM as currently available.</p></div>
                </label>
              </div>
              <div className="atm-form-actions">
                <button type="button" onClick={closeFormModal} disabled={isSaving}>Cancel</button>
                <button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingATMId ? "Update ATM" : "Add ATM"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showViewModal && selectedATM && (
        <div className="atm-modal-overlay" onMouseDown={() => setShowViewModal(false)}>
          <section className="atm-view-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="atm-modal-header"><div><p>STANDALONE ATM</p><h2>{selectedATM.atm_name}</h2></div><button onClick={() => setShowViewModal(false)}>×</button></div>
            <div className="atm-view-status"><span className={selectedATM.atm_status ? "available" : "unavailable"}><i></i>{selectedATM.atm_status ? "ATM Available" : "ATM Unavailable"}</span></div>
            <div className="atm-view-grid">
              <Detail label="Address" value={selectedATM.address} />
              <Detail label="Opening Hours" value={selectedATM.opening_hours || "Not specified"} />
              <Detail label="Latitude" value={selectedATM.latitude} />
              <Detail label="Longitude" value={selectedATM.longitude} />
            </div>
            <div className="atm-view-description"><span>Description</span><p>{selectedATM.description || "No description provided."}</p></div>
            <div className="atm-view-actions">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selectedATM.latitude},${selectedATM.longitude}`)}`} target="_blank" rel="noreferrer">Directions</a>
              <button onClick={() => openEditModal(selectedATM)}>Edit ATM</button>
            </div>
          </section>
        </div>
      )}

      {showDeleteModal && atmToDelete && (
        <div className="atm-modal-overlay" onMouseDown={() => !deletingId && setShowDeleteModal(false)}>
          <section className="atm-delete-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="atm-delete-icon">!</div>
            <h2>Delete standalone ATM?</h2>
            <p>You are about to delete <strong>{atmToDelete.atm_name}</strong>. This action cannot be undone.</p>
            <div className="atm-delete-actions">
              <button onClick={() => setShowDeleteModal(false)} disabled={Boolean(deletingId)}>Cancel</button>
              <button onClick={handleDelete} disabled={Boolean(deletingId)}>{deletingId ? "Deleting..." : "Delete ATM"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, error, placeholder, full = false, readOnly = false }) {
  return (
    <div className={`atm-form-group ${full ? "full" : ""}`}>
      <label htmlFor={`atm-${name}`}>{label}</label>
      <input id={`atm-${name}`} name={name} value={value} onChange={onChange} readOnly={readOnly} className={`${error ? "field-error" : ""} ${readOnly ? "atm-readonly-coordinate" : ""}`} placeholder={placeholder} />
      {error && <small>{error}</small>}
    </div>
  );
}

function ATMLocationPicker({ latitude, longitude, onLocationSelected }) {
  const map = useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onLocationSelected(lat, lng);
      map.flyTo([lat, lng], 16, { duration: 0.7 });
    },
  });

  const latitudeNumber = Number(latitude);
  const longitudeNumber = Number(longitude);
  const hasValidLocation = latitude !== "" && longitude !== "" &&
    Number.isFinite(latitudeNumber) && Number.isFinite(longitudeNumber);

  useEffect(() => {
    if (hasValidLocation) {
      map.setView([latitudeNumber, longitudeNumber], Math.max(map.getZoom(), 15));
    }
  }, [hasValidLocation, latitudeNumber, longitudeNumber, map]);

  if (!hasValidLocation) return null;

  return (
    <CircleMarker
      center={[latitudeNumber, longitudeNumber]}
      radius={12}
      pathOptions={{ color: "#ffffff", weight: 4, fillColor: "#2f63ac", fillOpacity: 1 }}
    />
  );
}

function ATMMapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function Detail({ label, value }) {
  return <article><span>{label}</span><strong>{value}</strong></article>;
}

export default ManageATMs;
