import {
  BrowserRouter,
  Routes,
  Route,
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<CustomerHome />}
        />

        <Route
          path="/register"
          element={<CustomerRegistration />}
        />

        <Route
          path="/login"
          element={<CustomerLogin />}
        />

        <Route
          path="/branches"
          element={<CustomerBranches />}
        />

        <Route
          path="/branches/:id"
          element={<CustomerBranchDetails />}
        />
  

        <Route
          path="/map"
          element={<GISMap />}
        />

        <Route
          path="/services"
          element={<CustomerServices />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/branches"
          element={<ManageBranches />}
        />

        <Route
          path="/admin/categories"
          element={<ManageCategories />}
        />

        <Route
          path="/admin/services"
          element={<ManageServices />}
        />

        <Route
          path="/admin/customers"
          element={<ManageCustomers />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;