import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { createCustomer } from "../../api/api";
import { isCustomerLoggedIn } from "../../utils/customerSession";

import "./CustomerRegistration.css";

const initialFormData = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  accept_terms: false,
};

function CustomerRegistration() {
  const navigate = useNavigate();


  const [formData, setFormData] =
    useState(initialFormData);

  const [formErrors, setFormErrors] =
    useState({});

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const passwordStrength = useMemo(() => {
    const password = formData.password;

    let score = 0;

    if (password.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    if (!password) {
      return {
        score: 0,
        label: "",
        className: "",
      };
    }

    if (score <= 2) {
      return {
        score,
        label: "Weak password",
        className: "weak",
      };
    }

    if (score <= 4) {
      return {
        score,
        label: "Medium password",
        className: "medium",
      };
    }

    return {
      score,
      label: "Strong password",
      className: "strong",
    };
  }, [formData.password]);

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

    if (!formData.first_name.trim()) {
      errors.first_name =
        "First name is required.";
    }

    if (!formData.last_name.trim()) {
      errors.last_name =
        "Last name is required.";
    }

    if (!formData.username.trim()) {
      errors.username =
        "Username is required.";
    } else if (
      formData.username.trim().length < 3
    ) {
      errors.username =
        "Username must contain at least 3 characters.";
    } else if (
      !/^[\w.@+-]+$/u.test(
        formData.username.trim()
      )
    ) {
      errors.username =
        "Username may contain letters, numbers and @ . + - _ characters.";
    }

    if (!formData.email.trim()) {
      errors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone =
        "Phone number is required.";
    } else if (
      !/^\+?[0-9]{9,15}$/.test(
        formData.phone
          .replace(/\s/g, "")
          .trim()
      )
    ) {
      errors.phone =
        "Enter a valid phone number.";
    }

    if (!formData.password) {
      errors.password =
        "Password is required.";
    } else if (
      formData.password.length < 8
    ) {
      errors.password =
        "Password must contain at least 8 characters.";
    } else if (
      !/[A-Z]/.test(formData.password)
    ) {
      errors.password =
        "Password must contain an uppercase letter.";
    } else if (
      !/[a-z]/.test(formData.password)
    ) {
      errors.password =
        "Password must contain a lowercase letter.";
    } else if (
      !/[0-9]/.test(formData.password)
    ) {
      errors.password =
        "Password must contain a number.";
    }

    if (!formData.confirm_password) {
      errors.confirm_password =
        "Please confirm your password.";
    } else if (
      formData.password !==
      formData.confirm_password
    ) {
      errors.confirm_password =
        "Passwords do not match.";
    }

    if (!formData.accept_terms) {
      errors.accept_terms =
        "You must accept the terms and conditions.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    const customerPayload = {
      first_name:
        formData.first_name.trim(),
      last_name:
        formData.last_name.trim(),
      username:
        formData.username.trim(),
      email:
        formData.email.trim().toLowerCase(),
      phone:
        formData.phone.replace(/\s/g, "").trim(),
      password: formData.password,
    };

    try {
      setIsSubmitting(true);

      await createCustomer(customerPayload);

      const registeredUsername =
        formData.username.trim();

      setSuccessMessage(
        "Your account has been created successfully. Redirecting you to sign in..."
      );

      setFormErrors({});

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registrationSuccess: true,
            username: registeredUsername,
          },
        });
      }, 900);
    } catch (error) {
      console.error(
        "Customer registration failed:",
        error
      );

      const backendErrors =
        error.response?.data;

      if (
        backendErrors &&
        typeof backendErrors === "object" &&
        !backendErrors.detail
      ) {
        const convertedErrors = {};

        Object.entries(backendErrors).forEach(
          ([field, messages]) => {
            if (
              field === "non_field_errors"
            ) {
              setErrorMessage(
                Array.isArray(messages)
                  ? messages[0]
                  : String(messages)
              );

              return;
            }

            convertedErrors[field] =
              Array.isArray(messages)
                ? messages[0]
                : String(messages);
          }
        );

        setFormErrors(convertedErrors);
      } else {
        setErrorMessage(
          backendErrors?.detail ||
            "Registration failed. Please check your information and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCustomerLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="customer-registration-page">
      <header className="registration-navbar">
        <Link
          to="/"
          className="registration-brand"
        >
          <div className="registration-brand-logo">
            PBZ
          </div>

          <div>
            <strong>PBZ GIS</strong>
            <span>Branch & ATM Locator</span>
          </div>
        </Link>

        <div className="registration-navbar-actions">
          <span>Already registered?</span>

          <Link to="/login">
            Sign in
          </Link>
        </div>
      </header>

      <main className="registration-layout">
        <section className="registration-visual-section">
          <div className="registration-visual-decoration decoration-a"></div>
          <div className="registration-visual-decoration decoration-b"></div>

          <div className="registration-visual-content">
            <span className="registration-overline">
              CUSTOMER ACCOUNT
            </span>

            <h1>
              Discover PBZ branches and ATM services
              more easily.
            </h1>

            <p>
              Create your PBZ GIS account to access
              branch information, ATM status, services
              and accurate map locations.
            </p>

            <div className="registration-benefits">
              <article>
                <div>01</div>

                <div>
                  <strong>
                    Find nearby branches
                  </strong>

                  <span>
                    Explore PBZ branches using an
                    interactive GIS map.
                  </span>
                </div>
              </article>

              <article>
                <div>02</div>

                <div>
                  <strong>
                    Check ATM availability
                  </strong>

                  <span>
                    Know whether an ATM is available
                    before travelling.
                  </span>
                </div>
              </article>

              <article>
                <div>03</div>

                <div>
                  <strong>
                    View branch services
                  </strong>

                  <span>
                    Confirm available banking services
                    at every branch.
                  </span>
                </div>
              </article>
            </div>

            <div className="registration-map-preview">
              <div className="registration-map-grid"></div>

              <div className="registration-map-route route-one"></div>
              <div className="registration-map-route route-two"></div>

              <span className="registration-map-pin pin-one"></span>
              <span className="registration-map-pin pin-two"></span>
              <span className="registration-map-pin pin-three unavailable"></span>

              <div className="registration-map-info">
                <span>PBZ GIS System</span>
                <strong>
                  Smart branch information
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="registration-form-section">
          <div className="registration-form-container">
            <div className="registration-form-heading">
              <span className="registration-mobile-logo">
                PBZ
              </span>

              <p>GET STARTED</p>

              <h2>Create your account</h2>

              <span>
                Enter your personal information to
                register as a PBZ GIS customer.
              </span>
            </div>

            {successMessage && (
              <div className="registration-alert success">
                <div>✓</div>

                <p>{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="registration-alert error">
                <div>!</div>

                <p>{errorMessage}</p>

                <button
                  type="button"
                  onClick={() =>
                    setErrorMessage("")
                  }
                  aria-label="Close error"
                >
                  ×
                </button>
              </div>
            )}

            <form
              className="registration-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="registration-form-grid">
                <RegistrationInput
                  label="First name"
                  name="first_name"
                  value={formData.first_name}
                  error={formErrors.first_name}
                  onChange={handleInputChange}
                  placeholder="Fatma"
                  autoComplete="given-name"
                />

                <RegistrationInput
                  label="Last name"
                  name="last_name"
                  value={formData.last_name}
                  error={formErrors.last_name}
                  onChange={handleInputChange}
                  placeholder="Suleiman"
                  autoComplete="family-name"
                />

                <RegistrationInput
                  label="Username"
                  name="username"
                  value={formData.username}
                  error={formErrors.username}
                  onChange={handleInputChange}
                  placeholder="fatma_suleiman"
                  autoComplete="username"
                />

                <RegistrationInput
                  label="Phone number"
                  name="phone"
                  value={formData.phone}
                  error={formErrors.phone}
                  onChange={handleInputChange}
                  placeholder="+255712345678"
                  autoComplete="tel"
                />

                <div className="registration-form-group full-width">
                  <label htmlFor="registration-email">
                    Email address
                  </label>

                  <div
                    className={`registration-input-wrapper ${
                      formErrors.email
                        ? "has-error"
                        : ""
                    }`}
                  >
                    <span className="registration-input-icon">
                      @
                    </span>

                    <input
                      type="email"
                      id="registration-email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="fatma@example.com"
                      autoComplete="email"
                    />
                  </div>

                  {formErrors.email && (
                    <small>
                      {formErrors.email}
                    </small>
                  )}
                </div>

                <div className="registration-form-group">
                  <label htmlFor="registration-password">
                    Password
                  </label>

                  <div
                    className={`registration-input-wrapper ${
                      formErrors.password
                        ? "has-error"
                        : ""
                    }`}
                  >
                    <span className="registration-input-icon">
                      ●
                    </span>

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      id="registration-password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="registration-password-toggle"
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

                  {formData.password && (
                    <div className="password-strength">
                      <div className="password-strength-bars">
                        {Array.from({
                          length: 5,
                        }).map((_, index) => (
                          <span
                            key={index}
                            className={
                              index <
                              passwordStrength.score
                                ? passwordStrength.className
                                : ""
                            }
                          ></span>
                        ))}
                      </div>

                      <small
                        className={
                          passwordStrength.className
                        }
                      >
                        {passwordStrength.label}
                      </small>
                    </div>
                  )}

                  {formErrors.password && (
                    <small>
                      {formErrors.password}
                    </small>
                  )}
                </div>

                <div className="registration-form-group">
                  <label htmlFor="registration-confirm-password">
                    Confirm password
                  </label>

                  <div
                    className={`registration-input-wrapper ${
                      formErrors.confirm_password
                        ? "has-error"
                        : ""
                    }`}
                  >
                    <span className="registration-input-icon">
                      ●
                    </span>

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      id="registration-confirm-password"
                      name="confirm_password"
                      value={
                        formData.confirm_password
                      }
                      onChange={handleInputChange}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="registration-password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previousValue) =>
                            !previousValue
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  {formErrors.confirm_password && (
                    <small>
                      {
                        formErrors.confirm_password
                      }
                    </small>
                  )}
                </div>
              </div>

              <div className="registration-password-help">
                <span>Password requirements:</span>

                <div>
                  <PasswordRequirement
                    valid={
                      formData.password.length >= 8
                    }
                    text="At least 8 characters"
                  />

                  <PasswordRequirement
                    valid={/[A-Z]/.test(
                      formData.password
                    )}
                    text="One uppercase letter"
                  />

                  <PasswordRequirement
                    valid={/[a-z]/.test(
                      formData.password
                    )}
                    text="One lowercase letter"
                  />

                  <PasswordRequirement
                    valid={/[0-9]/.test(
                      formData.password
                    )}
                    text="One number"
                  />
                </div>
              </div>

              <div className="registration-terms">
                <label>
                  <input
                    type="checkbox"
                    name="accept_terms"
                    checked={
                      formData.accept_terms
                    }
                    onChange={handleInputChange}
                  />

                  <span className="registration-custom-checkbox">
                    ✓
                  </span>

                  <p>
                    I agree to the{" "}
                    <button type="button">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button type="button">
                      Privacy Policy
                    </button>
                    .
                  </p>
                </label>

                {formErrors.accept_terms && (
                  <small>
                    {formErrors.accept_terms}
                  </small>
                )}
              </div>

              <button
                type="submit"
                className="registration-submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="registration-button-spinner"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Customer Account
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="registration-login-message">
                <span>
                  Already have an account?
                </span>

                <Link to="/">
                  Return to Home
                </Link>
              </div>
            </form>

            <div className="registration-security-message">
              <span>✓</span>

              <p>
                Your information is securely submitted
                to the PBZ GIS system.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function RegistrationInput({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  autoComplete,
}) {
  return (
    <div className="registration-form-group">
      <label htmlFor={`registration-${name}`}>
        {label}
      </label>

      <div
        className={`registration-input-wrapper ${
          error ? "has-error" : ""
        }`}
      >
        <span className="registration-input-icon">
          {name === "phone" ? "TEL" : "ID"}
        </span>

        <input
          type="text"
          id={`registration-${name}`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>

      {error && <small>{error}</small>}
    </div>
  );
}

function PasswordRequirement({
  valid,
  text,
}) {
  return (
    <span className={valid ? "valid" : ""}>
      <strong>{valid ? "✓" : "•"}</strong>
      {text}
    </span>
  );
}

export default CustomerRegistration;