"use strict";

/*
  ============================================================
  KRISHNA JEWELLERS
  Public Storefront JavaScript
  ============================================================

  Features:
  - Supabase product loading
  - Featured products
  - New arrivals
  - Category filtering
  - Search
  - Sorting
  - Wishlist
  - Product details modal
  - WhatsApp enquiry
  - Mobile navigation
  - Search panel
  - Scroll reveal animations

  No cart.
  No checkout.
*/


/* ============================================================
   SUPABASE
============================================================ */

const SUPABASE_CONFIG = window.KRISHNA_SUPABASE || {};

const supabaseClient =
  window.supabase &&
  SUPABASE_CONFIG.url &&
  SUPABASE_CONFIG.key
    ? window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.key
      )
    : null;


/* ============================================================
   BUSINESS
============================================================ */

const BUSINESS = {
  name: "Krishna Jewellers",
  phone: "9839902006",
  secondPhone: "7394872651",
  whatsapp: "919839902006",
  email: "krishnajewellersgkp@gmail.com",
  instagram: "https://www.instagram.com/krishna_jewellers_gkp/",
  address: "Lohamandi, Gola Bazar, Gorakhpur",
  hours: "9:30 AM — 7:00 PM"
};


/* ============================================================
   STATE
============================================================ */

const state = {
  products: [],
  filteredProducts: [],
  activeCategory: "all",
  searchTerm: "",
  sort: "newest",
  wishlist: loadWishlist()
};


/* ============================================================
   DOM
============================================================ */

const elements = {
  featuredGrid:
    document.getElementById("featuredGrid"),

  newArrivalsGrid:
    document.getElementById("newArrivalsGrid"),

  productGrid:
    document.getElementById("productGrid"),

  emptyState:
    document.getElementById("emptyState"),

  sortSelect:
    document.getElementById("sortSelect"),

  clearFiltersBtn:
    document.getElementById("clearFiltersBtn"),

  globalSearch:
    document.getElementById("globalSearch"),

  searchToggle:
    document.getElementById("searchToggle"),

  searchPanel:
    document.getElementById("searchPanel"),

  closeSearch:
    document.getElementById("closeSearch"),

  wishlistToggle:
    document.getElementById("wishlistToggle"),

  wishlistCount:
    document.getElementById("wishlistCount"),

  wishlistDrawer:
    document.getElementById("wishlistDrawer"),

  closeWishlist:
    document.getElementById("closeWishlist"),

  wishlistContent:
    document.getElementById("wishlistContent"),

  drawerBackdrop:
    document.getElementById("drawerBackdrop"),

  productModal:
    document.getElementById("productModal"),

  modalBackdrop:
    document.getElementById("modalBackdrop"),

  modalClose:
    document.getElementById("modalClose"),

  productModalImage:
    document.getElementById("productModalImage"),

  productModalCategory:
    document.getElementById("productModalCategory"),

  productModalName:
    document.getElementById("productModalName"),

  productModalPrice:
    document.getElementById("productModalPrice"),

  productModalDescription:
    document.getElementById("productModalDescription"),

  productModalMaterial:
    document.getElementById("productModalMaterial"),

  productModalSku:
    document.getElementById("productModalSku"),

  productModalWhatsApp:
    document.getElementById("productModalWhatsApp"),

  menuToggle:
    document.getElementById("menuToggle"),

  mainNav:
    document.getElementById("mainNav"),

  currentYear:
    document.getElementById("currentYear")
};


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);


async function initialize() {

  setCurrentYear();

  bindEvents();

  updateWishlistCount();

  initializeRevealAnimations();

  await loadProducts();

  renderEverything();

}


