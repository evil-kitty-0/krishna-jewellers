"use strict";

/*
 * ============================================================
 * KRISHNA JEWELLERS — ADMIN PANEL
 * Gold + Silver Product Management
 * ============================================================
 */

(function () {
  const CONFIG = {
    storageBucket: "jewellery",
    maxImageSize: 6 * 1024 * 1024,
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
    defaultMetal: "gold"
  };

  const CATEGORY_SETS = {
    gold: [
      { value: "ladies-rings", label: "Ladies Rings" },
      { value: "gents-rings", label: "Gents Rings" },
      { value: "necklaces", label: "Necklaces" },
      { value: "earrings", label: "Earrings" },
      { value: "ladies-chains", label: "Ladies Chains" },
      { value: "gents-chains", label: "Gents Chains" },
      { value: "single-locket", label: "Single Locket" },
      { value: "double-locket", label: "Double Locket" },
      { value: "other", label: "Other" }
    ],

    silver: [
      { value: "kids-payal", label: "Kids Payal" },
      { value: "adult-payal", label: "Adult Payal" },
      { value: "lockets", label: "Lockets" },
      { value: "male-bracelets", label: "Male Bracelets" },
      { value: "female-bracelets", label: "Female Bracelets" },
      { value: "male-chains", label: "Male Chains" },
      { value: "female-chains", label: "Female Chains" },
      { value: "other", label: "Other" }
    ]
  };

  const state = {
    supabase: null,
    session: null,
    products: [],
    currentView: "dashboard",
    metalMode: CONFIG.defaultMetal,
    productMetalFilter: "all",
    productSearch: "",
    productCategoryFilter: "all",
    productStatusFilter: "all",
    editingProductId: null,
    pendingDeleteProduct: null,
    selectedFiles: [],
    existingImages: [],
    isSaving: false,
    toastTimer: null
  };

  const $ = (selector, parent = document) => parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  function getElement(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeMetal(value) {
    const metal = String(value || "").trim().toLowerCase();

    return metal === "silver" ? "silver" : "gold";
  }

  function normalizeCategory(category, metal) {
    const value = String(category || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

    const normalizedMetal = normalizeMetal(metal);

    if (normalizedMetal === "gold") {
      const aliases = {
        ring: "ladies-rings",
        rings: "ladies-rings",
        "ladies-ring": "ladies-rings",
        "ladies-rings": "ladies-rings",
        "gents-ring": "gents-rings",
        "gents-rings": "gents-rings",

        necklace: "necklaces",
        necklaces: "necklaces",

        earring: "earrings",
        earrings: "earrings",

        chain: "gents-chains",
        chains: "gents-chains",
        "ladies-chain": "ladies-chains",
        "ladies-chains": "ladies-chains",
        "gents-chain": "gents-chains",
        "gents-chains": "gents-chains",
        "male-chain": "gents-chains",
        "male-chains": "gents-chains",
        "female-chain": "ladies-chains",
        "female-chains": "ladies-chains",

        locket: "single-locket",
        lockets: "single-locket",
        "single-locket": "single-locket",
        "double-locket": "double-locket",

        bangle: "other",
        bangles: "other",
        bracelet: "other",
        bracelets: "other",
        other: "other"
      };

      return aliases[value] || "other";
    }

    const aliases = {
      payal: "adult-payal",
      "kids-payal": "kids-payal",
      "kid-payal": "kids-payal",
      "adult-payal": "adult-payal",

      locket: "lockets",
      lockets: "lockets",

      bracelet: "male-bracelets",
      bracelets: "male-bracelets",
      "male-bracelet": "male-bracelets",
      "male-bracelets": "male-bracelets",
      "female-bracelet": "female-bracelets",
      "female-bracelets": "female-bracelets",

      chain: "male-chains",
      chains: "male-chains",
      "male-chain": "male-chains",
      "male-chains": "male-chains",
      "female-chain": "female-chains",
      "female-chains": "female-chains",

      other: "other"
    };

    return aliases[value] || "other";
  }

  function formatCategory(category) {
    const allCategories = [
      ...CATEGORY_SETS.gold,
      ...CATEGORY_SETS.silver
    ];

    const found = allCategories.find((item) => item.value === category);

    if (found) {
      return found.label;
    }

    return String(category || "Other")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatMetal(metal) {
    return normalizeMetal(metal) === "silver" ? "Silver" : "Gold";
  }

  function formatPrice(price) {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return "Price on enquiry";
    }

    return `₹${numericPrice.toLocaleString("en-IN")}`;
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function getCategorySet(metal = state.metalMode) {
    return CATEGORY_SETS[normalizeMetal(metal)];
  }

  function getCategoryLabel(metal, category) {
    const categories = getCategorySet(metal);
    const found = categories.find((item) => item.value === category);

    return found ? found.label : formatCategory(category);
  }

  function normalizeProduct(product) {
    const metal = normalizeMetal(product?.metal);

    return {
      ...product,
      metal,
      category: normalizeCategory(product?.category, metal),
      name: String(product?.name || "Unnamed Product"),
      description: String(product?.description || ""),
      material: String(product?.material || ""),
      sku: String(product?.sku || ""),
      image_url: String(product?.image_url || ""),
      images: Array.isArray(product?.images)
        ? product.images.filter(Boolean)
        : [],
      is_published: Boolean(product?.is_published),
      featured: Boolean(product?.featured)
    };
  }

  /* ==========================================================
     SUPABASE
     ========================================================== */

  function getSupabaseConfig() {
    const config = window.KRISHNA_SUPABASE;

    if (!config || !config.url || !config.key) {
      throw new Error(
        "Supabase configuration is missing. Please check supabase-config.js."
      );
    }

    return config;
  }

  function createSupabaseClient() {
    if (state.supabase) {
      return state.supabase;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error(
        "Supabase library could not be loaded. Please check the internet connection and admin.html."
      );
    }

    const config = getSupabaseConfig();

    state.supabase = window.supabase.createClient(
      config.url,
      config.key,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    return state.supabase;
  }

  /* ==========================================================
     UI HELPERS
     ========================================================== */

  function showLoginScreen() {
    const loginScreen = getElement("loginScreen");
    const adminApp = getElement("adminApp");

    if (loginScreen) {
      loginScreen.style.display = "flex";
    }

    if (adminApp) {
      adminApp.classList.add("is-hidden");
      adminApp.style.display = "none";
    }
  }

  function showAdminApp() {
    const loginScreen = getElement("loginScreen");
    const adminApp = getElement("adminApp");

    if (loginScreen) {
      loginScreen.style.display = "none";
    }

    if (adminApp) {
      adminApp.classList.remove("is-hidden");
      adminApp.style.display = "";
    }
  }

  function setLoginMessage(message, type = "info") {
    const element = getElement("loginMessage");

    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.className = `form-message ${type}`;
  }

  function setFormMessage(message, type = "info") {
    const element = getElement("productFormMessage");

    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.className = `form-message ${type}`;
  }

  function clearFormMessage() {
    setFormMessage("");
  }

  function showToast(message, type = "success") {
    const toast = getElement("adminToast");
    const toastMessage = getElement("adminToastMessage");

    if (!toast || !toastMessage) {
      return;
    }

    toastMessage.textContent = message || "";

    toast.classList.remove("success", "error", "warning", "show");
    toast.classList.add(type);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }

    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  function setButtonLoading(button, loading, loadingText = "Saving...") {
    if (!button) {
      return;
    }

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent.trim();
      }

      button.disabled = true;
      button.textContent = loadingText;
    } else {
      button.disabled = false;

      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
        delete button.dataset.originalText;
      }
    }
  }

  /* ==========================================================
     AUTHENTICATION
     ========================================================== */

  async function checkAdminUser(userId) {
    if (!userId) {
      return false;
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Admin verification error:", error);
      throw error;
    }

    return Boolean(data);
  }

  async function handleLogin(event) {
    event.preventDefault();

    const emailInput = getElement("loginEmail");
    const passwordInput = getElement("loginPassword");
    const submitButton = getElement("loginButton");

    const email = String(emailInput?.value || "").trim();
    const password = String(passwordInput?.value || "");

    if (!email || !password) {
      setLoginMessage("Please enter your email and password.", "error");
      return;
    }

    const supabase = createSupabaseClient();

    setButtonLoading(submitButton, true, "Signing in...");
    setLoginMessage("Signing in...", "info");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error("Login succeeded but no user was returned.");
      }

      const isAdmin = await checkAdminUser(data.user.id);

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error(
          "This account does not have administrator access."
        );
      }

      state.session = data.session;

      setLoginMessage("Login successful. Loading admin panel...", "success");

      await initializeAdmin(data.session);

    } catch (error) {
      console.error("Login error:", error);

      setLoginMessage(
        error?.message || "Unable to sign in. Please check your details.",
        "error"
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  }

  async function handleLogout() {
    try {
      const supabase = createSupabaseClient();

      await supabase.auth.signOut();

      state.session = null;
      state.products = [];

      showLoginScreen();
      closeMobileSidebar();

      setLoginMessage("You have been signed out.", "success");

    } catch (error) {
      console.error("Logout error:", error);
      showToast("Unable to sign out completely.", "error");
    }
  }

  async function initializeAuth() {
    const supabase = createSupabaseClient();

    showLoginScreen();

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {
      try {
        const isAdmin = await checkAdminUser(session.user.id);

        if (isAdmin) {
          state.session = session;
          await initializeAdmin(session);
          return;
        }

        await supabase.auth.signOut();

      } catch (error) {
        console.error("Existing session verification failed:", error);
      }
    }

    showLoginScreen();

    supabase.auth.onAuthStateChange(async (event, sessionData) => {
      if (event === "SIGNED_OUT") {
        state.session = null;
        showLoginScreen();
        return;
      }

      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        sessionData?.user
      ) {
        try {
          const isAdmin = await checkAdminUser(sessionData.user.id);

          if (!isAdmin) {
            await supabase.auth.signOut();
            setLoginMessage(
              "This account does not have administrator access.",
              "error"
            );
            return;
          }

          state.session = sessionData;

          if (event === "SIGNED_IN") {
            await initializeAdmin(sessionData);
          }
        } catch (error) {
          console.error("Auth state verification failed:", error);
        }
      }
    });
  }

  /* ==========================================================
     INITIALIZATION
     ========================================================== */

  async function initializeAdmin(session) {
    state.session = session;

    showAdminApp();

    const emailElement = getElement("adminUserEmail");

    if (emailElement) {
      emailElement.textContent = session?.user?.email || "";
    }

    setMetalMode(state.metalMode, false);

    bindNavigation();
    bindMetalControls();
    bindProductControls();
    bindFormControls();
    bindModalControls();

    resetProductForm();

    await loadProducts();
    showView(state.currentView);
  }

  /* ==========================================================
     NAVIGATION
     ========================================================== */

  function bindNavigation() {
    $$(".sidebar-nav-item").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener("click", () => {
        const view = button.dataset.view;

        if (!view) {
          return;
        }

        showView(view);
        closeMobileSidebar();
      });
    });

    const logoutButton = getElement("logoutButton");

    if (logoutButton && logoutButton.dataset.bound !== "true") {
      logoutButton.dataset.bound = "true";
      logoutButton.addEventListener("click", handleLogout);
    }

    const mobileToggle = getElement("mobileSidebarToggle");

    if (mobileToggle && mobileToggle.dataset.bound !== "true") {
      mobileToggle.dataset.bound = "true";

      mobileToggle.addEventListener("click", toggleMobileSidebar);
    }

    const overlay = getElement("adminSidebarOverlay");

    if (overlay && overlay.dataset.bound !== "true") {
      overlay.dataset.bound = "true";

      overlay.addEventListener("click", closeMobileSidebar);
    }
  }

  function showView(view) {
    const allowedViews = ["dashboard", "products", "add-product"];

    state.currentView = allowedViews.includes(view)
      ? view
      : "dashboard";

    $$(".admin-view").forEach((section) => {
      section.classList.toggle(
        "active",
        section.dataset.view === state.currentView
      );
    });

    $$(".sidebar-nav-item").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.view === state.currentView
      );
    });

    const headerTitle = getElement("adminHeaderTitle");
    const headerSubtitle = getElement("adminHeaderSubtitle");

    const titles = {
      dashboard: {
        title: "Dashboard",
        subtitle: "Overview of your jewellery catalogue."
      },
      products: {
        title: "Products",
        subtitle: "Manage Gold and Silver jewellery."
      },
      "add-product": {
        title: state.editingProductId ? "Edit Product" : "Add Product",
        subtitle: state.editingProductId
          ? "Update the selected jewellery item."
          : "Add a new jewellery item to your catalogue."
      }
    };

    const current = titles[state.currentView];

    if (headerTitle) {
      headerTitle.textContent = current.title;
    }

    if (headerSubtitle) {
      headerSubtitle.textContent = current.subtitle;
    }

    if (state.currentView === "dashboard") {
      renderDashboard();
    }

    if (state.currentView === "products") {
      renderProducts();
    }
  }

  function toggleMobileSidebar() {
    const sidebar = $(".admin-sidebar");
    const overlay = getElement("adminSidebarOverlay");

    if (!sidebar) {
      return;
    }

    const open = sidebar.classList.toggle("mobile-open");

    if (overlay) {
      overlay.classList.toggle("active", open);
    }
  }

  function closeMobileSidebar() {
    const sidebar = $(".admin-sidebar");
    const overlay = getElement("adminSidebarOverlay");

    if (sidebar) {
      sidebar.classList.remove("mobile-open");
    }

    if (overlay) {
      overlay.classList.remove("active");
    }
  }

  /* ==========================================================
     METAL MODE
     ========================================================== */

  function bindMetalControls() {
    const toggle = getElement("adminMetalToggle");

    if (toggle && toggle.dataset.bound !== "true") {
      toggle.dataset.bound = "true";

      toggle.addEventListener("click", () => {
        const nextMetal =
          state.metalMode === "gold"
            ? "silver"
            : "gold";

        setMetalMode(nextMetal, true);
      });
    }

    $$("[data-product-metal]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener("click", () => {
        const value = button.dataset.productMetal;

        state.productMetalFilter =
          value === "gold" || value === "silver"
            ? value
            : "all";

        $$("[data-product-metal]").forEach((item) => {
          item.classList.toggle(
            "active",
            item.dataset.productMetal === state.productMetalFilter
          );
        });

        updateCategoryFilterOptions();
        renderProducts();
      });
    });
  }

  function setMetalMode(metal, refresh = true) {
    state.metalMode = normalizeMetal(metal);

    document.body.classList.toggle(
      "admin-silver-mode",
      state.metalMode === "silver"
    );

    const toggle = getElement("adminMetalToggle");

    if (toggle) {
      toggle.classList.toggle(
        "silver",
        state.metalMode === "silver"
      );

      toggle.setAttribute(
        "aria-pressed",
        state.metalMode === "silver" ? "true" : "false"
      );
    }

    const goldLabel = getElement("goldAdminLabel");
    const silverLabel = getElement("silverAdminLabel");

    if (goldLabel) {
      goldLabel.classList.toggle(
        "active",
        state.metalMode === "gold"
      );

      goldLabel.classList.remove("silver-active");
    }

    if (silverLabel) {
      silverLabel.classList.toggle(
        "active",
        state.metalMode === "silver"
      );

      silverLabel.classList.toggle(
        "silver-active",
        state.metalMode === "silver"
      );
    }

    const productMetalInput = getElement("productMetal");

    if (
      productMetalInput &&
      document.activeElement !== productMetalInput &&
      !state.editingProductId
    ) {
      productMetalInput.value = state.metalMode;
      updateCategoryOptions(state.metalMode);
    }

    const sidebarModeText = $(".sidebar-mode-value");

    if (sidebarModeText) {
      sidebarModeText.innerHTML = `
        <span class="sidebar-mode-dot"></span>
        ${escapeHtml(formatMetal(state.metalMode))} Catalogue
      `;
    }

    if (refresh) {
      updateCategoryFilterOptions();
      renderProducts();
      renderDashboard();
    }
  }

  /* ==========================================================
     CATEGORY SELECTS
     ========================================================== */

  function updateCategoryOptions(metal, selectedValue = "") {
    const select = getElement("productCategory");

    if (!select) {
      return;
    }

    const normalizedMetal = normalizeMetal(metal);
    const categories = getCategorySet(normalizedMetal);

    const selected =
      categories.some((category) => category.value === selectedValue)
        ? selectedValue
        : categories[0]?.value || "";

    select.innerHTML = categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category.value)}">${escapeHtml(
            category.label
          )}</option>`
      )
      .join("");

    if (selected) {
      select.value = selected;
    }
  }

  function updateCategoryFilterOptions() {
    const select = getElement("productCategoryFilter");

    if (!select) {
      return;
    }

    const filterMetal =
      state.productMetalFilter === "all"
        ? state.metalMode
        : state.productMetalFilter;

    const categories = getCategorySet(filterMetal);

    const previousValue = state.productCategoryFilter;

    select.innerHTML = `
      <option value="all">All Categories</option>
      ${categories
        .map(
          (category) =>
            `<option value="${escapeHtml(category.value)}">${escapeHtml(
              category.label
            )}</option>`
        )
        .join("")}
    `;

    if (
      previousValue === "all" ||
      categories.some(
        (category) => category.value === previousValue
      )
    ) {
      select.value = previousValue;
    } else {
      state.productCategoryFilter = "all";
      select.value = "all";
    }
  }

  /* ==========================================================
     PRODUCT CONTROLS
     ========================================================== */

  function bindProductControls() {
    const search = getElement("productSearch");

    if (search && search.dataset.bound !== "true") {
      search.dataset.bound = "true";

      search.addEventListener("input", () => {
        state.productSearch = search.value.trim().toLowerCase();
        renderProducts();
      });
    }

    const categoryFilter = getElement("productCategoryFilter");

    if (
      categoryFilter &&
      categoryFilter.dataset.bound !== "true"
    ) {
      categoryFilter.dataset.bound = "true";

      categoryFilter.addEventListener("change", () => {
        state.productCategoryFilter = categoryFilter.value;
        renderProducts();
      });
    }

    const statusFilter = getElement("productStatusFilter");

    if (
      statusFilter &&
      statusFilter.dataset.bound !== "true"
    ) {
      statusFilter.dataset.bound = "true";

      statusFilter.addEventListener("change", () => {
        state.productStatusFilter = statusFilter.value;
        renderProducts();
      });
    }

    const addButtons = $$(
      '[data-action="add-product"]'
    );

    addButtons.forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener("click", () => {
        startNewProduct();
      });
    });

    const refreshButton = getElement("refreshProductsButton");

    if (
      refreshButton &&
      refreshButton.dataset.bound !== "true"
    ) {
      refreshButton.dataset.bound = "true";

      refreshButton.addEventListener("click", async () => {
        await loadProducts();
      });
    }

    const table = getElement("productsTable");

    if (table && table.dataset.bound !== "true") {
      table.dataset.bound = "true";

      table.addEventListener("click", handleProductTableClick);
    }
  }

  function handleProductTableClick(event) {
    const actionButton = event.target.closest("[data-product-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.productAction;
    const productId = actionButton.dataset.productId;

    if (!productId) {
      return;
    }

    if (action === "edit") {
      editProduct(productId);
      return;
    }

    if (action === "delete") {
      openDeleteModal(productId);
      return;
    }

    if (action === "toggle-publish") {
      togglePublished(productId);
    }
  }

  /* ==========================================================
     LOAD PRODUCTS
     ========================================================== */

  async function loadProducts() {
    const table = getElement("productsTable");

    if (table) {
      table.innerHTML = `
        <div class="admin-loading">
          Loading jewellery products...
        </div>
      `;
    }

    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false
        });

      if (error) {
        throw error;
      }

      state.products = Array.isArray(data)
        ? data.map(normalizeProduct)
        : [];

      updateCategoryFilterOptions();
      renderDashboard();
      renderProducts();

    } catch (error) {
      console.error("Product loading error:", error);

      if (table) {
        table.innerHTML = `
          <div class="admin-empty-state">
            <div>
              <div class="admin-empty-state-icon">!</div>
              <h3>Unable to load products</h3>
              <p>${escapeHtml(
                error?.message ||
                  "Please check your Supabase connection and try again."
              )}</p>
            </div>
          </div>
        `;
      }

      showToast(
        error?.message || "Unable to load products.",
        "error"
      );
    }
  }

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  function renderDashboard() {
    const total = state.products.length;

    const published = state.products.filter(
      (product) => product.is_published
    ).length;

    const featured = state.products.filter(
      (product) => product.featured
    ).length;

    const categories = new Set(
      state.products
        .filter(
          (product) =>
            normalizeMetal(product.metal) === state.metalMode
        )
        .map((product) => product.category)
    );

    const totalElement = getElement("totalProducts");
    const publishedElement = getElement("publishedProducts");
    const featuredElement = getElement("featuredProducts");
    const categoryElement = getElement("categoryCount");

    if (totalElement) {
      totalElement.textContent = total;
    }

    if (publishedElement) {
      publishedElement.textContent = published;
    }

    if (featuredElement) {
      featuredElement.textContent = featured;
    }

    if (categoryElement) {
      categoryElement.textContent = categories.size;
    }

    const metalProducts = state.products.filter(
      (product) =>
        normalizeMetal(product.metal) === state.metalMode
    );

    const dashboardMetalCount = getElement("dashboardMetalCount");

    if (dashboardMetalCount) {
      dashboardMetalCount.textContent = metalProducts.length;
    }

    const dashboardMetalName = getElement("dashboardMetalName");

    if (dashboardMetalName) {
      dashboardMetalName.textContent = formatMetal(
        state.metalMode
      );
    }
  }

  /* ==========================================================
     FILTER PRODUCTS
     ========================================================== */

  function getFilteredProducts() {
    return state.products.filter((product) => {
      if (
        state.productMetalFilter !== "all" &&
        product.metal !== state.productMetalFilter
      ) {
        return false;
      }

      if (
        state.productCategoryFilter !== "all" &&
        product.category !== state.productCategoryFilter
      ) {
        return false;
      }

      if (state.productStatusFilter === "published") {
        if (!product.is_published) {
          return false;
        }
      }

      if (state.productStatusFilter === "draft") {
        if (product.is_published) {
          return false;
        }
      }

      if (state.productStatusFilter === "featured") {
        if (!product.featured) {
          return false;
        }
      }

      if (state.productSearch) {
        const searchable = [
          product.name,
          product.sku,
          product.category,
          product.metal,
          product.material,
          product.description
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(state.productSearch)) {
          return false;
        }
      }

      return true;
    });
  }

  /* ==========================================================
     RENDER PRODUCTS
     ========================================================== */

  function renderProducts() {
    const container = getElement("productsTable");

    if (!container) {
      return;
    }

    const products = getFilteredProducts();

    if (!products.length) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <div>
            <div class="admin-empty-state-icon">◇</div>
            <h3>No products found</h3>
            <p>
              There are no products matching your current filters.
              Add a new product or change the filters above.
            </p>
          </div>
        </div>
      `;
      return;
    }

    const rows = products.map((product) => {
      const image = getPrimaryImage(product);

      return `
        <tr>
          <td>
            <div class="admin-product-name-cell">
              <div class="admin-product-thumb">
                ${
                  image
                    ? `<img src="${escapeHtml(
                        image
                      )}" alt="${escapeHtml(product.name)}" loading="lazy">`
                    : `<div class="admin-product-thumb-placeholder">◇</div>`
                }
              </div>

              <div>
                <p class="admin-product-name">
                  ${escapeHtml(product.name)}
                </p>

                ${
                  product.sku
                    ? `<p class="admin-product-sku">SKU: ${escapeHtml(
                        product.sku
                      )}</p>`
                    : ""
                }
              </div>
            </div>
          </td>

          <td>
            <span class="admin-metal-badge ${escapeHtml(
              product.metal
            )}">
              ${escapeHtml(formatMetal(product.metal))}
            </span>
          </td>

          <td>
            <span class="admin-category-badge">
              ${escapeHtml(
                getCategoryLabel(
                  product.metal,
                  product.category
                )
              )}
            </span>
          </td>

          <td>
            ${escapeHtml(formatPrice(product.price))}
          </td>

          <td>
            ${
              product.is_published
                ? `<span class="admin-status-badge published">Published</span>`
                : `<span class="admin-status-badge draft">Draft</span>`
            }
          </td>

          <td>
            ${
              product.featured
                ? `<span class="admin-featured-badge">Featured</span>`
                : `<span style="color:#aaa;font-size:11px;">—</span>`
            }
          </td>

          <td>
            <div class="admin-table-actions">
              <button
                type="button"
                class="table-action-button"
                data-product-action="edit"
                data-product-id="${escapeHtml(product.id)}"
              >
                Edit
              </button>

              <button
                type="button"
                class="table-action-button"
                data-product-action="toggle-publish"
                data-product-id="${escapeHtml(product.id)}"
              >
                ${product.is_published ? "Unpublish" : "Publish"}
              </button>

              <button
                type="button"
                class="table-action-button danger"
                data-product-action="delete"
                data-product-id="${escapeHtml(product.id)}"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <div class="admin-product-table-wrap">
        <table class="admin-product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Metal</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Featured</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  function getPrimaryImage(product) {
    if (product.image_url) {
      return product.image_url;
    }

    if (Array.isArray(product.images) && product.images.length) {
      return product.images[0];
    }

    return "";
  }

  /* ==========================================================
     ADD / EDIT PRODUCT
     ========================================================== */

  function startNewProduct() {
    state.editingProductId = null;
    state.selectedFiles = [];
    state.existingImages = [];

    resetProductForm();

    const productMetal = getElement("productMetal");

    if (productMetal) {
      productMetal.value = state.metalMode;
    }

    updateCategoryOptions(state.metalMode);

    showView("add-product");

    const nameInput = getElement("productName");

    if (nameInput) {
      window.setTimeout(() => nameInput.focus(), 100);
    }
  }

  function editProduct(productId) {
    const product = state.products.find(
      (item) => String(item.id) === String(productId)
    );

    if (!product) {
      showToast("Product could not be found.", "error");
      return;
    }

    state.editingProductId = product.id;
    state.selectedFiles = [];
    state.existingImages = Array.isArray(product.images)
      ? [...product.images]
      : [];

    const productIdInput = getElement("productId");
    const nameInput = getElement("productName");
    const metalInput = getElement("productMetal");
    const categoryInput = getElement("productCategory");
    const priceInput = getElement("productPrice");
    const skuInput = getElement("productSku");
    const materialInput = getElement("productMaterial");
    const descriptionInput = getElement("productDescription");
    const publishedInput = getElement("productPublished");
    const featuredInput = getElement("productFeatured");

    if (productIdInput) {
      productIdInput.value = product.id;
    }

    if (nameInput) {
      nameInput.value = product.name;
    }

    if (metalInput) {
      metalInput.value = product.metal;
    }

    updateCategoryOptions(
      product.metal,
      product.category
    );

    if (priceInput) {
      priceInput.value =
        product.price === null ||
        product.price === undefined
          ? ""
          : product.price;
    }

    if (skuInput) {
      skuInput.value = product.sku;
    }

    if (materialInput) {
      materialInput.value = product.material;
    }

    if (descriptionInput) {
      descriptionInput.value = product.description;
    }

    if (publishedInput) {
      publishedInput.checked = product.is_published;
    }

    if (featuredInput) {
      featuredInput.checked = product.featured;
    }

    renderImagePreview();

    clearFormMessage();

    showView("add-product");

    window.setTimeout(() => {
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
  }

  function resetProductForm() {
    const form = getElement("productForm");

    if (form) {
      form.reset();
    }

    state.editingProductId = null;
    state.selectedFiles = [];
    state.existingImages = [];

    const productId = getElement("productId");
    const metal = getElement("productMetal");
    const published = getElement("productPublished");
    const featured = getElement("productFeatured");

    if (productId) {
      productId.value = "";
    }

    if (metal) {
      metal.value = CONFIG.defaultMetal;
      updateCategoryOptions(CONFIG.defaultMetal);
    }

    if (published) {
      published.checked = true;
    }

    if (featured) {
      featured.checked = false;
    }

    renderImagePreview();
    clearFormMessage();

    const saveButton = getElement("saveProductButton");

    if (saveButton) {
      saveButton.textContent = "Save Product";
    }
  }

  function bindFormControls() {
    const form = getElement("productForm");

    if (form && form.dataset.bound !== "true") {
      form.dataset.bound = "true";
      form.addEventListener("submit", handleProductSubmit);
    }

    const cancelButton = getElement("cancelProductButton");

    if (
      cancelButton &&
      cancelButton.dataset.bound !== "true"
    ) {
      cancelButton.dataset.bound = "true";

      cancelButton.addEventListener("click", () => {
        resetProductForm();
        showView("products");
      });
    }

    const metalInput = getElement("productMetal");

    if (
      metalInput &&
      metalInput.dataset.bound !== "true"
    ) {
      metalInput.dataset.bound = "true";

      metalInput.addEventListener("change", () => {
        const metal = normalizeMetal(metalInput.value);

        const currentCategory =
          getElement("productCategory")?.value || "";

        const validCategory = getCategorySet(metal).some(
          (category) => category.value === currentCategory
        )
          ? currentCategory
          : "";

        updateCategoryOptions(metal, validCategory);
      });
    }

    const imageInput = getElement("productImages");

    if (
      imageInput &&
      imageInput.dataset.bound !== "true"
    ) {
      imageInput.dataset.bound = "true";

      imageInput.addEventListener("change", handleImageSelection);
    }

    const imagePreview = getElement("imagePreview");

    if (
      imagePreview &&
      imagePreview.dataset.bound !== "true"
    ) {
      imagePreview.dataset.bound = "true";

      imagePreview.addEventListener(
        "click",
        handleImagePreviewClick
      );
    }
  }

  /* ==========================================================
     IMAGE HANDLING
     ========================================================== */

  function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!CONFIG.allowedImageTypes.includes(file.type)) {
        showToast(
          `${file.name}: only JPG, PNG and WebP images are allowed.`,
          "error"
        );
        continue;
      }

      if (file.size > CONFIG.maxImageSize) {
        showToast(
          `${file.name}: image must be 6MB or smaller.`,
          "error"
        );
        continue;
      }

      validFiles.push(file);
    }

    state.selectedFiles = [
      ...state.selectedFiles,
      ...validFiles
    ];

    event.target.value = "";

    renderImagePreview();
  }

  function handleImagePreviewClick(event) {
    const removeButton = event.target.closest(
      "[data-remove-image]"
    );

    if (!removeButton) {
      return;
    }

    const type = removeButton.dataset.removeImage;

    if (type === "new") {
      const index = Number(removeButton.dataset.index);

      if (Number.isInteger(index)) {
        state.selectedFiles.splice(index, 1);
      }
    }

    if (type === "existing") {
      const index = Number(removeButton.dataset.index);

      if (Number.isInteger(index)) {
        state.existingImages.splice(index, 1);
      }
    }

    renderImagePreview();
  }

  function renderImagePreview() {
    const preview = getElement("imagePreview");

    if (!preview) {
      return;
    }

    if (
      !state.selectedFiles.length &&
      !state.existingImages.length
    ) {
      preview.classList.add("image-preview-empty");
      preview.innerHTML = "";
      return;
    }

    preview.classList.remove("image-preview-empty");

    const existingMarkup = state.existingImages
      .map(
        (url, index) => `
          <div class="image-preview-item">
            <img
              src="${escapeHtml(url)}"
              alt="Existing product image ${index + 1}"
            >

            <button
              type="button"
              class="image-preview-item-remove"
              data-remove-image="existing"
              data-index="${index}"
              aria-label="Remove existing image"
              title="Remove image"
            >
              ×
            </button>
          </div>
        `
      )
      .join("");

    const newMarkup = state.selectedFiles
      .map(
        (file, index) => `
          <div class="image-preview-item">
            <img
              src="${URL.createObjectURL(file)}"
              alt="${escapeHtml(file.name)}"
            >

            <button
              type="button"
              class="image-preview-item-remove"
              data-remove-image="new"
              data-index="${index}"
              aria-label="Remove selected image"
              title="Remove image"
            >
              ×
            </button>
          </div>
        `
      )
      .join("");

    preview.innerHTML = existingMarkup + newMarkup;
  }

  /* ==========================================================
     PRODUCT VALIDATION
     ========================================================== */

  function collectProductFormData() {
    const name = String(
      getElement("productName")?.value || ""
    ).trim();

    const metal = normalizeMetal(
      getElement("productMetal")?.value
    );

    const category = normalizeCategory(
      getElement("productCategory")?.value,
      metal
    );

    const priceRaw = String(
      getElement("productPrice")?.value || ""
    ).trim();

    const sku = String(
      getElement("productSku")?.value || ""
    ).trim();

    const material = String(
      getElement("productMaterial")?.value || ""
    ).trim();

    const description = String(
      getElement("productDescription")?.value || ""
    ).trim();

    const isPublished = Boolean(
      getElement("productPublished")?.checked
    );

    const featured = Boolean(
      getElement("productFeatured")?.checked
    );

    if (!name) {
      throw new Error("Please enter the product name.");
    }

    if (!CATEGORY_SETS[metal].some(
      (item) => item.value === category
    )) {
      throw new Error("Please select a valid category.");
    }

    let price = null;

    if (priceRaw) {
      price = Number(
        priceRaw.replace(/,/g, "")
      );

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(
          "Please enter a valid price."
        );
      }
    }

    return {
      name,
      metal,
      category,
      price,
      sku,
      material,
      description,
      is_published: isPublished,
      featured
    };
  }

  /* ==========================================================
     SAVE PRODUCT
     ========================================================== */

  async function handleProductSubmit(event) {
    event.preventDefault();

    if (state.isSaving) {
      return;
    }

    let formData;

    try {
      formData = collectProductFormData();
    } catch (error) {
      setFormMessage(
        error?.message || "Please check the form.",
        "error"
      );
      return;
    }

    const wasEditing = Boolean(state.editingProductId);

    state.isSaving = true;

    const saveButton = getElement("saveProductButton");

    setButtonLoading(
      saveButton,
      true,
      wasEditing ? "Updating..." : "Saving..."
    );

    setFormMessage(
      wasEditing
        ? "Updating product..."
        : "Saving product...",
      "info"
    );

    try {
      const supabase = createSupabaseClient();

      const uploadedUrls = await uploadSelectedImages(
        formData.metal
      );

      const allImages = [
        ...state.existingImages,
        ...uploadedUrls
      ];

      const imageUrl = allImages[0] || "";

      const payload = {
        name: formData.name,
        metal: formData.metal,
        category: formData.category,
        price: formData.price,
        sku: formData.sku || null,
        material: formData.material || null,
        description: formData.description || null,
        image_url: imageUrl || null,
        images: allImages,
        is_published: formData.isPublished,
        featured: formData.featured,
        updated_at: new Date().toISOString()
      };

      let savedProduct;

      if (wasEditing) {
        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", state.editingProductId)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        savedProduct = normalizeProduct(data);

      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        savedProduct = normalizeProduct(data);
      }

      if (!savedProduct) {
        throw new Error(
          "The product was saved but could not be returned."
        );
      }

      if (wasEditing) {
        const oldProduct = state.products.find(
          (product) =>
            String(product.id) ===
            String(state.editingProductId)
        );

        if (oldProduct) {
          const removedImages = getRemovedExistingImages(
            oldProduct,
            state.existingImages
          );

          if (removedImages.length) {
            await deleteStorageImages(
              removedImages
            );
          }
        }
      }

      const index = state.products.findIndex(
        (product) =>
          String(product.id) ===
          String(savedProduct.id)
      );

      if (index >= 0) {
        state.products[index] = savedProduct;
      } else {
        state.products.unshift(savedProduct);
      }

      showToast(
        wasEditing
          ? "Product updated successfully."
          : "Product added successfully.",
        "success"
      );

      resetProductForm();
      updateCategoryFilterOptions();
      renderDashboard();
      renderProducts();
      showView("products");

    } catch (error) {
      console.error("Product save error:", error);

      setFormMessage(
        error?.message ||
          "Unable to save the product. Please try again.",
        "error"
      );

      showToast(
        error?.message ||
          "Unable to save the product.",
        "error"
      );

    } finally {
      state.isSaving = false;
      setButtonLoading(saveButton, false);
    }
  }

  /* ==========================================================
     IMAGE UPLOAD TO SUPABASE STORAGE
     ========================================================== */

  async function uploadSelectedImages(metal) {
    if (!state.selectedFiles.length) {
      return [];
    }

    const supabase = createSupabaseClient();

    const uploadedUrls = [];

    for (const file of state.selectedFiles) {
      const extension = getFileExtension(file.name);

      const safeMetal = normalizeMetal(metal);

      const uniqueName = [
        safeMetal,
        Date.now(),
        Math.random().toString(36).slice(2, 10),
        extension
      ].join(".");

      const path = `${safeMetal}/${uniqueName}`;

      const { error } = await supabase.storage
        .from(CONFIG.storageBucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (error) {
        throw new Error(
          `Unable to upload ${file.name}: ${error.message}`
        );
      }

      const {
        data: publicData
      } = supabase.storage
        .from(CONFIG.storageBucket)
        .getPublicUrl(path);

      const publicUrl = publicData?.publicUrl || "";

      if (!publicUrl) {
        throw new Error(
          `Image ${file.name} uploaded but its public URL could not be created.`
        );
      }

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  }

  function getFileExtension(fileName) {
    const name = String(fileName || "");
    const lastDot = name.lastIndexOf(".");

    if (lastDot === -1) {
      return "jpg";
    }

    return name
      .slice(lastDot + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  }

  function getRemovedExistingImages(
    oldProduct,
    remainingImages
  ) {
    const oldImages = Array.isArray(oldProduct.images)
      ? oldProduct.images
      : [];

    const remainingSet = new Set(
      remainingImages || []
    );

    return oldImages.filter(
      (image) => image && !remainingSet.has(image)
    );
  }

  /* ==========================================================
     STORAGE DELETE
     ========================================================== */

  async function deleteStorageImages(images) {
    if (!Array.isArray(images) || !images.length) {
      return;
    }

    const supabase = createSupabaseClient();

    const paths = images
      .map(getStoragePathFromUrl)
      .filter(Boolean);

    if (!paths.length) {
      return;
    }

    const { error } = await supabase.storage
      .from(CONFIG.storageBucket)
      .remove(paths);

    if (error) {
      console.warn(
        "Some storage images could not be deleted:",
        error
      );
    }
  }

  function getStoragePathFromUrl(url) {
    if (!url) {
      return "";
    }

    try {
      const parsed = new URL(url);

      const marker =
        `/storage/v1/object/public/${CONFIG.storageBucket}/`;

      const markerIndex =
        parsed.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return "";
      }

      return decodeURIComponent(
        parsed.pathname.slice(
          markerIndex + marker.length
        )
      );
    } catch (error) {
      console.warn(
        "Could not parse storage URL:",
        url,
        error
      );

      return "";
    }
  }

  /* ==========================================================
     PUBLISH / UNPUBLISH
     ========================================================== */

  async function togglePublished(productId) {
    const product = state.products.find(
      (item) =>
        String(item.id) === String(productId)
    );

    if (!product) {
      showToast(
        "Product could not be found.",
        "error"
      );
      return;
    }

    const nextPublished = !product.is_published;

    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from("products")
        .update({
          is_published: nextPublished,
          updated_at: new Date().toISOString()
        })
        .eq("id", product.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const updatedProduct = normalizeProduct(data);

      const index = state.products.findIndex(
        (item) =>
          String(item.id) === String(product.id)
      );

      if (index >= 0) {
        state.products[index] = updatedProduct;
      }

      renderProducts();
      renderDashboard();

      showToast(
        nextPublished
          ? "Product published."
          : "Product unpublished.",
        "success"
      );

    } catch (error) {
      console.error(
        "Publish toggle error:",
        error
      );

      showToast(
        error?.message ||
          "Unable to update product status.",
        "error"
      );
    }
  }

  /* ==========================================================
     DELETE
     ========================================================== */

  function openDeleteModal(productId) {
    const product = state.products.find(
      (item) =>
        String(item.id) === String(productId)
    );

    if (!product) {
      showToast(
        "Product could not be found.",
        "error"
      );
      return;
    }

    state.pendingDeleteProduct = product;

    const modal = getElement("confirmModal");
    const title = getElement("confirmModalTitle");
    const text = getElement("confirmModalText");

    if (title) {
      title.textContent = "Delete Product";
    }

    if (text) {
      text.textContent =
        `Are you sure you want to delete "${product.name}"? ` +
        "This action cannot be undone.";
    }

    if (modal) {
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function closeDeleteModal() {
    const modal = getElement("confirmModal");

    state.pendingDeleteProduct = null;

    if (modal) {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  async function confirmDelete() {
    const product = state.pendingDeleteProduct;

    if (!product) {
      closeDeleteModal();
      return;
    }

    const deleteButton = getElement(
      "confirmDeleteButton"
    );

    setButtonLoading(
      deleteButton,
      true,
      "Deleting..."
    );

    try {
      const supabase = createSupabaseClient();

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        throw error;
      }

      if (Array.isArray(product.images)) {
        await deleteStorageImages(
          product.images
        );
      }

      if (product.image_url) {
        await deleteStorageImages([
          product.image_url
        ]);
      }

      state.products = state.products.filter(
        (item) =>
          String(item.id) !== String(product.id)
      );

      closeDeleteModal();

      renderProducts();
      renderDashboard();

      showToast(
        "Product deleted successfully.",
        "success"
      );

    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      showToast(
        error?.message ||
          "Unable to delete the product.",
        "error"
      );

    } finally {
      setButtonLoading(
        deleteButton,
        false
      );
    }
  }

  /* ==========================================================
     MODALS
     ========================================================== */

  function bindModalControls() {
    const closeButton = getElement("confirmModalClose");

    if (
      closeButton &&
      closeButton.dataset.bound !== "true"
    ) {
      closeButton.dataset.bound = "true";
      closeButton.addEventListener(
        "click",
        closeDeleteModal
      );
    }

    const backdrop = $(
      ".admin-modal-backdrop"
    );

    if (
      backdrop &&
      backdrop.dataset.bound !== "true"
    ) {
      backdrop.dataset.bound = "true";
      backdrop.addEventListener(
        "click",
        closeDeleteModal
      );
    }

    const cancelButton = getElement(
      "cancelDeleteButton"
    );

    if (
      cancelButton &&
      cancelButton.dataset.bound !== "true"
    ) {
      cancelButton.dataset.bound = "true";
      cancelButton.addEventListener(
        "click",
        closeDeleteModal
      );
    }

    const confirmButton = getElement(
      "confirmDeleteButton"
    );

    if (
      confirmButton &&
      confirmButton.dataset.bound !== "true"
    ) {
      confirmButton.dataset.bound = "true";
      confirmButton.addEventListener(
        "click",
        confirmDelete
      );
    }

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          closeDeleteModal();
          closeMobileSidebar();
        }
      }
    );
  }

  /* ==========================================================
     WINDOW RESIZE
     ========================================================== */

  function bindResizeHandling() {
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        closeMobileSidebar();
      }
    });
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.KrishnaJewellersAdmin = {
    refreshProducts: loadProducts,

    getProducts: function () {
      return [...state.products];
    },

    getCurrentMetal: function () {
      return state.metalMode;
    },

    setMetal: function (metal) {
      setMetalMode(metal, true);
    },

    openAddProduct: function () {
      startNewProduct();
    },

    editProduct: function (productId) {
      editProduct(productId);
    },

    logout: handleLogout
  };

  /* ==========================================================
     START
     ========================================================== */

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      bindResizeHandling();
      await initializeAuth();
    } catch (error) {
      console.error(
        "Admin initialization error:",
        error
      );

      showLoginScreen();

      setLoginMessage(
        error?.message ||
          "Unable to initialize the admin panel.",
        "error"
      );
    }
  });
})();
