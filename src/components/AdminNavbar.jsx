import { NavLink } from "react-router-dom";

import "./AdminNavbar.css";

const adminNavigation = [
	{ path: "/admin/dashboard", label: "Dashboard", icon: "DB" },
	{ path: "/admin/branches", label: "Branches", icon: "BR" },
	{ path: "/admin/atms", label: "Standalone ATMs", icon: "ATM" },
	{ path: "/admin/categories", label: "Categories", icon: "CT" },
	{ path: "/admin/services", label: "Services", icon: "SV" },
	{ path: "/admin/customers", label: "Customers", icon: "CU" },
	{ path: "/admin/map", label: "GIS Map", icon: "MP" },
	{ path: "/admin/reports", label: "Reports", icon: "RP" },
];

function AdminNavbar() {
	return (
		<aside className="admin-navbar">
			<div className="admin-navbar-brand">
				<div className="admin-navbar-logo">PBZ</div>

				<div>
					<h1>PBZ GIS</h1>
					<p>Administration</p>
				</div>
			</div>

			<nav className="admin-navbar-navigation" aria-label="Admin navigation">
				<p className="admin-navbar-title">MAIN MENU</p>

				{adminNavigation.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						end={item.path === "/admin/dashboard"}
						className={({ isActive }) =>
							`admin-navbar-link${isActive ? " active" : ""}`
						}
					>
						<span className="admin-navbar-link-icon">{item.icon}</span>
						<span>{item.label}</span>
					</NavLink>
				))}
			</nav>

			<div className="admin-navbar-footer">
				<div className="admin-navbar-help">
					<span className="admin-navbar-help-icon">?</span>

					<div>
						<strong>Need help?</strong>
						<p>PBZ GIS administration portal</p>
					</div>
				</div>
			</div>
		</aside>
	);
}

export default AdminNavbar;