/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

  /*
    Search
  */

  if (elements.searchToggle) {
    elements.searchToggle.addEventListener(
      "click",
      openSearch
    );
  }

  if (elements.closeSearch) {
    elements.closeSearch.addEventListener(
      "click",
      closeSearch
    );
  }

  if (elements.globalSearch) {
    elements.globalSearch.addEventListener(
      "input",
      handleSearch
    );
  }


  /*
    Wishlist
  */

  if (elements.wishlistToggle) {
    elements.wishlistToggle.addEventListener(
      "click",
      openWishlist
    );
  }

  if (elements.closeWishlist) {
    elements.closeWishlist.addEventListener(
      "click",
      closeWishlist
    );
  }

  if (elements.drawerBackdrop) {
    elements.drawerBackdrop.addEventListener(
      "click",
      closeWishlist
    );
  }


  /*
    Product modal
  */

  if (elements.modalClose) {
    elements.modalClose.addEventListener(
      "click",
      closeProductModal
    );
  }

  if (elements.modalBackdrop) {
    elements.modalBackdrop.addEventListener(
      "click",
      closeProductModal
    );
  }


  /*
    Mobile navigation
  */

  if (elements.menuToggle) {
    elements.menuToggle.addEventListener(
      "click",
      toggleMobileNavigation
    );
  }


  /*
    Close mobile nav after click
  */

  if (elements.mainNav) {

    elements.mainNav
      .querySelectorAll("a")
      .forEach(link => {

        link.addEventListener(
          "click",
          () => {
            elements.mainNav.classList.remove("open");
          }
        );

      });

  }


  /*
    Category buttons
  */

  document
    .querySelectorAll(".category-card")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const category =
            button.dataset.category || "all";

          setCategory(category);

          const collection =
            document.getElementById("collection");

          if (collection) {
            collection.scrollIntoView({
              behavior: "smooth"
            });
          }

        }
      );

    });


  /*
    Filter buttons
  */

  document
    .querySelectorAll(".filter-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const category =
            button.dataset.filter || "all";

          setCategory(category);

        }
      );

    });


  /*
    Sorting
  */

  if (elements.sortSelect) {

    elements.sortSelect.addEventListener(
      "change",
      event => {

        state.sort =
          event.target.value || "newest";

        renderCatalogue();

      }
    );

  }


  /*
    Clear filters
  */

  if (elements.clearFiltersBtn) {

    elements.clearFiltersBtn.addEventListener(
      "click",
      clearFilters
    );

  }


  /*
    Escape key
  */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }

      closeSearch();
      closeWishlist();
      closeProductModal();

    }
  );

}


/* ============================================================
   LOAD PRODUCTS
============================================================ */

async function loadProducts() {

  /*
    If Supabase is unavailable, show a useful empty state.
    We intentionally do NOT create fake frontend products.
  */

  if (!supabaseClient) {

    state.products = [];

    return;

  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("created_at", {
        ascending: false
      });


    if (error) {
      throw error;
    }


    state.products =
      Array.isArray(data)
        ? data.map(normalizeProduct)
        : [];

  } catch (error) {

    console.error(
      "Unable to load jewellery catalogue:",
      error
    );

    state.products = [];

  }

}


/* ============================================================
   NORMALIZE PRODUCT
============================================================ */

function normalizeProduct(product) {

  const images =
    normalizeImages(product.images);

  const imageUrl =
    images[0]?.url ||
    product.image_url ||
    createPlaceholderImage(
      product.name || "Krishna Jewellers"
    );

  return {
    ...product,

    id:
      product.id,

    name:
      product.name ||
      "Beautiful Jewellery",

    category:
      product.category ||
      "Jewellery",

    price:
      Number(product.price) || 0,

    description:
      product.description ||
      "Beautiful jewellery from Krishna Jewellers.",

    material:
      product.material ||
      "Gold",

    sku:
      product.sku ||
      "Available in store",

    image_url:
      imageUrl,

    images,

    featured:
      Boolean(product.featured),

    created_at:
      product.created_at ||
      null

  };

}


/* ============================================================
   NORMALIZE IMAGES
============================================================ */

function normalizeImages(images) {

  if (!images) {
    return [];
  }


  if (Array.isArray(images)) {

    return images
      .map(image => {

        if (typeof image === "string") {
          return {
            url: image,
            path: ""
          };
        }

        if (
          image &&
          typeof image === "object" &&
          image.url
        ) {
          return {
            url: image.url,
            path: image.path || ""
          };
        }

        return null;

      })
      .filter(Boolean);

  }


  if (typeof images === "string") {

    try {

      const parsed =
        JSON.parse(images);

      return normalizeImages(parsed);

    } catch {
      return [];
    }

  }


  return [];

}


/* ============================================================
   RENDER EVERYTHING
============================================================ */

function renderEverything() {

  renderFeatured();

  renderNewArrivals();

  renderCatalogue();

  updateWishlistCount();

}


