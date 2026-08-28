import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  adminLogin,
} from "../../api/api";

import {
  clearAdminSession,
  isAdminAuthenticated,
  saveAdminSession,
} from "../../utils/AdminAuth";

import "./AdminLogin.css";


function AdminLogin() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});


  /*
  |--------------------------------------------------------------------------
  | REDIRECT ALREADY AUTHENTICATED ADMIN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      isAdminAuthenticated()
    ) {
      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );
    }
  }, [navigate]);


  /*
  |--------------------------------------------------------------------------
  | VALIDATE LOGIN FORM
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const errors = {};


    if (
      !username.trim()
    ) {
      errors.username =
        "Username is required.";
    }


    if (!password) {
      errors.password =
        "Password is required.";
    }


    setFieldErrors(
      errors
    );


    return (
      Object.keys(
        errors
      ).length === 0
    );
  };


  /*
  |--------------------------------------------------------------------------
  | ADMIN LOGIN
  |--------------------------------------------------------------------------
  */

  const handleLogin =
    async (event) => {
      event.preventDefault();

      setErrorMessage("");


      if (
        !validateForm()
      ) {
        return;
      }


      try {
        setIsLoading(true);


        /*
         * Remove any old or invalid
         * admin session before creating
         * a fresh one.
         */
        clearAdminSession();


        const response =
          await adminLogin({
            username:
              username.trim(),

            password,
          });


        const {
          token,
          user,
        } =
          response.data || {};


        /*
         * Backend must return:
         *
         * {
         *   message: "Login successful",
         *   token: "...",
         *   user: {...}
         * }
         */
        if (
          !token ||
          !user
        ) {
          setErrorMessage(
            "The server returned an invalid admin login response."
          );

          return;
        }


        /*
         * Only staff/superuser accounts
         * should enter admin pages.
         */
        const isAdministrator =
          user.is_staff === true ||
          user.is_superuser ===
            true;


        if (
          !isAdministrator
        ) {
          clearAdminSession();

          setErrorMessage(
            "This account does not have administrator privileges."
          );

          return;
        }


        /*
         * Save the administrator
         * session.
         *
         * rememberMe = true
         *    -> localStorage
         *
         * rememberMe = false
         *    -> sessionStorage
         */
        saveAdminSession(
          token,
          user,
          rememberMe
        );


        /*
         * If AdminProtectedRoute sent
         * the administrator to this
         * page, return to the requested
         * admin page.
         *
         * Otherwise open dashboard.
         */
        const redirectTo =
          location.state?.from ||
          "/admin/dashboard";


        navigate(
          redirectTo,
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Admin login failed:",
          error
        );


        /*
         * Never leave an invalid
         * admin session behind.
         */
        clearAdminSession();


        const backendData =
          error.response?.data;


        /*
         * Incorrect credentials.
         */
        if (
          error.response
            ?.status === 401
        ) {
          setErrorMessage(
            backendData?.detail ||
              backendData?.message ||
              backendData
                ?.non_field_errors?.[0] ||
              "Incorrect username or password."
          );

          return;
        }


        /*
         * Account authenticated but
         * backend rejected admin access.
         */
        if (
          error.response
            ?.status === 403
        ) {
          setErrorMessage(
            backendData?.detail ||
              backendData?.message ||
              "You do not have permission to access the administrator portal."
          );

          return;
        }


        /*
         * Validation errors from DRF.
         */
        if (
          backendData?.username
        ) {
          setFieldErrors(
            (previous) => ({
              ...previous,

              username:
                Array.isArray(
                  backendData.username
                )
                  ? backendData
                      .username[0]
                  : String(
                      backendData.username
                    ),
            })
          );

          return;
        }


        if (
          backendData?.password
        ) {
          setFieldErrors(
            (previous) => ({
              ...previous,

              password:
                Array.isArray(
                  backendData.password
                )
                  ? backendData
                      .password[0]
                  : String(
                      backendData.password
                    ),
            })
          );

          return;
        }


        setErrorMessage(
          backendData?.detail ||
            backendData?.message ||
            backendData
              ?.non_field_errors?.[0] ||
            "Unable to sign in. Please check your credentials and try again."
        );
      } finally {
        setIsLoading(false);
      }
    };


  return (
    <div className="admin-login-page">

      {/* =================================
          NAVBAR
      ================================= */}

      <header className="admin-login-navbar">

        <Link
          to="/"
          className="admin-login-brand"
        >
          <div className="admin-login-brand-logo">
            PBZ
          </div>


          <div>

            <strong>
              PBZ GIS
            </strong>

            <span>
              Administration Portal
            </span>

          </div>

        </Link>


        <Link
          to="/"
          className="admin-login-customer-link"
        >
          Customer Portal

          <span>
            →
          </span>
        </Link>

      </header>


      {/* =================================
          MAIN
      ================================= */}

      <main className="admin-login-main">

        {/* =================================
            LEFT VISUAL
        ================================= */}

        <section className="admin-login-visual">

          <div className="admin-login-orb orb-one"></div>

          <div className="admin-login-orb orb-two"></div>

          <div className="admin-login-grid-pattern"></div>


          <div className="admin-login-visual-content">

            <span className="admin-login-overline">
              PBZ GIS ADMINISTRATION
            </span>


            <h1>
              Manage branch information
              with confidence.
            </h1>


            <p className="admin-login-description">
              Secure access to the PBZ GIS
              administrative environment for
              managing branches, categories,
              services and customer accounts.
            </p>


            <div className="admin-login-feature-list">

              {/* BRANCH */}

              <article>

                <div className="admin-login-feature-icon">
                  BR
                </div>


                <div>

                  <strong>
                    Branch Management
                  </strong>

                  <p>
                    Maintain branch information,
                    locations and ATM
                    availability.
                  </p>

                </div>

              </article>


              {/* SERVICES */}

              <article>

                <div className="admin-login-feature-icon">
                  SV
                </div>


                <div>

                  <strong>
                    Banking Services
                  </strong>

                  <p>
                    Manage services and assign
                    them across multiple PBZ
                    branches.
                  </p>

                </div>

              </article>


              {/* CUSTOMERS */}

              <article>

                <div className="admin-login-feature-icon">
                  CU
                </div>


                <div>

                  <strong>
                    Customer Accounts
                  </strong>

                  <p>
                    Review and manage customer
                    account access securely.
                  </p>

                </div>

              </article>

            </div>


            {/* SECURITY */}

            <div className="admin-login-security">

              <div>
                ✓
              </div>


              <div>

                <strong>
                  Authorized personnel only
                </strong>

                <p>
                  Administrator access is
                  restricted to PBZ GIS staff
                  and superuser accounts.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =================================
            LOGIN FORM
        ================================= */}

        <section className="admin-login-form-section">

          <div className="admin-login-form-container">

            {/* FORM HEADER */}

            <div className="admin-login-form-header">

              <div className="admin-login-form-icon">
                PBZ
              </div>


              <span>
                ADMINISTRATOR LOGIN
              </span>


              <h2>
                Welcome back
              </h2>


              <p>
                Enter your administrator
                credentials to continue to
                the PBZ GIS dashboard.
              </p>

            </div>


            {/* =================================
                LOGIN ERROR
            ================================= */}

            {errorMessage && (

              <div
                className="admin-login-error"
                role="alert"
              >

                <div>
                  !
                </div>


                <p>
                  {
                    errorMessage
                  }
                </p>

              </div>

            )}


            {/* =================================
                FORM
            ================================= */}

            <form
              className="admin-login-form"
              onSubmit={
                handleLogin
              }
              noValidate
            >

              {/* USERNAME */}

              <div className="admin-login-field">

                <label htmlFor="admin-username">
                  Username
                </label>


                <div
                  className={`admin-login-input-wrapper ${
                    fieldErrors.username
                      ? "has-error"
                      : ""
                  }`}
                >

                  <span className="admin-login-input-icon">
                    USR
                  </span>


                  <input
                    id="admin-username"
                    type="text"
                    value={
                      username
                    }
                    onChange={(
                      event
                    ) => {
                      setUsername(
                        event.target
                          .value
                      );


                      setFieldErrors(
                        (
                          previous
                        ) => ({
                          ...previous,

                          username: "",
                        })
                      );


                      setErrorMessage(
                        ""
                      );
                    }}
                    placeholder="Enter administrator username"
                    autoComplete="username"
                    disabled={
                      isLoading
                    }
                  />

                </div>


                {fieldErrors.username && (

                  <small>
                    {
                      fieldErrors.username
                    }
                  </small>

                )}

              </div>


              {/* PASSWORD */}

              <div className="admin-login-field">

                <label htmlFor="admin-password">
                  Password
                </label>


                <div
                  className={`admin-login-input-wrapper ${
                    fieldErrors.password
                      ? "has-error"
                      : ""
                  }`}
                >

                  <span className="admin-login-input-icon">
                    PWD
                  </span>


                  <input
                    id="admin-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event.target
                          .value
                      );


                      setFieldErrors(
                        (
                          previous
                        ) => ({
                          ...previous,

                          password: "",
                        })
                      );


                      setErrorMessage(
                        ""
                      );
                    }}
                    placeholder="Enter administrator password"
                    autoComplete="current-password"
                    disabled={
                      isLoading
                    }
                  />


                  <button
                    type="button"
                    className="admin-login-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                    disabled={
                      isLoading
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>


                {fieldErrors.password && (

                  <small>
                    {
                      fieldErrors.password
                    }
                  </small>

                )}

              </div>


              {/* =================================
                  OPTIONS
              ================================= */}

              <div className="admin-login-options">

                <label className="admin-login-remember">

                  <input
                    type="checkbox"
                    checked={
                      rememberMe
                    }
                    onChange={(
                      event
                    ) =>
                      setRememberMe(
                        event.target
                          .checked
                      )
                    }
                    disabled={
                      isLoading
                    }
                  />


                  <span className="admin-login-switch"></span>


                  <span className="admin-login-remember-text">
                    Remember me
                  </span>

                </label>


                <span className="admin-login-secure-label">
                  Secure login
                </span>

              </div>


              {/* =================================
                  SUBMIT
              ================================= */}

              <button
                type="submit"
                className="admin-login-submit"
                disabled={
                  isLoading
                }
              >

                {isLoading ? (

                  <>
                    <span className="admin-login-spinner"></span>

                    Authenticating...
                  </>

                ) : (

                  <>
                    Sign in to Dashboard

                    <span>
                      →
                    </span>
                  </>

                )}

              </button>

            </form>


            {/* =================================
                DIVIDER
            ================================= */}

            <div className="admin-login-divider">

              <span></span>

              <p>
                ADMIN ACCESS ONLY
              </p>

              <span></span>

            </div>


            {/* =================================
                HELP
            ================================= */}

            <div className="admin-login-help">

              <div className="admin-login-help-icon">
                ?
              </div>


              <div>

                <strong>
                  Trouble signing in?
                </strong>

                <p>
                  Verify your administrator
                  username and password or
                  contact the PBZ GIS system
                  administrator.
                </p>

              </div>

            </div>


            {/* FOOTER */}

            <footer className="admin-login-footer">

              <span>
                PBZ GIS
              </span>

              <span>
                •
              </span>

              <span>
                Secure Administration
              </span>

            </footer>

          </div>

        </section>

      </main>

    </div>
  );
}


export default AdminLogin;