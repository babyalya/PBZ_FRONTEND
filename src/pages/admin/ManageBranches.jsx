// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";

// import {
//   createBranch,
//   deleteBranch,
//   getBranches,
//   getCategories,
//   updateBranch,
// } from "../../api/api";

// import "./ManageBranches.css";

// const initialFormData = {
//   branch_name: "",
//   address: "",
//   latitude: "",
//   longitude: "",
//   phone: "",
//   opening_hours: "",
//   atm_status: true,
//   category: "",
// };

// function ManageBranches() {
//   const [branches, setBranches] = useState([]);
//   const [categories, setCategories] = useState([]);

//   const [formData, setFormData] = useState(initialFormData);
//   const [formErrors, setFormErrors] = useState({});

//   const [searchTerm, setSearchTerm] = useState("");
//   const [atmFilter, setAtmFilter] = useState("all");

//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState(null);

//   const [editingBranchId, setEditingBranchId] = useState(null);
//   const [branchToDelete, setBranchToDelete] = useState(null);

//   const [showFormModal, setShowFormModal] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);

//   const [errorMessage, setErrorMessage] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const loadBranchesAndCategories = async () => {
//     try {
//       setIsLoading(true);
//       setErrorMessage("");

//       const [branchesResponse, categoriesResponse] =
//         await Promise.all([
//           getBranches(),
//           getCategories(),
//         ]);

//       setBranches(branchesResponse.data);
//       setCategories(categoriesResponse.data);
//     } catch (error) {
//       console.error("Failed to load branches:", error);

//       setErrorMessage(
//         error.response?.data?.detail ||
//           "Failed to load branch information."
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadBranchesAndCategories();
//   }, []);

//   const filteredBranches = useMemo(() => {
//     const normalizedSearch = searchTerm
//       .trim()
//       .toLowerCase();

//     return branches.filter((branch) => {
//       const matchesSearch =
//         !normalizedSearch ||
//         branch.branch_name
//           ?.toLowerCase()
//           .includes(normalizedSearch) ||
//         branch.address
//           ?.toLowerCase()
//           .includes(normalizedSearch) ||
//         branch.phone
//           ?.toLowerCase()
//           .includes(normalizedSearch);

//       const matchesAtmStatus =
//         atmFilter === "all" ||
//         (atmFilter === "available" &&
//           branch.atm_status === true) ||
//         (atmFilter === "unavailable" &&
//           branch.atm_status === false);

//       return matchesSearch && matchesAtmStatus;
//     });
//   }, [branches, searchTerm, atmFilter]);

//   const getCategoryName = (categoryId) => {
//     const category = categories.find(
//       (item) =>
//         Number(item.id) === Number(categoryId)
//     );

//     return category
//       ? category.category_name
//       : "Not assigned";
//   };

//   const resetMessages = () => {
//     setErrorMessage("");
//     setSuccessMessage("");
//   };

//   const openAddModal = () => {
//     resetMessages();
//     setEditingBranchId(null);
//     setFormData(initialFormData);
//     setFormErrors({});
//     setShowFormModal(true);
//   };

//   const openEditModal = (branch) => {
//     resetMessages();

//     setEditingBranchId(branch.id);

//     setFormData({
//       branch_name: branch.branch_name || "",
//       address: branch.address || "",
//       latitude: branch.latitude || "",
//       longitude: branch.longitude || "",
//       phone: branch.phone || "",
//       opening_hours: branch.opening_hours || "",
//       atm_status: Boolean(branch.atm_status),
//       category: branch.category || "",
//     });

//     setFormErrors({});
//     setShowFormModal(true);
//   };

//   const closeFormModal = () => {
//     if (isSaving) return;

//     setShowFormModal(false);
//     setEditingBranchId(null);
//     setFormData(initialFormData);
//     setFormErrors({});
//   };

//   const openDeleteModal = (branch) => {
//     resetMessages();
//     setBranchToDelete(branch);
//     setShowDeleteModal(true);
//   };

//   const closeDeleteModal = () => {
//     if (deletingId) return;

//     setShowDeleteModal(false);
//     setBranchToDelete(null);
//   };

//   const handleInputChange = (event) => {
//     const { name, value, type, checked } =
//       event.target;

//     setFormData((previousData) => ({
//       ...previousData,
//       [name]:
//         type === "checkbox" ? checked : value,
//     }));

//     setFormErrors((previousErrors) => ({
//       ...previousErrors,
//       [name]: "",
//     }));
//   };

//   const validateForm = () => {
//     const errors = {};

//     if (!formData.branch_name.trim()) {
//       errors.branch_name =
//         "Branch name is required.";
//     }

//     if (!formData.address.trim()) {
//       errors.address = "Address is required.";
//     }

//     if (!formData.latitude.trim()) {
//       errors.latitude = "Latitude is required.";
//     } else {
//       const latitude = Number(formData.latitude);

//       if (
//         Number.isNaN(latitude) ||
//         latitude < -90 ||
//         latitude > 90
//       ) {
//         errors.latitude =
//           "Enter a valid latitude between -90 and 90.";
//       }
//     }

//     if (!formData.longitude.trim()) {
//       errors.longitude =
//         "Longitude is required.";
//     } else {
//       const longitude = Number(
//         formData.longitude
//       );

//       if (
//         Number.isNaN(longitude) ||
//         longitude < -180 ||
//         longitude > 180
//       ) {
//         errors.longitude =
//           "Enter a valid longitude between -180 and 180.";
//       }
//     }

//     if (!formData.phone.trim()) {
//       errors.phone = "Phone number is required.";
//     }

//     if (!formData.opening_hours.trim()) {
//       errors.opening_hours =
//         "Opening hours are required.";
//     }

//     if (!formData.category) {
//       errors.category =
//         "Please select a category.";
//     }

//     setFormErrors(errors);

//     return Object.keys(errors).length === 0;
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     resetMessages();

//     if (!validateForm()) {
//       return;
//     }

//     const branchPayload = {
//       branch_name: formData.branch_name.trim(),
//       address: formData.address.trim(),
//       latitude: formData.latitude.trim(),
//       longitude: formData.longitude.trim(),
//       phone: formData.phone.trim(),
//       opening_hours:
//         formData.opening_hours.trim(),
//       atm_status: formData.atm_status,
//       category: Number(formData.category),
//     };

//     try {
//       setIsSaving(true);

//       if (editingBranchId) {
//         const response = await updateBranch(
//           editingBranchId,
//           branchPayload
//         );

