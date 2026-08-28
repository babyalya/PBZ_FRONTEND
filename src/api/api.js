
import axios from "axios";
import { clearCustomerSession, getCustomerToken } from "../utils/customerSession";

const API_BASE_URL =
import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
baseURL: API_BASE_URL,
headers: {
"Content-Type": "application/json",
Accept: "application/json",
},
withCredentials: true,
timeout: 15000,
});

/*
--------------------------------------------------------------------------
Authentication helpers
--------------------------------------------------------------------------
*/

api.interceptors.request.use(
(config) => {
const token = getCustomerToken();

if (token) {
  config.headers.Authorization = `Token ${token}`;
}

return config;

},
(error) => Promise.reject(error)
);

api.interceptors.response.use(
(response) => response,
(error) => {
const status = error.response?.status;
const requestUrl = error.config?.url || "";

const isAuthenticationRequest =
  requestUrl.includes("/customer/login/");

if (status === 401 && !isAuthenticationRequest) {
  clearCustomerSession();
}

return Promise.reject(error);

}
);

/*
--------------------------------------------------------------------------
Customer authentication
--------------------------------------------------------------------------
*/

export const customerLogin = (credentials) =>
api.post("/customer/login/", credentials);

export const customerLogout = () =>
api.post("/customer/logout/");

/*
--------------------------------------------------------------------------
Branch endpoints
--------------------------------------------------------------------------
*/

export const getBranches = () =>
api.get("/branches/");

export const getBranchById = (id) =>
api.get(`/branches/${id}/`);

export const createBranch = (branchData) =>
api.post("/branches/", branchData);

export const updateBranch = (id, branchData) =>
api.put(`/branches/${id}/`, branchData);

export const patchBranch = (id, branchData) =>
api.patch(`/branches/${id}/`, branchData);

export const deleteBranch = (id) =>
api.delete(`/branches/${id}/`);

/*
--------------------------------------------------------------------------
Category endpoints
--------------------------------------------------------------------------
*/

export const getCategories = () =>
api.get("/categories/");

export const getCategoryById = (id) =>
api.get(`/categories/${id}/`);

export const createCategory = (categoryData) =>
api.post("/categories/", categoryData);

export const updateCategory = (id, categoryData) =>
api.put(`/categories/${id}/`, categoryData);

export const patchCategory = (id, categoryData) =>
api.patch(`/categories/${id}/`, categoryData);

export const deleteCategory = (id) =>
api.delete(`/categories/${id}/`);

/*
--------------------------------------------------------------------------
Service endpoints
--------------------------------------------------------------------------
*/

export const getServices = () =>
api.get("/services/");

export const getServiceById = (id) =>
api.get(`/services/${id}/`);

export const createService = (serviceData) =>
api.post("/services/", serviceData);

export const updateService = (id, serviceData) =>
api.put(`/services/${id}/`, serviceData);

export const patchService = (id, serviceData) =>
api.patch(`/services/${id}/`, serviceData);

export const deleteService = (id) =>
api.delete(`/services/${id}/`);

/*
--------------------------------------------------------------------------
Customer endpoints
--------------------------------------------------------------------------
*/

export const getCustomers = () =>
api.get("/customers/");

export const getCustomerById = (id) =>
api.get(`/customers/${id}/`);

export const createCustomer = (customerData) =>
api.post("/customers/", customerData);

export const updateCustomer = (id, customerData) =>
api.put(`/customers/${id}/`, customerData);

export const patchCustomer = (
id,
customerData
) => {
return api.patch(
`/customers/${id}/`,
customerData
);
};

export const deleteCustomer = (id) =>
api.delete(`/customers/${id}/`);

export default api;

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

export const adminLogin = (
  credentials
) => {
  return api.post(
    "/admin/login/",
    credentials
  );
};


/*
|--------------------------------------------------------------------------
| Standalone ATM endpoints
|--------------------------------------------------------------------------
*/

export const getATMs = () => {
  return api.get("/atms/");
};

export const getATMById = (id) => {
  return api.get(`/atms/${id}/`);
};

export const createATM = (atmData) => {
  return api.post("/atms/", atmData);
};

export const updateATM = (id, atmData) => {
  return api.put(`/atms/${id}/`, atmData);
};

export const patchATM = (id, atmData) => {
  return api.patch(`/atms/${id}/`, atmData);
};

export const deleteATM = (id) => {
  return api.delete(`/atms/${id}/`);
};