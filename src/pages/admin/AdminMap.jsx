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

import { useNavigate } from "react-router-dom";

import AdminNavbar from "../../components/AdminNavbar";

import L from "leaflet";

import {
  getBranches,
  getCategories,
  getServices,
} from "../../api/api";

import "leaflet/dist/leaflet.css";
import "./AdminMap.css";


const DEFAULT_CENTER = [
  -6.1659,
  39.2026,
];

const DEFAULT_ZOOM = 12;


function AdminMap() {
  const navigate =
    useNavigate();

  const markerRefs =
    useRef({});

  const [branches, setBranches] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [
    selectedBranch,
    setSelectedBranch,
  ] = useState(null);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

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

  const loadMapData =
    async () => {
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
      } catch (error) {
        console.error(
          "Failed to load admin map:",
          error
        );

        setErrorMessage(
          error.response?.data
            ?.detail ||
            "Unable to load GIS information."
        );
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    loadMapData();
  }, []);


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
      "PBZ Branch"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | MANY-TO-MANY SERVICE BRANCH IDS
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
        (id) =>
          Number.isFinite(id)
      );
  };


  /*
  |--------------------------------------------------------------------------
  | SERVICES FOR ONE BRANCH
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
  | VALID COORDINATES
  |--------------------------------------------------------------------------
  */

  const validBranches =
    useMemo(() => {
      return branches.filter(
        (branch) => {
          const latitude =
            Number(
              branch.latitude
            );

          const longitude =
            Number(
              branch.longitude
            );

          return (
            Number.isFinite(
              latitude
            ) &&
            Number.isFinite(
              longitude
            ) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          );
        }
      );
    }, [branches]);


  /*
  |--------------------------------------------------------------------------
  | SERVICES FILTER OPTIONS
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
  | FILTER BRANCHES
  |--------------------------------------------------------------------------
  */

  const filteredBranches =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return validBranches.filter(
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
      validBranches,
      categories,
      services,
      searchTerm,
      categoryFilter,
      atmFilter,
      serviceFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const availableAtmCount =
    validBranches.filter(
      (branch) =>
        branch.atm_status ===
        true
    ).length;


  const unavailableAtmCount =
    validBranches.filter(
      (branch) =>
        branch.atm_status ===
        false
    ).length;


  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setAtmFilter("all");
    setServiceFilter("all");
    setSelectedBranch(null);
  };


  const selectBranch = (
    branch
  ) => {
    setSelectedBranch(
      branch
    );

    const marker =
      markerRefs.current[
        branch.id
      ];

    if (marker) {
      marker.openPopup();
    }
  };


  const manageBranch = () => {
    navigate(
      "/admin/branches"
    );
  };


  return (
    <div className="admin-map-page">

      <AdminNavbar />


      {/* =================================
          MAIN AREA
      ================================= */}

      <main className="admin-map-main">

        {/* HEADER */}

        <header className="admin-map-header">

          <div>

            <span className="admin-map-overline">
              GIS MANAGEMENT
            </span>

            <h2>
              Branch Location Map
            </h2>

            <p>
              Monitor PBZ branch
              locations, services and
              ATM availability from one
              administrative map.
            </p>

          </div>


          <div className="admin-map-header-actions">

            <button
              type="button"
              className="admin-map-refresh"
              onClick={
                loadMapData
              }
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "Loading..."
                : "Refresh Map"}
            </button>


            <button
              type="button"
              className="admin-map-manage-button"
              onClick={
                manageBranch
              }
            >
              Manage Branches
              <span>
                →
              </span>
            </button>

          </div>

        </header>


        {/* =================================
            SUMMARY
        ================================= */}

        <section className="admin-map-summary">

          <article>

            <div className="admin-map-summary-icon total">
              BR
            </div>

            <div>
              <span>
                Total Branches
              </span>

              <strong>
                {
                  validBranches.length
                }
              </strong>
            </div>

          </article>


          <article>

            <div className="admin-map-summary-icon available">
              ✓
            </div>

            <div>
              <span>
                ATM Available
              </span>

              <strong>
                {
                  availableAtmCount
                }
              </strong>
            </div>

          </article>


          <article>

            <div className="admin-map-summary-icon unavailable">
              !
            </div>

            <div>
              <span>
                ATM Unavailable
              </span>

              <strong>
                {
                  unavailableAtmCount
                }
              </strong>
            </div>

          </article>


          <article>

            <div className="admin-map-summary-icon shown">
              MP
            </div>

            <div>
              <span>
                Map Results
              </span>

              <strong>
                {
                  filteredBranches.length
                }
              </strong>
            </div>

          </article>

        </section>


        {/* =================================
            MAP WORKSPACE
        ================================= */}

        <section className="admin-map-workspace">

          {/* LEFT PANEL */}

          <aside className="admin-map-filter-panel">

            <div className="admin-map-panel-heading">

              <span>
                MAP FILTERS
              </span>

              <h3>
                Find Branches
              </h3>

              <p>
                Search and filter branch
                locations displayed on
                the GIS map.
              </p>

            </div>


            {/* SEARCH */}

            <div className="admin-map-field">

              <label>
                Search
              </label>

              <div className="admin-map-search">

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
                  placeholder="Branch, area or service..."
                />

              </div>

            </div>


            {/* CATEGORY */}

            <div className="admin-map-field">

              <label>
                Category
              </label>

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

            </div>


            {/* ATM */}

            <div className="admin-map-field">

              <label>
                ATM Status
              </label>

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
                  All ATM statuses
                </option>

                <option value="available">
                  ATM available
                </option>

                <option value="unavailable">
                  ATM unavailable
                </option>

              </select>

            </div>


            {/* SERVICE */}

            <div className="admin-map-field">

              <label>
                Service
              </label>

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

            </div>


            <button
              type="button"
              className="admin-map-clear-filters"
              onClick={
                clearFilters
              }
            >
              Clear all filters
            </button>


            {/* RESULTS */}

            <div className="admin-map-results-header">

              <span>
                DISPLAYED BRANCHES
              </span>

              <strong>
                {
                  filteredBranches.length
                }
              </strong>

            </div>


            <div className="admin-map-branch-list">

              {isLoading ? (

                <div className="admin-map-loading">

                  <div className="admin-map-spinner"></div>

                  <p>
                    Loading branches...
                  </p>

                </div>

              ) : errorMessage ? (

                <div className="admin-map-error">

                  <div>
                    !
                  </div>

                  <h4>
                    Unable to load map
                  </h4>

                  <p>
                    {
                      errorMessage
                    }
                  </p>

                </div>

              ) : filteredBranches.length ===
                0 ? (

                <div className="admin-map-empty">

                  <div>
                    ⌕
                  </div>

                  <h4>
                    No branches found
                  </h4>

                  <p>
                    Try adjusting your
                    filters.
                  </p>

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
                        key={
                          branch.id
                        }
                        type="button"
                        className={`admin-map-branch-card ${
                          selectedBranch?.id ===
                          branch.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          selectBranch(
                            branch
                          )
                        }
                      >

                        <span
                          className={`admin-map-card-dot ${
                            branch.atm_status
                              ? "available"
                              : "unavailable"
                          }`}
                        ></span>


                        <div className="admin-map-card-content">

                          <div className="admin-map-card-title">

                            <strong>
                              {
                                branch.branch_name
                              }
                            </strong>

                            <span>
                              {
                                branchServices.length
                              }{" "}
                              services
                            </span>

                          </div>


                          <p>
                            {
                              branch.address
                            }
                          </p>


                          <small>
                            {getCategoryName(
                              branch.category
                            )}
                          </small>

                        </div>


                        <span className="admin-map-card-arrow">
                          ›
                        </span>

                      </button>

                    );
                  }
                )

              )}

            </div>

          </aside>


          {/* =================================
              MAP
          ================================= */}

          <div className="admin-map-container">

            <MapContainer
              center={
                DEFAULT_CENTER
              }
              zoom={
                DEFAULT_ZOOM
              }
              scrollWheelZoom
              className="admin-leaflet-map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              <AdminMapController
                branches={
                  filteredBranches
                }
                selectedBranch={
                  selectedBranch
                }
              />


              {filteredBranches.map(
                (branch) => {

                  const branchServices =
                    getBranchServices(
                      branch.id
                    );

                  return (

                    <CircleMarker
                      key={
                        branch.id
                      }
                      center={[
                        Number(
                          branch.latitude
                        ),
                        Number(
                          branch.longitude
                        ),
                      ]}
                      radius={
                        selectedBranch?.id ===
                        branch.id
                          ? 14
                          : 10
                      }
                      pathOptions={{
                        color:
                          "#ffffff",

                        weight: 4,

                        fillColor:
                          branch.atm_status
                            ? "#17985e"
                            : "#d34e4e",

                        fillOpacity:
                          1,
                      }}
                      eventHandlers={{
                        click: () =>
                          setSelectedBranch(
                            branch
                          ),
                      }}
                      ref={(
                        marker
                      ) => {
                        if (marker) {
                          markerRefs.current[
                            branch.id
                          ] =
                            marker;
                        }
                      }}
                    >

                      <Popup
                        className="admin-map-popup"
                        minWidth={
                          300
                        }
                      >

                        <div className="admin-map-popup-content">

                          <div
                            className={`admin-map-popup-atm ${
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


                          <h3>
                            {
                              branch.branch_name
                            }
                          </h3>


                          <span className="admin-map-popup-category">
                            {getCategoryName(
                              branch.category
                            )}
                          </span>


                          <div className="admin-map-popup-info">

                            <div>

                              <span>
                                Address
                              </span>

                              <strong>
                                {branch.address ||
                                  "Not available"}
                              </strong>

                            </div>


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


                          <div className="admin-map-popup-services">

                            <div>

                              <span>
                                SERVICES
                              </span>

                              <strong>
                                {
                                  branchServices.length
                                }
                              </strong>

                            </div>


                            <div>

                              {branchServices.length >
                              0 ? (

                                <>
                                  {branchServices
                                    .slice(
                                      0,
                                      4
                                    )
                                    .map(
                                      (
                                        service
                                      ) => (

                                        <span
                                          key={
                                            service.id
                                          }
                                        >
                                          {
                                            service.service_name
                                          }
                                        </span>

                                      )
                                    )}

                                  {branchServices.length >
                                    4 && (

                                    <span>
                                      +
                                      {branchServices.length -
                                        4}{" "}
                                      more
                                    </span>

                                  )}
                                </>

                              ) : (

                                <span>
                                  No services assigned
                                </span>

                              )}

                            </div>

                          </div>


                          <div className="admin-map-popup-actions">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  "/admin/branches"
                                )
                              }
                            >
                              Manage Branch
                            </button>


                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Directions
                            </a>

                          </div>

                        </div>

                      </Popup>

                    </CircleMarker>

                  );
                }
              )}

            </MapContainer>


            {/* MAP LEGEND */}

            <div className="admin-map-legend">

              <span className="admin-map-legend-title">
                ATM STATUS
              </span>


              <div>
                <i className="available"></i>

                Available
              </div>


              <div>
                <i className="unavailable"></i>

                Unavailable
              </div>

            </div>


            <div className="admin-map-result-badge">

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

          </div>

        </section>

      </main>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| MAP CONTROLLER
|--------------------------------------------------------------------------
*/

function AdminMapController({
  branches,
  selectedBranch,
}) {
  const map =
    useMap();


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
          duration:
            0.8,
        }
      );

      return;
    }


    if (
      branches.length ===
      0
    ) {

      map.setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM
      );

      return;
    }


    const coordinates =
      branches.map(
        (branch) => [
          Number(
            branch.latitude
          ),

          Number(
            branch.longitude
          ),
        ]
      );


    if (
      coordinates.length ===
      1
    ) {

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


    map.fitBounds(
      bounds,
      {
        padding:
          [55, 55],

        maxZoom:
          15,
      }
    );

  }, [
    branches,
    selectedBranch,
    map,
  ]);


  return null;
}


export default AdminMap;