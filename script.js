"use strict";

/*
 * Krishna Jewellers
 * Customer Website JavaScript
 *
 * Features:
 * - Supabase catalogue loading
 * - Search
 * - Category filtering
 * - Sorting
 * - Product details
 * - Wishlist
 * - Shopping bag
 * - WhatsApp enquiries
 * - Newsletter
 * - Mobile navigation
 * - Graceful fallback if Supabase is unavailable
 */

(function () {
  const CONFIG = window.KRISHNA_SUPABASE || {};

  const SUPABASE_URL = String(CONFIG.url || "").trim();
  const SUPABASE_KEY = String(CONFIG.key || "").trim();

  const WHATSAPP_NUMBER = "917394872651";
  const STORE_PHONE = "919839902006";
  const STORE_EMAIL = "krishnajewellersgkp@gmail.com";

  const FALLBACK_PRODUCTS = [
    {
      id: "demo-1",
      name: "Classic Gold Ring",
      category: "rings",
      price: 0,
      description:
        "A timeless jewellery piece designed for everyday elegance and special occasions.",
      image_url:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
      images: [],
      material: "Gold",
      featured: true
    },
    {
      id: "demo-2",
      name: "Elegant Gold Necklace",
      category: "necklaces",
      price: 0,
      description:
        "An elegant necklace designed to add a refined touch to your occasion.",
      image_url:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      images: [],
      material: "Gold",
      featured: true
    },
    {
      id: "demo-3",
      name: "Classic Earrings",
      category: "earrings",
      price: 0,
      description:
        "Beautiful earrings that complement both traditional and contemporary looks.",
      image_url:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
      images: [],
      material: "Gold",
      featured: true
    },
    {
      id: "demo-4",
      name: "Traditional Bangles",
      category: "bangles",
      price: 0,
      description:
        "Traditional-inspired bangles created to complete your festive look.",
      image_url:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
      images: [],
      material: "Gold",
      featured: true
    }
  ];

  let supabaseClient = null;

  let products = [];
  let filteredProducts = [];

  let currentCategory = "all";
  let currentSearch = "";
  let currentSort = "featured";

  let selectedProduct = null;

  let cart = loadStorageArray("krishna_cart");
  let wishlist = loadStorageArray("krishna_wishlist");

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();
    setupEventListeners();
    updateYear();
    updateCounts();
    renderCart();
    renderWishlist();

    initializeSupabase();

    await loadProducts();

    applyFiltersAndRender();
  }

  function cacheElements() {
    elements.siteHeader = document.getElementById("siteHeader");
    elements.mainNav = document.getElementById("mainNav");
    elements.mobileMenuBtn = document.getElementById("mobileMenuBtn");

    elements.searchToggle = document.getElementById("searchToggle");
    elements.searchPanel = document.getElementById("searchPanel");
    elements.searchClose = document.getElementById("searchClose");
    elements.searchInput = document.getElementById("searchInput");

    elements.categoryTabs = document.getElementById("categoryTabs");
    elements.sortProducts = document.getElementById("sortProducts");

    elements.productGrid = document.getElementById("productGrid");
    elements.productResultText = document.getElementById("productResultText");
    elements.emptyState = document.getElementById("emptyState");
    elements.clearFiltersBtn = document.getElementById("clearFiltersBtn");

    elements.wishlistBtn = document.getElementById("wishlistBtn");
    elements.wishlistCount = document.getElementById("wishlistCount");
    elements.wishlistDrawer = document.getElementById("wishlistDrawer");
    elements.wishlistClose = document.getElementById("wishlistClose");
    elements.wishlistItems = document.getElementById("wishlistItems");

    elements.cartBtn = document.getElementById("cartBtn");
    elements.cartCount = document.getElementById("cartCount");
    elements.cartDrawer = document.getElementById("cartDrawer");
    elements.cartClose = document.getElementById("cartClose");
    elements.cartItems = document.getElementById("cartItems");
    elements.cartTotal = document.getElementById("cartTotal");
    elements.checkoutBtn = document.getElementById("checkoutBtn");

    elements.productModal = document.getElementById("productModal");
    elements.modalProductImage = document.getElementById("modalProductImage");
    elements.modalProductCategory =
      document.getElementById("modalProductCategory");
    elements.modalProductName = document.getElementById("modalProductName");
    elements.modalProductPrice = document.getElementById("modalProductPrice");
    elements.modalProductDescription =
      document.getElementById("modalProductDescription");
    elements.modalProductMeta = document.getElementById("modalProductMeta");
    elements.modalEnquireBtn = document.getElementById("modalEnquireBtn");
    elements.modalAddCartBtn = document.getElementById("modalAddCartBtn");

    elements.checkoutModal = document.getElementById("checkoutModal");
    elements.checkoutForm = document.getElementById("checkoutForm");
    elements.customerName = document.getElementById("customerName");
    elements.customerPhone = document.getElementById("customerPhone");
    elements.customerMessage = document.getElementById("customerMessage");

    elements.newsletterForm = document.getElementById("newsletterForm");

    elements.toast = document.getElementById("toast");
  }

  function setupEventListeners() {
    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.addEventListener("click", toggleMobileMenu);
    }

    if (elements.mainNav) {
      elements.mainNav.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
          closeMobileMenu();
        }
      });
    }

    if (elements.searchToggle) {
      elements.searchToggle.addEventListener("click", openSearch);
    }

    if (elements.searchClose) {
      elements.searchClose.addEventListener("click", closeSearch);
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener(
        "input",
        debounce(function (event) {
          currentSearch = event.target.value.trim().toLowerCase();
          applyFiltersAndRender();
        }, 180)
      );

      elements.searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          closeSearch();
        }
      });
    }

    if (elements.categoryTabs) {
      elements.categoryTabs.addEventListener("click", function (event) {
        const button = event.target.closest("[data-category]");

        if (!button) {
          return;
        }

        currentCategory = button.dataset.category || "all";

        elements.categoryTabs
          .querySelectorAll("[data-category]")
          .forEach(function (tab) {
            tab.classList.toggle("active", tab === button);
          });

        applyFiltersAndRender();
      });
    }

    if (elements.sortProducts) {
      elements.sortProducts.addEventListener("change", function (event) {
        currentSort = event.target.value;
        applyFiltersAndRender();
      });
    }

    if (elements.clearFiltersBtn) {
      elements.clearFiltersBtn.addEventListener("click", clearFilters);
    }

    if (elements.productGrid) {
      elements.productGrid.addEventListener("click", handleProductGridClick);
    }

    if (elements.wishlistBtn) {
      elements.wishlistBtn.addEventListener("click", function () {
        openDrawer(elements.wishlistDrawer);
      });
    }

    if (elements.wishlistClose) {
      elements.wishlistClose.addEventListener("click", function () {
        closeDrawer(elements.wishlistDrawer);
      });
    }

    if (elements.wishlistItems) {
      elements.wishlistItems.addEventListener(
        "click",
        handleWishlistClick
      );
    }

    if (elements.cartBtn) {
      elements.cartBtn.addEventListener("click", function () {
        openDrawer(elements.cartDrawer);
      });
    }

    if (elements.cartClose) {
      elements.cartClose.addEventListener("click", function () {
        closeDrawer(elements.cartDrawer);
      });
    }

    if (elements.cartItems) {
      elements.cartItems.addEventListener("click", handleCartClick);
    }

    if (elements.checkoutBtn) {
      elements.checkoutBtn.addEventListener("click", openCheckout);
    }

    if (elements.modalEnquireBtn) {
      elements.modalEnquireBtn.addEventListener(
        "click",
        enquireAboutSelectedProduct
      );
    }

    if (elements.modalAddCartBtn) {
      elements.modalAddCartBtn.addEventListener("click", function () {
        if (selectedProduct) {
          addToCart(selectedProduct);
        }
      });
    }

    if (elements.checkoutForm) {
      elements.checkoutForm.addEventListener(
        "submit",
        handleCheckoutSubmit
      );
    }

    if (elements.newsletterForm) {
      elements.newsletterForm.addEventListener(
        "submit",
        handleNewsletterSubmit
      );
    }

    document.addEventListener("click", function (event) {
      const closeTarget = event.target.closest("[data-close-modal]");

      if (closeTarget) {
        closeAllModals();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeAllModals();
        closeDrawer(elements.cartDrawer);
        closeDrawer(elements.wishlistDrawer);
        closeSearch();
      }
    });

    window.addEventListener("scroll", handleHeaderScroll, {
      passive: true
    });
  }

  function initializeSupabase() {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      SUPABASE_URL.includes("YOUR_SUPABASE") ||
      SUPABASE_KEY.includes("YOUR_SUPABASE")
    ) {
      console.warn(
        "Krishna Jewellers: Supabase configuration is incomplete."
      );

      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.warn(
        "Krishna Jewellers: Supabase JavaScript library was not loaded."
      );

      return;
    }

    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    } catch (error) {
      console.error("Unable to initialize Supabase:", error);
      supabaseClient = null;
    }
  }

  async function loadProducts() {
    showLoadingState();

    if (!supabaseClient) {
      products = FALLBACK_PRODUCTS.map(normalizeProduct);

      showToast(
        "Supabase is not connected. Demo catalogue is being shown.",
        "info"
      );

      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("is_published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      products = Array.isArray(data)
        ? data.map(normalizeProduct)
        : [];

      /*
       * If the database is empty, show a friendly empty catalogue
       * instead of fake products.
       */
      if (products.length === 0) {
        console.info(
          "Krishna Jewellers: No published products found in Supabase."
        );
      }
    } catch (error) {
      console.error("Could not load Supabase products:", error);

      products = FALLBACK_PRODUCTS.map(normalizeProduct);

      showToast(
        "Could not load the online catalogue. Showing demo items.",
        "error"
      );
    }
  }

  function normalizeProduct(product) {
    const item = product && typeof product === "object"
      ? { ...product }
      : {};

    const images = normalizeImages(item);

    let imageUrl =
      item.image_url ||
      item.image ||
      images[0] ||
      "";

    if (!imageUrl) {
      imageUrl =
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85";
    }

    return {
      id: String(item.id || ""),
      name: String(item.name || "Untitled Jewellery"),
      category: normalizeCategory(item.category),
      price: normalizePrice(item.price),
      description: String(
        item.description ||
          "Please contact Krishna Jewellers for product details."
      ),
      image_url: imageUrl,
      images: images,
      material: String(item.material || item.metal || ""),
      featured: Boolean(item.featured),
      is_published:
        item.is_published === undefined
          ? true
          : Boolean(item.is_published),
      created_at: item.created_at || "",
      updated_at: item.updated_at || ""
    };
  }

  function normalizeImages(product) {
    if (!product) {
      return [];
    }

    if (Array.isArray(product.images)) {
      return product.images
        .map(function (image) {
          if (typeof image === "string") {
            return image;
          }

          if (image && typeof image === "object") {
            return image.url || image.publicUrl || image.path || "";
          }

          return "";
        })
        .filter(Boolean);
    }

    if (typeof product.images === "string") {
      try {
        const parsed = JSON.parse(product.images);

        if (Array.isArray(parsed)) {
          return parsed
            .map(function (image) {
              if (typeof image === "string") {
                return image;
              }

              if (image && typeof image === "object") {
                return image.url || image.publicUrl || image.path || "";
              }

              return "";
            })
            .filter(Boolean);
        }
      } catch (error) {
        return product.images
          .split(",")
          .map(function (item) {
            return item.trim();
          })
          .filter(Boolean);
      }
    }

    return [];
  }

  function normalizeCategory(category) {
    const value = String(category || "other")
      .trim()
      .toLowerCase();

    const allowed = [
      "rings",
      "necklaces",
      "earrings",
      "bangles",
      "bracelets",
      "chains",
      "other"
    ];

    if (allowed.includes(value)) {
      return value;
    }

    return "other";
  }

  function normalizePrice(price) {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return 0;
    }

    return numericPrice;
  }

  function applyFiltersAndRender() {
    const search = currentSearch;

    filteredProducts = products.filter(function (product) {
      const matchesCategory =
        currentCategory === "all" ||
        product.category === currentCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        product.name,
        product.category,
        product.description,
        product.material
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });

    sortProducts(filteredProducts);

    renderProducts();
  }

  function sortProducts(items) {
    items.sort(function (a, b) {
      switch (currentSort) {
        case "name-asc":
          return a.name.localeCompare(b.name);

        case "name-desc":
          return b.name.localeCompare(a.name);

        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "featured":
        default:
          if (a.featured !== b.featured) {
            return Number(b.featured) - Number(a.featured);
          }

          return a.name.localeCompare(b.name);
      }
    });
  }

  function renderProducts() {
    if (!elements.productGrid) {
      return;
    }

    const total = filteredProducts.length;

    if (elements.productResultText) {
      elements.productResultText.textContent =
        total === 1
          ? "1 piece"
          : `${total} pieces`;
    }

    if (total === 0) {
      elements.productGrid.innerHTML = "";

      if (elements.emptyState) {
        elements.emptyState.hidden = false;
      }

      return;
    }

    if (elements.emptyState) {
      elements.emptyState.hidden = true;
    }

    elements.productGrid.innerHTML = filteredProducts
      .map(createProductCard)
      .join("");
  }

  function createProductCard(product) {
    const isWishlisted = wishlist.includes(product.id);

    const categoryName = formatCategory(product.category);

    const priceMarkup =
      product.price > 0
        ? `<span class="product-price">${formatCurrency(
            product.price
          )}</span>`
        : `<span class="product-price enquiry-price">Price on enquiry</span>`;

    return `
      <article class="product-card" data-product-id="${escapeAttribute(
        product.id
      )}">

        <div class="product-image-wrap">

          <button
            type="button"
            class="product-wishlist ${isWishlisted ? "active" : ""}"
            data-action="wishlist"
            data-product-id="${escapeAttribute(product.id)}"
            aria-label="${
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }"
            title="${
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }"
          >
            ${isWishlisted ? "♥" : "♡"}
          </button>

          <button
            type="button"
            class="product-image-button"
            data-action="view"
            data-product-id="${escapeAttribute(product.id)}"
            aria-label="View ${escapeAttribute(product.name)}"
          >
            <img
              src="${escapeAttribute(product.image_url)}"
              alt="${escapeAttribute(product.name)}"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85';"
            >
          </button>

        </div>

        <div class="product-card-content">

          <p class="product-category">
            ${escapeHTML(categoryName)}
          </p>

          <h3>
            <button
              type="button"
              class="product-title-button"
              data-action="view"
              data-product-id="${escapeAttribute(product.id)}"
            >
              ${escapeHTML(product.name)}
            </button>
          </h3>

          <div class="product-card-bottom">

            ${priceMarkup}

            <button
              type="button"
              class="product-view-btn"
              data-action="view"
              data-product-id="${escapeAttribute(product.id)}"
            >
              View
            </button>

          </div>

        </div>

      </article>
    `;
  }

  function handleProductGridClick(event) {
    const actionElement = event.target.closest("[data-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;
    const productId = actionElement.dataset.productId;

    if (!productId) {
      return;
    }

    const product = findProduct(productId);

    if (!product) {
      return;
    }

    if (action === "view") {
      openProductModal(product);
      return;
    }

    if (action === "wishlist") {
      toggleWishlist(product);
    }
  }

  function openProductModal(product) {
    selectedProduct = product;

    if (elements.modalProductImage) {
      elements.modalProductImage.src = product.image_url;
      elements.modalProductImage.alt = product.name;
    }

    if (elements.modalProductCategory) {
      elements.modalProductCategory.textContent =
        formatCategory(product.category);
    }

    if (elements.modalProductName) {
      elements.modalProductName.textContent = product.name;
    }

    if (elements.modalProductPrice) {
      elements.modalProductPrice.textContent =
        product.price > 0
          ? formatCurrency(product.price)
          : "Price available on enquiry";
    }

    if (elements.modalProductDescription) {
      elements.modalProductDescription.textContent =
        product.description;
    }

    if (elements.modalProductMeta) {
      const metaParts = [];

      if (product.material) {
        metaParts.push(
          `<span><strong>Material:</strong> ${escapeHTML(
            product.material
          )}</span>`
        );
      }

      if (product.category) {
        metaParts.push(
          `<span><strong>Category:</strong> ${escapeHTML(
            formatCategory(product.category)
          )}</span>`
        );
      }

      elements.modalProductMeta.innerHTML = metaParts.join("");
    }

    if (elements.modalAddCartBtn) {
      elements.modalAddCartBtn.textContent = isInCart(product.id)
        ? "Added to Bag"
        : "Add to Bag";
    }

    openModal(elements.productModal);
  }

  function enquireAboutSelectedProduct() {
    if (!selectedProduct) {
      return;
    }

    const price =
      selectedProduct.price > 0
        ? formatCurrency(selectedProduct.price)
        : "Price on enquiry";

    const message = [
      "Hello Krishna Jewellers,",
      "",
      "I am interested in this jewellery piece:",
      `Product: ${selectedProduct.name}`,
      `Category: ${formatCategory(selectedProduct.category)}`,
      `Price: ${price}`,
      "",
      "Please share availability and details."
    ].join("\n");

    openWhatsApp(message);
  }

  function toggleWishlist(product) {
    const index = wishlist.indexOf(product.id);

    if (index >= 0) {
      wishlist.splice(index, 1);
      showToast("Removed from wishlist.");
    } else {
      wishlist.push(product.id);
      showToast("Added to wishlist.");
    }

    saveStorageArray("krishna_wishlist", wishlist);

    updateCounts();
    renderProducts();
    renderWishlist();
  }

  function renderWishlist() {
    if (!elements.wishlistItems) {
      return;
    }

    const items = wishlist
      .map(function (id) {
        return findProduct(id);
      })
      .filter(Boolean);

    if (items.length === 0) {
      elements.wishlistItems.innerHTML = `
        <div class="drawer-empty">
          <div class="drawer-empty-icon">♡</div>
          <h3>Your wishlist is empty</h3>
          <p>Save jewellery pieces here while you browse.</p>
        </div>
      `;

      return;
    }

    elements.wishlistItems.innerHTML = items
      .map(function (product) {
        return `
          <div class="drawer-product">

            <img
              src="${escapeAttribute(product.image_url)}"
              alt="${escapeAttribute(product.name)}"
              onerror="this.src='https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=400&q=80';"
            >

            <div class="drawer-product-info">

              <button
                type="button"
                class="drawer-product-title"
                data-wishlist-action="view"
                data-product-id="${escapeAttribute(product.id)}"
              >
                ${escapeHTML(product.name)}
              </button>

              <span>
                ${
                  product.price > 0
                    ? formatCurrency(product.price)
                    : "Price on enquiry"
                }
              </span>

              <div class="drawer-product-actions">

                <button
                  type="button"
                  data-wishlist-action="add-cart"
                  data-product-id="${escapeAttribute(product.id)}"
                >
                  Add to bag
                </button>

                <button
                  type="button"
                  data-wishlist-action="remove"
                  data-product-id="${escapeAttribute(product.id)}"
                >
                  Remove
                </button>

              </div>

            </div>

          </div>
        `;
      })
      .join("");
  }

  function handleWishlistClick(event) {
    const button = event.target.closest("[data-wishlist-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.wishlistAction;
    const product = findProduct(button.dataset.productId);

    if (!product) {
      return;
    }

    if (action === "view") {
      closeDrawer(elements.wishlistDrawer);
      openProductModal(product);
      return;
    }

    if (action === "add-cart") {
      addToCart(product);
      return;
    }

    if (action === "remove") {
      toggleWishlist(product);
    }
  }

  function addToCart(product) {
    const existing = cart.find(function (item) {
      return item.id === product.id;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      });
    }

    saveStorageArray("krishna_cart", cart);

    updateCounts();
    renderCart();

    if (elements.modalAddCartBtn && selectedProduct) {
      elements.modalAddCartBtn.textContent = "Added to Bag";
    }

    showToast(`${product.name} added to your bag.`);
  }

  function removeFromCart(productId) {
    cart = cart.filter(function (item) {
      return item.id !== productId;
    });

    saveStorageArray("krishna_cart", cart);

    updateCounts();
    renderCart();
  }

  function changeCartQuantity(productId, amount) {
    const item = cart.find(function (cartItem) {
      return cartItem.id === productId;
    });

    if (!item) {
      return;
    }

    item.quantity += amount;

    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    saveStorageArray("krishna_cart", cart);

    updateCounts();
    renderCart();
  }

  function renderCart() {
    if (!elements.cartItems) {
      return;
    }

    if (cart.length === 0) {
      elements.cartItems.innerHTML = `
        <div class="drawer-empty">
          <div class="drawer-empty-icon">♧</div>
          <h3>Your bag is empty</h3>
          <p>Add jewellery pieces you're interested in.</p>
        </div>
      `;

      if (elements.cartTotal) {
        elements.cartTotal.textContent = "₹0";
      }

      return;
    }

    elements.cartItems.innerHTML = cart
      .map(function (item) {
        const lineTotal = item.price * item.quantity;

        return `
          <div class="drawer-product">

            <img
              src="${escapeAttribute(item.image_url)}"
              alt="${escapeAttribute(item.name)}"
              onerror="this.src='https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=400&q=80';"
            >

            <div class="drawer-product-info">

              <button
                type="button"
                class="drawer-product-title"
                data-cart-action="view"
                data-product-id="${escapeAttribute(item.id)}"
              >
                ${escapeHTML(item.name)}
              </button>

              <span>
                ${
                  item.price > 0
                    ? formatCurrency(lineTotal)
                    : "Price on enquiry"
                }
              </span>

              <div class="quantity-controls">

                <button
                  type="button"
                  data-cart-action="decrease"
                  data-product-id="${escapeAttribute(item.id)}"
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span>${item.quantity}</span>

                <button
                  type="button"
                  data-cart-action="increase"
                  data-product-id="${escapeAttribute(item.id)}"
                  aria-label="Increase quantity"
                >
                  +
                </button>

              </div>

              <button
                type="button"
                class="remove-cart-item"
                data-cart-action="remove"
                data-product-id="${escapeAttribute(item.id)}"
              >
                Remove
              </button>

            </div>

          </div>
        `;
      })
      .join("");

    if (elements.cartTotal) {
      elements.cartTotal.textContent = formatCurrency(calculateCartTotal());
    }
  }

  function handleCartClick(event) {
    const button = event.target.closest("[data-cart-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.cartAction;
    const productId = button.dataset.productId;

    if (action === "increase") {
      changeCartQuantity(productId, 1);
      return;
    }

    if (action === "decrease") {
      changeCartQuantity(productId, -1);
      return;
    }

    if (action === "remove") {
      removeFromCart(productId);
      showToast("Removed from your bag.");
      return;
    }

    if (action === "view") {
      const product = findProduct(productId);

      if (product) {
        closeDrawer(elements.cartDrawer);
        openProductModal(product);
      }
    }
  }

  function calculateCartTotal() {
    return cart.reduce(function (total, item) {
      return total + item.price * item.quantity;
    }, 0);
  }

  function isInCart(productId) {
    return cart.some(function (item) {
      return item.id === productId;
    });
  }

  function openCheckout() {
    if (cart.length === 0) {
      showToast("Your bag is empty.");
      return;
    }

    closeDrawer(elements.cartDrawer);

    if (elements.customerMessage) {
      elements.customerMessage.value =
        "I am interested in the jewellery pieces in my bag.";
    }

    openModal(elements.checkoutModal);
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();

    const name = String(
      elements.customerName?.value || ""
    ).trim();

    const phone = String(
      elements.customerPhone?.value || ""
    ).trim();

    const message = String(
      elements.customerMessage?.value || ""
    ).trim();

    if (!name || !phone) {
      showToast("Please enter your name and phone number.", "error");
      return;
    }

    const lines = [
      "Hello Krishna Jewellers,",
      "",
      "I would like to enquire about these jewellery pieces:",
      ""
    ];

    cart.forEach(function (item, index) {
      lines.push(
        `${index + 1}. ${item.name} × ${item.quantity}`
      );

      if (item.price > 0) {
        lines.push(
          `   Price: ${formatCurrency(
            item.price * item.quantity
          )}`
        );
      }
    });

    const total = calculateCartTotal();

    if (total > 0) {
      lines.push("");
      lines.push(`Estimated total: ${formatCurrency(total)}`);
    }

    lines.push("");
    lines.push(`Name: ${name}`);
    lines.push(`Phone: ${phone}`);

    if (message) {
      lines.push(`Message: ${message}`);
    }

    lines.push("");
    lines.push("Please share availability and further details.");

    openWhatsApp(lines.join("\n"));

    closeAllModals();
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    const email = String(
      elements.newsletterEmail?.value || ""
    ).trim();

    if (!email) {
      return;
    }

    showToast("Thank you for subscribing.");

    event.target.reset();
  }

  function openWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openModal(modal) {
    if (!modal) {
      return;
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    const firstInput = modal.querySelector(
      "input, textarea, button"
    );

    if (firstInput) {
      setTimeout(function () {
        firstInput.focus();
      }, 50);
    }
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    if (
      !document.querySelector(".modal.active") &&
      !document.querySelector(".side-drawer.active")
    ) {
      document.body.classList.remove("modal-open");
    }
  }

  function closeAllModals() {
    closeModal(elements.productModal);
    closeModal(elements.checkoutModal);

    selectedProduct = null;
  }

  function openDrawer(drawer) {
    if (!drawer) {
      return;
    }

    document
      .querySelectorAll(".side-drawer.active")
      .forEach(function (item) {
        if (item !== drawer) {
          closeDrawer(item);
        }
      });

    drawer.classList.add("active");
    drawer.setAttribute("aria-hidden", "false");

    document.body.classList.add("drawer-open");
  }

  function closeDrawer(drawer) {
    if (!drawer) {
      return;
    }

    drawer.classList.remove("active");
    drawer.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".side-drawer.active")) {
      document.body.classList.remove("drawer-open");
    }
  }

  function toggleMobileMenu() {
    if (!elements.mainNav || !elements.mobileMenuBtn) {
      return;
    }

    const isOpen = elements.mainNav.classList.toggle("active");

    elements.mobileMenuBtn.classList.toggle("active", isOpen);

    elements.mobileMenuBtn.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    document.body.classList.toggle("nav-open", isOpen);
  }

  function closeMobileMenu() {
    if (!elements.mainNav || !elements.mobileMenuBtn) {
      return;
    }

    elements.mainNav.classList.remove("active");
    elements.mobileMenuBtn.classList.remove("active");

    elements.mobileMenuBtn.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove("nav-open");
  }

  function openSearch() {
    if (!elements.searchPanel) {
      return;
    }

    elements.searchPanel.classList.add("active");

    if (elements.searchInput) {
      setTimeout(function () {
        elements.searchInput.focus();
      }, 100);
    }
  }

  function closeSearch() {
    if (!elements.searchPanel) {
      return;
    }

    elements.searchPanel.classList.remove("active");
  }

  function clearFilters() {
    currentCategory = "all";
    currentSearch = "";
    currentSort = "featured";

    if (elements.searchInput) {
      elements.searchInput.value = "";
    }

    if (elements.sortProducts) {
      elements.sortProducts.value = "featured";
    }

    if (elements.categoryTabs) {
      elements.categoryTabs
        .querySelectorAll("[data-category]")
        .forEach(function (button) {
          button.classList.toggle(
            "active",
            button.dataset.category === "all"
          );
        });
    }

    applyFiltersAndRender();
  }

  function handleHeaderScroll() {
    if (!elements.siteHeader) {
      return;
    }

    elements.siteHeader.classList.toggle(
      "scrolled",
      window.scrollY > 20
    );
  }

  function updateCounts() {
    if (elements.wishlistCount) {
      elements.wishlistCount.textContent = wishlist.length;
      elements.wishlistCount.hidden = wishlist.length === 0;
    }

    if (elements.cartCount) {
      const totalQuantity = cart.reduce(function (total, item) {
        return total + item.quantity;
      }, 0);

      elements.cartCount.textContent = totalQuantity;
      elements.cartCount.hidden = totalQuantity === 0;
    }
  }

  function updateYear() {
    const yearElement = document.getElementById("currentYear");

    if (yearElement) {
      yearElement.textContent = String(new Date().getFullYear());
    }
  }

  function showLoadingState() {
    if (!elements.productGrid) {
      return;
    }

    if (elements.emptyState) {
      elements.emptyState.hidden = true;
    }

    elements.productGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading jewellery...</p>
      </div>
    `;

    if (elements.productResultText) {
      elements.productResultText.textContent =
        "Loading collection...";
    }
  }

  let toastTimer = null;

  function showToast(message, type) {
    if (!elements.toast) {
      return;
    }

    clearTimeout(toastTimer);

    elements.toast.textContent = message;

    elements.toast.className = "toast";

    if (type) {
      elements.toast.classList.add(type);
    }

    elements.toast.classList.add("show");

    toastTimer = setTimeout(function () {
      elements.toast.classList.remove("show");
    }, 3200);
  }

  function findProduct(productId) {
    return products.find(function (product) {
      return String(product.id) === String(productId);
    });
  }

  function formatCategory(category) {
    const names = {
      rings: "Rings",
      necklaces: "Necklaces",
      earrings: "Earrings",
      bangles: "Bangles",
      bracelets: "Bracelets",
      chains: "Chains",
      other: "Jewellery"
    };

    return names[category] || "Jewellery";
  }

  function formatCurrency(amount) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(numericAmount);
  }

  function loadStorageArray(key) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`Could not read ${key} from localStorage.`, error);

      return [];
    }
  }

  function saveStorageArray(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not save ${key} to localStorage.`, error);
    }
  }

  function debounce(callback, delay) {
    let timer = null;

    return function () {
      const context = this;
      const args = arguments;

      clearTimeout(timer);

      timer = setTimeout(function () {
        callback.apply(context, args);
      }, delay);
    };
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }

  /*
   * Expose a small public API.
   * This is useful if you later want buttons or other
   * components to interact with the catalogue.
   */
  window.KrishnaJewellers = {
    getProducts: function () {
      return products.slice();
    },

    getCart: function () {
      return cart.slice();
    },

    getWishlist: function () {
      return wishlist.slice();
    },

    refreshCatalogue: async function () {
      await loadProducts();
      applyFiltersAndRender();
    },

    enquire: function (productId) {
      const product = findProduct(productId);

      if (product) {
        selectedProduct = product;
        enquireAboutSelectedProduct();
      }
    }
  };
})();
