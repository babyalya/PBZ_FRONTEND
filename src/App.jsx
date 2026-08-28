import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";


import CustomerHome from "./pages/customer/CustomerHome";
import GISMap from "./pages/customer/GISMap";
import CustomerRegistration from "./pages/customer/CustomerRegistration";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerBranches from "./pages/customer/CustomerBranches";
import CustomerBranchDetails from "./pages/customer/CustomerBranchDetails";
import CustomerServices from "./pages/customer/CustomerServices";


import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageBranches from "./pages/admin/ManageBranches";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageServices from "./pages/admin/ManageServices";
import ManageCustomers from "./pages/admin/ManageCustomers";
import AdminMap from "./pages/admin/AdminMap";
import AdminReports from "./pages/admin/AdminReports";


import AdminProtectedRoute from "./components/AdminProtectedRoute";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =============================
            CUSTOMER ROUTES
        ============================= */}

        <Route
          path="/"
          element={
            <CustomerHome />
          }
        />

        <Route
          path="/register"
          element={
            <CustomerRegistration />
          }
        />

        <Route
          path="/login"
          element={
            <CustomerLogin />
          }
        />

        <Route
          path="/branches"
          element={
            <CustomerBranches />
          }
        />

        <Route
          path="/branches/:id"
          element={
            <CustomerBranchDetails />
          }
        />

        <Route
          path="/services"
          element={
            <CustomerServices />
          }
        />

        <Route
          path="/map"
          element={
            <GISMap />
          }
        />


        {/* =============================
            ADMIN LOGIN
        ============================= */}

        <Route
          path="/admin/login"
          element={
            <AdminLogin />
          }
        />


        {/* =============================
            PROTECTED ADMIN ROUTES
        ============================= */}

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/branches"
          element={
            <AdminProtectedRoute>
              <ManageBranches />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/categories"
          element={
            <AdminProtectedRoute>
              <ManageCategories />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/services"
          element={
            <AdminProtectedRoute>
              <ManageServices />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/customers"
          element={
            <AdminProtectedRoute>
              <ManageCustomers />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/map"
          element={
            <AdminProtectedRoute>
              <AdminMap />
            </AdminProtectedRoute>
          }
        />


        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <AdminReports />
            </AdminProtectedRoute>
          }
        />


        {/* =============================
            OPTIONAL ADMIN ROOT
        ============================= */}

        <Route
          path="/admin"
          element={
            <Navigate
              to="/admin/login"
              replace
            />
          }
        />


        {/* =============================
            NOT FOUND
        ============================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;