/* ============================================================
   FEATURED
============================================================ */

function renderFeatured() {

  if (!elements.featuredGrid) {
    return;
  }


  const featured =
    state.products
      .filter(product => product.featured)
      .slice(0, 4);


  const products =
    featured.length > 0
      ? featured
      : state.products.slice(0, 4);


  if (!products.length) {

    elements.featuredGrid.innerHTML =
      createNoProductsMessage(
        "Your featured jewellery will appear here."
      );

    return;

  }


  elements.featuredGrid.innerHTML =
    products
      .map(createProductCard)
      .join("");

}


/* ============================================================
   NEW ARRIVALS
============================================================ */

function renderNewArrivals() {

  if (!elements.newArrivalsGrid) {
    return;
  }


  const products =
    [...state.products]
      .sort(sortByNewest)
      .slice(0, 4);


  if (!products.length) {

    elements.newArrivalsGrid.innerHTML =
      createNoProductsMessage(
        "New jewellery added from Admin will appear here."
      );

    return;

  }


  elements.newArrivalsGrid.innerHTML =
    products
      .map(createProductCard)
      .join("");

}


/* ============================================================
   CATALOGUE
============================================================ */

function renderCatalogue() {

  if (!elements.productGrid) {
    return;
  }


  let products =
    [...state.products];


  /*
    Category
  */

  if (state.activeCategory !== "all") {

    products =
      products.filter(
        product =>
          normalizeText(product.category) ===
          normalizeText(state.activeCategory)
      );

  }


  /*
    Search
  */

  if (state.searchTerm) {

    const query =
      normalizeText(state.searchTerm);

    products =
      products.filter(product => {

        const searchable =
          [
            product.name,
            product.category,
            product.description,
            product.material,
            product.sku
          ]
            .filter(Boolean)
            .join(" ");

        return normalizeText(searchable)
          .includes(query);

      });

  }


  /*
    Sort
  */

  products.sort(
    getSortFunction(state.sort)
  );


  state.filteredProducts =
    products;


  /*
    Empty state
  */

  if (!products.length) {

    elements.productGrid.innerHTML = "";

    if (elements.emptyState) {
      elements.emptyState.hidden = false;
    }

    return;

  }


  if (elements.emptyState) {
    elements.emptyState.hidden = true;
  }


  elements.productGrid.innerHTML =
    products
      .map(createProductCard)
      .join("");

}


/* ============================================================
   PRODUCT CARD
============================================================ */

function createProductCard(product) {

  const isWishlisted =
    state.wishlist.includes(
      String(product.id)
    );


  const badge =
    product.featured
      ? `<span class="product-badge">Featured</span>`
      : "";


  const price =
    formatPrice(product.price);


  return `
    <article
      class="product-card"
      data-product-id="${escapeAttribute(product.id)}"
    >

      <div class="product-image">

        <img
          src="${escapeAttribute(product.image_url)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
          onerror="this.src='${escapeAttribute(
            createPlaceholderImage(product.name)
          )}'"
        >

        ${badge}

        <button
          type="button"
          class="wishlist-product-button ${
            isWishlisted ? "active" : ""
          }"
          data-wishlist-id="${escapeAttribute(product.id)}"
          aria-label="${
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }"
        >
          ${isWishlisted ? "♥" : "♡"}
        </button>

      </div>


      <div class="product-info">

        <span class="product-category">
          ${escapeHTML(product.category)}
        </span>

        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description)}
        </p>

        <div class="product-bottom">

          <span class="product-price">
            ${price}
          </span>

          <button
            type="button"
            class="product-view"
            data-view-product="${escapeAttribute(product.id)}"
          >
            View Details →
          </button>

        </div>

      </div>

    </article>
  `;

}


/* ============================================================
   EVENT DELEGATION FOR PRODUCTS
============================================================ */

document.addEventListener(
  "click",
  event => {

    const wishlistButton =
      event.target.closest(
        "[data-wishlist-id]"
      );


    if (wishlistButton) {

      event.preventDefault();
      event.stopPropagation();

      toggleWishlist(
        wishlistButton.dataset.wishlistId
      );

      return;

    }


    const productButton =
      event.target.closest(
        "[data-view-product]"
      );


    if (productButton) {

      event.preventDefault();

      openProduct(
        productButton.dataset.viewProduct
      );

      return;

    }


    const productCard =
      event.target.closest(
        ".product-card"
      );


    if (
      productCard &&
      !event.target.closest("button")
    ) {

      openProduct(
        productCard.dataset.productId
      );

    }

  }
);


