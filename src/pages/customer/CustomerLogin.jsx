import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { customerLogin } from "../../api/api";
import {
  getCustomerToken,
  saveCustomerSession,
} from "../../utils/customerSession";

import "./CustomerLogin.css";

const initialFormData = {
  username: "",
  password: "",
  remember_me: false,
};

function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState(
    initialFormData
  );

  const [formErrors, setFormErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  const registrationMessage =
    location.state?.registrationSuccess
      ? "Account created successfully. Sign in with your username and password."
      : "";

  const existingToken = getCustomerToken();

  if (existingToken) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setErrorMessage("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username =
        "Username is required.";
    }

    if (!formData.password) {
      errors.password =
        "Password is required.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    const loginPayload = {
      username: formData.username.trim(),
      password: formData.password,
    };

    try {
      setIsSubmitting(true);

      const response =
        await customerLogin(loginPayload);

      const { token, customer } = response.data;

      if (!token || !customer) {
        throw new Error(
          "The login response did not include a token and customer."
        );
      }

      saveCustomerSession(
        token,
        customer,
        formData.remember_me
      );

      const destination =
        location.state?.from?.pathname || "/";

      navigate(destination, {
        replace: true,
        state: {
          loginSuccess: true,
        },
      });
    } catch (error) {
      console.error(
        "Customer login failed:",
        error
      );

      const backendData =
        error.response?.data;

      if (
        backendData?.non_field_errors &&
        Array.isArray(
          backendData.non_field_errors
        )
      ) {
        setErrorMessage(
          backendData.non_field_errors[0]
        );
      } else if (
        backendData?.detail
      ) {
        setErrorMessage(
          backendData.detail
        );
      } else if (
        typeof backendData === "string"
      ) {
        setErrorMessage(backendData);
      } else {
        setErrorMessage(
          "Unable to sign in. Please check your username and password."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-login-page">
      <header className="customer-login-navbar">
        <Link
          to="/"
          className="customer-login-brand"
        >
          <div className="customer-login-brand-logo">
            PBZ
          </div>

          <div>
            <strong>PBZ GIS</strong>
            <span>
              Branch & ATM Locator
            </span>
          </div>
        </Link>

        <div className="customer-login-navbar-action">
          <span>New customer?</span>

          <Link to="/register">
            Create account
          </Link>
        </div>
      </header>

      <main className="customer-login-layout">
        <section className="customer-login-visual">
          <div className="customer-login-circle circle-one"></div>
          <div className="customer-login-circle circle-two"></div>

          <div className="customer-login-visual-content">
            <span className="customer-login-overline">
              PBZ CUSTOMER PORTAL
            </span>

            <h1>
              Find banking services before you travel.
            </h1>

            <p>
              Sign in to access PBZ branch information,
              ATM availability, branch services and GIS
              locations.
            </p>

            <div className="customer-login-feature-list">
              <article>
                <div>MAP</div>

                <div>
                  <strong>
                    Interactive branch map
                  </strong>

                  <span>
                    View branch locations using accurate
                    latitude and longitude coordinates.
                  </span>
                </div>
              </article>

              <article>
                <div>ATM</div>

                <div>
                  <strong>
                    ATM availability status
                  </strong>

                  <span>
                    Identify available and unavailable
                    ATMs before visiting.
                  </span>
                </div>
              </article>

              <article>
                <div>SV</div>

                <div>
                  <strong>
                    Branch service information
                  </strong>

                  <span>
                    Check the services offered by each
                    PBZ branch.
                  </span>
                </div>
              </article>
            </div>

            <div className="customer-login-map-preview">
              <div className="login-map-grid"></div>
              <div className="login-map-road road-one"></div>
              <div className="login-map-road road-two"></div>

              <span className="login-map-pin first"></span>
              <span className="login-map-pin second"></span>
              <span className="login-map-pin third unavailable"></span>

              <div className="login-map-card">
                <div>
                  <span>Branch locator</span>
                  <strong>
                    Explore PBZ Zanzibar
                  </strong>
                </div>

                <span className="login-live-badge">
                  <i></i>
                  Live
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="customer-login-form-section">
          <div className="customer-login-form-container">
            <div className="customer-login-form-heading">
              <div className="customer-login-mobile-logo">
                PBZ
              </div>

              <p>WELCOME BACK</p>

              <h2>Customer Login</h2>

              <span>
                Sign in using your customer username and
                password.
              </span>
            </div>

            {registrationMessage && !errorMessage && (
              <div className="customer-login-alert customer-login-alert--success">
                <div>✓</div>
                <p>{registrationMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="customer-login-alert">
                <div>!</div>

                <p>{errorMessage}</p>

                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage("")
                  }
                  aria-label="Close error message"
                >
                  ×
                </button>
              </div>
            )}

            <form
              className="customer-login-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="customer-login-form-group">
                <label htmlFor="customer-username">
                  Username
                </label>

                <div
                  className={`customer-login-input ${
                    formErrors.username
                      ? "has-error"
                      : ""
                  }`}
                >
                  <span>USR</span>

                  <input
                    type="text"
                    id="customer-username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                {formErrors.username && (
                  <small>
                    {formErrors.username}
                  </small>
                )}
              </div>

              <div className="customer-login-form-group">
                <div className="customer-login-label-row">
                  <label htmlFor="customer-password">
                    Password
                  </label>

                  <span className="customer-login-help-text">
                    Use your registered PBZ GIS password
                  </span>
                </div>

                <div
                  className={`customer-login-input ${
                    formErrors.password
                      ? "has-error"
                      : ""
                  }`}
                >
                  <span>KEY</span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    id="customer-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="customer-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (previousValue) =>
                          !previousValue
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                {formErrors.password && (
                  <small>
                    {formErrors.password}
                  </small>
                )}
              </div>

              <div className="customer-login-options">
                <label>
                  <input
                    type="checkbox"
                    name="remember_me"
                    checked={
                      formData.remember_me
                    }
                    onChange={handleInputChange}
                  />

                  <span>✓</span>

                  <p>Remember me</p>
                </label>
              </div>

              <button
                type="submit"
                className="customer-login-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="customer-login-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Customer Account
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="customer-login-divider">
              <span></span>
              <p>New to PBZ GIS?</p>
              <span></span>
            </div>

            <Link
              to="/register"
              className="customer-create-account-button"
            >
              Create a Customer Account
            </Link>

            <div className="customer-login-guest">
              <p>
                You can also explore public branch
                information without signing in.
              </p>

              <Link to="/map">
                Continue to GIS Map
                <span>→</span>
              </Link>
            </div>

            <div className="customer-login-security">
              <span>✓</span>

              <p>
                Your login information is sent securely
                to the PBZ GIS system.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CustomerLogin;