//         setBranches((previousBranches) =>
//           previousBranches.map((branch) =>
//             branch.id === editingBranchId
//               ? response.data
//               : branch
//           )
//         );

//         setSuccessMessage(
//           "Branch updated successfully."
//         );
//       } else {
//         const response =
//           await createBranch(branchPayload);

//         setBranches((previousBranches) => [
//           response.data,
//           ...previousBranches,
//         ]);

//         setSuccessMessage(
//           "Branch added successfully."
//         );
//       }

//       closeFormModal();
//     } catch (error) {
//       console.error("Failed to save branch:", error);

//       const backendErrors = error.response?.data;

//       if (
//         backendErrors &&
//         typeof backendErrors === "object" &&
//         !backendErrors.detail
//       ) {
//         const convertedErrors = {};

//         Object.entries(backendErrors).forEach(
//           ([field, messages]) => {
//             convertedErrors[field] =
//               Array.isArray(messages)
//                 ? messages[0]
//                 : String(messages);
//           }
//         );

//         setFormErrors(convertedErrors);
//       } else {
//         setErrorMessage(
//           backendErrors?.detail ||
//             "Failed to save branch. Please try again."
//         );
//       }
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!branchToDelete) return;

//     try {
//       setDeletingId(branchToDelete.id);
//       setErrorMessage("");

//       await deleteBranch(branchToDelete.id);

//       setBranches((previousBranches) =>
//         previousBranches.filter(
//           (branch) =>
//             branch.id !== branchToDelete.id
//         )
//       );

//       setSuccessMessage(
//         "Branch deleted successfully."
//       );

//       setShowDeleteModal(false);
//       setBranchToDelete(null);
//     } catch (error) {
//       console.error("Failed to delete branch:", error);

