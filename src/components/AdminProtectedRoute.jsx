import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  clearAdminSession,
  getAdminToken,
  getAdminUser,
} from "../utils/AdminAuth";


function AdminProtectedRoute({
  children,
}) {
  const location =
    useLocation();

  const token =
    getAdminToken();

  const adminUser =
    getAdminUser();


  /*
   * No admin login session.
   */
  if (
    !token ||
    !adminUser
  ) {
    clearAdminSession();

    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }


  /*
   * User exists, but is not an
   * administrator.
   */
  const isAuthorizedAdmin =
    adminUser.is_staff === true ||
    adminUser.is_superuser === true;


  if (!isAuthorizedAdmin) {
    clearAdminSession();

    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from:
            location.pathname,
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