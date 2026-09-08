"use strict";

(() => {
  const config = window.KRISHNA_SUPABASE || {};

  const SUPABASE_URL = String(config.url || "").replace(/\/$/, "");
  const SUPABASE_KEY = String(config.key || "");

  const hasSupabaseConfig =
    SUPABASE_URL &&
    SUPABASE_KEY &&
    !SUPABASE_KEY.includes("YOUR_");

  const supabaseClient =
    hasSupabaseConfig && window.supabase
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
      : null;

  const FALLBACK_PRODUCTS = [
    {
      id: "demo-1",
      name: "Classic Gold Ring",
      category: "rings",
      price: 0,
      description: "A timeless gold ring crafted for everyday elegance.",
      material: "Gold",
      sku: "KR-RING-001",
      image_url:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85",
      images: [],
      featured: true,
      is_published: true
    },
    {
      id: "demo-2",
      name: "Elegant Gold Necklace",
      category: "necklaces",
      price: 0,
      description: "An elegant necklace designed to add a refined golden touch.",
      material: "Gold",
      sku: "KR-NK-001",
      image_url:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85",
      images: [],
      featured: true,
      is_published: true
    },
    {
      id: "demo-3",
      name: "Diamond Earrings",
      category: "earrings",
      price: 0,
      description: "Sophisticated earrings made for memorable occasions.",
      material: "Gold & Diamond",
      sku: "KR-EAR-001",
      image_url:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85",
      images: [],
      featured: false,
      is_published: true
    },
    {
      id: "demo-4",
      name: "Traditional Gold Bangles",
      category: "bangles",
      price: 0,
      description: "Beautiful traditional bangles with a timeless finish.",
      material: "Gold",
      sku: "KR-BAN-001",
      image_url:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85",
      images: [],
      featured: false,
      is_published: true
    }
  ];

  const state = {
    products: [],
    filteredProducts: [],
    activeCategory: "all",
    searchTerm: "",
    sort: "featured",
    wishlist: loadWishlist(),
    currentProduct: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupHeader();
    setupNavigation();
    setupSearch();
    setupCategories();
    setupSorting();
    setupWishlist();
    setupProductModal();
    setupNewsletter();
    setupScrollReveal();
    setupWhatsAppLinks();

    await loadProducts();
  }

  /* =======================================================
     PRODUCTS
  ======================================================= */

  async function loadProducts() {
    let products = [];

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("products")
          .select("*")
          .eq("is_published", true)
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase catalogue error:", error);
        } else {
          products = (data || []).map(normalizeProduct);
        }
      } catch (error) {
        console.error("Catalogue loading error:", error);
      }
    }

    state.products = products.length ? products : FALLBACK_PRODUCTS;
    applyFilters();
  }

  function normalizeProduct(product) {
    const images = normalizeImages(product.images);

    return {
      id: product.id,
      name: product.name || "Jewellery",
      category: String(product.category || "other").toLowerCase(),
      price: Number(product.price || 0),
      description:
        product.description ||
        "Beautifully crafted jewellery from Krishna Jewellers.",
      material: product.material || "Gold",
      sku: product.sku || "",
      image_url:
        product.image_url ||
        images[0]?.url ||
        images[0] ||
        "",
      images,
      featured: Boolean(product.featured),
      is_published: Boolean(product.is_published),
      created_at: product.created_at || "",
      updated_at: product.updated_at || ""
    };
  }

  function normalizeImages(images) {
    if (!Array.isArray(images)) return [];

    return images
      .map((image) => {
        if (typeof image === "string") {
          return {
            url: image,
            path: ""
          };
        }

        if (image && typeof image === "object" && image.url) {
          return {
            url: image.url,
            path: image.path || ""
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  function applyFilters() {
    let products = [...state.products];

    if (state.activeCategory !== "all") {
      products = products.filter(
        (product) => product.category === state.activeCategory
      );
    }

    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();

      products = products.filter((product) => {
        return [
          product.name,
          product.category,
          product.description,
          product.material,
          product.sku
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
    }

    products.sort((a, b) => {
      switch (state.sort) {
        case "newest":
          return (
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
          );

        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "name":
          return a.name.localeCompare(b.name);

        case "featured":
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });

    state.filteredProducts = products;
    renderProducts();
  }

  function renderProducts() {
    const grid = $("#productGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const resultText = $("#productResultText");

    if (resultText) {
      resultText.textContent =
        `${state.filteredProducts.length} ` +
        `${state.filteredProducts.length === 1 ? "piece" : "pieces"} available`;
    }

    const emptyState = $("#emptyState");

    if (!state.filteredProducts.length) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    state.filteredProducts.forEach((product, index) => {
      const card = createProductCard(product, index);
      grid.appendChild(card);
    });
  }

  function createProductCard(product, index) {
    const article = document.createElement("article");
    article.className = "product-card";
    article.style.animationDelay = `${Math.min(index * 70, 500)}ms`;

    const image =
      product.image_url ||
      product.images?.[0]?.url ||
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1000&q=85";

    const isWishlisted = state.wishlist.includes(product.id);

    article.innerHTML = `
      <div class="product-image">
        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
        >

        ${
          product.featured
            ? `<span class="product-badge">Featured</span>`
            : ""
        }

        <button
          class="product-wishlist ${isWishlisted ? "active" : ""}"
          type="button"
          aria-label="Add ${escapeAttribute(product.name)} to wishlist"
          data-wishlist-id="${escapeAttribute(product.id)}"
        >
          ${isWishlisted ? "♥" : "♡"}
        </button>
      </div>

      <div class="product-info">
        <div class="product-category">
          ${escapeHTML(formatCategory(product.category))}
        </div>

        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description)}
        </p>

        ${
          product.price > 0
            ? `<div class="product-price">${formatCurrency(product.price)}</div>`
            : `<div class="product-price">Price on enquiry</div>`
        }

        <div class="product-actions">
          <button
            class="btn btn-outline view-product"
            type="button"
            data-product-id="${escapeAttribute(product.id)}"
          >
            View Details
          </button>

          <button
            class="btn btn-gold enquire-product"
            type="button"
            data-product-id="${escapeAttribute(product.id)}"
          >
            Enquire
          </button>
        </div>
      </div>
    `;

    const wishlistButton = article.querySelector("[data-wishlist-id]");
    wishlistButton?.addEventListener("click", () => {
      toggleWishlist(product.id);
    });

    article.querySelector(".view-product")?.addEventListener("click", () => {
      openProductModal(product.id);
    });

    article.querySelector(".enquire-product")?.addEventListener("click", () => {
      sendWhatsAppEnquiry(product);
    });

    return article;
  }

  /* =======================================================
     CATEGORIES
  ======================================================= */

  function setupCategories() {
    $$(".category-tab").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".category-tab").forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        state.activeCategory =
          button.dataset.category || "all";

        applyFilters();
      });
    });
  }

  /* =======================================================
     SEARCH
  ======================================================= */

  function setupSearch() {
    const toggle = $("#searchToggle");
    const panel = $("#searchPanel");
    const close = $("#searchClose");
    const input = $("#searchInput");

    toggle?.addEventListener("click", () => {
      panel?.classList.toggle("open");

      if (panel?.classList.contains("open")) {
        setTimeout(() => input?.focus(), 150);
      }
    });

    close?.addEventListener("click", () => {
      panel?.classList.remove("open");
    });

    input?.addEventListener("input", (event) => {
      state.searchTerm = event.target.value.trim();
      applyFilters();
    });
  }

  /* =======================================================
     SORTING
  ======================================================= */

  function setupSorting() {
    const select = $("#sortProducts");

    select?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      applyFilters();
    });
  }

  /* =======================================================
     WISHLIST
  ======================================================= */

  function loadWishlist() {
    try {
      const stored = localStorage.getItem("krishna_wishlist");
      const parsed = JSON.parse(stored || "[]");

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveWishlist() {
    localStorage.setItem(
      "krishna_wishlist",
      JSON.stringify(state.wishlist)
    );
  }

  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);

    if (index >= 0) {
      state.wishlist.splice(index, 1);
      showToast("Removed from wishlist");
    } else {
      state.wishlist.push(productId);
      showToast("Added to wishlist");
    }

    saveWishlist();
    updateWishlistCount();
    applyFilters();

    if ($("#wishlistDrawer")?.classList.contains("open")) {
      renderWishlist();
    }
  }

  function setupWishlist() {
    const button = $("#wishlistBtn");
    const close = $("#wishlistClose");
    const drawer = $("#wishlistDrawer");

    button?.addEventListener("click", () => {
      renderWishlist();
      openDrawer(drawer);
    });

    close?.addEventListener("click", () => {
      closeDrawer(drawer);
    });

    updateWishlistCount();
  }

  function renderWishlist() {
    const container = $("#wishlistItems");
    if (!container) return;

    container.innerHTML = "";

    const products = state.wishlist
      .map((id) => state.products.find((product) => product.id === id))
      .filter(Boolean);

    if (!products.length) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Your wishlist is empty</h3>
          <p>Save your favourite pieces here.</p>
        </div>
      `;
      return;
    }

    products.forEach((product) => {
      const image =
        product.image_url ||
        product.images?.[0]?.url ||
        "";

      const item = document.createElement("div");
      item.className = "wishlist-item";

      item.innerHTML = `
        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
        >

        <div>
          <h4>${escapeHTML(product.name)}</h4>
          <p>${escapeHTML(formatCategory(product.category))}</p>
        </div>

        <button
          class="wishlist-remove"
          type="button"
          aria-label="Remove from wishlist"
        >
          ×
        </button>
      `;

      item.querySelector(".wishlist-remove")?.addEventListener(
        "click",
        () => toggleWishlist(product.id)
      );

      container.appendChild(item);
    });
  }

  function updateWishlistCount() {
    const count = $("#wishlistCount");

    if (!count) return;

    count.textContent = state.wishlist.length;
    count.classList.toggle("hidden", state.wishlist.length === 0);
  }

  /* =======================================================
     PRODUCT MODAL
  ======================================================= */

  function setupProductModal() {
    const overlay = $("#productModal");
    const close = $("#productModalClose");

    close?.addEventListener("click", () => {
      closeModal(overlay);
    });

    overlay?.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeModal(overlay);
      }
    });
  }

  function openProductModal(productId) {
    const product = state.products.find(
      (item) => item.id === productId
    );

    if (!product) return;

    state.currentProduct = product;

    const modal = $("#productModal");
    if (!modal) return;

    const image =
      product.image_url ||
      product.images?.[0]?.url ||
      "";

    const imageElement = $("#productModalImage");
    const categoryElement = $("#productModalCategory");
    const nameElement = $("#productModalName");
    const descriptionElement = $("#productModalDescription");
    const materialElement = $("#productModalMaterial");
    const priceElement = $("#productModalPrice");
    const enquiryButton = $("#productModalEnquire");

    if (imageElement) {
      imageElement.src = image;
      imageElement.alt = product.name;
    }

    if (categoryElement) {
      categoryElement.textContent =
        formatCategory(product.category);
    }

    if (nameElement) {
      nameElement.textContent = product.name;
    }

    if (descriptionElement) {
      descriptionElement.textContent = product.description;
    }

    if (materialElement) {
      materialElement.textContent =
        product.material || "Gold";
    }

    if (priceElement) {
      priceElement.textContent =
        product.price > 0
          ? formatCurrency(product.price)
          : "Price on enquiry";
    }

    enquiryButton?.replaceWith(
      enquiryButton.cloneNode(true)
    );

    $("#productModalEnquire")?.addEventListener(
      "click",
      () => sendWhatsAppEnquiry(product)
    );

    openModal(modal);
  }

  /* =======================================================
     WHATSAPP
  ======================================================= */

  function setupWhatsAppLinks() {
    const phone = "919839902006";

    $$("[data-whatsapp]").forEach((link) => {
      link.href = `https://wa.me/${phone}`;
    });
  }

  function sendWhatsAppEnquiry(product) {
    const phone = "919839902006";

    const message =
      `Hello Krishna Jewellers,%0A%0A` +
      `I am interested in:%0A` +
      `${encodeURIComponent(product.name)}%0A%0A` +
      `Category: ${encodeURIComponent(
        formatCategory(product.category)
      )}%0A` +
      `SKU: ${encodeURIComponent(product.sku || "N/A")}%0A%0A` +
      `Please share more details and the current price.`;

    window.open(
      `https://wa.me/${phone}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =======================================================
     HEADER / NAVIGATION
  ======================================================= */

  function setupHeader() {
    const header = $("#siteHeader");

    const update = () => {
      header?.classList.toggle(
        "scrolled",
        window.scrollY > 20
      );
    };

    update();
    window.addEventListener("scroll", update, {
      passive: true
    });
  }

  function setupNavigation() {
    const button = $("#mobileMenuBtn");
    const nav = $("#mainNav");

    button?.addEventListener("click", () => {
      nav?.classList.toggle("open");
    });

    $$("#mainNav a").forEach((link) => {
      link.addEventListener("click", () => {
        nav?.classList.remove("open");
      });
    });
  }

  /* =======================================================
     NEWSLETTER
  ======================================================= */

  function setupNewsletter() {
    const form = $("#newsletterForm");

    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const input = form.querySelector("input");

      if (!input?.value.trim()) {
        showToast("Please enter your email");
        return;
      }

      showToast("Thank you for subscribing");
      form.reset();
    });
  }

  /* =======================================================
     SCROLL REVEAL
  ======================================================= */

  function setupScrollReveal() {
    const elements = $(
      ".section-heading, .story-grid, .service-card, " +
      ".testimonial, .newsletter-box, .feature"
    );

    elements.forEach((element) => {
      element.classList.add("reveal");
    });

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });
  }

  /* =======================================================
     DRAWERS / MODALS
  ======================================================= */

  function openDrawer(drawer) {
    if (!drawer) return;

    drawer.classList.add("open");
    document.body.style.overflow = "hidden";

    let overlay = document.querySelector(".drawer-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "drawer-overlay";
      document.body.appendChild(overlay);

      overlay.addEventListener("click", () => {
        closeDrawer(drawer);
      });
    }

    requestAnimationFrame(() => {
      overlay.classList.add("open");
    });
  }

  function closeDrawer(drawer) {
    if (!drawer) return;

    drawer.classList.remove("open");

    const overlay = document.querySelector(".drawer-overlay");

    overlay?.classList.remove("open");

    setTimeout(() => {
      if (!document.querySelector(".drawer.open")) {
        document.body.style.overflow = "";
      }
    }, 350);
  }

  function openModal(modal) {
    modal?.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    modal?.classList.remove("open");

    if (!document.querySelector(".drawer.open")) {
      document.body.style.overflow = "";
    }
  }

  /* =======================================================
     UTILITIES
  ======================================================= */

  function formatCategory(category) {
    return String(category || "other")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }

  function showToast(message) {
    let toast = document.querySelector(".kj-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "kj-toast";

      Object.assign(toast.style, {
        position: "fixed",
        left: "50%",
        bottom: "30px",
        zIndex: "5000",
        transform: "translate(-50%, 20px)",
        opacity: "0",
        padding: "12px 20px",
        borderRadius: "999px",
        background: "#171717",
        color: "#fff",
        fontSize: "14px",
        boxShadow: "0 15px 40px rgba(0,0,0,.2)",
        transition: "all .3s ease",
        pointerEvents: "none"
      });

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%, 0)";
    });

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 20px)";
    }, 2300);
  }

  /* =======================================================
     PUBLIC API
  ======================================================= */

  window.KrishnaJewellers = {
    refreshCatalogue: loadProducts,
    openProduct: openProductModal,
    sendWhatsAppEnquiry
  };
})();