//       setErrorMessage(
//         error.response?.data?.detail ||
//           "Failed to delete branch."
//       );
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   return (
//     <div className="manage-branches-page">
//       <aside className="branches-sidebar">
//         <div className="branches-sidebar-brand">
//           <div className="branches-brand-logo">
//             PBZ
//           </div>

//           <div>
//             <h1>PBZ GIS</h1>
//             <p>Administration</p>
//           </div>
//         </div>

//         <nav className="branches-navigation">
//           <p className="branches-navigation-title">
//             MAIN MENU
//           </p>

//           <Link
//             to="/admin/dashboard"
//             className="branches-nav-link"
//           >
//             <span>DB</span>
//             Dashboard
//           </Link>

//           <Link
//             to="/admin/branches"
//             className="branches-nav-link active"
//           >
//             <span>BR</span>
//             Branches
//           </Link>

//           <Link
//             to="/admin/categories"
//             className="branches-nav-link"
//           >
//             <span>CT</span>
//             Categories
//           </Link>

//           <Link
//             to="/admin/services"
//             className="branches-nav-link"
//           >
//             <span>SV</span>
//             Services
//           </Link>

//           <Link
//             to="/admin/customers"
//             className="branches-nav-link"
//           >
//             <span>CU</span>
//             Customers
//           </Link>
//         </nav>
//       </aside>

//       <main className="branches-main">
//         <header className="branches-header">
//           <div>
//             <p className="branches-overline">
//               BRANCH MANAGEMENT
//             </p>

//             <h2>Manage Branches</h2>

//             <p>
//               Add, update and manage PBZ branch
//               information.
//             </p>
//           </div>

//           <button
//             type="button"
//             className="add-branch-button"
//             onClick={openAddModal}
//           >
//             <span>+</span>
//             Add Branch
//           </button>
//         </header>

//         {successMessage && (
//           <div
//             className="branches-alert success-alert"
//             role="status"
//           >
//             <span>✓</span>
//             <p>{successMessage}</p>

//             <button
//               type="button"
//               onClick={() => setSuccessMessage("")}
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {errorMessage && (
//           <div
//             className="branches-alert error-alert"
//             role="alert"
//           >
//             <span>!</span>
//             <p>{errorMessage}</p>

//             <button
//               type="button"
//               onClick={() => setErrorMessage("")}
//             >
//               ×
//             </button>
//           </div>
//         )}

//         <section className="branches-summary">
//           <article>
//             <span>Total Branches</span>
//             <strong>{branches.length}</strong>
//           </article>

//           <article>
//             <span>ATM Available</span>
//             <strong>
//               {
//                 branches.filter(
//                   (branch) => branch.atm_status
//                 ).length
//               }
//             </strong>
//           </article>

//           <article>
//             <span>ATM Unavailable</span>
//             <strong>
//               {
//                 branches.filter(
//                   (branch) => !branch.atm_status
//                 ).length
//               }
//             </strong>
//           </article>

//           <article>
//             <span>Categories Used</span>
//             <strong>
//               {
//                 new Set(
//                   branches.map(
//                     (branch) => branch.category
//                   )
//                 ).size
//               }
//             </strong>
//           </article>
//         </section>

//         <section className="branches-content-card">
//           <div className="branches-toolbar">
//             <div className="branches-search-box">
//               <span>⌕</span>

//               <input
//                 type="search"
//                 value={searchTerm}
//                 onChange={(event) =>
//                   setSearchTerm(event.target.value)
//                 }
//                 placeholder="Search branch, address or phone..."
//               />
//             </div>

//             <select
//               value={atmFilter}
//               onChange={(event) =>
//                 setAtmFilter(event.target.value)
//               }
//               className="atm-filter"
//             >
//               <option value="all">
//                 All ATM statuses
//               </option>

//               <option value="available">
//                 ATM available
//               </option>

//               <option value="unavailable">
//                 ATM unavailable
//               </option>
//             </select>

//             <button
//               type="button"
//               className="refresh-branches-button"
//               onClick={loadBranchesAndCategories}
//               disabled={isLoading}
//             >
//               {isLoading ? "Loading..." : "Refresh"}
//             </button>
//           </div>

//           <div className="branches-table-wrapper">
//             {isLoading ? (
//               <div className="branches-loading-state">
//                 <div className="branches-spinner"></div>
//                 <p>Loading branches...</p>
//               </div>
//             ) : filteredBranches.length === 0 ? (
//               <div className="branches-empty-state">
//                 <div>BR</div>

//                 <h3>No branches found</h3>

//                 <p>
//                   No branches match your current
//                   search or filter.
//                 </p>

//                 <button
//                   type="button"
//                   onClick={openAddModal}
//                 >
//                   Add first branch
//                 </button>
//               </div>
//             ) : (
//               <table className="manage-branches-table">
//                 <thead>
//                   <tr>
//                     <th>Branch</th>
//                     <th>Category</th>
//                     <th>Contact</th>
//                     <th>Coordinates</th>
//                     <th>ATM Status</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {filteredBranches.map((branch) => (
//                     <tr key={branch.id}>
//                       <td>
//                         <div className="branch-information">
//                           <div className="branch-avatar">
//                             {branch.branch_name
//                               ?.substring(0, 2)
//                               .toUpperCase()}
//                           </div>

//                           <div>
//                             <strong>
//                               {branch.branch_name}
//                             </strong>

//                             <span>
//                               {branch.address}
//                             </span>

//                             <small>
//                               {branch.opening_hours}
//                             </small>
//                           </div>
//                         </div>
//                       </td>

//                       <td>
//                         <span className="branch-category-badge">
//                           {getCategoryName(
//                             branch.category
//                           )}
//                         </span>
//                       </td>

//                       <td>
//                         <span className="branch-phone">
//                           {branch.phone}
//                         </span>
//                       </td>

//                       <td>
//                         <div className="branch-coordinates">
//                           <span>
//                             Lat: {branch.latitude}
//                           </span>

//                           <span>
//                             Lng: {branch.longitude}
//                           </span>
//                         </div>
//                       </td>

//                       <td>
//                         <span
//                           className={
//                             branch.atm_status
//                               ? "branch-atm-status available"
//                               : "branch-atm-status unavailable"
//                           }
//                         >
//                           <span></span>

//                           {branch.atm_status
//                             ? "Available"
//                             : "Unavailable"}
//                         </span>
//                       </td>

//                       <td>
//                         <div className="branch-actions">
//                           <button
//                             type="button"
//                             className="edit-branch-button"
//                             onClick={() =>
//                               openEditModal(branch)
//                             }
//                           >
//                             Edit
//                           </button>

//                           <button
//                             type="button"
//                             className="delete-branch-button"
//                             onClick={() =>
//                               openDeleteModal(branch)
//                             }
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>

//           {!isLoading &&
//             filteredBranches.length > 0 && (
//               <div className="branches-table-footer">
//                 Showing {filteredBranches.length} of{" "}
//                 {branches.length} branches
//               </div>
//             )}
//         </section>
//       </main>

//       {showFormModal && (
//         <div
//           className="branch-modal-overlay"
//           onMouseDown={closeFormModal}
//         >
//           <section
//             className="branch-form-modal"
//             onMouseDown={(event) =>
//               event.stopPropagation()
//             }
//           >
//             <div className="branch-modal-header">
//               <div>
//                 <p>
//                   {editingBranchId
//                     ? "UPDATE BRANCH"
//                     : "NEW BRANCH"}
//                 </p>

//                 <h2>
//                   {editingBranchId
//                     ? "Edit Branch"
//                     : "Add Branch"}
//                 </h2>
//               </div>

//               <button
//                 type="button"
//                 onClick={closeFormModal}
//                 disabled={isSaving}
//                 aria-label="Close form"
//               >
//                 ×
//               </button>
//             </div>

//             <form
//               className="branch-form"
//               onSubmit={handleSubmit}
//               noValidate
//             >
//               <div className="branch-form-grid">
//                 <div className="branch-form-group full-width">
//                   <label htmlFor="branch_name">
//                     Branch name
//                   </label>

//                   <input
//                     type="text"
//                     id="branch_name"
//                     name="branch_name"
//                     value={formData.branch_name}
//                     onChange={handleInputChange}
//                     placeholder="Example: PBZ Mwanakwerekwe"
//                     className={
//                       formErrors.branch_name
//                         ? "field-has-error"
//                         : ""
//                     }
//                   />

//                   {formErrors.branch_name && (
//                     <small>
//                       {formErrors.branch_name}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group full-width">
//                   <label htmlFor="address">
//                     Address
//                   </label>

//                   <input
//                     type="text"
//                     id="address"
//                     name="address"
//                     value={formData.address}
//                     onChange={handleInputChange}
//                     placeholder="Enter branch address"
//                     className={
//                       formErrors.address
//                         ? "field-has-error"
//                         : ""
//                     }
//                   />

//                   {formErrors.address && (
//                     <small>
//                       {formErrors.address}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group">
//                   <label htmlFor="latitude">
//                     Latitude
//                   </label>

//                   <input
//                     type="number"
//                     step="any"
//                     id="latitude"
//                     name="latitude"
//                     value={formData.latitude}
//                     onChange={handleInputChange}
//                     placeholder="-6.16500000"
//                     className={
//                       formErrors.latitude
//                         ? "field-has-error"
//                         : ""
//                     }
//                   />

//                   {formErrors.latitude && (
//                     <small>
//                       {formErrors.latitude}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group">
//                   <label htmlFor="longitude">
//                     Longitude
//                   </label>

//                   <input
//                     type="number"
//                     step="any"
//                     id="longitude"
//                     name="longitude"
//                     value={formData.longitude}
//                     onChange={handleInputChange}
//                     placeholder="39.20200000"
//                     className={
//                       formErrors.longitude
//                         ? "field-has-error"
//                         : ""
//                     }
//                   />

//                   {formErrors.longitude && (
//                     <small>
//                       {formErrors.longitude}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group">
//                   <label htmlFor="phone">
//                     Phone number
//                   </label>

//                   <input
//                     type="text"
//                     id="phone"
//                     name="phone"
//                     value={formData.phone}
//                     onChange={handleInputChange}
//                     placeholder="+255 24 223 0000"
//                     className={
//                       formErrors.phone
//                         ? "field-has-error"
//                         : ""
//                     }
//                   />

//                   {formErrors.phone && (
//                     <small>
//                       {formErrors.phone}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group">
//                   <label htmlFor="category">
//                     Category
//                   </label>

//                   <select
//                     id="category"
//                     name="category"
//                     value={formData.category}
//                     onChange={handleInputChange}
//                     className={
//                       formErrors.category
//                         ? "field-has-error"
//                         : ""
//                     }
//                   >
//                     <option value="">
//                       Select category
//                     </option>

//                     {categories.map((category) => (
//                       <option
//                         key={category.id}
//                         value={category.id}
//                       >
//                         {category.category_name}
//                       </option>
//                     ))}
//                   </select>

//                   {formErrors.category && (
//                     <small>
//                       {formErrors.category}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group full-width">
//                   <label htmlFor="opening_hours">
//                     Opening hours
//                   </label>

//                   <input
//                     type="text"
//                     id="opening_hours"
//                     name="opening_hours"
//                     value={formData.opening_hours}
//                     onChange={handleInputChange}
//                     placeholder="Monday - Friday, 8:00 AM - 4:00 PM"
//                     className={
//                       formErrors.opening_hours
//                         ? "field-has-error"
//                         : ""
//                     }
//                   />

//                   {formErrors.opening_hours && (
//                     <small>
//                       {formErrors.opening_hours}
//                     </small>
//                   )}
//                 </div>

//                 <div className="branch-form-group full-width">
//                   <label className="atm-checkbox">
//                     <input
//                       type="checkbox"
//                       name="atm_status"
//                       checked={formData.atm_status}
//                       onChange={handleInputChange}
//                     />

//                     <span className="atm-checkbox-control"></span>

//                     <span>
//                       <strong>ATM available</strong>
//                       <small>
//                         Mark this when the branch ATM
//                         is currently available.
//                       </small>
//                     </span>
//                   </label>
//                 </div>
//               </div>

//               <div className="branch-form-actions">
//                 <button
//                   type="button"
//                   className="cancel-branch-form"
//                   onClick={closeFormModal}
//                   disabled={isSaving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="save-branch-button"
//                   disabled={isSaving}
//                 >
//                   {isSaving
//                     ? "Saving..."
//                     : editingBranchId
//                       ? "Update Branch"
//                       : "Add Branch"}
//                 </button>
//               </div>
//             </form>
//           </section>
//         </div>
//       )}

//       {showDeleteModal && branchToDelete && (
//         <div
//           className="branch-modal-overlay"
//           onMouseDown={closeDeleteModal}
//         >
//           <section
//             className="delete-confirmation-modal"
//             onMouseDown={(event) =>
//               event.stopPropagation()
//             }
//           >
//             <div className="delete-warning-icon">
//               !
//             </div>

//             <h2>Delete branch?</h2>

//             <p>
//               You are about to delete{" "}
//               <strong>
//                 {branchToDelete.branch_name}
//               </strong>
//               . This action cannot be undone.
//             </p>

//             <div className="delete-confirmation-actions">
//               <button
//                 type="button"
//                 onClick={closeDeleteModal}
//                 disabled={Boolean(deletingId)}
//               >
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={handleDelete}
//                 disabled={Boolean(deletingId)}
//               >
//                 {deletingId
//                   ? "Deleting..."
//                   : "Delete Branch"}
//               </button>
//             </div>
//           </section>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ManageBranches;

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminNavbar from "../../components/AdminNavbar";

import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  createBranch,
  deleteBranch,
  getBranches,
  getCategories,
  updateBranch,
} from "../../api/api";

import "leaflet/dist/leaflet.css";
import "./ManageBranches.css";


const DEFAULT_MAP_CENTER = [
  -6.1659,
  39.2026,
];

const DEFAULT_MAP_ZOOM = 12;


const initialFormData = {
  branch_name: "",
  address: "",
  latitude: "",
  longitude: "",
  phone: "",
  opening_hours: "",
  atm_status: true,
  category: "",

  /*
   * Frontend-only field.
   * It is NOT sent to Django.
   */
  location_mode: "map",
};


function ManageBranches() {
  const [branches, setBranches] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [formData, setFormData] =
    useState(initialFormData);

  const [formErrors, setFormErrors] =
    useState({});

  const [searchTerm, setSearchTerm] =
    useState("");

  const [atmFilter, setAtmFilter] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [
    editingBranchId,
    setEditingBranchId,
  ] = useState(null);

  const [
    branchToDelete,
    setBranchToDelete,
  ] = useState(null);

  const [
    showFormModal,
    setShowFormModal,
  ] = useState(false);

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    isDetectingAddress,
    setIsDetectingAddress,
  ] = useState(false);

  const [
    locationMessage,
    setLocationMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  const loadBranchesAndCategories =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          branchesResponse,
          categoriesResponse,
        ] = await Promise.all([
          getBranches(),
          getCategories(),
        ]);

        setBranches(
          Array.isArray(
            branchesResponse.data
          )
            ? branchesResponse.data
            : []
        );

        setCategories(
          Array.isArray(
            categoriesResponse.data
          )
            ? categoriesResponse.data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load branches:",
          error
        );

        setErrorMessage(
          error.response?.data?.detail ||
            "Failed to load branch information."
        );
      } finally {
        setIsLoading(false);
      }
    };


  useEffect(() => {
    loadBranchesAndCategories();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | FILTERING
  |--------------------------------------------------------------------------
  */

  const filteredBranches = useMemo(
    () => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return branches.filter(
        (branch) => {
          const matchesSearch =
            !normalizedSearch ||
            branch.branch_name
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            branch.address
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            branch.phone
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesAtmStatus =
            atmFilter === "all" ||
            (atmFilter ===
              "available" &&
              branch.atm_status ===
                true) ||
            (atmFilter ===
              "unavailable" &&
              branch.atm_status ===
                false);

          return (
            matchesSearch &&
            matchesAtmStatus
          );
        }
      );
    },
    [
      branches,
      searchTerm,
      atmFilter,
    ]
  );


  const getCategoryName = (
    categoryId
  ) => {
    const category =
      categories.find(
        (item) =>
          Number(item.id) ===
          Number(categoryId)
      );

    return category
      ? category.category_name
      : "Not assigned";
  };


  /*
  |--------------------------------------------------------------------------
  | MESSAGES
  |--------------------------------------------------------------------------
  */

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLocationMessage("");
  };


  /*
  |--------------------------------------------------------------------------
  | ADD / EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const openAddModal = () => {
    resetMessages();

    setEditingBranchId(null);

    setFormData({
      ...initialFormData,
      location_mode: "map",
    });

    setFormErrors({});

    setIsDetectingAddress(false);

    setShowFormModal(true);
  };


  const openEditModal = (
    branch
  ) => {
    resetMessages();

    setEditingBranchId(
      branch.id
    );

    setFormData({
      branch_name:
        branch.branch_name || "",

      address:
        branch.address || "",

      latitude:
        branch.latitude || "",

      longitude:
        branch.longitude || "",

      phone:
        branch.phone || "",

      opening_hours:
        branch.opening_hours || "",

      atm_status:
        Boolean(
          branch.atm_status
        ),

      category:
        branch.category || "",

      /*
       * When editing we initially
       * display manual mode so the
       * existing values remain obvious.
       *
       * Admin can still switch to map.
       */
      location_mode: "manual",
    });

    setFormErrors({});

    setIsDetectingAddress(false);

    setShowFormModal(true);
  };


  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setShowFormModal(false);

    setEditingBranchId(null);

    setFormData(
      initialFormData
    );

    setFormErrors({});

    setLocationMessage("");

    setIsDetectingAddress(false);
  };


  /*
  |--------------------------------------------------------------------------
  | DELETE MODAL
  |--------------------------------------------------------------------------
  */

  const openDeleteModal = (
    branch
  ) => {
    resetMessages();

    setBranchToDelete(
      branch
    );

    setShowDeleteModal(true);
  };


  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setShowDeleteModal(false);

    setBranchToDelete(null);
  };


  /*
  |--------------------------------------------------------------------------
  | INPUTS
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );

    setFormErrors(
      (previousErrors) => ({
        ...previousErrors,

        [name]: "",
      })
    );
  };


  /*
  |--------------------------------------------------------------------------
  | LOCATION MODE
  |--------------------------------------------------------------------------
  */

  const changeLocationMode = (
    mode
  ) => {
    setFormData(
      (previousData) => ({
        ...previousData,

        location_mode:
          mode,
      })
    );

    setLocationMessage("");

    setFormErrors(
      (previousErrors) => ({
        ...previousErrors,

        address: "",
        latitude: "",
        longitude: "",
      })
    );
  };


  /*
  |--------------------------------------------------------------------------
  | MAP LOCATION
  |--------------------------------------------------------------------------
  */

  const handleMapLocationSelected =
    async (
      latitude,
      longitude
    ) => {
      const formattedLatitude =
        Number(latitude).toFixed(8);

      const formattedLongitude =
        Number(longitude).toFixed(8);

      /*
       * Immediately save coordinates
       * into the form.
       */
      setFormData(
        (previousData) => ({
          ...previousData,

          latitude:
            formattedLatitude,

          longitude:
            formattedLongitude,
        })
      );

      setFormErrors(
        (previousErrors) => ({
          ...previousErrors,

          latitude: "",
          longitude: "",
        })
      );

      setLocationMessage(
        "Location selected. Detecting address..."
      );

      /*
       * Reverse geocode the point.
       *
       * If address detection fails,
       * admin can still manually type
       * the address without losing
       * coordinates.
       */
      try {
        setIsDetectingAddress(
          true
        );

        const url =
          `https://nominatim.openstreetmap.org/reverse` +
          `?format=jsonv2` +
          `&lat=${encodeURIComponent(
            formattedLatitude
          )}` +
          `&lon=${encodeURIComponent(
            formattedLongitude
          )}`;

        const response =
          await fetch(url, {
            headers: {
              Accept:
                "application/json",
            },
          });

        if (!response.ok) {
          throw new Error(
            "Address lookup failed."
          );
        }

        const data =
          await response.json();

        if (
          data?.display_name
        ) {
          setFormData(
            (previousData) => ({
              ...previousData,

              address:
                data.display_name,
            })
          );

          setFormErrors(
            (
              previousErrors
            ) => ({
              ...previousErrors,

              address: "",
            })
          );

          setLocationMessage(
            "Location and address detected successfully."
          );
        } else {
          setLocationMessage(
            "Coordinates selected. Please type the branch address below."
          );
        }
      } catch (error) {
        console.error(
          "Reverse geocoding failed:",
          error
        );

        setLocationMessage(
          "Coordinates selected. Address could not be detected automatically, so please enter it manually."
        );
      } finally {
        setIsDetectingAddress(
          false
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const errors = {};


    if (
      !formData.branch_name.trim()
    ) {
      errors.branch_name =
        "Branch name is required.";
    }


    if (
      !formData.address.trim()
    ) {
      errors.address =
        "Address is required.";
    }


    if (
      !String(
        formData.latitude
      ).trim()
    ) {
      errors.latitude =
        formData.location_mode ===
        "map"
          ? "Please select the branch location from the map."
          : "Latitude is required.";
    } else {
      const latitude =
        Number(
          formData.latitude
        );

      if (
        Number.isNaN(
          latitude
        ) ||
        latitude < -90 ||
        latitude > 90
      ) {
        errors.latitude =
          "Enter a valid latitude between -90 and 90.";
      }
    }


    if (
      !String(
        formData.longitude
      ).trim()
    ) {
      errors.longitude =
        formData.location_mode ===
        "map"
          ? "Please select the branch location from the map."
          : "Longitude is required.";
    } else {
      const longitude =
        Number(
          formData.longitude
        );

      if (
        Number.isNaN(
          longitude
        ) ||
        longitude < -180 ||
        longitude > 180
      ) {
        errors.longitude =
          "Enter a valid longitude between -180 and 180.";
      }
    }


    if (
      !formData.phone.trim()
    ) {
      errors.phone =
        "Phone number is required.";
    }


    if (
      !formData.opening_hours.trim()
    ) {
      errors.opening_hours =
        "Opening hours are required.";
    }


    if (
      !formData.category
    ) {
      errors.category =
        "Please select a category.";
    }


    setFormErrors(
      errors
    );

    return (
      Object.keys(errors).length ===
      0
    );
  };


  /*
  |--------------------------------------------------------------------------
  | SAVE BRANCH
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    resetMessages();


    if (!validateForm()) {
      return;
    }


    /*
     * IMPORTANT:
     *
     * location_mode is NOT sent
     * to Django.
     *
     * Backend still receives exactly
     * the same fields it received
     * before this map feature.
     */
    const branchPayload = {
      branch_name:
        formData.branch_name.trim(),

      address:
        formData.address.trim(),

      latitude:
        String(
          formData.latitude
        ).trim(),

      longitude:
        String(
          formData.longitude
        ).trim(),

      phone:
        formData.phone.trim(),

      opening_hours:
        formData.opening_hours.trim(),

      atm_status:
        formData.atm_status,

      category:
        Number(
          formData.category
        ),
    };


    try {
      setIsSaving(true);


      if (
        editingBranchId
      ) {
        const response =
          await updateBranch(
            editingBranchId,
            branchPayload
          );

        setBranches(
          (
            previousBranches
          ) =>
            previousBranches.map(
              (branch) =>
                branch.id ===
                editingBranchId
                  ? response.data
                  : branch
            )
        );

        setSuccessMessage(
          "Branch updated successfully."
        );
      } else {
        const response =
          await createBranch(
            branchPayload
          );

        setBranches(
          (
            previousBranches
          ) => [
            response.data,
            ...previousBranches,
          ]
        );

        setSuccessMessage(
          "Branch added successfully."
        );
      }


      setShowFormModal(
        false
      );

      setEditingBranchId(
        null
      );

      setFormData(
        initialFormData
      );

      setFormErrors({});

      setLocationMessage("");
    } catch (error) {
      console.error(
        "Failed to save branch:",
        error
      );


      const backendErrors =
        error.response?.data;


      if (
        backendErrors &&
        typeof backendErrors ===
          "object" &&
        !backendErrors.detail
      ) {
        const convertedErrors =
          {};


        Object.entries(
          backendErrors
        ).forEach(
          ([
            field,
            messages,
          ]) => {
            convertedErrors[
              field
            ] =
              Array.isArray(
                messages
              )
                ? messages[0]
                : String(
                    messages
                  );
          }
        );


        setFormErrors(
          convertedErrors
        );
      } else {
        setErrorMessage(
          backendErrors?.detail ||
            "Failed to save branch. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | DELETE BRANCH
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async () => {
      if (!branchToDelete) {
        return;
      }


      try {
        setDeletingId(
          branchToDelete.id
        );

        setErrorMessage(
          ""
        );


        await deleteBranch(
          branchToDelete.id
        );


        setBranches(
          (
            previousBranches
          ) =>
            previousBranches.filter(
              (branch) =>
                branch.id !==
                branchToDelete.id
            )
        );


        setSuccessMessage(
          "Branch deleted successfully."
        );


        setShowDeleteModal(
          false
        );

        setBranchToDelete(
          null
        );
      } catch (error) {
        console.error(
          "Failed to delete branch:",
          error
        );


        setErrorMessage(
          error.response?.data
            ?.detail ||
            "Failed to delete branch."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="manage-branches-page">

      <AdminNavbar />


      {/* =================================
          MAIN CONTENT
      ================================= */}

      <main className="branches-main">

        <header className="branches-header">

          <div>

            <p className="branches-overline">
              BRANCH MANAGEMENT
            </p>

            <h2>
              Manage Branches
            </h2>

            <p>
              Add, update and manage
              PBZ branch information
              and geographical
              locations.
            </p>

          </div>


          <button
            type="button"
            className="add-branch-button"
            onClick={
              openAddModal
            }
          >
            <span>
              +
            </span>

            Add Branch
          </button>

        </header>


        {/* SUCCESS */}

        {successMessage && (
          <div
            className="branches-alert success-alert"
            role="status"
          >
            <span>
              ✓
            </span>

            <p>
              {
                successMessage
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage(
                  ""
                )
              }
              aria-label="Close success message"
            >
              ×
            </button>
          </div>
        )}


        {/* ERROR */}

        {errorMessage && (
          <div
            className="branches-alert error-alert"
            role="alert"
          >
            <span>
              !
            </span>

            <p>
              {
                errorMessage
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setErrorMessage(
                  ""
                )
              }
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}


        {/* =================================
            SUMMARY
        ================================= */}

        <section className="branches-summary">

          <article>
            <span>
              Total Branches
            </span>

            <strong>
              {
                branches.length
              }
            </strong>
          </article>


          <article>
            <span>
              ATM Available
            </span>

            <strong>
              {
                branches.filter(
                  (branch) =>
                    branch.atm_status
                ).length
              }
            </strong>
          </article>


          <article>
            <span>
              ATM Unavailable
            </span>

            <strong>
              {
                branches.filter(
                  (branch) =>
                    !branch.atm_status
                ).length
              }
            </strong>
          </article>


          <article>
            <span>
              Categories Used
            </span>

            <strong>
              {
                new Set(
                  branches.map(
                    (branch) =>
                      branch.category
                  )
                ).size
              }
            </strong>
          </article>

        </section>


        {/* =================================
            TABLE CARD
        ================================= */}

        <section className="branches-content-card">

          <div className="branches-toolbar">

            <div className="branches-search-box">

              <span>
                ⌕
              </span>

              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                placeholder="Search branch, address or phone..."
              />

            </div>


            <select
              value={
                atmFilter
              }
              onChange={(
                event
              ) =>
                setAtmFilter(
                  event.target
                    .value
                )
              }
              className="atm-filter"
            >
              <option value="all">
                All ATM statuses
              </option>

              <option value="available">
                ATM available
              </option>

              <option value="unavailable">
                ATM unavailable
              </option>
            </select>


            <button
              type="button"
              className="refresh-branches-button"
              onClick={
                loadBranchesAndCategories
              }
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>


          <div className="branches-table-wrapper">

            {isLoading ? (

              <div className="branches-loading-state">

                <div className="branches-spinner"></div>

                <p>
                  Loading branches...
                </p>

              </div>

            ) : filteredBranches.length ===
              0 ? (

              <div className="branches-empty-state">

                <div>
                  BR
                </div>

                <h3>
                  No branches found
                </h3>

                <p>
                  No branches match your
                  current search or
                  filter.
                </p>

                <button
                  type="button"
                  onClick={
                    openAddModal
                  }
                >
                  Add first branch
                </button>

              </div>

            ) : (

              <table className="manage-branches-table">

                <thead>
                  <tr>
                    <th>
                      Branch
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Coordinates
                    </th>

                    <th>
                      ATM Status
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {filteredBranches.map(
                    (branch) => (

                      <tr
                        key={
                          branch.id
                        }
                      >

                        <td>

                          <div className="branch-information">

                            <div className="branch-avatar">
                              {branch.branch_name
                                ?.substring(
                                  0,
                                  2
                                )
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {
                                  branch.branch_name
                                }
                              </strong>

                              <span>
                                {
                                  branch.address
                                }
                              </span>

                              <small>
                                {
                                  branch.opening_hours
                                }
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span className="branch-category-badge">
                            {getCategoryName(
                              branch.category
                            )}
                          </span>

                        </td>


                        <td>

                          <span className="branch-phone">
                            {
                              branch.phone
                            }
                          </span>

                        </td>


                        <td>

                          <div className="branch-coordinates">

                            <span>
                              Lat:{" "}
                              {
                                branch.latitude
                              }
                            </span>

                            <span>
                              Lng:{" "}
                              {
                                branch.longitude
                              }
                            </span>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              branch.atm_status
                                ? "branch-atm-status available"
                                : "branch-atm-status unavailable"
                            }
                          >
                            <span></span>

                            {branch.atm_status
                              ? "Available"
                              : "Unavailable"}
                          </span>

                        </td>


                        <td>

                          <div className="branch-actions">

                            <button
                              type="button"
                              className="edit-branch-button"
                              onClick={() =>
                                openEditModal(
                                  branch
                                )
                              }
                            >
                              Edit
                            </button>


                            <button
                              type="button"
                              className="delete-branch-button"
                              onClick={() =>
                                openDeleteModal(
                                  branch
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            )}

          </div>


          {!isLoading &&
            filteredBranches.length >
              0 && (

              <div className="branches-table-footer">
                Showing{" "}
                {
                  filteredBranches.length
                }{" "}
                of{" "}
                {
                  branches.length
                }{" "}
                branches
              </div>

            )}

        </section>

      </main>


      {/* =================================
          ADD / EDIT MODAL
      ================================= */}

      {showFormModal && (

        <div
          className="branch-modal-overlay"
          onMouseDown={
            closeFormModal
          }
        >

          <section
            className="branch-form-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="branch-modal-header">

              <div>

                <p>
                  {editingBranchId
                    ? "UPDATE BRANCH"
                    : "NEW BRANCH"}
                </p>

                <h2>
                  {editingBranchId
                    ? "Edit Branch"
                    : "Add Branch"}
                </h2>

              </div>


              <button
                type="button"
                onClick={
                  closeFormModal
                }
                disabled={
                  isSaving
                }
                aria-label="Close form"
              >
                ×
              </button>

            </div>


            <form
              className="branch-form"
              onSubmit={
                handleSubmit
              }
              noValidate
            >

              <div className="branch-form-grid">

                {/* BRANCH NAME */}

                <div className="branch-form-group full-width">

                  <label htmlFor="branch_name">
                    Branch name
                  </label>

                  <input
                    type="text"
                    id="branch_name"
                    name="branch_name"
                    value={
                      formData.branch_name
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Example: PBZ Mwanakwerekwe"
                    className={
                      formErrors.branch_name
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.branch_name && (
                    <small>
                      {
                        formErrors.branch_name
                      }
                    </small>
                  )}

                </div>


                {/* =================================
                    LOCATION METHOD
                ================================= */}

                <div className="branch-form-group full-width">

                  <label>
                    Branch location
                  </label>


                  <div className="branch-location-mode">

                    <button
                      type="button"
                      className={
                        formData.location_mode ===
                        "map"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        changeLocationMode(
                          "map"
                        )
                      }
                    >
                      <span>
                        MAP
                      </span>

                      <div>
                        <strong>
                          Pick from Map
                        </strong>

                        <small>
                          Select exact branch
                          location visually.
                        </small>
                      </div>
                    </button>


                    <button
                      type="button"
                      className={
                        formData.location_mode ===
                        "manual"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        changeLocationMode(
                          "manual"
                        )
                      }
                    >
                      <span>
                        GPS
                      </span>

                      <div>
                        <strong>
                          Enter Manually
                        </strong>

                        <small>
                          Type address and
                          coordinates yourself.
                        </small>
                      </div>
                    </button>

                  </div>

                </div>


                {/* =================================
                    MAP MODE
                ================================= */}

                {formData.location_mode ===
                  "map" && (
                  <>

                    <div className="branch-form-group full-width">

                      <div className="branch-location-map-wrapper">

                        <MapContainer
                          center={
                            formData.latitude &&
                            formData.longitude
                              ? [
                                  Number(
                                    formData.latitude
                                  ),
                                  Number(
                                    formData.longitude
                                  ),
                                ]
                              : DEFAULT_MAP_CENTER
                          }
                          zoom={
                            formData.latitude &&
                            formData.longitude
                              ? 16
                              : DEFAULT_MAP_ZOOM
                          }
                          scrollWheelZoom={
                            true
                          }
                          className="branch-location-map"
                        >

                          <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />


                          <BranchLocationPicker
                            latitude={
                              formData.latitude
                            }
                            longitude={
                              formData.longitude
                            }
                            onLocationSelected={
                              handleMapLocationSelected
                            }
                          />


                          <MapResizeHandler />

                        </MapContainer>


                        <div className="branch-map-help-overlay">
                          Click anywhere on
                          the map to select
                          branch location
                        </div>

                      </div>


                      {locationMessage && (
                        <div
                          className={`branch-location-message ${
                            isDetectingAddress
                              ? "loading"
                              : "success"
                          }`}
                        >
                          <span>
                            {isDetectingAddress
                              ? "..."
                              : "✓"}
                          </span>

                          {
                            locationMessage
                          }
                        </div>
                      )}


                      {formErrors.latitude && (
                        <small>
                          {
                            formErrors.latitude
                          }
                        </small>
                      )}

                    </div>


                    <div className="branch-form-group full-width">

                      <label htmlFor="map_address">
                        Address
                      </label>


                      <div className="branch-address-detected-input">

                        <input
                          type="text"
                          id="map_address"
                          name="address"
                          value={
                            formData.address
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder={
                            isDetectingAddress
                              ? "Detecting address..."
                              : "Address will appear after selecting the map location"
                          }
                          className={
                            formErrors.address
                              ? "field-has-error"
                              : ""
                          }
                        />

                        {isDetectingAddress && (
                          <div className="branch-address-spinner"></div>
                        )}

                      </div>


                      <span className="branch-field-note">
                        You can edit the
                        detected address if
                        necessary.
                      </span>


                      {formErrors.address && (
                        <small>
                          {
                            formErrors.address
                          }
                        </small>
                      )}

                    </div>


                    <div className="branch-form-group">

                      <label>
                        Latitude
                      </label>

                      <input
                        type="text"
                        value={
                          formData.latitude
                        }
                        readOnly
                        placeholder="Select on map"
                        className="branch-readonly-coordinate"
                      />

                      {formErrors.latitude && (
                        <small>
                          {
                            formErrors.latitude
                          }
                        </small>
                      )}

                    </div>


                    <div className="branch-form-group">

                      <label>
                        Longitude
                      </label>

                      <input
                        type="text"
                        value={
                          formData.longitude
                        }
                        readOnly
                        placeholder="Select on map"
                        className="branch-readonly-coordinate"
                      />

                      {formErrors.longitude && (
                        <small>
                          {
                            formErrors.longitude
                          }
                        </small>
                      )}

                    </div>

                  </>
                )}


                {/* =================================
                    MANUAL MODE
                ================================= */}

                {formData.location_mode ===
                  "manual" && (
                  <>

                    <div className="branch-manual-location-notice full-width">

                      <span>
                        GPS
                      </span>

                      <div>

                        <strong>
                          Manual location entry
                        </strong>

                        <p>
                          Enter the address,
                          latitude and longitude
                          exactly as before.
                        </p>

                      </div>

                    </div>


                    <div className="branch-form-group full-width">

                      <label htmlFor="address">
                        Address
                      </label>

                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={
                          formData.address
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="Enter branch address"
                        className={
                          formErrors.address
                            ? "field-has-error"
                            : ""
                        }
                      />

                      {formErrors.address && (
                        <small>
                          {
                            formErrors.address
                          }
                        </small>
                      )}

                    </div>


                    <div className="branch-form-group">

                      <label htmlFor="latitude">
                        Latitude
                      </label>

                      <input
                        type="number"
                        step="any"
                        id="latitude"
                        name="latitude"
                        value={
                          formData.latitude
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="-6.16500000"
                        className={
                          formErrors.latitude
                            ? "field-has-error"
                            : ""
                        }
                      />

                      {formErrors.latitude && (
                        <small>
                          {
                            formErrors.latitude
                          }
                        </small>
                      )}

                    </div>


                    <div className="branch-form-group">

                      <label htmlFor="longitude">
                        Longitude
                      </label>

                      <input
                        type="number"
                        step="any"
                        id="longitude"
                        name="longitude"
                        value={
                          formData.longitude
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="39.20200000"
                        className={
                          formErrors.longitude
                            ? "field-has-error"
                            : ""
                        }
                      />

                      {formErrors.longitude && (
                        <small>
                          {
                            formErrors.longitude
                          }
                        </small>
                      )}

                    </div>

                  </>
                )}


                {/* =================================
                    PHONE
                ================================= */}

                <div className="branch-form-group">

                  <label htmlFor="phone">
                    Phone number
                  </label>

                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="+255 24 223 0000"
                    className={
                      formErrors.phone
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.phone && (
                    <small>
                      {
                        formErrors.phone
                      }
                    </small>
                  )}

                </div>


                {/* =================================
                    CATEGORY
                ================================= */}

                <div className="branch-form-group">

                  <label htmlFor="category">
                    Category
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={
                      handleInputChange
                    }
                    className={
                      formErrors.category
                        ? "field-has-error"
                        : ""
                    }
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.category_name
                          }
                        </option>
                      )
                    )}

                  </select>

                  {formErrors.category && (
                    <small>
                      {
                        formErrors.category
                      }
                    </small>
                  )}

                </div>


                {/* =================================
                    HOURS
                ================================= */}

                <div className="branch-form-group full-width">

                  <label htmlFor="opening_hours">
                    Opening hours
                  </label>

                  <input
                    type="text"
                    id="opening_hours"
                    name="opening_hours"
                    value={
                      formData.opening_hours
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Monday - Friday, 8:00 AM - 4:00 PM"
                    className={
                      formErrors.opening_hours
                        ? "field-has-error"
                        : ""
                    }
                  />

                  {formErrors.opening_hours && (
                    <small>
                      {
                        formErrors.opening_hours
                      }
                    </small>
                  )}

                </div>


                {/* =================================
                    ATM
                ================================= */}

                <div className="branch-form-group full-width">

                  <label className="atm-checkbox">

                    <input
                      type="checkbox"
                      name="atm_status"
                      checked={
                        formData.atm_status
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                    <span className="atm-checkbox-control"></span>

                    <span>

                      <strong>
                        ATM available
                      </strong>

                      <small>
                        Mark this when the
                        branch ATM is
                        currently available.
                      </small>

                    </span>

                  </label>

                </div>

              </div>


              {/* =================================
                  FORM ACTIONS
              ================================= */}

              <div className="branch-form-actions">

                <button
                  type="button"
                  className="cancel-branch-form"
                  onClick={
                    closeFormModal
                  }
                  disabled={
                    isSaving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-branch-button"
                  disabled={
                    isSaving ||
                    isDetectingAddress
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : editingBranchId
                      ? "Update Branch"
                      : "Add Branch"}
                </button>

              </div>

            </form>

          </section>

        </div>

      )}


      {/* =================================
          DELETE CONFIRMATION
      ================================= */}

      {showDeleteModal &&
        branchToDelete && (

        <div
          className="branch-modal-overlay"
          onMouseDown={
            closeDeleteModal
          }
        >

          <section
            className="delete-confirmation-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="delete-warning-icon">
              !
            </div>


            <h2>
              Delete branch?
            </h2>


            <p>
              You are about to delete{" "}

              <strong>
                {
                  branchToDelete.branch_name
                }
              </strong>

              . This action cannot be
              undone.
            </p>


            <div className="delete-confirmation-actions">

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  Boolean(
                    deletingId
                  )
                }
              >
                {deletingId
                  ? "Deleting..."
                  : "Delete Branch"}
              </button>

            </div>

          </section>

        </div>

      )}

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| MAP CLICK HANDLER
|--------------------------------------------------------------------------
*/

function BranchLocationPicker({
  latitude,
  longitude,
  onLocationSelected,
}) {
  const map =
    useMapEvents({
      click(event) {
        const {
          lat,
          lng,
        } = event.latlng;

        onLocationSelected(
          lat,
          lng
        );

        map.flyTo(
          [lat, lng],
          16,
          {
            duration: 0.7,
          }
        );
      },
    });


  const latitudeNumber =
    Number(latitude);

  const longitudeNumber =
    Number(longitude);


  const hasValidLocation =
    latitude !== "" &&
    longitude !== "" &&
    Number.isFinite(
      latitudeNumber
    ) &&
    Number.isFinite(
      longitudeNumber
    );


  useEffect(() => {
    if (
      hasValidLocation
    ) {
      map.setView(
        [
          latitudeNumber,
          longitudeNumber,
        ],
        Math.max(
          map.getZoom(),
          15
        )
      );
    }
  }, [
    hasValidLocation,
    latitudeNumber,
    longitudeNumber,
    map,
  ]);


  if (
    !hasValidLocation
  ) {
    return null;
  }


  return (
    <CircleMarker
      center={[
        latitudeNumber,
        longitudeNumber,
      ]}
      radius={11}
      pathOptions={{
        color: "#ffffff",
        weight: 4,

        fillColor:
          "#11945d",

        fillOpacity: 1,
      }}
    />
  );
}


/*
|--------------------------------------------------------------------------
| FIX LEAFLET SIZE INSIDE MODAL
|--------------------------------------------------------------------------
*/

function MapResizeHandler() {
  const map =
    useMap();


  useEffect(() => {
    const timer =
      setTimeout(() => {
        map.invalidateSize();
      }, 150);


    return () =>
      clearTimeout(
        timer
      );
  }, [map]);


  return null;
}


export default ManageBranches;