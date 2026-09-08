"use strict";

/*
 * Krishna Jewellers — Admin Dashboard
 *
 * Supabase features:
 * - Email/password authentication
 * - Admin verification
 * - Product CRUD
 * - Image upload to Storage
 * - Multiple product photos
 * - Publish / hide products
 * - Featured products
 * - Product search and filtering
 * - Product deletion
 */

(function () {
  const CONFIG = window.KRISHNA_SUPABASE || {};

  const SUPABASE_URL = String(CONFIG.url || "").trim();
  const SUPABASE_KEY = String(CONFIG.key || "").trim();

  const STORAGE_BUCKET = "jewellery";
  const MAX_FILE_SIZE = 6 * 1024 * 1024;

  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  let supabaseClient = null;
  let currentUser = null;

  let allProducts = [];
  let filteredProducts = [];

  let selectedFiles = [];
  let existingImages = [];

  let editingProductId = null;

  let deleteTargetId = null;

  let toastTimer = null;

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();
    setupEvents();

    initializeSupabase();

    if (!supabaseClient) {
      showLoginScreen();
      setLoginMessage(
        "Supabase configuration is missing. Check supabase-config.js.",
        "error"
      );
      return;
    }

    await checkExistingSession();
  }

  function cacheElements() {
    elements.loginScreen = document.getElementById("loginScreen");
    elements.adminApp = document.getElementById("adminApp");

    elements.loginForm = document.getElementById("loginForm");
    elements.loginEmail = document.getElementById("loginEmail");
    elements.loginPassword = document.getElementById("loginPassword");
    elements.loginButton = document.getElementById("loginButton");
    elements.loginMessage = document.getElementById("loginMessage");
    elements.togglePassword =
      document.getElementById("togglePassword");

    elements.adminEmail = document.getElementById("adminEmail");
    elements.logoutButton = document.getElementById("logoutButton");

    elements.sidebar = document.getElementById("sidebar");
    elements.sidebarOpen = document.getElementById("sidebarOpen");
    elements.sidebarClose = document.getElementById("sidebarClose");
    elements.sidebarOverlay =
      document.getElementById("sidebarOverlay");

    elements.pageTitle = document.getElementById("pageTitle");

    elements.productsView =
      document.getElementById("productsView");

    elements.addProductView =
      document.getElementById("addProductView");

    elements.totalProducts =
      document.getElementById("totalProducts");

    elements.publishedProducts =
      document.getElementById("publishedProducts");

    elements.hiddenProducts =
      document.getElementById("hiddenProducts");

    elements.categoryCount =
      document.getElementById("categoryCount");

    elements.adminSearch =
      document.getElementById("adminSearch");

    elements.adminCategoryFilter =
      document.getElementById("adminCategoryFilter");

    elements.adminStatusFilter =
      document.getElementById("adminStatusFilter");

    elements.productTableBody =
      document.getElementById("productTableBody");

    elements.adminEmptyState =
      document.getElementById("adminEmptyState");

    elements.topAddProductButton =
      document.getElementById("topAddProductButton");

    elements.panelAddProductButton =
      document.getElementById("panelAddProductButton");

    elements.emptyAddProductButton =
      document.getElementById("emptyAddProductButton");

    elements.backToProducts =
      document.getElementById("backToProducts");

    elements.cancelEditorButton =
      document.getElementById("cancelEditorButton");

    elements.productForm =
      document.getElementById("productForm");

    elements.productId =
      document.getElementById("productId");

    elements.editorTitle =
      document.getElementById("editorTitle");

    elements.productName =
      document.getElementById("productName");

    elements.productCategory =
      document.getElementById("productCategory");

    elements.productPrice =
      document.getElementById("productPrice");

    elements.productMaterial =
      document.getElementById("productMaterial");

    elements.productSku =
      document.getElementById("productSku");

    elements.productDescription =
      document.getElementById("productDescription");

    elements.descriptionCount =
      document.getElementById("descriptionCount");

    elements.productPublished =
      document.getElementById("productPublished");

    elements.productFeatured =
      document.getElementById("productFeatured");

    elements.productImages =
      document.getElementById("productImages");

    elements.uploadZone =
      document.getElementById("uploadZone");

    elements.chooseImagesButton =
      document.getElementById("chooseImagesButton");

    elements.imagePreviewGrid =
      document.getElementById("imagePreviewGrid");

    elements.uploadMessage =
      document.getElementById("uploadMessage");

    elements.saveProductButton =
      document.getElementById("saveProductButton");

    elements.productFormMessage =
      document.getElementById("productFormMessage");

    elements.confirmModal =
      document.getElementById("confirmModal");

    elements.confirmMessage =
      document.getElementById("confirmMessage");

    elements.confirmCancel =
      document.getElementById("confirmCancel");

    elements.confirmDelete =
      document.getElementById("confirmDelete");

    elements.adminToast =
      document.getElementById("adminToast");
  }

  function setupEvents() {
    if (elements.loginForm) {
      elements.loginForm.addEventListener(
        "submit",
        handleLogin
      );
    }

    if (elements.togglePassword) {
      elements.togglePassword.addEventListener(
        "click",
        togglePassword
      );
    }

    if (elements.logoutButton) {
      elements.logoutButton.addEventListener(
        "click",
        handleLogout
      );
    }

    if (elements.sidebarOpen) {
      elements.sidebarOpen.addEventListener(
        "click",
        openSidebar
      );
    }

    if (elements.sidebarClose) {
      elements.sidebarClose.addEventListener(
        "click",
        closeSidebar
      );
    }

    if (elements.sidebarOverlay) {
      elements.sidebarOverlay.addEventListener(
        "click",
        closeSidebar
      );
    }

    document
      .querySelectorAll("[data-view]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          switchView(button.dataset.view);
        });
      });

    if (elements.topAddProductButton) {
      elements.topAddProductButton.addEventListener(
        "click",
        startAddProduct
      );
    }

    if (elements.panelAddProductButton) {
      elements.panelAddProductButton.addEventListener(
        "click",
        startAddProduct
      );
    }

    if (elements.emptyAddProductButton) {
      elements.emptyAddProductButton.addEventListener(
        "click",
        startAddProduct
      );
    }

    if (elements.backToProducts) {
      elements.backToProducts.addEventListener(
        "click",
        showProducts
      );
    }

    if (elements.cancelEditorButton) {
      elements.cancelEditorButton.addEventListener(
        "click",
        showProducts
      );
    }

    if (elements.productForm) {
      elements.productForm.addEventListener(
        "submit",
        handleProductSubmit
      );
    }

    if (elements.productImages) {
      elements.productImages.addEventListener(
        "change",
        handleFileSelection
      );
    }

    if (elements.chooseImagesButton) {
      elements.chooseImagesButton.addEventListener(
        "click",
        function () {
          elements.productImages.click();
        }
      );
    }

    if (elements.uploadZone) {
      setupDragAndDrop();
    }

    if (elements.imagePreviewGrid) {
      elements.imagePreviewGrid.addEventListener(
        "click",
        handleImagePreviewClick
      );
    }

    if (elements.descriptionCount) {
      updateDescriptionCount();
    }

    if (elements.productDescription) {
      elements.productDescription.addEventListener(
        "input",
        updateDescriptionCount
      );
    }

    if (elements.adminSearch) {
      elements.adminSearch.addEventListener(
        "input",
        debounce(function () {
          applyAdminFilters();
        }, 180)
      );
    }

    if (elements.adminCategoryFilter) {
      elements.adminCategoryFilter.addEventListener(
        "change",
        applyAdminFilters
      );
    }

    if (elements.adminStatusFilter) {
      elements.adminStatusFilter.addEventListener(
        "change",
        applyAdminFilters
      );
    }

    if (elements.productTableBody) {
      elements.productTableBody.addEventListener(
        "click",
        handleTableAction
      );
    }

    if (elements.confirmCancel) {
      elements.confirmCancel.addEventListener(
        "click",
        closeConfirmModal
      );
    }

    if (elements.confirmDelete) {
      elements.confirmDelete.addEventListener(
        "click",
        confirmDeleteProduct
      );
    }

    if (elements.confirmModal) {
      const backdrop =
        elements.confirmModal.querySelector(
          ".admin-modal-backdrop"
        );

      if (backdrop) {
        backdrop.addEventListener(
          "click",
          closeConfirmModal
        );
      }
    }

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Escape") {
          closeConfirmModal();
          closeSidebar();
        }
      }
    );
  }

  function initializeSupabase() {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      SUPABASE_URL.includes("YOUR_SUPABASE") ||
      SUPABASE_KEY.includes("YOUR_SUPABASE")
    ) {
      return;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      return;
    }

    try {
      supabaseClient =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );
    } catch (error) {
      console.error(
        "Supabase initialization failed:",
        error
      );
    }
  }

  async function checkExistingSession() {
    try {
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session || !session.user) {
        showLoginScreen();
        return;
      }

      const isAdmin =
        await verifyAdmin(session.user.id);

      if (!isAdmin) {
        await supabaseClient.auth.signOut();

        showLoginScreen();

        setLoginMessage(
          "This account is not authorized to access the admin panel.",
          "error"
        );

        return;
      }

      currentUser = session.user;

      showAdminApp();

      await loadProducts();
    } catch (error) {
      console.error(
        "Session check failed:",
        error
      );

      showLoginScreen();

      setLoginMessage(
        getErrorMessage(error),
        "error"
      );
    }

    supabaseClient.auth.onAuthStateChange(
      function (event, session) {
        if (event === "SIGNED_OUT") {
          currentUser = null;
          showLoginScreen();
        }
      }
    );
  }

  async function verifyAdmin(userId) {
    if (!userId) {
      return false;
    }

    try {
      const { data, error } =
        await supabaseClient
          .from("admin_users")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

      if (error) {
        console.error(
          "Admin verification error:",
          error
        );

        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error(
        "Admin verification failed:",
        error
      );

      return false;
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!supabaseClient) {
      setLoginMessage(
        "Supabase is not configured correctly.",
        "error"
      );

      return;
    }

    const email = String(
      elements.loginEmail?.value || ""
    ).trim();

    const password = String(
      elements.loginPassword?.value || ""
    );

    if (!email || !password) {
      setLoginMessage(
        "Please enter your email and password.",
        "error"
      );

      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Login was unsuccessful."
        );
      }

      const isAdmin =
        await verifyAdmin(data.user.id);

      if (!isAdmin) {
        await supabaseClient.auth.signOut();

        throw new Error(
          "This account is not authorized as an admin."
        );
      }

      currentUser = data.user;

      clearLoginMessage();

      showAdminApp();

      await loadProducts();

      showToast(
        "Welcome to the Krishna Jewellers admin panel.",
        "success"
      );
    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      setLoginMessage(
        getErrorMessage(error),
        "error"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    if (!supabaseClient) {
      return;
    }

    try {
      await supabaseClient.auth.signOut();

      currentUser = null;

      showLoginScreen();

      resetEditor();

      showToast(
        "You have been signed out.",
        "success"
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );
    }
  }

  function showLoginScreen() {
    if (elements.loginScreen) {
      elements.loginScreen.hidden = false;
    }

    if (elements.adminApp) {
      elements.adminApp.hidden = true;
    }

    document.body.classList.remove(
      "admin-authenticated"
    );
  }

  function showAdminApp() {
    if (elements.loginScreen) {
      elements.loginScreen.hidden = true;
    }

    if (elements.adminApp) {
      elements.adminApp.hidden = false;
    }

    document.body.classList.add(
      "admin-authenticated"
    );

    if (elements.adminEmail && currentUser) {
      elements.adminEmail.textContent =
        currentUser.email || "Admin";
    }

    switchView("products");
  }

  function setLoginLoading(isLoading) {
    if (!elements.loginButton) {
      return;
    }

    elements.loginButton.disabled = isLoading;

    elements.loginButton.textContent =
      isLoading ? "Signing In..." : "Sign In";
  }

  function setLoginMessage(message, type) {
    if (!elements.loginMessage) {
      return;
    }

    elements.loginMessage.textContent =
      message || "";

    elements.loginMessage.className =
      "form-message";

    if (type) {
      elements.loginMessage.classList.add(type);
    }
  }

  function clearLoginMessage() {
    setLoginMessage("", "");
  }

  function togglePassword() {
    if (!elements.loginPassword) {
      return;
    }

    const isPassword =
      elements.loginPassword.type === "password";

    elements.loginPassword.type =
      isPassword ? "text" : "password";

    if (elements.togglePassword) {
      elements.togglePassword.textContent =
        isPassword ? "Hide" : "Show";

      elements.togglePassword.setAttribute(
        "aria-label",
        isPassword
          ? "Hide password"
          : "Show password"
      );
    }
  }

  async function loadProducts() {
    if (!supabaseClient) {
      return;
    }

    showTableLoading();

    try {
      const { data, error } =
        await supabaseClient
          .from("products")
          .select("*")
          .order("created_at", {
            ascending: false
          });

      if (error) {
        throw error;
      }

      allProducts = Array.isArray(data)
        ? data.map(normalizeProduct)
        : [];

      updateStats();

      applyAdminFilters();
    } catch (error) {
      console.error(
        "Could not load products:",
        error
      );

      showTableError(
        getErrorMessage(error)
      );

      showToast(
        "Could not load products.",
        "error"
      );
    }
  }

  function normalizeProduct(product) {
    const item = product || {};

    let images = [];

    if (Array.isArray(item.images)) {
      images = item.images
        .map(function (image) {
          if (typeof image === "string") {
            return image;
          }

          if (image && typeof image === "object") {
            return {
              url:
                image.url ||
                image.publicUrl ||
                "",
              path:
                image.path ||
                ""
            };
          }

          return null;
        })
        .filter(Boolean);
    } else if (typeof item.images === "string") {
      try {
        const parsed =
          JSON.parse(item.images);

        if (Array.isArray(parsed)) {
          images = parsed
            .map(function (image) {
              if (typeof image === "string") {
                return image;
              }

              if (
                image &&
                typeof image === "object"
              ) {
                return {
                  url:
                    image.url ||
                    image.publicUrl ||
                    "",
                  path:
                    image.path ||
                    ""
                };
              }

              return null;
            })
            .filter(Boolean);
        }
      } catch (error) {
        images = item.images
          .split(",")
          .map(function (url) {
            return url.trim();
          })
          .filter(Boolean);
      }
    }

    return {
      ...item,
      id: String(item.id || ""),
      name: String(
        item.name || "Untitled Product"
      ),
      category: String(
        item.category || "other"
      ).toLowerCase(),
      price: Number(item.price) || 0,
      description: String(
        item.description || ""
      ),
      material: String(
        item.material ||
          item.metal ||
          ""
      ),
      sku: String(
        item.sku ||
          item.product_code ||
          ""
      ),
      image_url: String(
        item.image_url ||
          (images[0] &&
            typeof images[0] === "string"
            ? images[0]
            : images[0]?.url) ||
          ""
      ),
      images,
      is_published:
        Boolean(item.is_published),
      featured:
        Boolean(item.featured)
    };
  }

  function applyAdminFilters() {
    const search = String(
      elements.adminSearch?.value || ""
    )
      .trim()
      .toLowerCase();

    const category =
      elements.adminCategoryFilter?.value ||
      "all";

    const status =
      elements.adminStatusFilter?.value ||
      "all";

    filteredProducts =
      allProducts.filter(function (product) {
        const matchesSearch =
          !search ||
          [
            product.name,
            product.category,
            product.description,
            product.material,
            product.sku
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);

        const matchesCategory =
          category === "all" ||
          product.category === category;

        const matchesStatus =
          status === "all" ||
          (status === "published" &&
            product.is_published) ||
          (status === "hidden" &&
            !product.is_published);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus
        );
      });

    renderProductTable();
  }

  function renderProductTable() {
    if (!elements.productTableBody) {
      return;
    }

    if (filteredProducts.length === 0) {
      elements.productTableBody.innerHTML = "";

      if (elements.adminEmptyState) {
        elements.adminEmptyState.hidden = false;
      }

      return;
    }

    if (elements.adminEmptyState) {
      elements.adminEmptyState.hidden = true;
    }

    elements.productTableBody.innerHTML =
      filteredProducts
        .map(createProductRow)
        .join("");
  }

  function createProductRow(product) {
    const image =
      product.image_url ||
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=300&q=80";

    const statusClass =
      product.is_published
        ? "published"
        : "hidden";

    const statusText =
      product.is_published
        ? "Published"
        : "Hidden";

    const price =
      product.price > 0
        ? formatCurrency(product.price)
        : "Enquiry";

    const updated =
      formatDate(
        product.updated_at ||
          product.created_at
      );

    return `
      <tr data-product-id="${escapeAttribute(
        product.id
      )}">

        <td>
          <div class="table-product">

            <div class="table-product-image">
              <img
                src="${escapeAttribute(image)}"
                alt="${escapeAttribute(
                  product.name
                )}"
                loading="lazy"
                onerror="this.src='https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=300&q=80';"
              >
            </div>

            <div class="table-product-info">

              <strong>
                ${escapeHTML(
                  product.name
                )}

                ${
                  product.featured
                    ? `<span class="featured-badge">Featured</span>`
                    : ""
                }
              </strong>

              <small>
                ${
                  product.sku
                    ? `SKU: ${escapeHTML(
                        product.sku
                      )}`
                    : "No product code"
                }
              </small>

            </div>

          </div>
        </td>

        <td>
          <span class="table-category">
            ${escapeHTML(
              formatCategory(
                product.category
              )
            )}
          </span>
        </td>

        <td>
          <span class="table-price">
            ${escapeHTML(price)}
          </span>
        </td>

        <td>
          <span class="status-badge ${statusClass}">
            ${statusText}
          </span>
        </td>

        <td>
          <span class="table-date">
            ${escapeHTML(updated)}
          </span>
        </td>

        <td>

          <div class="table-actions">

            <button
              type="button"
              class="table-action"
              data-table-action="edit"
              data-product-id="${escapeAttribute(
                product.id
              )}"
              title="Edit product"
            >
              Edit
            </button>

            <button
              type="button"
              class="table-action"
              data-table-action="toggle"
              data-product-id="${escapeAttribute(
                product.id
              )}"
              title="${
                product.is_published
                  ? "Hide product"
                  : "Publish product"
              }"
            >
              ${
                product.is_published
                  ? "Hide"
                  : "Publish"
              }
            </button>

            <button
              type="button"
              class="table-action delete"
              data-table-action="delete"
              data-product-id="${escapeAttribute(
                product.id
              )}"
              title="Delete product"
            >
              Delete
            </button>

          </div>

        </td>

      </tr>
    `;
  }

  function handleTableAction(event) {
    const button =
      event.target.closest(
        "[data-table-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset.tableAction;

    const productId =
      button.dataset.productId;

    if (!productId) {
      return;
    }

    if (action === "edit") {
      startEditProduct(productId);
      return;
    }

    if (action === "toggle") {
      toggleProductPublished(productId);
      return;
    }

    if (action === "delete") {
      openDeleteConfirmation(productId);
    }
  }

  function updateStats() {
    const total =
      allProducts.length;

    const published =
      allProducts.filter(function (product) {
        return product.is_published;
      }).length;

    const hidden =
      total - published;

    const categories =
      new Set(
        allProducts.map(function (product) {
          return product.category;
        })
      );

    if (elements.totalProducts) {
      elements.totalProducts.textContent =
        total;
    }

    if (elements.publishedProducts) {
      elements.publishedProducts.textContent =
        published;
    }

    if (elements.hiddenProducts) {
      elements.hiddenProducts.textContent =
        hidden;
    }

    if (elements.categoryCount) {
      elements.categoryCount.textContent =
        categories.size;
    }
  }

  function switchView(view) {
    if (view === "add-product") {
      startAddProduct();
      return;
    }

    showProducts();
  }

  function showProducts() {
    closeSidebar();

    if (elements.productsView) {
      elements.productsView.classList.add(
        "active"
      );
    }

    if (elements.addProductView) {
      elements.addProductView.classList.remove(
        "active"
      );
    }

    if (elements.pageTitle) {
      elements.pageTitle.textContent =
        "Products";
    }

    document
      .querySelectorAll("[data-view]")
      .forEach(function (button) {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            "products"
        );
      });
  }

  function startAddProduct() {
    closeSidebar();

    editingProductId = null;

    resetEditor();

    if (elements.editorTitle) {
      elements.editorTitle.textContent =
        "Add Product";
    }

    if (elements.saveProductButton) {
      elements.saveProductButton.textContent =
        "Save Product";
    }

    if (elements.productsView) {
      elements.productsView.classList.remove(
        "active"
      );
    }

    if (elements.addProductView) {
      elements.addProductView.classList.add(
        "active"
      );
    }

    if (elements.pageTitle) {
      elements.pageTitle.textContent =
        "Add Product";
    }

    document
      .querySelectorAll("[data-view]")
      .forEach(function (button) {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            "add-product"
        );
      });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function startEditProduct(productId) {
    const product =
      allProducts.find(function (item) {
        return (
          String(item.id) ===
          String(productId)
        );
      });

    if (!product) {
      showToast(
        "Product could not be found.",
        "error"
      );

      return;
    }

    editingProductId = product.id;

    resetEditor();

    if (elements.editorTitle) {
      elements.editorTitle.textContent =
        "Edit Product";
    }

    if (elements.saveProductButton) {
      elements.saveProductButton.textContent =
        "Update Product";
    }

    if (elements.productId) {
      elements.productId.value =
        product.id;
    }

    if (elements.productName) {
      elements.productName.value =
        product.name;
    }

    if (elements.productCategory) {
      elements.productCategory.value =
        product.category;
    }

    if (elements.productPrice) {
      elements.productPrice.value =
        product.price || "";
    }

    if (elements.productMaterial) {
      elements.productMaterial.value =
        product.material || "";
    }

    if (elements.productSku) {
      elements.productSku.value =
        product.sku || "";
    }

    if (elements.productDescription) {
      elements.productDescription.value =
        product.description || "";
    }

    if (elements.productPublished) {
      elements.productPublished.checked =
        product.is_published;
    }

    if (elements.productFeatured) {
      elements.productFeatured.checked =
        product.featured;
    }

    existingImages =
      getProductImages(product);

    renderImagePreviews();

    updateDescriptionCount();

    if (elements.productsView) {
      elements.productsView.classList.remove(
        "active"
      );
    }

    if (elements.addProductView) {
      elements.addProductView.classList.add(
        "active"
      );
    }

    if (elements.pageTitle) {
      elements.pageTitle.textContent =
        "Edit Product";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function resetEditor() {
    editingProductId = null;

    selectedFiles = [];
    existingImages = [];

    if (elements.productForm) {
      elements.productForm.reset();
    }

    if (elements.productId) {
      elements.productId.value = "";
    }

    if (elements.productPublished) {
      elements.productPublished.checked =
        true;
    }

    if (elements.productFeatured) {
      elements.productFeatured.checked =
        false;
    }

    if (elements.imagePreviewGrid) {
      elements.imagePreviewGrid.innerHTML =
        "";
    }

    clearEditorMessage();
    clearUploadMessage();
    updateDescriptionCount();

    if (elements.productImages) {
      elements.productImages.value = "";
    }
  }

  function handleFileSelection(event) {
    const files =
      Array.from(
        event.target.files || []
      );

    addSelectedFiles(files);

    event.target.value = "";
  }

  function addSelectedFiles(files) {
    if (!files.length) {
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (
        !ALLOWED_TYPES.includes(
          file.type
        )
      ) {
        showUploadMessage(
          `${file.name}: only JPG, PNG and WebP images are allowed.`
        );

        continue;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        showUploadMessage(
          `${file.name}: maximum file size is 6 MB.`
        );

        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      return;
    }

    selectedFiles.push(
      ...validFiles
    );

    renderImagePreviews();

    clearUploadMessage();
  }

  function setupDragAndDrop() {
    const zone =
      elements.uploadZone;

    if (!zone) {
      return;
    }

    [
      "dragenter",
      "dragover"
    ].forEach(function (eventName) {
      zone.addEventListener(
        eventName,
        function (event) {
          event.preventDefault();
          event.stopPropagation();

          zone.classList.add(
            "dragover"
          );
        }
      );
    });

    [
      "dragleave",
      "drop"
    ].forEach(function (eventName) {
      zone.addEventListener(
        eventName,
        function (event) {
          event.preventDefault();
          event.stopPropagation();

          zone.classList.remove(
            "dragover"
          );
        }
      );
    });

    zone.addEventListener(
      "drop",
      function (event) {
        const files =
          Array.from(
            event.dataTransfer
              ?.files || []
          );

        addSelectedFiles(files);
      }
    );

    zone.addEventListener(
      "click",
      function (event) {
        if (
          event.target.closest(
            "button"
          )
        ) {
          return;
        }

        if (
          event.target.closest(
            "input"
          )
        ) {
          return;
        }

        elements.productImages.click();
      }
    );
  }

  function renderImagePreviews() {
    if (!elements.imagePreviewGrid) {
      return;
    }

    const existingMarkup =
      existingImages.map(
        function (image, index) {
          const url =
            typeof image ===
            "string"
              ? image
              : image.url;

          return `
            <div
              class="image-preview ${
                index === 0
                  ? "is-primary"
                  : ""
              }"
              data-existing-index="${index}"
            >

              <img
                src="${escapeAttribute(
                  url
                )}"
                alt="Product image ${
                  index + 1
                }"
                onerror="this.style.opacity='0.35';"
              >

              ${
                index === 0
                  ? `<span class="image-preview-label">Primary</span>`
                  : ""
              }

              <button
                type="button"
                class="image-preview-remove"
                data-image-action="remove-existing"
                data-image-index="${index}"
                aria-label="Remove image"
              >
                ×
              </button>

            </div>
          `;
        }
      ).join("");

    const newMarkup =
      selectedFiles.map(
        function (file, index) {
          const previewUrl =
            URL.createObjectURL(file);

          const isPrimary =
            existingImages.length ===
              0 &&
            index === 0;

          return `
            <div
              class="image-preview ${
                isPrimary
                  ? "is-primary"
                  : ""
              }"
              data-new-index="${index}"
            >

              <img
                src="${escapeAttribute(
                  previewUrl
                )}"
                alt="${escapeAttribute(
                  file.name
                )}"
              >

              ${
                isPrimary
                  ? `<span class="image-preview-label">Primary</span>`
                  : ""
              }

              <button
                type="button"
                class="image-preview-remove"
                data-image-action="remove-new"
                data-image-index="${index}"
                aria-label="Remove selected image"
              >
                ×
              </button>

            </div>
          `;
        }
      ).join("");

    elements.imagePreviewGrid.innerHTML =
      existingMarkup +
      newMarkup;
  }

  async function handleImagePreviewClick(
    event
  ) {
    const button =
      event.target.closest(
        "[data-image-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset.imageAction;

    const index = Number(
      button.dataset.imageIndex
    );

    if (!Number.isInteger(index)) {
      return;
    }

    if (
      action ===
      "remove-new"
    ) {
      selectedFiles.splice(
        index,
        1
      );

      renderImagePreviews();

      return;
    }

    if (
      action ===
      "remove-existing"
    ) {
      await removeExistingImage(
        index
      );
    }
  }

  async function removeExistingImage(
    index
  ) {
    if (
      index < 0 ||
      index >=
        existingImages.length
    ) {
      return;
    }

    const image =
      existingImages[index];

    const confirmed =
      window.confirm(
        "Remove this image from the product?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const path =
        typeof image ===
        "object"
          ? image.path
          : "";

      if (path) {
        const { error } =
          await supabaseClient.storage
            .from(
              STORAGE_BUCKET
            )
            .remove([path]);

        if (error) {
          throw error;
        }
      }

      existingImages.splice(
        index,
        1
      );

      await saveCurrentProductImages();

      renderImagePreviews();

      showToast(
        "Image removed.",
        "success"
      );
    } catch (error) {
      console.error(
        "Image removal failed:",
        error
      );

      showToast(
        `Could not remove image: ${getErrorMessage(
          error
        )}`,
        "error"
      );
    }
  }

  async function saveCurrentProductImages() {
    if (!editingProductId) {
      return;
    }

    const images =
      existingImages.map(
        function (image) {
          if (
            typeof image ===
            "string"
          ) {
            return {
              url: image,
              path: ""
            };
          }

          return {
            url: image.url || "",
            path: image.path || ""
          };
        }
      );

    const imageUrl =
      images[0]?.url || "";

    const { error } =
      await supabaseClient
        .from("products")
        .update({
          images,
          image_url: imageUrl,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          editingProductId
        );

    if (error) {
      throw error;
    }

    const product =
      allProducts.find(
        function (item) {
          return (
            String(item.id) ===
            String(editingProductId)
          );
        }
      );

    if (product) {
      product.images = images;
      product.image_url =
        imageUrl;
    }
  }

  async function handleProductSubmit(
    event
  ) {
    event.preventDefault();

    if (!supabaseClient) {
      showEditorMessage(
        "Supabase is not connected.",
        "error"
      );

      return;
    }

    const formData =
      getProductFormData();

    const validation =
      validateProductForm(
        formData
      );

    if (!validation.valid) {
      showEditorMessage(
        validation.message,
        "error"
      );

      return;
    }

    setSaveLoading(true);

    try {
      if (editingProductId) {
        await updateProduct(
          formData
        );
      } else {
        await createProduct(
          formData
        );
      }

      await loadProducts();

      showProducts();

      resetEditor();

      showToast(
        editingProductId
          ? "Product updated successfully."
          : "Product added successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Product save failed:",
        error
      );

      showEditorMessage(
        getErrorMessage(error),
        "error"
      );

      showToast(
        "Could not save the product.",
        "error"
      );
    } finally {
      setSaveLoading(false);
    }
  }

  function getProductFormData() {
    const priceValue =
      String(
        elements.productPrice
          ?.value || ""
      ).trim();

    return {
      name: String(
        elements.productName
          ?.value || ""
      ).trim(),

      category: String(
        elements.productCategory
          ?.value || ""
      ).trim(),

      price:
        priceValue === ""
          ? 0
          : Number(priceValue),

      material: String(
        elements.productMaterial
          ?.value || ""
      ).trim(),

      sku: String(
        elements.productSku
          ?.value || ""
      ).trim(),

      description: String(
        elements.productDescription
          ?.value || ""
      ).trim(),

      is_published:
        Boolean(
          elements.productPublished
            ?.checked
        ),

      featured:
        Boolean(
          elements.productFeatured
            ?.checked
        )
    };
  }

  function validateProductForm(
    data
  ) {
    if (!data.name) {
      return {
        valid: false,
        message:
          "Please enter a product name."
      };
    }

    if (!data.category) {
      return {
        valid: false,
        message:
          "Please select a category."
      };
    }

    if (!data.description) {
      return {
        valid: false,
        message:
          "Please enter a product description."
      };
    }

    if (
      !Number.isFinite(
        data.price
      ) ||
      data.price < 0
    ) {
      return {
        valid: false,
        message:
          "Please enter a valid price."
      };
    }

    return {
      valid: true,
      message: ""
    };
  }

  async function createProduct(
    formData
  ) {
    /*
     * Create the database row first.
     * This gives us the product ID needed
     * to create a unique Storage folder.
     */
    const { data, error } =
      await supabaseClient
        .from("products")
        .insert({
          name: formData.name,
          category:
            formData.category,
          price: formData.price,
          material:
            formData.material,
          sku: formData.sku,
          description:
            formData.description,
          is_published:
            formData.is_published,
          featured:
            formData.featured,
          images: [],
          image_url: ""
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    if (!data || !data.id) {
      throw new Error(
        "Product was created but no product ID was returned."
      );
    }

    editingProductId =
      String(data.id);

    elements.productId.value =
      editingProductId;

    /*
     * Upload newly selected images.
     */
    if (selectedFiles.length) {
      const uploadedImages =
        await uploadImages(
          editingProductId
        );

      const imageUrl =
        uploadedImages[0]?.url ||
        "";

      const { error: updateError } =
        await supabaseClient
          .from("products")
          .update({
            images:
              uploadedImages,
            image_url:
              imageUrl,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            editingProductId
          );

      if (updateError) {
        throw updateError;
      }
    }
  }

  async function updateProduct(
    formData
  ) {
    if (!editingProductId) {
      throw new Error(
        "No product selected for editing."
      );
    }

    /*
     * Upload any new images first.
     */
    let uploadedImages = [];

    if (selectedFiles.length) {
      uploadedImages =
        await uploadImages(
          editingProductId
        );
    }

    const combinedImages =
      normalizeImageObjects(
        existingImages
      ).concat(
        uploadedImages
      );

    const imageUrl =
      combinedImages[0]?.url ||
      "";

    const { error } =
      await supabaseClient
        .from("products")
        .update({
          name: formData.name,
          category:
            formData.category,
          price: formData.price,
          material:
            formData.material,
          sku: formData.sku,
          description:
            formData.description,
          is_published:
            formData.is_published,
          featured:
            formData.featured,
          images:
            combinedImages,
          image_url:
            imageUrl,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          editingProductId
        );

    if (error) {
      throw error;
    }
  }

  async function uploadImages(
    productId
  ) {
    if (
      !selectedFiles.length
    ) {
      return [];
    }

    const uploaded = [];

    for (
      let index = 0;
      index <
      selectedFiles.length;
      index++
    ) {
      const file =
        selectedFiles[index];

      showUploadMessage(
        `Uploading image ${index + 1} of ${selectedFiles.length}...`
      );

      const extension =
        getFileExtension(
          file.name,
          file.type
        );

      const safeName =
        createSafeFileName(
          file.name
        );

      const path =
        `${productId}/${Date.now()}-${index}-${safeName}.${extension}`;

      const { error } =
        await supabaseClient.storage
          .from(
            STORAGE_BUCKET
          )
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type
            }
          );

      if (error) {
        throw new Error(
          `Image upload failed for ${file.name}: ${getErrorMessage(
            error
          )}`
        );
      }

      const { data } =
        supabaseClient.storage
          .from(
            STORAGE_BUCKET
          )
          .getPublicUrl(
            path
          );

      const publicUrl =
        data?.publicUrl || "";

      if (!publicUrl) {
        throw new Error(
          `Could not generate a public URL for ${file.name}.`
        );
      }

      uploaded.push({
        url: publicUrl,
        path
      });
    }

    clearUploadMessage();

    return uploaded;
  }

  function normalizeImageObjects(
    images
  ) {
    return (
      Array.isArray(images)
        ? images
        : []
    )
      .map(function (image) {
        if (
          typeof image ===
          "string"
        ) {
          return {
            url: image,
            path: ""
          };
        }

        if (
          image &&
          typeof image ===
            "object"
        ) {
          return {
            url:
              image.url ||
              image.publicUrl ||
              "",
            path:
              image.path ||
              ""
          };
        }

        return null;
      })
      .filter(function (image) {
        return (
          image &&
          image.url
        );
      });
  }

  function getProductImages(
    product
  ) {
    if (
      !product ||
      !Array.isArray(
        product.images
      )
    ) {
      if (
        product?.image_url
      ) {
        return [
          {
            url:
              product.image_url,
            path: ""
          }
        ];
      }

      return [];
    }

    const images =
      normalizeImageObjects(
        product.images
      );

    if (
      !images.length &&
      product.image_url
    ) {
      return [
        {
          url:
            product.image_url,
          path: ""
        }
      ];
    }

    return images;
  }

  async function toggleProductPublished(
    productId
  ) {
    const product =
      allProducts.find(
        function (item) {
          return (
            String(item.id) ===
            String(productId)
          );
        }
      );

    if (!product) {
      return;
    }

    try {
      const newStatus =
        !product.is_published;

      const { error } =
        await supabaseClient
          .from("products")
          .update({
            is_published:
              newStatus,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            productId
          );

      if (error) {
        throw error;
      }

      product.is_published =
        newStatus;

      product.updated_at =
        new Date().toISOString();

      updateStats();

      applyAdminFilters();

      showToast(
        newStatus
          ? "Product published."
          : "Product hidden.",
        "success"
      );
    } catch (error) {
      console.error(
        "Publish status update failed:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );
    }
  }

  function openDeleteConfirmation(
    productId
  ) {
    const product =
      allProducts.find(
        function (item) {
          return (
            String(item.id) ===
            String(productId)
          );
        }
      );

    if (!product) {
      return;
    }

    deleteTargetId =
      product.id;

    if (elements.confirmMessage) {
      elements.confirmMessage.textContent =
        `"${product.name}" will be permanently deleted along with its stored images.`;
    }

    if (elements.confirmModal) {
      elements.confirmModal.classList.add(
        "active"
      );

      elements.confirmModal.setAttribute(
        "aria-hidden",
        "false"
      );
    }
  }

  function closeConfirmModal() {
    deleteTargetId = null;

    if (elements.confirmModal) {
      elements.confirmModal.classList.remove(
        "active"
      );

      elements.confirmModal.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  }

  async function confirmDeleteProduct() {
    if (!deleteTargetId) {
      closeConfirmModal();
      return;
    }

    const productId =
      deleteTargetId;

    setDeleteLoading(true);

    try {
      const product =
        allProducts.find(
          function (item) {
            return (
              String(item.id) ===
              String(productId)
            );
          }
        );

      if (product) {
        const images =
          getProductImages(
            product
          );

        const paths =
          images
            .map(function (image) {
              return image.path;
            })
            .filter(Boolean);

        if (paths.length) {
          const { error } =
            await supabaseClient
              .storage
              .from(
                STORAGE_BUCKET
              )
              .remove(paths);

          if (error) {
            console.warn(
              "Some product images could not be removed:",
              error
            );
          }
        }
      }

      const { error } =
        await supabaseClient
          .from("products")
          .delete()
          .eq(
            "id",
            productId
          );

      if (error) {
        throw error;
      }

      allProducts =
        allProducts.filter(
          function (item) {
            return (
              String(item.id) !==
              String(productId)
            );
          }
        );

      updateStats();

      applyAdminFilters();

      closeConfirmModal();

      showToast(
        "Product deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Product deletion failed:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function setDeleteLoading(
    isLoading
  ) {
    if (!elements.confirmDelete) {
      return;
    }

    elements.confirmDelete.disabled =
      isLoading;

    elements.confirmDelete.textContent =
      isLoading
        ? "Deleting..."
        : "Delete";
  }

  function setupDescriptionCounter() {
    updateDescriptionCount();
  }

  function updateDescriptionCount() {
    if (
      !elements.productDescription ||
      !elements.descriptionCount
    ) {
      return;
    }

    const length =
      elements.productDescription
        .value.length;

    elements.descriptionCount.textContent =
      length;
  }

  function setSaveLoading(
    isLoading
  ) {
    if (!elements.saveProductButton) {
      return;
    }

    elements.saveProductButton.disabled =
      isLoading;

    elements.saveProductButton.textContent =
      isLoading
        ? "Saving..."
        : editingProductId
        ? "Update Product"
        : "Save Product";
  }

  function showEditorMessage(
    message,
    type
  ) {
    if (
      !elements.productFormMessage
    ) {
      return;
    }

    elements.productFormMessage.textContent =
      message || "";

    elements.productFormMessage.className =
      "form-message editor-message";

    if (type) {
      elements.productFormMessage.classList.add(
        type
      );
    }
  }

  function clearEditorMessage() {
    showEditorMessage(
      "",
      ""
    );
  }

  function showUploadMessage(
    message
  ) {
    if (!elements.uploadMessage) {
      return;
    }

    elements.uploadMessage.textContent =
      message || "";
  }

  function clearUploadMessage() {
    showUploadMessage("");
  }

  function showTableLoading() {
    if (!elements.productTableBody) {
      return;
    }

    elements.productTableBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="table-loading"
        >
          <div class="loading-spinner"></div>
          Loading products...
        </td>
      </tr>
    `;

    if (elements.adminEmptyState) {
      elements.adminEmptyState.hidden =
        true;
    }
  }

  function showTableError(
    message
  ) {
    if (!elements.productTableBody) {
      return;
    }

    elements.productTableBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="table-loading"
        >
          <strong>Could not load products.</strong>
          <br>
          ${escapeHTML(message)}
        </td>
      </tr>
    `;
  }

  function openSidebar() {
    if (!elements.sidebar) {
      return;
    }

    elements.sidebar.classList.add(
      "open"
    );

    elements.sidebarOverlay?.classList.add(
      "active"
    );
  }

  function closeSidebar() {
    if (!elements.sidebar) {
      return;
    }

    elements.sidebar.classList.remove(
      "open"
    );

    elements.sidebarOverlay?.classList.remove(
      "active"
    );
  }

  let lastToastMessage = "";

  function showToast(
    message,
    type
  ) {
    if (!elements.adminToast) {
      return;
    }

    if (
      message ===
      lastToastMessage
    ) {
      return;
    }

    lastToastMessage =
      message;

    clearTimeout(
      toastTimer
    );

    elements.adminToast.textContent =
      message;

    elements.adminToast.className =
      "admin-toast";

    if (type) {
      elements.adminToast.classList.add(
        type
      );
    }

    elements.adminToast.classList.add(
      "show"
    );

    toastTimer = setTimeout(
      function () {
        elements.adminToast.classList.remove(
          "show"
        );

        lastToastMessage = "";
      },
      3200
    );
  }

  function formatCategory(
    category
  ) {
    const names = {
      rings: "Rings",
      necklaces: "Necklaces",
      earrings: "Earrings",
      bangles: "Bangles",
      bracelets: "Bracelets",
      chains: "Chains",
      other: "Other"
    };

    return (
      names[
        String(
          category || ""
        ).toLowerCase()
      ] ||
      "Other"
    );
  }

  function formatCurrency(
    amount
  ) {
    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      )
    ) {
      return "₹0";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }
    ).format(
      numericAmount
    );
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(date);
  }

  function getFileExtension(
    fileName,
    mimeType
  ) {
    const extension =
      String(
        fileName || ""
      )
        .split(".")
        .pop()
        .toLowerCase();

    if (
      ["jpg", "jpeg", "png", "webp"].includes(
        extension
      )
    ) {
      return extension ===
        "jpeg"
        ? "jpg"
        : extension;
    }

    if (
      mimeType ===
      "image/png"
    ) {
      return "png";
    }

    if (
      mimeType ===
      "image/webp"
    ) {
      return "webp";
    }

    return "jpg";
  }

  function createSafeFileName(
    fileName
  ) {
    const base =
      String(
        fileName || "image"
      )
        .replace(
          /\.[^/.]+$/,
          ""
        )
        .replace(
          /[^a-zA-Z0-9_-]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .toLowerCase();

    return (
      base ||
      "image"
    );
  }

  function getErrorMessage(
    error
  ) {
    if (!error) {
      return "An unknown error occurred.";
    }

    const message =
      String(
        error.message ||
          error.error_description ||
          error.msg ||
          ""
      ).trim();

    if (message) {
      return message;
    }

    return "An unexpected error occurred.";
  }

  function escapeHTML(
    value
  ) {
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  function escapeAttribute(
    value
  ) {
    return escapeHTML(
      value
    );
  }

  function debounce(
    callback,
    delay
  ) {
    let timer = null;

    return function () {
      const context =
        this;

      const args =
        arguments;

      clearTimeout(
        timer
      );

      timer = setTimeout(
        function () {
          callback.apply(
            context,
            args
          );
        },
        delay
      );
    };
  }
})();