/* ============================================================
   PRODUCT MODAL
============================================================ */

function openProduct(productId) {

  const product =
    state.products.find(
      item =>
        String(item.id) ===
        String(productId)
    );


  if (!product || !elements.productModal) {
    return;
  }


  elements.productModalImage.src =
    product.image_url;

  elements.productModalImage.alt =
    product.name;


  elements.productModalCategory.textContent =
    product.category;


  elements.productModalName.textContent =
    product.name;


  elements.productModalPrice.textContent =
    formatPrice(product.price);


  elements.productModalDescription.textContent =
    product.description;


  elements.productModalMaterial.textContent =
    product.material;


  elements.productModalSku.textContent =
    product.sku;


  const message =
    [
      "Hello Krishna Jewellers,",
      "",
      `I am interested in: ${product.name}`,
      `Category: ${product.category}`,
      product.sku
        ? `SKU: ${product.sku}`
        : "",
      "",
      "Please share more details."
    ]
      .filter(Boolean)
      .join("\n");


  elements.productModalWhatsApp.href =
    `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(
      message
    )}`;


  elements.productModal.classList.add("open");

  elements.productModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add("no-scroll");

}


/* ============================================================
   CLOSE PRODUCT
============================================================ */

function closeProductModal() {

  if (!elements.productModal) {
    return;
  }

  elements.productModal.classList.remove("open");

  elements.productModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove("no-scroll");

}


/* ============================================================
   WISHLIST
============================================================ */

function loadWishlist() {

  try {

    const saved =
      localStorage.getItem(
        "krishna_jewellers_wishlist"
      );


    const parsed =
      saved
        ? JSON.parse(saved)
        : [];


    return Array.isArray(parsed)
      ? parsed.map(String)
      : [];

  } catch {

    return [];

  }

}


/* ============================================================
   SAVE WISHLIST
============================================================ */

function saveWishlist() {

  localStorage.setItem(
    "krishna_jewellers_wishlist",
    JSON.stringify(state.wishlist)
  );

}


/* ============================================================
   TOGGLE WISHLIST
============================================================ */

function toggleWishlist(productId) {

  const id =
    String(productId);


  const index =
    state.wishlist.indexOf(id);


  if (index >= 0) {

    state.wishlist.splice(index, 1);

  } else {

    state.wishlist.push(id);

  }


  saveWishlist();

  updateWishlistCount();

  renderFeatured();

  renderNewArrivals();

  renderCatalogue();

  renderWishlistDrawer();

}


/* ============================================================
   WISHLIST COUNT
============================================================ */

function updateWishlistCount() {

  if (!elements.wishlistCount) {
    return;
  }


  elements.wishlistCount.textContent =
    state.wishlist.length;

}


/* ============================================================
   OPEN WISHLIST
============================================================ */

function openWishlist() {

  if (!elements.wishlistDrawer) {
    return;
  }


  renderWishlistDrawer();


  elements.wishlistDrawer.classList.add("open");

  elements.wishlistDrawer.setAttribute(
    "aria-hidden",
    "false"
  );


  elements.drawerBackdrop?.classList.add(
    "open"
  );


  document.body.classList.add(
    "no-scroll"
  );

}


/* ============================================================
   CLOSE WISHLIST
============================================================ */

function closeWishlist() {

  elements.wishlistDrawer?.classList.remove(
    "open"
  );

  elements.wishlistDrawer?.setAttribute(
    "aria-hidden",
    "true"
  );

  elements.drawerBackdrop?.classList.remove(
    "open"
  );

  document.body.classList.remove(
    "no-scroll"
  );

}


/* ============================================================
   RENDER WISHLIST
============================================================ */

