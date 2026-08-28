import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  clearAdminSession,
  isAdminAuthenticated,
} from "../utils/AdminAuth";


function AdminProtectedRoute({
  children,
}) {
  const location =
    useLocation();

  /*
   * No admin login session.
   */
  if (!isAdminAuthenticated()) {
    clearAdminSession();

    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }


  /*
   * Valid admin session.
   */
  return children;
}


export default AdminProtectedRoute;