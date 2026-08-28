import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getBranches,
  getCategories,
  getServices,
  getCustomers,
} from "../../api/api";

import "./AdminDashboard.css";

const initialDashboardData = {
  branches: [],
  categories: [],
  services: [],
  customers: [],
};

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        branchesResponse,
        categoriesResponse,
        servicesResponse,
        customersResponse,
      ] = await Promise.all([
        getBranches(),
        getCategories(),
        getServices(),
        getCustomers(),
      ]);

      setDashboardData({
        branches: branchesResponse.data,
        categories: categoriesResponse.data,
        services: servicesResponse.data,
        customers: customersResponse.data,
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to load dashboard information. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeAtms = dashboardData.branches.filter(
    (branch) => branch.atm_status === true
  ).length;

  const unavailableAtms = dashboardData.branches.filter(
    (branch) => branch.atm_status === false
  ).length;

  const recentBranches = [...dashboardData.branches]
    .sort((firstBranch, secondBranch) => secondBranch.id - firstBranch.id)
    .slice(0, 5);

  const getCategoryName = (categoryId) => {
    const category = dashboardData.categories.find(
      (item) => Number(item.id) === Number(categoryId)
    );

    return category ? category.category_name : "Not assigned";
  };

  const summaryCards = [
    {
      title: "Total Branches",
      value: dashboardData.branches.length,
      description: "Registered PBZ branches",
      icon: "BR",
      link: "/admin/branches",
      linkText: "Manage branches",
      cardClass: "branches-card",
    },
    {
      title: "Categories",
      value: dashboardData.categories.length,
      description: "Available branch categories",
      icon: "CT",
      link: "/admin/categories",
      linkText: "Manage categories",
      cardClass: "categories-card",
    },
    {
      title: "Services",
      value: dashboardData.services.length,
      description: "Banking services recorded",
      icon: "SV",
      link: "/admin/services",
      linkText: "Manage services",
      cardClass: "services-card",
    },
    {
      title: "Customers",
      value: dashboardData.customers.length,
      description: "Registered customer accounts",
      icon: "CU",
      link: "/admin/customers",
      linkText: "Manage customers",
      cardClass: "customers-card",
    },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">PBZ</div>

          <div>
            <h1>PBZ GIS</h1>
            <p>Administration</p>
          </div>
        </div>

        <nav className="sidebar-navigation">
          <p className="navigation-title">MAIN MENU</p>

          <Link
            to="/admin/dashboard"
            className="sidebar-link sidebar-link-active"
          >
            <span className="sidebar-link-icon">DB</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/admin/branches" className="sidebar-link">
            <span className="sidebar-link-icon">BR</span>
            <span>Branches</span>
          </Link>

          <Link to="/admin/categories" className="sidebar-link">
            <span className="sidebar-link-icon">CT</span>
            <span>Categories</span>
          </Link>

          <Link to="/admin/services" className="sidebar-link">
            <span className="sidebar-link-icon">SV</span>
            <span>Services</span>
          </Link>

          <Link to="/admin/customers" className="sidebar-link">
            <span className="sidebar-link-icon">CU</span>
            <span>Customers</span>
          </Link>

          <Link to="/admin/map" className="sidebar-link">
            <span className="sidebar-link-icon">MP</span>
            <span>GIS Map</span>
          </Link>

          <Link to="/admin/reports" className="sidebar-link">
            <span className="sidebar-link-icon">RP</span>
            <span>Reports</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-help">
            <span className="sidebar-help-icon">?</span>

            <div>
              <strong>Need help?</strong>
              <p>PBZ GIS administration portal</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-overline">ADMINISTRATION PORTAL</p>
            <h2>Dashboard Overview</h2>
            <p className="dashboard-subtitle">
              Monitor PBZ branches, services and customer information.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="refresh-button"
              onClick={loadDashboardData}
              disabled={isLoading}
            >
              <span className={isLoading ? "refresh-icon rotating" : "refresh-icon"}>
                ↻
              </span>

              {isLoading ? "Refreshing..." : "Refresh"}
            </button>

            <div className="admin-profile">
              <div className="admin-avatar">AD</div>

              <div className="admin-profile-information">
                <strong>Administrator</strong>
                <span>PBZ GIS System</span>
              </div>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="dashboard-error" role="alert">
            <div>
              <strong>Unable to load dashboard</strong>
              <p>{errorMessage}</p>
            </div>

            <button type="button" onClick={loadDashboardData}>
              Try again
            </button>
          </div>
        )}

        <section className="dashboard-summary">
          {summaryCards.map((card) => (
            <article
              className={`summary-card ${card.cardClass}`}
              key={card.title}
            >
              <div className="summary-card-top">
                <div className="summary-card-icon">{card.icon}</div>

                <span className="summary-card-status">Live</span>
              </div>

              <div className="summary-card-content">
                <p>{card.title}</p>

                {isLoading ? (
                  <div className="number-skeleton"></div>
                ) : (
                  <h3>{card.value}</h3>
                )}

                <span>{card.description}</span>
              </div>

              <Link to={card.link} className="summary-card-link">
                {card.linkText}
                <span>→</span>
              </Link>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-panel recent-branches-panel">
            <div className="panel-header">
              <div>
                <p className="panel-overline">BRANCH INFORMATION</p>
                <h3>Recent Branches</h3>
              </div>

              <Link to="/admin/branches" className="view-all-link">
                View all
                <span>→</span>
              </Link>
            </div>

            <div className="table-container">
              {isLoading ? (
                <div className="table-loading">
                  <div className="loading-circle"></div>
                  <p>Loading branch information...</p>
                </div>
              ) : recentBranches.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">BR</div>
                  <h4>No branches found</h4>
                  <p>Branch records will appear here after they are added.</p>

                  <Link to="/admin/branches">Add branch</Link>
                </div>
              ) : (
                <table className="branches-table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Category</th>
                      <th>ATM Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentBranches.map((branch) => (
                      <tr key={branch.id}>
                        <td>
                          <div className="branch-cell">
                            <div className="branch-table-icon">
                              {branch.branch_name
                                ?.substring(0, 2)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>{branch.branch_name}</strong>
                              <span>{branch.address}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="category-badge">
                            {getCategoryName(branch.category)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              branch.atm_status
                                ? "atm-status atm-available"
                                : "atm-status atm-unavailable"
                            }
                          >
                            <span className="status-dot"></span>
                            {branch.atm_status
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        </td>

                        <td>
                          <Link
                            to={`/admin/branches/${branch.id}`}
                            className="table-action"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <aside className="dashboard-side-column">
            <article className="dashboard-panel atm-panel">
              <div className="panel-header">
                <div>
                  <p className="panel-overline">ATM MONITORING</p>
                  <h3>ATM Availability</h3>
                </div>
              </div>

              {isLoading ? (
                <div className="atm-loading">
                  <div className="loading-circle"></div>
                </div>
              ) : (
                <>
                  <div className="atm-total">
                    <div>
                      <span>Total branch ATMs</span>
                      <strong>{dashboardData.branches.length}</strong>
                    </div>

                    <div className="atm-percentage">
                      {dashboardData.branches.length > 0
                        ? Math.round(
                            (activeAtms / dashboardData.branches.length) * 100
                          )
                        : 0}
                      %
                    </div>
                  </div>

                  <div className="atm-progress">
                    <div
                      className="atm-progress-value"
                      style={{
                        width:
                          dashboardData.branches.length > 0
                            ? `${
                                (activeAtms /
                                  dashboardData.branches.length) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>

                  <div className="atm-status-list">
                    <div className="atm-status-item">
                      <div>
                        <span className="atm-list-dot available-dot"></span>
                        <p>Available</p>
                      </div>

                      <strong>{activeAtms}</strong>
                    </div>

                    <div className="atm-status-item">
                      <div>
                        <span className="atm-list-dot unavailable-dot"></span>
                        <p>Unavailable</p>
                      </div>

                      <strong>{unavailableAtms}</strong>
                    </div>
                  </div>
                </>
              )}
            </article>

            <article className="dashboard-panel quick-actions-panel">
              <div className="panel-header">
                <div>
                  <p className="panel-overline">SHORTCUTS</p>
                  <h3>Quick Actions</h3>
                </div>
              </div>

              <div className="quick-actions">
                <Link to="/admin/branches/new" className="quick-action">
                  <span className="quick-action-icon">+</span>

                  <div>
                    <strong>Add branch</strong>
                    <p>Register a new PBZ branch</p>
                  </div>

                  <span className="quick-action-arrow">→</span>
                </Link>

                <Link to="/admin/services/new" className="quick-action">
                  <span className="quick-action-icon">+</span>

                  <div>
                    <strong>Add service</strong>
                    <p>Create a new banking service</p>
                  </div>

                  <span className="quick-action-arrow">→</span>
                </Link>

                <Link to="/admin/categories/new" className="quick-action">
                  <span className="quick-action-icon">+</span>

                  <div>
                    <strong>Add category</strong>
                    <p>Create a branch category</p>
                  </div>

                  <span className="quick-action-arrow">→</span>
                </Link>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;