"use strict";

(function () {
  const CONFIG = {
    storageBucket: "jewellery",
    maxImageSize: 6 * 1024 * 1024,
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
    defaultMetal: "gold"
  };

  const CATEGORIES = {
    gold: [
      ["ladies-rings", "Ladies Rings"],
      ["gents-rings", "Gents Rings"],
      ["necklaces", "Necklaces"],
      ["earrings", "Earrings"],
      ["ladies-chains", "Ladies Chains"],
      ["gents-chains", "Gents Chains"],
      ["single-locket", "Single Locket"],
      ["double-locket", "Double Locket"],
      ["other", "Other"]
    ],

    silver: [
      ["kids-payal", "Kids Payal"],
      ["adult-payal", "Adult Payal"],
      ["lockets", "Lockets"],
      ["male-bracelets", "Male Bracelets"],
      ["female-bracelets", "Female Bracelets"],
      ["male-chains", "Male Chains"],
      ["female-chains", "Female Chains"],
      ["other", "Other"]
    ]
  };

  const state = {
    supabase: null,
    session: null,
    products: [],
    currentView: "dashboard",
    metalMode: "gold",
    productMetalFilter: "all",
    productSearch: "",
    productCategoryFilter: "all",
    productStatusFilter: "all",
    editingProductId: null,
    pendingDeleteProduct: null,
    selectedFiles: [],
    existingImages: [],
    isSaving: false,
    toastTimer: null,
    initialized: false
  };

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const byId = (id) =>
    document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeMetal(value) {
    return String(value || "").toLowerCase() === "silver"
      ? "silver"
      : "gold";
  }

  function metalLabel(metal) {
    return normalizeMetal(metal) === "silver"
      ? "Silver"
      : "Gold";
  }

  function categoryList(metal) {
    return CATEGORIES[normalizeMetal(metal)];
  }

  function normalizeCategory(value, metal) {
    const raw = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

    const currentMetal = normalizeMetal(metal);

    if (currentMetal === "gold") {
      const aliases = {
        ring: "ladies-rings",
        rings: "ladies-rings",
        "ladies-ring": "ladies-rings",
        "gents-ring": "gents-rings",
        necklace: "necklaces",
        earring: "earrings",
        earrings: "earrings",
        chain: "gents-chains",
        chains: "gents-chains",
        "ladies-chain": "ladies-chains",
        "gents-chain": "gents-chains",
        locket: "single-locket",
        lockets: "single-locket",
        bangle: "other",
        bangles: "other",
        bracelet: "other",
        bracelets: "other"
      };

      return aliases[raw] || (
        categoryList("gold").some(([value]) => value === raw)
          ? raw
          : "other"
      );
    }

    const aliases = {
      payal: "adult-payal",
      "kid-payal": "kids-payal",
      locket: "lockets",
      bracelet: "male-bracelets",
      bracelets: "male-bracelets",
      "male-bracelet": "male-bracelets",
      "female-bracelet": "female-bracelets",
      chain: "male-chains",
      chains: "male-chains",
      "male-chain": "male-chains",
      "female-chain": "female-chains"
    };

    return aliases[raw] || (
      categoryList("silver").some(([value]) => value === raw)
        ? raw
        : "other"
    );
  }

  function categoryLabel(category) {
    for (const metal of ["gold", "silver"]) {
      const found = categoryList(metal)
        .find(([value]) => value === category);

      if (found) {
        return found[1];
      }
    }

    return String(category || "Other")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function normalizeProduct(product) {
    const metal = normalizeMetal(product?.metal);

    let images = [];

    if (Array.isArray(product?.images)) {
      images = product.images
        .map((image) => {
          if (typeof image === "string") {
            return image;
          }

          if (image && typeof image === "object") {
            return image.url || "";
          }

          return "";
        })
        .filter(Boolean);
    }

    const imageUrl = String(product?.image_url || "");

    if (imageUrl && !images.includes(imageUrl)) {
      images.unshift(imageUrl);
    }

    return {
      ...product,
      metal,
      category: normalizeCategory(product?.category, metal),
      name: String(product?.name || "Unnamed Product"),
      price: product?.price ?? null,
      sku: String(product?.sku || ""),
      material: String(product?.material || ""),
      description: String(product?.description || ""),
      image_url: imageUrl,
      images,
      is_published: Boolean(product?.is_published),
      featured: Boolean(product?.featured)
    };
  }

  function priceLabel(price) {
    const number = Number(price);

    if (!Number.isFinite(number) || number <= 0) {
      return "Price on enquiry";
    }

    return `₹${number.toLocaleString("en-IN")}`;
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

  /* ==========================================================
     SUPABASE
  ========================================================== */

  function createSupabase() {
    if (state.supabase) {
      return state.supabase;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      throw new Error(
        "Supabase library could not load. Please refresh the page."
      );
    }

    const config = window.KRISHNA_SUPABASE;

    if (!config?.url || !config?.key) {
      throw new Error(
        "Supabase configuration is missing. Check supabase-config.js."
      );
    }

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
     UI
  ========================================================== */

  function showLoginScreen() {
    const login = byId("loginScreen");
    const app = byId("adminApp");

    if (login) {
      login.style.display = "flex";
    }

    if (app) {
      app.hidden = true;
      app.classList.add("is-hidden");
      app.style.display = "none";
    }
  }

  function showAdminApp() {
    const login = byId("loginScreen");
    const app = byId("adminApp");

    if (login) {
      login.style.display = "none";
    }

    if (app) {
      /*
       * IMPORTANT:
       * admin.html uses the native hidden attribute.
       * Removing only a CSS class is not enough.
       */
      app.hidden = false;
      app.removeAttribute("hidden");
      app.classList.remove("is-hidden");
      app.style.display = "grid";
    }
  }

  function setLoginMessage(message, type = "") {
    const element = byId("loginMessage");

    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.className =
      `form-message${type ? ` ${type}` : ""}`;
  }

  function setFormMessage(message, type = "") {
    const element = byId("productFormMessage");

    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.className =
      `form-message${type ? ` ${type}` : ""}`;
  }

  function showToast(message, type = "success") {
    const toast = byId("adminToast");
    const text = byId("adminToastMessage");

    if (!toast || !text) {
      return;
    }

    text.textContent = message;

    toast.classList.remove(
      "success",
      "error",
      "warning",
      "show"
    );

    toast.classList.add(type);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    clearTimeout(state.toastTimer);

    state.toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  function buttonLoading(button, loading, text) {
    if (!button) {
      return;
    }

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText =
          button.textContent.trim();
      }

      button.disabled = true;

      if (text) {
        button.textContent = text;
      }

      return;
    }

    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent =
        button.dataset.originalText;

      delete button.dataset.originalText;
    }
  }

  /* ==========================================================
     AUTH
  ========================================================== */

  async function verifyAdmin(userId) {
    if (!userId) {
      return false;
    }

    const supabase = createSupabase();

    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  async function login(event) {
    event.preventDefault();

    const email = String(
      byId("loginEmail")?.value || ""
    ).trim();

    const password = String(
      byId("loginPassword")?.value || ""
    );

    const button = byId("loginButton");

    if (!email || !password) {
      setLoginMessage(
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    buttonLoading(button, true, "Signing in...");
    setLoginMessage("Signing in...", "info");

    try {
      const supabase = createSupabase();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error(
          "Login succeeded but no user was returned."
        );
      }

      const admin = await verifyAdmin(
        data.user.id
      );

      if (!admin) {
        await supabase.auth.signOut();

        throw new Error(
          "This account does not have administrator access."
        );
      }

      state.session = data.session;

      await initializeAdmin(data.session);

      setLoginMessage(
        "Login successful.",
        "success"
      );
    } catch (error) {
      console.error("Admin login error:", error);

      setLoginMessage(
        error?.message ||
          "Unable to sign in. Please check your email and password.",
        "error"
      );
    } finally {
      buttonLoading(button, false);
    }
  }

  async function logout() {
    try {
      const supabase = createSupabase();

      await supabase.auth.signOut();

      state.session = null;
      state.products = [];

      showLoginScreen();

      setLoginMessage(
        "You have been signed out.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Unable to sign out.",
        "error"
      );
    }
  }

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  function getViewButtons() {
    return $$("[data-admin-view]");
  }

  function getViewSection(view) {
    const map = {
      dashboard: byId("dashboardView"),
      products: byId("productsView"),
      "add-product": byId("addProductView")
    };

    return map[view] || null;
  }

  function showView(view) {
    const allowed = [
      "dashboard",
      "products",
      "add-product"
    ];

    if (!allowed.includes(view)) {
      view = "dashboard";
    }

    state.currentView = view;

    const dashboard = byId("dashboardView");
    const products = byId("productsView");
    const addProduct = byId("addProductView");

    [dashboard, products, addProduct]
      .filter(Boolean)
      .forEach((section) => {
        const active =
          section === getViewSection(view);

        section.hidden = !active;
        section.classList.toggle(
          "active",
          active
        );
      });

    getViewButtons().forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.adminView === view
      );
    });

    updateHeader(view);

    if (view === "dashboard") {
      renderDashboard();
    }

    if (view === "products") {
      renderProducts();
    }
  }

  function updateHeader(view) {
    const title = byId("adminPageTitle");
    const eyebrow = byId("adminPageEyebrow");

    const data = {
      dashboard: {
        eyebrow: "Dashboard",
        title: "Jewellery Catalogue"
      },
      products: {
        eyebrow: "Catalogue Manager",
        title: "Manage Jewellery"
      },
      "add-product": {
        eyebrow: state.editingProductId
          ? "Edit Jewellery"
          : "New Jewellery",
        title: state.editingProductId
          ? "Edit Product"
          : "Add Product"
      }
    };

    const current = data[view];

    if (title) {
      title.textContent = current.title;
    }

    if (eyebrow) {
      eyebrow.textContent = current.eyebrow;
    }
  }

  function bindNavigation() {
    getViewButtons().forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener("click", () => {
        showView(
          button.dataset.adminView
        );

        closeMobileMenu();
      });
    });

    const logoutButton =
      byId("logoutButton");

    if (
      logoutButton &&
      logoutButton.dataset.bound !== "true"
    ) {
      logoutButton.dataset.bound = "true";
      logoutButton.addEventListener(
        "click",
        logout
      );
    }

    const headerLogout =
      byId("headerLogoutButton");

    if (
      headerLogout &&
      headerLogout.dataset.bound !== "true"
    ) {
      headerLogout.dataset.bound = "true";
      headerLogout.addEventListener(
        "click",
        logout
      );
    }

    const mobileButton =
      byId("mobileSidebarToggle");

    if (
      mobileButton &&
      mobileButton.dataset.bound !== "true"
    ) {
      mobileButton.dataset.bound = "true";

      mobileButton.addEventListener(
        "click",
        toggleMobileMenu
      );
    }
  }

  function toggleMobileMenu() {
    const sidebar =
      $(".admin-sidebar");

    if (!sidebar) {
      return;
    }

    sidebar.classList.toggle(
      "mobile-open"
    );
  }

  function closeMobileMenu() {
    const sidebar =
      $(".admin-sidebar");

    if (sidebar) {
      sidebar.classList.remove(
        "mobile-open"
      );
    }
  }

  /* ==========================================================
     METAL
  ========================================================== */

  function setMetalMode(metal, refresh = true) {
    state.metalMode =
      normalizeMetal(metal);

    const silver =
      state.metalMode === "silver";

    document.body.classList.toggle(
      "admin-silver-mode",
      silver
    );

    const toggle =
      byId("adminMetalToggle");

    if (toggle) {
      toggle.classList.toggle(
        "silver",
        silver
      );

      toggle.setAttribute(
        "aria-pressed",
        String(silver)
      );
    }

    const goldLabel =
      byId("goldAdminLabel");

    const silverLabel =
      byId("silverAdminLabel");

    if (goldLabel) {
      goldLabel.classList.toggle(
        "active",
        !silver
      );
    }

    if (silverLabel) {
      silverLabel.classList.toggle(
        "active",
        silver
      );

      silverLabel.classList.toggle(
        "silver-active",
        silver
      );
    }

    const sidebarLabel =
      byId("sidebarMetalLabel");

    if (sidebarLabel) {
      sidebarLabel.textContent =
        metalLabel(state.metalMode)
          .toUpperCase();
    }

    const formMetal =
      byId("productMetal");

    if (
      formMetal &&
      !state.editingProductId
    ) {
      formMetal.value =
        state.metalMode;

      updateCategoryOptions(
        state.metalMode
      );
    }

    const dashboardMetal =
      byId("dashboardMetalName");

    if (dashboardMetal) {
      dashboardMetal.textContent =
        metalLabel(state.metalMode);
    }

    if (refresh) {
      updateCategoryFilterOptions();
      renderProducts();
      renderDashboard();
    }
  }

  function bindMetalControls() {
    const toggle =
      byId("adminMetalToggle");

    if (
      toggle &&
      toggle.dataset.bound !== "true"
    ) {
      toggle.dataset.bound = "true";

      toggle.addEventListener(
        "click",
        () => {
          setMetalMode(
            state.metalMode === "gold"
              ? "silver"
              : "gold"
          );
        }
      );
    }

    $$("[data-product-metal]")
      .forEach((button) => {
        if (
          button.dataset.bound === "true"
        ) {
          return;
        }

        button.dataset.bound = "true";

        button.addEventListener(
          "click",
          () => {
            const value =
              button.dataset.productMetal;

            state.productMetalFilter =
              value === "gold" ||
              value === "silver"
                ? value
                : "all";

            $$("[data-product-metal]")
              .forEach((item) => {
                item.classList.toggle(
                  "active",
                  item.dataset.productMetal ===
                    state.productMetalFilter
                );
              });

            updateCategoryFilterOptions();
            renderProducts();
          }
        );
      });
  }

  /* ==========================================================
     CATEGORY
  ========================================================== */

  function updateCategoryOptions(
    metal,
    selected = ""
  ) {
    const select =
      byId("productCategory");

    if (!select) {
      return;
    }

    const categories =
      categoryList(metal);

    select.innerHTML =
      categories
        .map(
          ([value, label]) =>
            `<option value="${value}">
              ${escapeHtml(label)}
            </option>`
        )
        .join("");

    if (
      categories.some(
        ([value]) => value === selected
      )
    ) {
      select.value = selected;
    }
  }

  function updateCategoryFilterOptions() {
    const select =
      byId("productCategoryFilter");

    if (!select) {
      return;
    }

    const metal =
      state.productMetalFilter === "all"
        ? state.metalMode
        : state.productMetalFilter;

    const categories =
      categoryList(metal);

    const previous =
      state.productCategoryFilter;

    select.innerHTML =
      `<option value="all">All Categories</option>` +
      categories
        .map(
          ([value, label]) =>
            `<option value="${value}">
              ${escapeHtml(label)}
            </option>`
        )
        .join("");

    if (
      previous === "all" ||
      categories.some(
        ([value]) => value === previous
      )
    ) {
      select.value = previous;
    } else {
      state.productCategoryFilter =
        "all";

      select.value = "all";
    }
  }

  /* ==========================================================
     PRODUCTS LOAD
  ========================================================== */

  async function loadProducts() {
    const dashboard =
      byId("dashboardProducts");

    const table =
      byId("productsTable");

    if (dashboard) {
      dashboard.innerHTML =
        `<div class="admin-loading">
          Loading products...
        </div>`;
    }

    if (table) {
      table.innerHTML =
        `<div class="admin-loading">
          Loading products...
        </div>`;
    }

    try {
      const supabase =
        createSupabase();

      const { data, error } =
        await supabase
          .from("products")
          .select("*")
          .order(
            "created_at",
            { ascending: false }
          );

      if (error) {
        throw error;
      }

      state.products =
        Array.isArray(data)
          ? data.map(normalizeProduct)
          : [];

      updateCategoryFilterOptions();
      renderDashboard();
      renderProducts();
    } catch (error) {
      console.error(
        "Product loading error:",
        error
      );

      state.products = [];

      const message =
        error?.message ||
        "Unable to load products.";

      if (dashboard) {
        dashboard.innerHTML =
          `<div class="admin-empty-state">
            <h3>Unable to load products</h3>
            <p>${escapeHtml(message)}</p>
          </div>`;
      }

      if (table) {
        table.innerHTML =
          `<div class="admin-empty-state">
            <h3>Unable to load products</h3>
            <p>${escapeHtml(message)}</p>
          </div>`;
      }

      showToast(
        message,
        "error"
      );
    }
  }

  /* ==========================================================
     FILTERS
  ========================================================== */

  function getFilteredProducts() {
    const search =
      state.productSearch
        .trim()
        .toLowerCase();

    return state.products.filter(
      (product) => {
        if (
          state.productMetalFilter !==
            "all" &&
          product.metal !==
            state.productMetalFilter
        ) {
          return false;
        }

        if (
          state.productCategoryFilter !==
            "all" &&
          product.category !==
            state.productCategoryFilter
        ) {
          return false;
        }

        if (
          state.productStatusFilter ===
          "published" &&
          !product.is_published
        ) {
          return false;
        }

        if (
          state.productStatusFilter ===
          "hidden" &&
          product.is_published
        ) {
          return false;
        }

        if (
          state.productStatusFilter ===
          "featured" &&
          !product.featured
        ) {
          return false;
        }

        if (search) {
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

          if (
            !searchable.includes(search)
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }

  function bindProductControls() {
    const search =
      byId("productSearch");

    if (
      search &&
      search.dataset.bound !== "true"
    ) {
      search.dataset.bound = "true";

      search.addEventListener(
        "input",
        () => {
          state.productSearch =
            search.value;

          renderProducts();
        }
      );
    }

    const category =
      byId("productCategoryFilter");

    if (
      category &&
      category.dataset.bound !== "true"
    ) {
      category.dataset.bound = "true";

      category.addEventListener(
        "change",
        () => {
          state.productCategoryFilter =
            category.value;

          renderProducts();
        }
      );
    }

    const status =
      byId("productStatusFilter");

    if (
      status &&
      status.dataset.bound !== "true"
    ) {
      status.dataset.bound = "true";

      status.addEventListener(
        "change",
        () => {
          state.productStatusFilter =
            status.value;

          renderProducts();
        }
      );
    }
  }

  /* ==========================================================
     RENDER DASHBOARD
  ========================================================== */

  function renderDashboard() {
    const metal =
      state.metalMode;

    const products =
      state.products.filter(
        (product) =>
          product.metal === metal
      );

    const published =
      products.filter(
        (product) =>
          product.is_published
      ).length;

    const featured =
      products.filter(
        (product) =>
          product.featured
      ).length;

    const categories =
      new Set(
        products.map(
          (product) =>
            product.category
        )
      );

    const total =
      byId("totalProducts");

    const publishedElement =
      byId("publishedProducts");

    const featuredElement =
      byId("featuredProducts");

    const categoryCount =
      byId("categoryCount");

    if (total) {
      total.textContent =
        products.length;
    }

    if (publishedElement) {
      publishedElement.textContent =
        published;
    }

    if (featuredElement) {
      featuredElement.textContent =
        featured;
    }

    if (categoryCount) {
      categoryCount.textContent =
        categories.size;
    }

    const dashboard =
      byId("dashboardProducts");

    if (!dashboard) {
      return;
    }

    const latest =
      products.slice(0, 6);

    if (!latest.length) {
      dashboard.innerHTML =
        `<div class="admin-empty-state">
          <h3>No ${metalLabel(metal)} products yet</h3>
          <p>
            Use “Add Jewellery” to add your first
            ${metalLabel(metal).toLowerCase()} product.
          </p>
        </div>`;

      return;
    }

    dashboard.innerHTML = `
      <div class="admin-table-scroll">
        <table class="admin-product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            ${latest.map(productRow).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ==========================================================
     RENDER PRODUCTS
  ========================================================== */

  function renderProducts() {
    const container =
      byId("productsTable");

    if (!container) {
      return;
    }

    const products =
      getFilteredProducts();

    if (!products.length) {
      container.innerHTML =
        `<div class="admin-empty-state">
          <h3>No products found</h3>
          <p>
            Try another filter or add a new product.
          </p>
        </div>`;

      return;
    }

    container.innerHTML = `
      <div class="admin-table-scroll">
        <table class="admin-product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Metal</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${products.map(productTableRow).join("")}
          </tbody>
        </table>
      </div>
    `;

    bindProductRowActions();
  }

  function getPrimaryImage(product) {
    return (
      product.image_url ||
      product.images?.[0] ||
      ""
    );
  }

  function productRow(product) {
    const image =
      getPrimaryImage(product);

    return `
      <tr>
        <td>
          <div class="admin-product-name-cell">
            <div class="admin-product-thumb">
              ${
                image
                  ? `<img
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(product.name)}"
                    >`
                  : `<div class="admin-product-thumb-placeholder">
                      ◇
                    </div>`
              }
            </div>

            <div>
              <p class="admin-product-name">
                ${escapeHtml(product.name)}
              </p>

              ${
                product.sku
                  ? `<p class="admin-product-sku">
                      SKU: ${escapeHtml(product.sku)}
                    </p>`
                  : ""
              }
            </div>
          </div>
        </td>

        <td>${escapeHtml(metalLabel(product.metal))}</td>

        <td>
          ${escapeHtml(
            categoryLabel(product.category)
          )}
        </td>

        <td>
          ${escapeHtml(
            priceLabel(product.price)
          )}
        </td>

        <td>
          ${
            product.is_published
              ? `<span class="admin-status published">
                  Published
                </span>`
              : `<span class="admin-status hidden">
                  Hidden
                </span>`
          }
        </td>

        <td>
          <span class="admin-table-muted">
            ${escapeHtml(
              formatDate(
                product.updated_at ||
                product.created_at
              )
            )}
          </span>
        </td>
      </tr>
    `;
  }

  function productTableRow(product) {
    const image =
      getPrimaryImage(product);

    return `
      <tr>
        <td>
          <div class="admin-product-name-cell">
            <div class="admin-product-thumb">
              ${
                image
                  ? `<img
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(product.name)}"
                    >`
                  : `<div class="admin-product-thumb-placeholder">
                      ◇
                    </div>`
              }
            </div>

            <div>
              <p class="admin-product-name">
                ${escapeHtml(product.name)}
              </p>

              ${
                product.sku
                  ? `<p class="admin-product-sku">
                      SKU: ${escapeHtml(product.sku)}
                    </p>`
                  : ""
              }
            </div>
          </div>
        </td>

        <td>
          <span class="admin-metal-badge ${product.metal}">
            ${escapeHtml(
              metalLabel(product.metal)
            )}
          </span>
        </td>

        <td>
          ${escapeHtml(
            categoryLabel(product.category)
          )}
        </td>

        <td>
          ${escapeHtml(
            priceLabel(product.price)
          )}
        </td>

        <td>
          ${
            product.is_published
              ? `<span class="admin-status published">
                  Published
                </span>`
              : `<span class="admin-status hidden">
                  Hidden
                </span>`
          }

          ${
            product.featured
              ? `<span class="admin-status featured">
                  Featured
                </span>`
              : ""
          }
        </td>

        <td>
          <div class="admin-table-actions">

            <button
              type="button"
              class="admin-table-action"
              data-action="edit"
              data-product-id="${escapeHtml(product.id)}"
            >
              Edit
            </button>

            <button
              type="button"
              class="admin-table-action"
              data-action="publish"
              data-product-id="${escapeHtml(product.id)}"
            >
              ${
                product.is_published
                  ? "Hide"
                  : "Publish"
              }
            </button>

            <button
              type="button"
              class="admin-table-action danger"
              data-action="delete"
              data-product-id="${escapeHtml(product.id)}"
            >
              Delete
            </button>

          </div>
        </td>
      </tr>
    `;
  }

  function bindProductRowActions() {
    $("[data-action]") &&
      $$("[data-action]").forEach(
        (button) => {
          if (
            button.dataset.bound === "true"
          ) {
            return;
          }

          button.dataset.bound = "true";

          button.addEventListener(
            "click",
            () => {
              const id =
                button.dataset.productId;

              const action =
                button.dataset.action;

              if (action === "edit") {
                editProduct(id);
              }

              if (action === "publish") {
                togglePublished(id);
              }

              if (action === "delete") {
                openDeleteModal(id);
              }
            }
          );
        }
      );
  }

  /* ==========================================================
     PRODUCT FORM
  ========================================================== */

  function resetProductForm() {
    state.editingProductId = null;
    state.selectedFiles = [];
    state.existingImages = [];

    const form =
      byId("productForm");

    if (form) {
      form.reset();
    }

    const metal =
      byId("productMetal");

    if (metal) {
      metal.value =
        state.metalMode;
    }

    updateCategoryOptions(
      state.metalMode
    );

    const published =
      byId("productPublished");

    if (published) {
      published.checked = true;
    }

    const featured =
      byId("productFeatured");

    if (featured) {
      featured.checked = false;
    }

    const id =
      byId("productId");

    if (id) {
      id.value = "";
    }

    const title =
      byId("productFormTitle");

    if (title) {
      title.textContent =
        "Add Product";
    }

    const eyebrow =
      byId("productFormEyebrow");

    if (eyebrow) {
      eyebrow.textContent =
        "New Jewellery";
    }

    const save =
      byId("saveProductButton");

    if (save) {
      save.textContent =
        "Save Product";
    }

    setFormMessage("");

    renderImagePreview();
  }

  function editProduct(productId) {
    const product =
      state.products.find(
        (item) =>
          String(item.id) ===
          String(productId)
      );

    if (!product) {
      showToast(
        "Product could not be found.",
        "error"
      );
      return;
    }

    state.editingProductId =
      product.id;

    state.selectedFiles = [];
    state.existingImages =
      [...product.images];

    byId("productId").value =
      product.id;

    byId("productName").value =
      product.name;

    byId("productMetal").value =
      product.metal;

    updateCategoryOptions(
      product.metal,
      product.category
    );

    byId("productPrice").value =
      product.price ?? "";

    byId("productSku").value =
      product.sku;

    byId("productMaterial").value =
      product.material;

    byId("productDescription").value =
      product.description;

    byId("productPublished").checked =
      product.is_published;

    byId("productFeatured").checked =
      product.featured;

    const title =
      byId("productFormTitle");

    if (title) {
      title.textContent =
        "Edit Product";
    }

    const eyebrow =
      byId("productFormEyebrow");

    if (eyebrow) {
      eyebrow.textContent =
        "Edit Jewellery";
    }

    renderImagePreview();
    setFormMessage("");

    showView("add-product");
  }

  function bindFormControls() {
    const form =
      byId("productForm");

    if (
      form &&
      form.dataset.bound !== "true"
    ) {
      form.dataset.bound = "true";

      form.addEventListener(
        "submit",
        saveProduct
      );
    }

    const cancel =
      byId("cancelProductButton");

    if (
      cancel &&
      cancel.dataset.bound !== "true"
    ) {
      cancel.dataset.bound = "true";

      cancel.addEventListener(
        "click",
        () => {
          resetProductForm();
          showView("products");
        }
      );
    }

    const metal =
      byId("productMetal");

    if (
      metal &&
      metal.dataset.bound !== "true"
    ) {
      metal.dataset.bound = "true";

      metal.addEventListener(
        "change",
        () => {
          const current =
            byId("productCategory")
              ?.value || "";

          updateCategoryOptions(
            metal.value,
            current
          );
        }
      );
    }

    const images =
      byId("productImages");

    if (
      images &&
      images.dataset.bound !== "true"
    ) {
      images.dataset.bound = "true";

      images.addEventListener(
        "change",
        handleImageSelection
      );
    }

    const preview =
      byId("imagePreview");

    if (
      preview &&
      preview.dataset.bound !== "true"
    ) {
      preview.dataset.bound = "true";

      preview.addEventListener(
        "click",
        removeImage
      );
    }
  }

  function handleImageSelection(event) {
    const files =
      Array.from(
        event.target.files || []
      );

    for (const file of files) {
      if (
        !CONFIG.allowedImageTypes
          .includes(file.type)
      ) {
        showToast(
          `${file.name}: JPG, PNG or WebP only.`,
          "error"
        );
        continue;
      }

      if (
        file.size >
        CONFIG.maxImageSize
      ) {
        showToast(
          `${file.name}: maximum size is 6MB.`,
          "error"
        );
        continue;
      }

      state.selectedFiles.push(file);
    }

    event.target.value = "";

    renderImagePreview();
  }

  function removeImage(event) {
    const button =
      event.target.closest(
        "[data-remove-image]"
      );

    if (!button) {
      return;
    }

    const type =
      button.dataset.removeImage;

    const index =
      Number(button.dataset.index);

    if (!Number.isInteger(index)) {
      return;
    }

    if (type === "new") {
      state.selectedFiles.splice(
        index,
        1
      );
    }

    if (type === "existing") {
      state.existingImages.splice(
        index,
        1
      );
    }

    renderImagePreview();
  }

  function renderImagePreview() {
    const container =
      byId("imagePreview");

    if (!container) {
      return;
    }

    const existing =
      state.existingImages
        .map(
          (url, index) => `
            <div class="image-preview-item">
              <img
                src="${escapeHtml(url)}"
                alt="Product image"
              >

              <button
                type="button"
                class="image-preview-item-remove"
                data-remove-image="existing"
                data-index="${index}"
              >
                ×
              </button>
            </div>
          `
        )
        .join("");

    const newImages =
      state.selectedFiles
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
              >
                ×
              </button>
            </div>
          `
        )
        .join("");

    container.innerHTML =
      existing + newImages;
  }

  /* ==========================================================
     SAVE PRODUCT
  ========================================================== */

  async function saveProduct(event) {
    event.preventDefault();

    if (state.isSaving) {
      return;
    }

    const name =
      String(
        byId("productName")?.value || ""
      ).trim();

    const metal =
      normalizeMetal(
        byId("productMetal")?.value
      );

    const category =
      normalizeCategory(
        byId("productCategory")?.value,
        metal
      );

    const priceRaw =
      String(
        byId("productPrice")?.value || ""
      ).trim();

    const sku =
      String(
        byId("productSku")?.value || ""
      ).trim();

    const material =
      String(
        byId("productMaterial")?.value || ""
      ).trim();

    const description =
      String(
        byId("productDescription")?.value || ""
      ).trim();

    const published =
      Boolean(
        byId("productPublished")?.checked
      );

    const featured =
      Boolean(
        byId("productFeatured")?.checked
      );

    if (!name) {
      setFormMessage(
        "Please enter a product name.",
        "error"
      );
      return;
    }

    if (
      !categoryList(metal).some(
        ([value]) =>
          value === category
      )
    ) {
      setFormMessage(
        "Please select a valid category.",
        "error"
      );
      return;
    }

    let price = null;

    if (priceRaw) {
      price =
        Number(
          priceRaw.replace(/,/g, "")
        );

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        setFormMessage(
          "Please enter a valid price.",
          "error"
        );
        return;
      }
    }

    state.isSaving = true;

    const saveButton =
      byId("saveProductButton");

    buttonLoading(
      saveButton,
      true,
      state.editingProductId
        ? "Updating..."
        : "Saving..."
    );

    setFormMessage(
      state.editingProductId
        ? "Updating product..."
        : "Saving product...",
      "info"
    );

    try {
      const supabase =
        createSupabase();

      const uploaded =
        await uploadImages(metal);

      const images = [
        ...state.existingImages,
        ...uploaded
      ];

      const payload = {
        name,
        metal,
        category,
        price,
        sku: sku || null,
        material: material || null,
        description: description || null,
        image_url:
          images[0] || null,
        images,
        is_published: published,
        featured,
        updated_at:
          new Date().toISOString()
      };

      let saved;

      if (state.editingProductId) {
        const { data, error } =
          await supabase
            .from("products")
            .update(payload)
            .eq(
              "id",
              state.editingProductId
            )
            .select("*")
            .single();

        if (error) {
          throw error;
        }

        saved =
          normalizeProduct(data);
      } else {
        const { data, error } =
          await supabase
            .from("products")
            .insert(payload)
            .select("*")
            .single();

        if (error) {
          throw error;
        }

        saved =
          normalizeProduct(data);
      }

      if (!saved) {
        throw new Error(
          "Product could not be saved."
        );
      }

      const existingIndex =
        state.products.findIndex(
          (product) =>
            String(product.id) ===
            String(saved.id)
        );

      if (existingIndex >= 0) {
        state.products[
          existingIndex
        ] = saved;
      } else {
        state.products.unshift(
          saved
        );
      }

      showToast(
        state.editingProductId
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
      console.error(
        "Save product error:",
        error
      );

      setFormMessage(
        error?.message ||
          "Unable to save the product.",
        "error"
      );

      showToast(
        error?.message ||
          "Unable to save the product.",
        "error"
      );
    } finally {
      state.isSaving = false;

      buttonLoading(
        saveButton,
        false
      );
    }
  }

  /* ==========================================================
     IMAGE UPLOAD
  ========================================================== */

  async function uploadImages(metal) {
    if (
      !state.selectedFiles.length
    ) {
      return [];
    }

    const supabase =
      createSupabase();

    const urls = [];

    for (
      const file of state.selectedFiles
    ) {
      const extension =
        file.name
          .split(".")
          .pop()
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          ) || "jpg";

      const filename =
        `${normalizeMetal(metal)}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}.${extension}`;

      const path =
        `${normalizeMetal(metal)}/${filename}`;

      const { error } =
        await supabase.storage
          .from(CONFIG.storageBucket)
          .upload(
            path,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
            }
          );

      if (error) {
        throw new Error(
          `Unable to upload ${file.name}: ${error.message}`
        );
      }

      const { data } =
        supabase.storage
          .from(CONFIG.storageBucket)
          .getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error(
          `Image ${file.name} uploaded but its URL could not be created.`
        );
      }

      urls.push(
        data.publicUrl
      );
    }

    return urls;
  }

  /* ==========================================================
     PUBLISH
  ========================================================== */

  async function togglePublished(id) {
    const product =
      state.products.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!product) {
      return;
    }

    const next =
      !product.is_published;

    try {
      const supabase =
        createSupabase();

      const { data, error } =
        await supabase
          .from("products")
          .update({
            is_published: next,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            product.id
          )
          .select("*")
          .single();

      if (error) {
        throw error;
      }

      const updated =
        normalizeProduct(data);

      const index =
        state.products.findIndex(
          (item) =>
            String(item.id) ===
            String(product.id)
        );

      if (index >= 0) {
        state.products[index] =
          updated;
      }

      renderProducts();
      renderDashboard();

      showToast(
        next
          ? "Product published."
          : "Product hidden.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "Unable to update product.",
        "error"
      );
    }
  }

  /* ==========================================================
     DELETE
  ========================================================== */

  function openDeleteModal(id) {
    const product =
      state.products.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!product) {
      return;
    }

    state.pendingDeleteProduct =
      product;

    const modal =
      byId("confirmModal");

    const title =
      byId("confirmModalTitle");

    const text =
      byId("confirmModalText");

    if (title) {
      title.textContent =
        "Delete Product?";
    }

    if (text) {
      text.textContent =
        `Delete "${product.name}"? This cannot be undone.`;
    }

    if (modal) {
      modal.hidden = false;
      modal.classList.add(
        "active"
      );

      modal.setAttribute(
        "aria-hidden",
        "false"
      );
    }
  }

  function closeDeleteModal() {
    const modal =
      byId("confirmModal");

    state.pendingDeleteProduct =
      null;

    if (modal) {
      modal.hidden = true;
      modal.classList.remove(
        "active"
      );

      modal.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  }

  async function confirmDelete() {
    const product =
      state.pendingDeleteProduct;

    if (!product) {
      return;
    }

    const button =
      byId("confirmDeleteButton");

    buttonLoading(
      button,
      true,
      "Deleting..."
    );

    try {
      const supabase =
        createSupabase();

      const { error } =
        await supabase
          .from("products")
          .delete()
          .eq(
            "id",
            product.id
          );

      if (error) {
        throw error;
      }

      state.products =
        state.products.filter(
          (item) =>
            String(item.id) !==
            String(product.id)
        );

      closeDeleteModal();

      renderProducts();
      renderDashboard();

      showToast(
        "Product deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "Unable to delete product.",
        "error"
      );
    } finally {
      buttonLoading(
        button,
        false
      );
    }
  }

  function bindModalControls() {
    $$("[data-close-confirm]")
      .forEach((element) => {
        if (
          element.dataset.bound === "true"
        ) {
          return;
        }

        element.dataset.bound = "true";

        element.addEventListener(
          "click",
          closeDeleteModal
        );
      });

    const confirm =
      byId("confirmDeleteButton");

    if (
      confirm &&
      confirm.dataset.bound !== "true"
    ) {
      confirm.dataset.bound = "true";

      confirm.addEventListener(
        "click",
        confirmDelete
      );
    }
  }

  /* ==========================================================
     INITIALIZATION
  ========================================================== */

  async function initializeAdmin(
    session
  ) {
    state.session = session;

    showAdminApp();

    const email =
      byId("adminUserEmail");

    if (email) {
      email.textContent =
        session?.user?.email || "";
    }

    bindNavigation();
    bindMetalControls();
    bindProductControls();
    bindFormControls();
    bindModalControls();

    setMetalMode(
      state.metalMode,
      false
    );

    resetProductForm();

    await loadProducts();

    showView(
      state.currentView
    );
  }

  async function initializeAuth() {
    try {
      const supabase =
        createSupabase();

      showLoginScreen();

      const {
        data: {
          session
        }
      } =
        await supabase.auth.getSession();

      if (session?.user) {
        const admin =
          await verifyAdmin(
            session.user.id
          );

        if (admin) {
          await initializeAdmin(
            session
          );
          return;
        }

        await supabase.auth.signOut();
      }

      supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (
            event === "SIGNED_OUT"
          ) {
            state.session = null;
            showLoginScreen();
            return;
          }

          if (
            event === "SIGNED_IN" &&
            session?.user
          ) {
            try {
              const admin =
                await verifyAdmin(
                  session.user.id
                );

              if (!admin) {
                await supabase.auth.signOut();

                setLoginMessage(
                  "This account does not have administrator access.",
                  "error"
                );

                return;
              }

              await initializeAdmin(
                session
              );
            } catch (error) {
              console.error(
                "Authentication verification error:",
                error
              );

              setLoginMessage(
                error?.message ||
                  "Unable to verify administrator access.",
                "error"
              );
            }
          }
        }
      );
    } catch (error) {
      console.error(
        "Admin initialization error:",
        error
      );

      setLoginMessage(
        error?.message ||
          "Unable to initialize the admin panel.",
        "error"
      );
    }
  }

  /* ==========================================================
     GLOBAL EVENTS
  ========================================================== */

  function bindGlobalEvents() {
    const loginForm =
      byId("loginForm");

    if (
      loginForm &&
      loginForm.dataset.bound !== "true"
    ) {
      loginForm.dataset.bound = "true";

      loginForm.addEventListener(
        "submit",
        login
      );
    }

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape"
        ) {
          closeDeleteModal();
          closeMobileMenu();
        }
      }
    );

    window.addEventListener(
      "resize",
      () => {
        if (
          window.innerWidth > 900
        ) {
          closeMobileMenu();
        }
      }
    );
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (state.initialized) {
        return;
      }

      state.initialized = true;

      bindGlobalEvents();

      initializeAuth();
    }
  );
})();