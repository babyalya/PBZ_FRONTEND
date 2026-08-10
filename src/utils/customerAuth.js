export const getCustomerToken = () => {
  return localStorage.getItem(
    "customerToken"
  );
};

export const getLoggedInCustomer = () => {
  const storedCustomer =
    localStorage.getItem("customerData");

  if (!storedCustomer) {
    return null;
  }

  try {
    return JSON.parse(storedCustomer);
  } catch {
    localStorage.removeItem(
      "customerData"
    );

    return null;
  }
};

export const isCustomerLoggedIn = () => {
  return Boolean(getCustomerToken());
};

export const clearCustomerSession = () => {
  localStorage.removeItem(
    "customerToken"
  );

  localStorage.removeItem(
    "customerData"
  );

  localStorage.removeItem(
    "rememberCustomer"
  );
};