function renderWishlistDrawer() {

  if (!elements.wishlistContent) {
    return;
  }


  const products =
    state.wishlist
      .map(id =>
        state.products.find(
          product =>
            String(product.id) === String(id)
        )
      )
      .filter(Boolean);


  if (!products.length) {

    elements.wishlistContent.innerHTML = `
      <div class="empty-state">
        <span>♡</span>
        <h3>Your wishlist is empty</h3>
        <p>
          Tap the heart on jewellery you love.
        </p>
      </div>
    `;

    return;

  }


  elements.wishlistContent.innerHTML =
    products
      .map(product => {

        return `
          <div
            class="wishlist-item"
            style="
              display:grid;
              grid-template-columns:90px 1fr;
              gap:15px;
              padding:15px 0;
              border-bottom:1px solid var(--border);
            "
          >

            <img
              src="${escapeAttribute(product.image_url)}"
              alt="${escapeAttribute(product.name)}"
              style="
                width:90px;
                height:100px;
                object-fit:cover;
              "
            >

            <div>

              <span class="product-category">
                ${escapeHTML(product.category)}
              </span>

              <h3
                style="
                  margin:0 0 8px;
                  font-family:var(--serif);
                  font-size:23px;
                "
              >
                ${escapeHTML(product.name)}
              </h3>

              <div
                style="
                  color:var(--gold-dark);
                  font-size:11px;
                  font-weight:700;
                  margin-bottom:12px;
                "
              >
                ${formatPrice(product.price)}
              </div>

              <button
                type="button"
                data-remove-wishlist="${escapeAttribute(product.id)}"
                style="
                  border:0;
                  background:transparent;
                  padding:0;
                  color:var(--gold-dark);
                  font-size:8px;
                  font-weight:700;
                  letter-spacing:.08em;
                  text-transform:uppercase;
                "
              >
                Remove
              </button>

            </div>

          </div>
        `;

      })
      .join("");

}


/* ============================================================
   WISHLIST REMOVE
============================================================ */

document.addEventListener(
  "click",
  event => {

    const removeButton =
      event.target.closest(
        "[data-remove-wishlist]"
      );


    if (!removeButton) {
      return;
    }


    toggleWishlist(
      removeButton.dataset.removeWishlist
    );

  }
);


/* ============================================================
   SEARCH
============================================================ */

function openSearch() {

  elements.searchPanel?.classList.add(
    "open"
  );


  setTimeout(() => {

    elements.globalSearch?.focus();

  }, 250);

}


function closeSearch() {

  elements.searchPanel?.classList.remove(
    "open"
  );

}


function handleSearch(event) {

  state.searchTerm =
    event.target.value.trim();

  renderCatalogue();


  /*
    If the user searches from the header,
    scroll to the catalogue.
  */

  if (state.searchTerm) {

    const collection =
      document.getElementById("collection");

    if (
      collection &&
      window.scrollY < collection.offsetTop - 250
    ) {

      collection.scrollIntoView({
        behavior: "smooth"
      });

    }

  }

}


/* ============================================================
   CATEGORY
============================================================ */

function setCategory(category) {

  state.activeCategory =
    category || "all";


  document
    .querySelectorAll(".filter-button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        normalizeText(button.dataset.filter) ===
        normalizeText(state.activeCategory)
      );

    });


  renderCatalogue();

}


/* ============================================================
   CLEAR
============================================================ */

function clearFilters() {

  state.activeCategory =
    "all";

  state.searchTerm =
    "";

  state.sort =
    "newest";


  if (elements.globalSearch) {
    elements.globalSearch.value = "";
  }


  if (elements.sortSelect) {
    elements.sortSelect.value = "newest";
  }


  setCategory("all");

}


/* ============================================================
   SORT
============================================================ */

function getSortFunction(sort) {

  switch (sort) {

    case "oldest":
      return sortByOldest;

    case "name":
      return sortByName;

    case "price-low":
      return sortByPriceLow;

    case "price-high":
      return sortByPriceHigh;

    case "newest":
    default:
      return sortByNewest;

  }

}


function sortByNewest(a, b) {

  return (
    new Date(b.created_at || 0) -
    new Date(a.created_at || 0)
  );

}


function sortByOldest(a, b) {

  return (
    new Date(a.created_at || 0) -
    new Date(b.created_at || 0)
  );

}


function sortByName(a, b) {

  return String(a.name)
    .localeCompare(
      String(b.name)
    );

}


function sortByPriceLow(a, b) {

  return (
    Number(a.price || 0) -
    Number(b.price || 0)
  );

}


