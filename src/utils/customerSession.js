const TOKEN_KEY = "customerToken";
const CUSTOMER_KEY = "customerData";
const REMEMBER_KEY = "rememberCustomer";

const safeParse = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getCustomerToken = () => {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY)
  );
};

export const getLoggedInCustomer = () => {
  const localCustomer = safeParse(
    localStorage.getItem(CUSTOMER_KEY)
  );

  if (localCustomer) {
    return localCustomer;
  }

  const sessionCustomer = safeParse(
    sessionStorage.getItem(CUSTOMER_KEY)
  );

  if (sessionCustomer) {
    return sessionCustomer;
  }

  localStorage.removeItem(CUSTOMER_KEY);
  sessionStorage.removeItem(CUSTOMER_KEY);

  return null;
};

export const isCustomerLoggedIn = () => {
  return Boolean(
    getCustomerToken() && getLoggedInCustomer()
  );
};

export const saveCustomerSession = (
  token,
  customer,
  remember = false
) => {
  clearCustomerSession();

  const storage = remember
    ? localStorage
    : sessionStorage;

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(
    CUSTOMER_KEY,
    JSON.stringify(customer)
  );

  if (remember) {
    localStorage.setItem(REMEMBER_KEY, "true");
  }
};

export const clearCustomerSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
  localStorage.removeItem(REMEMBER_KEY);

  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(CUSTOMER_KEY);
};

export const wasCustomerRemembered = () => {
  return localStorage.getItem(REMEMBER_KEY) === "true";
};
