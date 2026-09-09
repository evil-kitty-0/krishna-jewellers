"use strict";

(function () {
  const CONFIG = {
    storageBucket: "jewellery",
    maxImageSize: 6 * 1024 * 1024,
    allowedImageTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ]
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

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  function byId(id) {
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
    return String(value || "").toLowerCase() === "silver"
      ? "silver"
      : "gold";
  }

  function metalLabel(metal) {
    return normalizeMetal(metal) === "silver"
      ? "Silver"
      : "Gold";
  }

  function getCategories(metal) {
    return CATEGORIES[normalizeMetal(metal)];
  }

  function normalizeCategory(value, metal) {
    const raw = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

    const currentMetal = normalizeMetal(metal);

    const aliases = {
      gold: {
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
        lockets: "single-locket"
      },
      silver: {
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
      }
    };

    if (aliases[currentMetal][raw]) {
      return aliases[currentMetal][raw];
    }

    const valid = getCategories(currentMetal)
      .some(([category]) => category === raw);

    return valid ? raw : "other";
  }

  function categoryLabel(category) {
    for (const metal of ["gold", "silver"]) {
      const found = getCategories(metal)
        .find(([value]) => value === category);

      if (found) {
        return found[1];
      }
    }

    return String(category || "Other")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function normalizeProduct(product) {
    const metal = normalizeMetal(product?.metal);

    let images = [];

    if (Array.isArray(product?.images)) {
      images = product.images
        .map(image => {
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

  function formatPrice(price) {
    const value = Number(price);

    if (!Number.isFinite(value) || value <= 0) {
      return "Price on enquiry";
    }

    return `₹${value.toLocaleString("en-IN")}`;
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

  /* =========================================================
     SUPABASE
  ========================================================= */

  function createSupabase() {
    if (state.supabase) {
      return state.supabase;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      throw new Error(
        "Supabase could not load. Please refresh the page."
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

  /* =========================================================
     LOGIN
  ========================================================= */

  function showLoginScreen() {
    const loginScreen = byId("loginScreen");
    const adminApp = byId("adminApp");

    if (loginScreen) {
      loginScreen.style.display = "flex";
    }

    if (adminApp) {
      adminApp.hidden = true;
      adminApp.setAttribute("hidden", "");
      adminApp.classList.add("is-hidden");
      adminApp.style.display = "none";
    }
  }

  function showAdminApp() {
    const loginScreen = byId("loginScreen");
    const adminApp = byId("adminApp");

    if (loginScreen) {
      loginScreen.style.display = "none";
    }

    if (adminApp) {
      adminApp.hidden = false;
      adminApp.removeAttribute("hidden");
      adminApp.classList.remove("is-hidden");
      adminApp.style.display = "";
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

  function setButtonLoading(button, loading, loadingText) {
    if (!button) {
      return;
    }

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText =
          button.textContent.trim();
      }

      button.disabled = true;

      if (loadingText) {
        button.textContent = loadingText;
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

  function showToast(message, type = "success") {
    const toast = byId("adminToast");
    const text = byId("adminToastMessage");

    if (!toast || !text) {
      return;
    }

    text.textContent = message;

    toast.classList.remove(
      "show",
      "success",
      "error",
      "warning"
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

  async function verifyAdmin(userId) {
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

  async function handleLogin(event) {
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

    setButtonLoading(
      button,
      true,
      "Signing in..."
    );

    setLoginMessage(
      "Signing in...",
      "info"
    );

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

      const isAdmin =
        await verifyAdmin(data.user.id);

      if (!isAdmin) {
        await supabase.auth.signOut();

        throw new Error(
          "This account does not have administrator access."
        );
      }

      state.session = data.session;

      await initializeAdmin(
        data.session
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setLoginMessage(
        error?.message ||
          "Unable to sign in.",
        "error"
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  async function handleLogout() {
    try {
      const supabase = createSupabase();

      await supabase.auth.signOut();

      state.session = null;
      state.products = [];
      state.editingProductId = null;

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

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function getViewButtons() {
    return $$("[data-admin-view]");
  }

  function getSection(view) {
    const sections = {
      dashboard: byId("dashboardView"),
      products: byId("productsView"),
      "add-product": byId("addProductView")
    };

    return sections[view] || null;
  }

  function showView(view) {
    const validViews = [
      "dashboard",
      "products",
      "add-product"
    ];

    if (!validViews.includes(view)) {
      view = "dashboard";
    }

    state.currentView = view;

    const sections = [
      byId("dashboardView"),
      byId("productsView"),
      byId("addProductView")
    ].filter(Boolean);

    sections.forEach(section => {
      const isActive =
        section === getSection(view);

      section.hidden = !isActive;
      section.classList.toggle(
        "active",
        isActive
      );
    });

    getViewButtons().forEach(button => {
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

    closeMobileSidebar();
  }

  function updateHeader(view) {
    const title = byId("adminPageTitle");
    const eyebrow = byId("adminPageEyebrow");

    const pages = {
      dashboard: {
        title: "Jewellery Catalogue",
        eyebrow: "Dashboard"
      },
      products: {
        title: "Manage Jewellery",
        eyebrow: "Catalogue Manager"
      },
      "add-product": {
        title: state.editingProductId
          ? "Edit Product"
          : "Add Product",
        eyebrow: state.editingProductId
          ? "Edit Jewellery"
          : "New Jewellery"
      }
    };

    const page = pages[view];

    if (!page) {
      return;
    }

    if (title) {
      title.textContent =
        page.title;
    }

    if (eyebrow) {
      eyebrow.textContent =
        page.eyebrow;
    }
  }

  function closeMobileSidebar() {
    const sidebar =
      $(".admin-sidebar");

    if (sidebar) {
      sidebar.classList.remove(
        "mobile-open",
        "open"
      );
    }
  }

  function bindNavigation() {
    getViewButtons().forEach(button => {
      if (button.dataset.bound === "true") {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener(
        "click",
        () => {
          showView(
            button.dataset.adminView
          );
        }
      );
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
        handleLogout
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
        handleLogout
      );
    }

    const mobileToggle =
      byId("mobileSidebarToggle");

    if (
      mobileToggle &&
      mobileToggle.dataset.bound !== "true"
    ) {
      mobileToggle.dataset.bound = "true";

      mobileToggle.addEventListener(
        "click",
        () => {
          const sidebar =
            $(".admin-sidebar");

          if (sidebar) {
            sidebar.classList.toggle(
              "mobile-open"
            );
          }
        }
      );
    }
  }

  /* =========================================================
     GOLD / SILVER
  ========================================================= */

  function setMetalMode(
    metal,
    refresh = true
  ) {
    state.metalMode =
      normalizeMetal(metal);

    const isSilver =
      state.metalMode === "silver";

    document.body.classList.toggle(
      "admin-silver-mode",
      isSilver
    );

    const toggle =
      byId("adminMetalToggle");

    if (toggle) {
      toggle.classList.toggle(
        "silver",
        isSilver
      );

      toggle.setAttribute(
        "aria-pressed",
        String(isSilver)
      );
    }

    const goldLabel =
      byId("goldAdminLabel");

    const silverLabel =
      byId("silverAdminLabel");

    if (goldLabel) {
      goldLabel.classList.toggle(
        "active",
        !isSilver
      );
    }

    if (silverLabel) {
      silverLabel.classList.toggle(
        "active",
        isSilver
      );
    }

    const sidebarLabel =
      byId("sidebarMetalLabel");

    if (sidebarLabel) {
      sidebarLabel.textContent =
        metalLabel(
          state.metalMode
        ).toUpperCase();
    }

    const productMetal =
      byId("productMetal");

    if (
      productMetal &&
      !state.editingProductId
    ) {
      productMetal.value =
        state.metalMode;

      updateProductCategories(
        state.metalMode
      );
    }

    if (refresh) {
      updateCategoryFilter();
      renderDashboard();
      renderProducts();
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
      .forEach(button => {
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
              .forEach(item => {
                item.classList.toggle(
                  "active",
                  item.dataset.productMetal ===
                    state.productMetalFilter
                );
              });

            updateCategoryFilter();
            renderProducts();
          }
        );
      });
  }

  /* =========================================================
     CATEGORIES
  ========================================================= */

  function updateProductCategories(
    metal,
    selected = ""
  ) {
    const select =
      byId("productCategory");

    if (!select) {
      return;
    }

    const categories =
      getCategories(metal);

    select.innerHTML =
      categories.map(
        ([value, label]) =>
          `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
      ).join("");

    if (
      categories.some(
        ([value]) =>
          value === selected
      )
    ) {
      select.value =
        selected;
    }
  }

  function updateCategoryFilter() {
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
      getCategories(metal);

    const previous =
      state.productCategoryFilter;

    select.innerHTML =
      `<option value="all">All Categories</option>` +
      categories.map(
        ([value, label]) =>
          `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
      ).join("");

    if (
      previous === "all" ||
      categories.some(
        ([value]) =>
          value === previous
      )
    ) {
      select.value =
        previous;
    } else {
      state.productCategoryFilter =
        "all";

      select.value =
        "all";
    }
  }

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  async function loadProducts() {
    try {
      const supabase =
        createSupabase();

      const { data, error } =
        await supabase
          .from("products")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );

      if (error) {
        throw error;
      }

      state.products =
        Array.isArray(data)
          ? data.map(normalizeProduct)
          : [];

      updateCategoryFilter();
      renderDashboard();
      renderProducts();
    } catch (error) {
      console.error(
        "Load products error:",
        error
      );

      state.products = [];

      showToast(
        error?.message ||
          "Unable to load products.",
        "error"
      );

      renderDashboard();
      renderProducts();
    }
  }

  /* =========================================================
     FILTERING
  ========================================================= */

  function getFilteredProducts() {
    const search =
      state.productSearch
        .trim()
        .toLowerCase();

    return state.products.filter(
      product => {
        if (
          state.productMetalFilter !== "all" &&
          product.metal !==
            state.productMetalFilter
        ) {
          return false;
        }

        if (
          state.productCategoryFilter !== "all" &&
          product.category !==
            state.productCategoryFilter
        ) {
          return false;
        }

        if (
          state.productStatusFilter === "published" &&
          !product.is_published
        ) {
          return false;
        }

        if (
          state.productStatusFilter === "hidden" &&
          product.is_published
        ) {
          return false;
        }

        if (
          state.productStatusFilter === "featured" &&
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

          if (!searchable.includes(search)) {
            return false;
          }
        }

        return true;
      }
    );
  }

  function bindProductFilters() {
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

  /* =========================================================
     DASHBOARD
  ========================================================= */

  function renderDashboard() {
    const metal =
      state.metalMode;

    const products =
      state.products.filter(
        product =>
          product.metal === metal
      );

    const published =
      products.filter(
        product =>
          product.is_published
      ).length;

    const featured =
      products.filter(
        product =>
          product.featured
      ).length;

    const totalElement =
      byId("totalProducts");

    const publishedElement =
      byId("publishedProducts");

    const featuredElement =
      byId("featuredProducts");

    const categoryElement =
      byId("categoryCount");

    if (totalElement) {
      totalElement.textContent =
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

    if (categoryElement) {
      categoryElement.textContent =
        new Set(
          products.map(
            product =>
              product.category
          )
        ).size;
    }

    const container =
      byId("dashboardProducts");

    if (!container) {
      return;
    }

    const latest =
      products.slice(0, 6);

    if (!latest.length) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <h3>No ${escapeHtml(
            metalLabel(metal)
          )} products yet</h3>
          <p>
            Click “Add Jewellery” to add your first product.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
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
            ${latest.map(product => `
              <tr>
                <td>
                  <div class="admin-product-name-cell">
                    ${productThumbnail(product)}

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
                  ${escapeHtml(
                    categoryLabel(
                      product.category
                    )
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    formatPrice(
                      product.price
                    )
                  )}
                </td>

                <td>
                  ${productStatus(product)}
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      product.updated_at ||
                      product.created_at
                    )
                  )}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  /* =========================================================
     PRODUCTS TABLE
  ========================================================= */

  function productThumbnail(product) {
    const image =
      product.image_url ||
      product.images?.[0] ||
      "";

    if (!image) {
      return `
        <div class="admin-product-thumb">
          <div class="admin-product-thumb-placeholder">
            ◇
          </div>
        </div>
      `;
    }

    return `
      <div class="admin-product-thumb">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
        >
      </div>
    `;
  }

  function productStatus(product) {
    return `
      ${
        product.is_published
          ? `<span class="admin-status published">Published</span>`
          : `<span class="admin-status hidden">Hidden</span>`
      }

      ${
        product.featured
          ? `<span class="admin-status featured">Featured</span>`
          : ""
      }
    `;
  }

  function renderProducts() {
    const container =
      byId("productsTable");

    if (!container) {
      return;
    }

    const products =
      getFilteredProducts();

    if (!products.length) {
      container.innerHTML = `
        <div class="admin-empty-state">
          <h3>No products found</h3>
          <p>
            Try changing the filters or add a new product.
          </p>
        </div>
      `;

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
            ${products.map(product => `
              <tr>
                <td>
                  <div class="admin-product-name-cell">
                    ${productThumbnail(product)}

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
                    categoryLabel(
                      product.category
                    )
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    formatPrice(
                      product.price
                    )
                  )}
                </td>

                <td>
                  ${productStatus(product)}
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
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    bindProductActions();
  }

  function bindProductActions() {
    $$("[data-action]").forEach(button => {
      if (
        button.dataset.bound === "true"
      ) {
        return;
      }

      button.dataset.bound = "true";

      button.addEventListener(
        "click",
        () => {
          const action =
            button.dataset.action;

          const productId =
            button.dataset.productId;

          if (action === "edit") {
            editProduct(productId);
          }

          if (action === "publish") {
            togglePublished(productId);
          }

          if (action === "delete") {
            openDeleteModal(productId);
          }
        }
      );
    });
  }

  /* =========================================================
     FORM
  ========================================================= */

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

    updateProductCategories(
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

    const productId =
      byId("productId");

    if (productId) {
      productId.value = "";
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
        item =>
          String(item.id) ===
          String(productId)
      );

    if (!product) {
      showToast(
        "Product not found.",
        "error"
      );
      return;
    }

    state.editingProductId =
      product.id;

    state.selectedFiles = [];
    state.existingImages =
      [...product.images];

    const productIdField =
      byId("productId");

    const nameField =
      byId("productName");

    const metalField =
      byId("productMetal");

    const priceField =
      byId("productPrice");

    const skuField =
      byId("productSku");

    const materialField =
      byId("productMaterial");

    const descriptionField =
      byId("productDescription");

    if (productIdField) {
      productIdField.value =
        product.id;
    }

    if (nameField) {
      nameField.value =
        product.name;
    }

    if (metalField) {
      metalField.value =
        product.metal;
    }

    updateProductCategories(
      product.metal,
      product.category
    );

    if (priceField) {
      priceField.value =
        product.price ?? "";
    }

    if (skuField) {
      skuField.value =
        product.sku;
    }

    if (materialField) {
      materialField.value =
        product.material;
    }

    if (descriptionField) {
      descriptionField.value =
        product.description;
    }

    const published =
      byId("productPublished");

    if (published) {
      published.checked =
        product.is_published;
    }

    const featured =
      byId("productFeatured");

    if (featured) {
      featured.checked =
        product.featured;
    }

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

  function bindProductForm() {
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
          updateProductCategories(
            metal.value
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

    files.forEach(file => {
      if (
        !CONFIG.allowedImageTypes
          .includes(file.type)
      ) {
        showToast(
          `${file.name}: JPG, PNG or WebP only.`,
          "error"
        );
        return;
      }

      if (
        file.size >
        CONFIG.maxImageSize
      ) {
        showToast(
          `${file.name}: maximum size is 6MB.`,
          "error"
        );
        return;
      }

      state.selectedFiles.push(file);
    });

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

    container.innerHTML = "";

    state.existingImages.forEach(
      (url, index) => {
        const wrapper =
          document.createElement("div");

        wrapper.className =
          "image-preview-item";

        wrapper.innerHTML = `
          <img
            src="${escapeHtml(url)}"
            alt="Existing product image"
          >

          <button
            type="button"
            class="image-preview-item-remove"
            data-remove-image="existing"
            data-index="${index}"
            aria-label="Remove image"
          >
            ×
          </button>
        `;

        container.appendChild(wrapper);
      }
    );

    state.selectedFiles.forEach(
      (file, index) => {
        const wrapper =
          document.createElement("div");

        wrapper.className =
          "image-preview-item";

        const image =
          document.createElement("img");

        image.alt = file.name;

        const objectUrl =
          URL.createObjectURL(file);

        image.src = objectUrl;

        image.addEventListener(
          "load",
          () => {
            URL.revokeObjectURL(
              objectUrl
            );
          },
          { once: true }
        );

        const remove =
          document.createElement("button");

        remove.type = "button";
        remove.className =
          "image-preview-item-remove";
        remove.dataset.removeImage =
          "new";
        remove.dataset.index =
          String(index);
        remove.setAttribute(
          "aria-label",
          "Remove image"
        );
        remove.textContent = "×";

        wrapper.appendChild(image);
        wrapper.appendChild(remove);

        container.appendChild(wrapper);
      }
    );
  }

  /* =========================================================
     SAVE
  ========================================================= */

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

    const priceText =
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

    let price = null;

    if (priceText) {
      price =
        Number(
          priceText.replace(/,/g, "")
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

    const button =
      byId("saveProductButton");

    setButtonLoading(
      button,
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

      const uploadedImages =
        await uploadImages(metal);

      const images = [
        ...state.existingImages,
        ...uploadedImages
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

      let savedProduct;

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

        savedProduct =
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

        savedProduct =
          normalizeProduct(data);
      }

      if (!savedProduct) {
        throw new Error(
          "The product was not returned after saving."
        );
      }

      const index =
        state.products.findIndex(
          product =>
            String(product.id) ===
            String(savedProduct.id)
        );

      if (index >= 0) {
        state.products[index] =
          savedProduct;
      } else {
        state.products.unshift(
          savedProduct
        );
      }

      const wasEditing =
        Boolean(
          state.editingProductId
        );

      resetProductForm();

      updateCategoryFilter();
      renderDashboard();
      renderProducts();

      showToast(
        wasEditing
          ? "Product updated successfully."
          : "Product added successfully.",
        "success"
      );

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

      setButtonLoading(
        button,
        false
      );
    }
  }

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  async function uploadImages(metal) {
    if (
      !state.selectedFiles.length
    ) {
      return [];
    }

    const supabase =
      createSupabase();

    const uploadedUrls = [];

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
        `${Date.now()}-${Math.random()
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
          `Unable to create a public URL for ${file.name}.`
        );
      }

      uploadedUrls.push(
        data.publicUrl
      );
    }

    return uploadedUrls;
  }

  /* =========================================================
     PUBLISH / HIDE
  ========================================================= */

  async function togglePublished(productId) {
    const product =
      state.products.find(
        item =>
          String(item.id) ===
          String(productId)
      );

    if (!product) {
      showToast(
        "Product not found.",
        "error"
      );
      return;
    }

    const nextStatus =
      !product.is_published;

    try {
      const supabase =
        createSupabase();

      const { data, error } =
        await supabase
          .from("products")
          .update({
            is_published: nextStatus,
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
          item =>
            String(item.id) ===
            String(product.id)
        );

      if (index >= 0) {
        state.products[index] =
          updated;
      }

      renderDashboard();
      renderProducts();

      showToast(
        nextStatus
          ? "Product published."
          : "Product hidden.",
        "success"
      );
    } catch (error) {
      console.error(
        "Publish update error:",
        error
      );

      showToast(
        error?.message ||
          "Unable to update product.",
        "error"
      );
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  function openDeleteModal(productId) {
    const product =
      state.products.find(
        item =>
          String(item.id) ===
          String(productId)
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
      modal.removeAttribute(
        "hidden"
      );

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
      modal.setAttribute(
        "hidden",
        ""
      );

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

    setButtonLoading(
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
          item =>
            String(item.id) !==
            String(product.id)
        );

      closeDeleteModal();

      renderDashboard();
      renderProducts();

      showToast(
        "Product deleted successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      showToast(
        error?.message ||
          "Unable to delete product.",
        "error"
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  function bindDeleteModal() {
    $$("[data-close-confirm]")
      .forEach(element => {
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

  /* =========================================================
     INITIALIZATION
  ========================================================= */

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
    bindProductFilters();
    bindProductForm();
    bindDeleteModal();

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
        const isAdmin =
          await verifyAdmin(
            session.user.id
          );

        if (isAdmin) {
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
              const isAdmin =
                await verifyAdmin(
                  session.user.id
                );

              if (!isAdmin) {
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
                "Admin verification error:",
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
        "Auth initialization error:",
        error
      );

      setLoginMessage(
        error?.message ||
          "Unable to initialize the admin panel.",
        "error"
      );
    }
  }

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
        handleLogin
      );
    }

    document.addEventListener(
      "keydown",
      event => {
        if (event.key === "Escape") {
          closeDeleteModal();
          closeMobileSidebar();
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