function sortByPriceHigh(a, b) {

  return (
    Number(b.price || 0) -
    Number(a.price || 0)
  );

}


/* ============================================================
   MOBILE NAVIGATION
============================================================ */

function toggleMobileNavigation() {

  elements.mainNav?.classList.toggle(
    "open"
  );

}


/* ============================================================
   YEAR
============================================================ */

function setCurrentYear() {

  if (elements.currentYear) {

    elements.currentYear.textContent =
      new Date().getFullYear();

  }

}


/* ============================================================
   REVEAL ANIMATIONS
============================================================ */

function initializeRevealAnimations() {

  const revealElements =
    document.querySelectorAll(
      ".section-header, .category-card, .bridal, .about-photo, .about-content, .why-item, .contact-content, .contact-card"
    );


  revealElements.forEach(
    element =>
      element.setAttribute(
        "data-reveal",
        ""
      )
  );


  if (
    !("IntersectionObserver" in window)
  ) {

    revealElements.forEach(
      element =>
        element.classList.add(
          "revealed"
        )
    );

    return;

  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            "revealed"
          );

          observer.unobserve(
            entry.target
          );

        });

      },
      {
        threshold: .12
      }
    );


  revealElements.forEach(
    element =>
      observer.observe(element)
  );

}


/* ============================================================
   PLACEHOLDER
============================================================ */

function createPlaceholderImage(name) {

  const safeName =
    String(name || "Krishna Jewellers")
      .replace(/[<>&"]/g, "");

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="900"
      viewBox="0 0 800 900"
    >

      <rect
        width="800"
        height="900"
        fill="#f7dfe6"
      />

      <circle
        cx="400"
        cy="360"
        r="210"
        fill="#e9e2f4"
      />

      <text
        x="400"
        y="330"
        text-anchor="middle"
        font-family="Georgia"
        font-size="70"
        fill="#8d6728"
      >
        KJ
      </text>

      <text
        x="400"
        y="430"
        text-anchor="middle"
        font-family="Arial"
        font-size="22"
        letter-spacing="5"
        fill="#6d626a"
      >
        KRISHNA JEWELLERS
      </text>

      <text
        x="400"
        y="485"
        text-anchor="middle"
        font-family="Arial"
        font-size="17"
        fill="#8d6728"
      >
        ${safeName}
      </text>

    </svg>
  `;


  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    svg
  )}`;

}


/* ============================================================
   NO PRODUCTS
============================================================ */

function createNoProductsMessage(message) {

  return `
    <div
      style="
        grid-column:1/-1;
        padding:70px 20px;
        text-align:center;
        background:white;
        border:1px solid var(--border);
      "
    >

      <div
        style="
          color:var(--gold);
          font-size:30px;
          margin-bottom:8px;
        "
      >
        ✦
      </div>

      <h3
        style="
          margin:0 0 8px;
          font-family:var(--serif);
          font-size:32px;
          font-weight:500;
        "
      >
        Jewellery collection
      </h3>

      <p
        style="
          margin:0;
          color:var(--muted);
          font-size:11px;
        "
      >
        ${escapeHTML(message)}
      </p>

    </div>
  `;

}


/* ============================================================
   PRICE
============================================================ */

function formatPrice(price) {

  const value =
    Number(price);


  /*
    A zero price is treated as
    "Price on enquiry" so we don't
    show ₹0 to customers.
  */

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {

    return "Price on enquiry";

  }


  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }
  ).format(value);

}


/* ============================================================
   TEXT HELPERS
============================================================ */

function normalizeText(value) {

  return String(value || "")
    .trim()
    .toLowerCase();

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


/* ============================================================
   PUBLIC API
============================================================ */

window.KrishnaJewellers = {

  refreshCatalogue: async function() {

    await loadProducts();

    renderEverything();

  },

  openProduct: function(productId) {

    openProduct(productId);

  },

  sendWhatsAppEnquiry: function(productId) {

    const product =
      state.products.find(
        item =>
          String(item.id) ===
          String(productId)
      );


    if (!product) {
      return;
    }


    const message =
      `Hello Krishna Jewellers, I am interested in ${product.name}. Please share more details.`;


    window.open(
      `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener"
    );

  }

};