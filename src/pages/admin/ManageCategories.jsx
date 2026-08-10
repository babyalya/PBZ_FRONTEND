import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  createCategory,
  deleteCategory,
  getBranches,
  getCategories,
  updateCategory,
} from "../../api/api";

import "./ManageCategories.css";

const initialFormData = {
  category_name: "",
  description: "",
};

function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadCategoriesAndBranches = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [categoriesResponse, branchesResponse] = await Promise.all([
        getCategories(),
        getBranches(),
      ]);

      setCategories(categoriesResponse.data);
      setBranches(branchesResponse.data);
    } catch (error) {
      console.error("Failed to load categories:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to load category information."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesAndBranches();
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) => {
      const nameMatches = category.category_name
        ?.toLowerCase()
        .includes(normalizedSearch);

      const descriptionMatches = category.description
        ?.toLowerCase()
        .includes(normalizedSearch);

      return nameMatches || descriptionMatches;
    });
  }, [categories, searchTerm]);

  const getBranchCount = (categoryId) => {
    return branches.filter(
      (branch) => Number(branch.category) === Number(categoryId)
    ).length;
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const openAddModal = () => {
    clearMessages();
    setEditingCategoryId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (category) => {
    clearMessages();

    setEditingCategoryId(category.id);

    setFormData({
      category_name: category.category_name || "",
      description: category.description || "",
    });

    setFormErrors({});
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setShowFormModal(false);
    setEditingCategoryId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const openDeleteModal = (category) => {
    clearMessages();
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }

    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setFormErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.category_name.trim()) {
      errors.category_name = "Category name is required.";
    } else if (formData.category_name.trim().length < 2) {
      errors.category_name =
        "Category name must contain at least 2 characters.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    const categoryPayload = {
      category_name: formData.category_name.trim(),
      description: formData.description.trim() || null,
    };

    try {
      setIsSaving(true);

      if (editingCategoryId) {
        const response = await updateCategory(
          editingCategoryId,
          categoryPayload
        );

        setCategories((previousCategories) =>
          previousCategories.map((category) =>
            category.id === editingCategoryId
              ? response.data
              : category
          )
        );

        setSuccessMessage("Category updated successfully.");
      } else {
        const response = await createCategory(categoryPayload);

        setCategories((previousCategories) => [
          response.data,
          ...previousCategories,
        ]);

        setSuccessMessage("Category added successfully.");
      }

      setShowFormModal(false);
      setEditingCategoryId(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      console.error("Failed to save category:", error);

      const backendErrors = error.response?.data;

      if (
        backendErrors &&
        typeof backendErrors === "object" &&
        !backendErrors.detail
      ) {
        const convertedErrors = {};

        Object.entries(backendErrors).forEach(([field, messages]) => {
          convertedErrors[field] = Array.isArray(messages)
            ? messages[0]
            : String(messages);
        });

        setFormErrors(convertedErrors);
      } else {
        setErrorMessage(
          backendErrors?.detail ||
            "Failed to save category. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) {
      return;
    }

    const branchCount = getBranchCount(categoryToDelete.id);

    if (branchCount > 0) {
      setShowDeleteModal(false);
      setCategoryToDelete(null);

      setErrorMessage(
        `This category cannot be deleted because it is used by ${branchCount} branch${
          branchCount === 1 ? "" : "es"
        }.`
      );

      return;
    }

    try {
      setDeletingId(categoryToDelete.id);
      setErrorMessage("");

      await deleteCategory(categoryToDelete.id);

      setCategories((previousCategories) =>
        previousCategories.filter(
          (category) => category.id !== categoryToDelete.id
        )
      );

      setSuccessMessage("Category deleted successfully.");
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Failed to delete category:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Failed to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="manage-categories-page">
      <aside className="categories-sidebar">
        <div className="categories-sidebar-brand">
          <div className="categories-brand-logo">PBZ</div>

          <div>
            <h1>PBZ GIS</h1>
            <p>Administration</p>
          </div>
        </div>

        <nav className="categories-navigation">
          <p className="categories-navigation-title">MAIN MENU</p>

          <Link
            to="/admin/dashboard"
            className="categories-nav-link"
          >
            <span>DB</span>
            Dashboard
          </Link>

          <Link
            to="/admin/branches"
            className="categories-nav-link"
          >
            <span>BR</span>
            Branches
          </Link>

          <Link
            to="/admin/categories"
            className="categories-nav-link active"
          >
            <span>CT</span>
            Categories
          </Link>

          <Link
            to="/admin/services"
            className="categories-nav-link"
          >
            <span>SV</span>
            Services
          </Link>

          <Link
            to="/admin/customers"
            className="categories-nav-link"
          >
            <span>CU</span>
            Customers
          </Link>
        </nav>
      </aside>

      <main className="categories-main">
        <header className="categories-header">
          <div>
            <p className="categories-overline">
              CATEGORY MANAGEMENT
            </p>

            <h2>Manage Categories</h2>

            <p>
              Add and manage the classifications used for PBZ
              branches.
            </p>
          </div>

          <button
            type="button"
            className="add-category-button"
            onClick={openAddModal}
          >
            <span>+</span>
            Add Category
          </button>
        </header>

        {successMessage && (
          <div
            className="categories-alert success-alert"
            role="status"
          >
            <span>✓</span>
            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            className="categories-alert error-alert"
            role="alert"
          >
            <span>!</span>
            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="categories-summary">
          <article>
            <span>Total Categories</span>
            <strong>{categories.length}</strong>
          </article>

          <article>
            <span>Categories in Use</span>
            <strong>
              {
                categories.filter(
                  (category) => getBranchCount(category.id) > 0
                ).length
              }
            </strong>
          </article>

          <article>
            <span>Unused Categories</span>
            <strong>
              {
                categories.filter(
                  (category) => getBranchCount(category.id) === 0
                ).length
              }
            </strong>
          </article>

          <article>
            <span>Total Branches</span>
            <strong>{branches.length}</strong>
          </article>
        </section>

        <section className="categories-content-card">
          <div className="categories-toolbar">
            <div className="categories-search-box">
              <span>⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search category or description..."
              />
            </div>

            <button
              type="button"
              className="refresh-categories-button"
              onClick={loadCategoriesAndBranches}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="categories-table-wrapper">
            {isLoading ? (
              <div className="categories-loading-state">
                <div className="categories-spinner"></div>
                <p>Loading categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="categories-empty-state">
                <div>CT</div>

                <h3>No categories found</h3>

                <p>
                  Add a category such as Head Office or Normal
                  Branch.
                </p>

                <button type="button" onClick={openAddModal}>
                  Add first category
                </button>
              </div>
            ) : (
              <table className="manage-categories-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Branches</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map((category) => {
                    const branchCount = getBranchCount(category.id);

                    return (
                      <tr key={category.id}>
                        <td>
                          <div className="category-information">
                            <div className="category-avatar">
                              {category.category_name
                                ?.substring(0, 2)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {category.category_name}
                              </strong>

                              <span>Category ID: {category.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <p className="category-description">
                            {category.description ||
                              "No description provided."}
                          </p>
                        </td>

                        <td>
                          <span className="category-branch-count">
                            {branchCount}{" "}
                            {branchCount === 1
                              ? "branch"
                              : "branches"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              branchCount > 0
                                ? "category-status in-use"
                                : "category-status unused"
                            }
                          >
                            <span></span>
                            {branchCount > 0 ? "In use" : "Unused"}
                          </span>
                        </td>

                        <td>
                          <div className="category-actions">
                            <button
                              type="button"
                              className="edit-category-button"
                              onClick={() =>
                                openEditModal(category)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-category-button"
                              onClick={() =>
                                openDeleteModal(category)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filteredCategories.length > 0 && (
            <div className="categories-table-footer">
              Showing {filteredCategories.length} of{" "}
              {categories.length} categories
            </div>
          )}
        </section>
      </main>

      {showFormModal && (
        <div
          className="category-modal-overlay"
          onMouseDown={closeFormModal}
        >
          <section
            className="category-form-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="category-modal-header">
              <div>
                <p>
                  {editingCategoryId
                    ? "UPDATE CATEGORY"
                    : "NEW CATEGORY"}
                </p>

                <h2>
                  {editingCategoryId
                    ? "Edit Category"
                    : "Add Category"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={isSaving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              className="category-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="category-form-group">
                <label htmlFor="category_name">
                  Category name
                </label>

                <input
                  type="text"
                  id="category_name"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleInputChange}
                  placeholder="Example: Head Office"
                  className={
                    formErrors.category_name
                      ? "field-has-error"
                      : ""
                  }
                />

                {formErrors.category_name && (
                  <small>{formErrors.category_name}</small>
                )}
              </div>

              <div className="category-form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this branch category..."
                  rows="5"
                />

                {formErrors.description && (
                  <small>{formErrors.description}</small>
                )}
              </div>

              <div className="category-form-actions">
                <button
                  type="button"
                  className="cancel-category-form"
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-category-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingCategoryId
                      ? "Update Category"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showDeleteModal && categoryToDelete && (
        <div
          className="category-modal-overlay"
          onMouseDown={closeDeleteModal}
        >
          <section
            className="category-delete-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="category-delete-icon">!</div>

            <h2>Delete category?</h2>

            <p>
              You are about to delete{" "}
              <strong>{categoryToDelete.category_name}</strong>.
            </p>

            {getBranchCount(categoryToDelete.id) > 0 && (
              <div className="category-delete-warning">
                This category is currently used by{" "}
                {getBranchCount(categoryToDelete.id)} branch
                {getBranchCount(categoryToDelete.id) === 1
                  ? ""
                  : "es"}
                .
              </div>
            )}

            <div className="category-delete-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId
                  ? "Deleting..."
                  : "Delete Category"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ManageCategories;