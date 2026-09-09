"use strict";

/*
============================================================
KRISHNA JEWELLERS
Storefront JavaScript

Gold + Silver Catalogue
Supabase-powered
No cart
No checkout
WhatsApp enquiry
============================================================
*/


/* ============================================================
   SUPABASE
============================================================ */

const SUPABASE_CONFIG =
  window.KRISHNA_SUPABASE || {};

const SUPABASE_URL =
  SUPABASE_CONFIG.url || "";

const SUPABASE_KEY =
  SUPABASE_CONFIG.key || "";

let supabaseClient = null;

if (
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_KEY !== "YOUR_PUBLIC_PUBLISHABLE_KEY"
) {
  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
}


/* ============================================================
   BUSINESS INFORMATION
============================================================ */

const BUSINESS = {

  name:
    "Krishna Jewellers",

  address:
    "Lohamandi, Gola Bazar, Gorakhpur",

  phone:
    "9839902006",

  secondPhone:
    "7394872651",

  whatsapp:
    "919839902006",

  email:
    "krishnajewellersgkp@gmail.com",

  instagram:
    "https://www.instagram.com/krishna_jewellers_gkp/",

  hours:
    "9:30 AM — 7:00 PM"

};


/* ============================================================
   CATEGORY DEFINITIONS
============================================================ */

const CATEGORY_SETS = {

  gold: [

    {
      id: "ladies-rings",
      name: "Ladies Rings",
      number: "01",
      image:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
      alt: "Ladies gold rings"
    },

    {
      id: "gents-rings",
      name: "Gents Rings",
      number: "02",
      image:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
      alt: "Gents gold rings"
    },

    {
      id: "necklaces",
      name: "Necklaces",
      number: "03",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      alt: "Gold necklaces"
    },

    {
      id: "earrings",
      name: "Earrings",
      number: "04",
      image:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
      alt: "Gold earrings"
    },

    {
      id: "ladies-chains",
      name: "Ladies Chains",
      number: "05",
      image:
        "https://images.unsplash.com/photo-1598560917807-1bae44bd7be8?auto=format&fit=crop&w=900&q=85",
      alt: "Ladies gold chains"
    },

    {
      id: "gents-chains",
      name: "Gents Chains",
      number: "06",
      image:
        "https://images.unsplash.com/photo-1598560917807-1bae44bd7be8?auto=format&fit=crop&w=900&q=85",
      alt: "Gents gold chains"
    },

    {
      id: "single-locket",
      name: "Single Locket",
      number: "07",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      alt: "Single gold locket"
    },

    {
      id: "double-locket",
      name: "Double Locket",
      number: "08",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      alt: "Double gold locket"
    },

    {
      id: "other",
      name: "Other",
      number: "09",
      image:
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
      alt: "Other gold jewellery"
    }

  ],


  silver: [

    {
      id: "kids-payal",
      name: "Kids Payal",
      number: "01",
      image:
        "https://images.unsplash.com/photo-1598560917807-1bae44bd7be8?auto=format&fit=crop&w=900&q=85",
      alt: "Silver payal for kids"
    },

    {
      id: "adult-payal",
      name: "Adult Payal",
      number: "02",
      image:
        "https://images.unsplash.com/photo-1598560917807-1bae44bd7be8?auto=format&fit=crop&w=900&q=85",
      alt: "Silver payal for adults"
    },

    {
      id: "lockets",
      name: "Lockets",
      number: "03",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      alt: "Silver lockets"
    },

    {
      id: "male-bracelets",
      name: "Male Bracelets",
      number: "04",
      image:
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
      alt: "Silver bracelets for men"
    },

    {
      id: "female-bracelets",
      name: "Female Bracelets",
      number: "05",
      image:
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
      alt: "Silver bracelets for women"
    },

    {
      id: "male-chains",
      name: "Male Chains",
      number: "06",
      image:
        "https://images.unsplash.com/photo-1598560917807-1bae44bd7be8?auto=format&fit=crop&w=900&q=85",
      alt: "Silver chains for men"
    },

    {
      id: "female-chains",
      name: "Female Chains",
      number: "07",
      image:
        "https://images.unsplash.com/photo-1598560917807-1bae44bd7be8?auto=format&fit=crop&w=900&q=85",
      alt: "Silver chains for women"
    },

    {
      id: "other",
      name: "Other",
      number: "08",
      image:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
      alt: "Other silver jewellery"
    }

  ]

};


/* ============================================================
   APPLICATION STATE
============================================================ */

const state = {

  products: [],

  filteredProducts: [],

  activeCategory: "all",

  searchTerm: "",

  sort: "newest",

  metalMode: "gold",

  wishlist: [],

  selectedProductId: null

};


/* ============================================================
   DOM ELEMENTS
============================================================ */

const elements = {

  body:
    document.body,

  header:
    document.getElementById("header"),

  menuToggle:
    document.getElementById("menuToggle"),

  mainNav:
    document.getElementById("mainNav"),

  searchToggle:
    document.getElementById("searchToggle"),

  searchPanel:
    document.getElementById("searchPanel"),

  closeSearch:
    document.getElementById("closeSearch"),

  globalSearch:
    document.getElementById("globalSearch"),

  metalToggle:
    document.getElementById("metalToggle"),

  categoryGrid:
    document.getElementById("categoryGrid"),

  filterButtons:
    document.getElementById("filterButtons"),

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

  wishlistToggle:
    document.getElementById("wishlistToggle"),

  wishlistCount:
    document.getElementById("wishlistCount"),

  wishlistDrawer:
    document.getElementById("wishlistDrawer"),

  wishlistContent:
    document.getElementById("wishlistContent"),

  closeWishlist:
    document.getElementById("closeWishlist"),

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

  currentYear:
    document.getElementById("currentYear"),

  heroMetalDescription:
    document.getElementById("heroMetalDescription"),

  heroMetalImage:
    document.getElementById("heroMetalImage"),

  bridalMetalDescription:
    document.getElementById("bridalMetalDescription"),

  bridalMetalImage:
    document.getElementById("bridalMetalImage"),

  contactMetalLine:
    document.getElementById("contactMetalLine")

};


/* ============================================================
   STORAGE
============================================================ */

const STORAGE_KEYS = {

  metal:
    "krishna_jewellers_metal_mode",

  wishlist:
    "krishna_jewellers_wishlist"

};


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);


async function initialize() {

  state.metalMode =
    loadMetalMode();

  state.wishlist =
    loadWishlist();

  setCurrentYear();

  bindEvents();

  applyMetalMode(false);

  updateWishlistCount();

  initializeRevealAnimations();

  await loadProducts();

  renderEverything();

}


/* ============================================================
   METAL MODE
============================================================ */

function loadMetalMode() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEYS.metal
      );

    if (saved === "silver") {
      return "silver";
    }

  } catch (error) {

    console.warn(
      "Unable to read saved metal mode.",
      error
    );

  }

  return "gold";

}


function saveMetalMode(mode) {

  try {

    localStorage.setItem(
      STORAGE_KEYS.metal,
      mode
    );

  } catch (error) {

    console.warn(
      "Unable to save metal mode.",
      error
    );

  }

}


function setMetalMode(mode) {

  state.metalMode =
    mode === "silver"
      ? "silver"
      : "gold";

  state.activeCategory =
    "all";

  state.searchTerm =
    "";

  if (elements.globalSearch) {

    elements.globalSearch.value =
      "";

  }

  saveMetalMode(
    state.metalMode
  );

  applyMetalMode(true);

}


function applyMetalMode(
  shouldRender = true
) {

  const mode =
    state.metalMode === "silver"
      ? "silver"
      : "gold";

  state.metalMode =
    mode;

  document.body.classList.toggle(
    "silver-mode",
    mode === "silver"
  );

  if (elements.metalToggle) {

    const silver =
      mode === "silver";

    elements.metalToggle.setAttribute(
      "aria-pressed",
      silver
        ? "true"
        : "false"
    );

    elements.metalToggle.setAttribute(
      "aria-label",
      silver
        ? "Switch to gold jewellery"
        : "Switch to silver jewellery"
    );

  }

  renderModeInterface();

  if (shouldRender) {

    renderEverything();

    updateWishlistCount();

  }

}


/* ============================================================
   DYNAMIC MODE INTERFACE
============================================================ */

function renderModeInterface() {

  const mode =
    state.metalMode;

  const categories =
    CATEGORY_SETS[mode];

  if (
    elements.categoryGrid
  ) {

    elements.categoryGrid.innerHTML =
      categories
        .map(
          category =>
            createCategoryCard(
              category
            )
        )
        .join("");

  }


  if (
    elements.filterButtons
  ) {

    elements.filterButtons.innerHTML = `

      <button
        type="button"
        class="filter-button active"
        data-filter="all"
      >
        All
      </button>

      ${categories
        .map(
          category => `
            <button
              type="button"
              class="filter-button"
              data-filter="${escapeAttribute(
                category.id
              )}"
            >
              ${escapeHTML(
                category.name
              )}
            </button>
          `
        )
        .join("")}

    `;

  }


  const silver =
    mode === "silver";


  if (
    elements.heroMetalDescription
  ) {

    elements.heroMetalDescription.textContent =
      silver

        ? "Discover elegant silver jewellery for everyday wear, gifting, celebrations and timeless style."

        : "Discover elegant gold jewellery for weddings, celebrations, gifting and everyday beauty.";

  }


  if (
    elements.heroMetalImage
  ) {

    elements.heroMetalImage.alt =
      silver
        ? "Silver jewellery"
        : "Gold jewellery";

  }


  if (
    elements.bridalMetalDescription
  ) {

    elements.bridalMetalDescription.textContent =
      silver

        ? "Explore beautiful silver jewellery for everyday elegance, gifting and special moments for every generation."

        : "Explore graceful gold jewellery for brides, weddings and the celebrations that bring families together.";

  }


  if (
    elements.bridalMetalImage
  ) {

    elements.bridalMetalImage.alt =
      silver
        ? "Silver jewellery collection"
        : "Gold bridal jewellery";

  }


  if (
    elements.contactMetalLine
  ) {

    elements.contactMetalLine.textContent =
      silver

        ? "SILVER • PAYAL • LOCKETS • CHAINS"

        : "GOLD • RINGS • NECKLACES • EARRINGS";

  }

}


/* ============================================================
   CATEGORY CARD
============================================================ */

function createCategoryCard(
  category
) {

  return `

    <button
      type="button"
      class="category-card"
      data-category="${escapeAttribute(
        category.id
      )}"
      aria-label="View ${escapeAttribute(
        category.name
      )}"
    >

      <div class="category-image">

        <img
          src="${escapeAttribute(
            category.image
          )}"
          alt="${escapeAttribute(
            category.alt
          )}"
          loading="lazy"
          onerror="this.src='${getPlaceholderImage()}'"
        >

      </div>

      <div class="category-info">

        <span>
          ${escapeHTML(
            category.number
          )}
        </span>

        <h3>
          ${escapeHTML(
            category.name
          )}
        </h3>

        <strong>
          Explore →
        </strong>

      </div>

    </button>

  `;

}


/* ============================================================
   LOAD PRODUCTS
============================================================ */

async function loadProducts() {

  if (!supabaseClient) {

    console.warn(
      "Supabase is not configured."
    );

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

      .eq(
        "is_published",
        true
      )

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

        ? data.map(
            normalizeProduct
          )

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
   PRODUCT NORMALIZATION
============================================================ */

function normalizeProduct(
  product
) {

  const metal =
    normalizeText(
      product?.metal ||
      "gold"
    ) === "silver"

      ? "silver"

      : "gold";


  const category =
    normalizeCategory(
      product?.category ||
      "other"
    );


  const images =
    normalizeImages(
      product
    );


  const imageUrl =
    images.length > 0

      ? images[0]

      : (
          product?.image_url ||
          ""
        );


  return {

    ...product,

    id:
      product?.id,

    name:
      product?.name ||
      "Beautiful Jewellery",

    metal:

      metal,

    category:

      category,

    price:

      Number(
        product?.price
      ) || 0,

    description:

      product?.description ||
      "Beautiful jewellery from Krishna Jewellers.",

    material:

      product?.material ||
      (
        metal === "silver"
          ? "Silver"
          : "Gold"
      ),

    sku:

      product?.sku ||
      "Available in store",

    image_url:

      imageUrl,

    images:

      images,

    featured:

      Boolean(
        product?.featured
      ),

    created_at:

      product?.created_at ||
      null,

    updated_at:

      product?.updated_at ||
      null

  };

}


/* ============================================================
   NORMALIZE CATEGORY
============================================================ */

function normalizeCategory(
  value
) {

  const category =
    normalizeText(
      value
    );

  const aliases = {

    "ladies ring":
      "ladies-rings",

    "ladies rings":
      "ladies-rings",

    "gents ring":
      "gents-rings",

    "gents rings":
      "gents-rings",

    "ring":
      "ladies-rings",

    "rings":
      "ladies-rings",

    "ladies chain":
      "ladies-chains",

    "ladies chains":
      "ladies-chains",

    "gents chain":
      "gents-chains",

    "gents chains":
      "gents-chains",

    "chain":
      "gents-chains",

    "chains":
      "gents-chains",

    "single locket":
      "single-locket",

    "double locket":
      "double-locket",

    "kids payal":
      "kids-payal",

    "adult payal":
      "adult-payal",

    "male bracelet":
      "male-bracelets",

    "male bracelets":
      "male-bracelets",

    "female bracelet":
      "female-bracelets",

    "female bracelets":
      "female-bracelets",

    "male chain":
      "male-chains",

    "male chains":
      "male-chains",

    "female chain":
      "female-chains",

    "female chains":
      "female-chains",

    "bangles":
      "other",

    "bangle":
      "other",

    "bracelet":
      "other",

    "bracelets":
      "other"

  };


  return (
    aliases[category] ||
    category ||
    "other"
  );

}


/* ============================================================
   NORMALIZE IMAGES
============================================================ */

function normalizeImages(
  product
) {

  const result = [];


  function addImage(
    value
  ) {

    if (
      typeof value === "string" &&
      value.trim()
    ) {

      result.push(
        value.trim()
      );

      return;

    }


    if (
      value &&
      typeof value === "object"
    ) {

      const url =
        value.url ||
        value.publicUrl ||
        value.image_url;

      if (
        typeof url === "string" &&
        url.trim()
      ) {

        result.push(
          url.trim()
        );

      }

    }

  }


  const rawImages =
    product?.images;


  if (
    Array.isArray(rawImages)
  ) {

    rawImages.forEach(
      addImage
    );

  } else if (
    typeof rawImages === "string" &&
    rawImages.trim()
  ) {

    try {

      const parsed =
        JSON.parse(
          rawImages
        );

      if (
        Array.isArray(parsed)
      ) {

        parsed.forEach(
          addImage
        );

      } else {

        addImage(
          rawImages
        );

      }

    } catch {

      addImage(
        rawImages
      );

    }

  }


  addImage(
    product?.image_url
  );


  return [
    ...new Set(
      result
    )
  ];

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
   VISIBLE PRODUCTS
============================================================ */

function getVisibleProducts() {

  return state.products.filter(
    product =>

      normalizeText(
        product.metal ||
        "gold"
      ) ===
      state.metalMode

  );

}


/* ============================================================
   FEATURED PRODUCTS
============================================================ */

function renderFeatured() {

  if (
    !elements.featuredGrid
  ) {
    return;
  }


  const visibleProducts =
    getVisibleProducts();


  const featured =
    visibleProducts
      .filter(
        product =>
          product.featured
      )
      .slice(
        0,
        4
      );


  const products =
    featured.length > 0

      ? featured

      : visibleProducts.slice(
          0,
          4
        );


  if (
    products.length === 0
  ) {

    elements.featuredGrid.innerHTML =
      createNoProductsMessage(
        state.metalMode === "silver"
          ? "Silver jewellery will appear here once you publish it from Admin."
          : "Gold jewellery will appear here once you publish it from Admin."
      );

    return;

  }


  elements.featuredGrid.innerHTML =
    products
      .map(
        createProductCard
      )
      .join("");

}


/* ============================================================
   NEW ARRIVALS
============================================================ */

function renderNewArrivals() {

  if (
    !elements.newArrivalsGrid
  ) {
    return;
  }


  const products =
    [
      ...getVisibleProducts()
    ]

      .sort(
        sortByNewest
      )

      .slice(
        0,
        4
      );


  if (
    products.length === 0
  ) {

    elements.newArrivalsGrid.innerHTML =
      createNoProductsMessage(
        state.metalMode === "silver"
          ? "Your latest silver jewellery will appear here."
          : "Your latest gold jewellery will appear here."
      );

    return;

  }


  elements.newArrivalsGrid.innerHTML =
    products
      .map(
        createProductCard
      )
      .join("");

}


/* ============================================================
   CATALOGUE
============================================================ */

function renderCatalogue() {

  if (
    !elements.productGrid
  ) {
    return;
  }


  let products =
    [
      ...getVisibleProducts()
    ];


  const search =
    normalizeText(
      state.searchTerm
    );


  if (
    search
  ) {

    products =
      products.filter(
        product => {

          const searchableText =
            [

              product.name,

              product.category,

              product.description,

              product.material,

              product.sku,

              product.metal

            ]

              .map(
                value =>
                  normalizeText(
                    value
                  )
              )

              .join(" ");


          return searchableText.includes(
            search
          );

        }
      );

  }


  if (
    state.activeCategory !==
    "all"
  ) {

    products =
      products.filter(
        product =>

          normalizeCategory(
            product.category
          ) ===
          normalizeCategory(
            state.activeCategory
          )

      );

  }


  products.sort(
    getSortFunction(
      state.sort
    )
  );


  state.filteredProducts =
    products;


  updateFilterButtons();


  if (
    products.length === 0
  ) {

    elements.productGrid.innerHTML =
      createNoProductsMessage(
        state.searchTerm
          ? "No jewellery matches your search."
          : state.activeCategory !== "all"
            ? "No products are currently available in this category."
            : (
                state.metalMode === "silver"
                  ? "Silver jewellery will appear here once products are published from Admin."
                  : "Gold jewellery will appear here once products are published from Admin."
              )
      );


    if (
      elements.emptyState
    ) {

      elements.emptyState.hidden =
        false;

    }

    return;

  }


  if (
    elements.emptyState
  ) {

    elements.emptyState.hidden =
      true;

  }


  elements.productGrid.innerHTML =
    products
      .map(
        createProductCard
      )
      .join("");

}


/* ============================================================
   PRODUCT CARD
============================================================ */

function createProductCard(
  product
) {

  const image =
    product.image_url ||
    (
      product.images &&
      product.images[0]
    ) ||
    getPlaceholderImage();


  const isWishlisted =
    isInWishlist(
      product.id
    );


  const badge =
    product.featured
      ? `
        <span class="product-badge">
          Featured
        </span>
      `
      : "";


  return `

    <article
      class="product-card"
      data-product-id="${escapeAttribute(
        String(product.id)
      )}"
    >

      <div class="product-image">

        ${badge}

        <button
          type="button"
          class="product-wishlist ${
            isWishlisted
              ? "active"
              : ""
          }"
          data-wishlist-id="${escapeAttribute(
            String(product.id)
          )}"
          aria-label="${
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }"
          aria-pressed="${
            isWishlisted
              ? "true"
              : "false"
          }"
        >
          ${
            isWishlisted
              ? "♥"
              : "♡"
          }
        </button>


        <img
          src="${escapeAttribute(
            image
          )}"
          alt="${escapeAttribute(
            product.name
          )}"
          loading="lazy"
          onerror="this.src='${getPlaceholderImage()}'"
        >

      </div>


      <div class="product-info">

        <span class="product-category">

          ${escapeHTML(
            formatPublicCategory(
              product.category
            )
          )}

        </span>


        <h3 class="product-name">

          ${escapeHTML(
            product.name
          )}

        </h3>


        <p class="product-description">

          ${escapeHTML(
            product.description
          )}

        </p>


        <div class="product-bottom">

          <span class="product-price">

            ${formatPrice(
              product.price
            )}

          </span>


          <button
            type="button"
            class="product-view"
            data-product-id="${escapeAttribute(
              String(product.id)
            )}"
          >
            View Details →
          </button>

        </div>

      </div>

    </article>

  `;

}


/* ============================================================
   NO PRODUCTS
============================================================ */

function createNoProductsMessage(
  message
) {

  return `

    <div class="no-products-message">

      <span>
        ✦
      </span>

      <h3>
        Your collection awaits
      </h3>

      <p>
        ${escapeHTML(
          message
        )}
      </p>

    </div>

  `;

}


/* ============================================================
   PUBLIC CATEGORY NAME
============================================================ */

function formatPublicCategory(
  category
) {

  const names = {

    "ladies-rings":
      "Ladies Rings",

    "gents-rings":
      "Gents Rings",

    necklaces:
      "Necklaces",

    earrings:
      "Earrings",

    "ladies-chains":
      "Ladies Chains",

    "gents-chains":
      "Gents Chains",

    "single-locket":
      "Single Locket",

    "double-locket":
      "Double Locket",

    "kids-payal":
      "Kids Payal",

    "adult-payal":
      "Adult Payal",

    lockets:
      "Lockets",

    "male-bracelets":
      "Male Bracelets",

    "female-bracelets":
      "Female Bracelets",

    "male-chains":
      "Male Chains",

    "female-chains":
      "Female Chains",

    other:
      "Other"

  };


  return (
    names[
      normalizeCategory(
        category
      )
    ] ||
    "Other"
  );

}


/* ============================================================
   FILTER BUTTONS
============================================================ */

function updateFilterButtons() {

  if (
    !elements.filterButtons
  ) {
    return;
  }


  const buttons =
    elements.filterButtons.querySelectorAll(
      ".filter-button"
    );


  buttons.forEach(
    button => {

      const value =
        normalizeCategory(
          button.dataset.filter ||
          "all"
        );


      const active =
        value ===
        normalizeCategory(
          state.activeCategory
        );


      button.classList.toggle(
        "active",
        active
      );

    }
  );

}


/* ============================================================
   SET CATEGORY
============================================================ */

function setCategory(
  category
) {

  state.activeCategory =
    category || "all";


  renderCatalogue();


  const collection =
    document.getElementById(
      "collection"
    );


  if (
    collection &&
    window.innerWidth <= 820
  ) {

    collection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* ============================================================
   SEARCH
============================================================ */

function setSearchTerm(
  value
) {

  state.searchTerm =
    String(
      value || ""
    ).trim();


  renderCatalogue();

}


/* ============================================================
   SORT
============================================================ */

function getSortFunction(
  sort
) {

  switch (sort) {

    case "oldest":

      return (
        a,
        b
      ) =>
        getTimestamp(
          a.created_at
        ) -
        getTimestamp(
          b.created_at
        );


    case "name":

      return (
        a,
        b
      ) =>
        String(
          a.name || ""
        ).localeCompare(
          String(
            b.name || ""
          ),
          undefined,
          {
            sensitivity:
              "base"
          }
        );


    case "price-low":

      return (
        a,
        b
      ) =>
        Number(
          a.price
        ) -
        Number(
          b.price
        );


    case "price-high":

      return (
        a,
        b
      ) =>
        Number(
          b.price
        ) -
        Number(
          a.price
        );


    case "newest":

    default:

      return sortByNewest;

  }

}


function sortByNewest(
  a,
  b
) {

  return (
    getTimestamp(
      b.created_at
    ) -
    getTimestamp(
      a.created_at
    )
  );

}


function getTimestamp(
  value
) {

  const timestamp =
    value
      ? Date.parse(
          value
        )
      : 0;


  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;

}


/* ============================================================
   PRICE
============================================================ */

function formatPrice(
  price
) {

  const amount =
    Number(
      price
    );


  if (
    !Number.isFinite(
      amount
    ) ||
    amount <= 0
  ) {

    return "Price on enquiry";

  }


  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0
    }
  ).format(
    amount
  );

}


/* ============================================================
   PRODUCT MODAL
============================================================ */

function openProduct(
  productId
) {

  const product =
    state.products.find(
      item =>
        String(
          item.id
        ) ===
        String(
          productId
        )
    );


  if (
    !product
  ) {

    return;

  }


  state.selectedProductId =
    product.id;


  const image =
    product.image_url ||
    (
      product.images &&
      product.images[0]
    ) ||
    getPlaceholderImage();


  if (
    elements.productModalImage
  ) {

    elements.productModalImage.src =
      image;

    elements.productModalImage.alt =
      product.name;

  }


  if (
    elements.productModalCategory
  ) {

    elements.productModalCategory.textContent =
      formatPublicCategory(
        product.category
      );

  }


  if (
    elements.productModalName
  ) {

    elements.productModalName.textContent =
      product.name;

  }


  if (
    elements.productModalPrice
  ) {

    elements.productModalPrice.textContent =
      formatPrice(
        product.price
      );

  }


  if (
    elements.productModalDescription
  ) {

    elements.productModalDescription.textContent =
      product.description;

  }


  if (
    elements.productModalMaterial
  ) {

    elements.productModalMaterial.textContent =
      product.material ||
      (
        product.metal === "silver"
          ? "Silver"
          : "Gold"
      );

  }


  if (
    elements.productModalSku
  ) {

    elements.productModalSku.textContent =
      product.sku ||
      "Available in store";

  }


  if (
    elements.productModalWhatsApp
  ) {

    elements.productModalWhatsApp.href =
      createWhatsAppProductUrl(
        product
      );

  }


  if (
    elements.productModal
  ) {

    elements.productModal.classList.add(
      "active"
    );

    elements.productModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "no-scroll"
    );

  }

}


function closeProductModal() {

  if (
    elements.productModal
  ) {

    elements.productModal.classList.remove(
      "active"
    );

    elements.productModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }

  state.selectedProductId =
    null;


  restoreBodyScrollIfPossible();

}


/* ============================================================
   WHATSAPP PRODUCT ENQUIRY
============================================================ */

function createWhatsAppProductUrl(
  product
) {

  const message =

    `Hello Krishna Jewellers, I would like to enquire about this jewellery piece.%0A%0A` +

    `Product: ${encodeURIComponent(
      product.name
    )}%0A` +

    `Metal: ${encodeURIComponent(
      product.metal === "silver"
        ? "Silver"
        : "Gold"
    )}%0A` +

    `Category: ${encodeURIComponent(
      formatPublicCategory(
        product.category
      )
    )}%0A` +

    `SKU: ${encodeURIComponent(
      product.sku ||
      "Available in store"
    )}`;


  return (
    `https://wa.me/${BUSINESS.whatsapp}?text=` +
    message
  );

}


function sendWhatsAppEnquiry(
  productId
) {

  const product =
    state.products.find(
      item =>
        String(
          item.id
        ) ===
        String(
          productId
        )
    );


  if (
    !product
  ) {

    return;

  }


  window.open(
    createWhatsAppProductUrl(
      product
    ),
    "_blank",
    "noopener,noreferrer"
  );

}


/* ============================================================
   WISHLIST
============================================================ */

function loadWishlist() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEYS.wishlist
      );


    if (!saved) {
      return [];
    }


    const parsed =
      JSON.parse(
        saved
      );


    if (
      !Array.isArray(
        parsed
      )
    ) {

      return [];

    }


    return [
      ...new Set(
        parsed.map(
          value =>
            String(
              value
            )
        )
      )
    ];

  } catch (error) {

    console.warn(
      "Unable to load wishlist.",
      error
    );

    return [];

  }

}


function saveWishlist() {

  try {

    localStorage.setItem(
      STORAGE_KEYS.wishlist,

      JSON.stringify(
        state.wishlist
      )

    );

  } catch (error) {

    console.warn(
      "Unable to save wishlist.",
      error
    );

  }

}


function isInWishlist(
  productId
) {

  return state.wishlist.includes(
    String(
      productId
    )
  );

}


function toggleWishlist(
  productId
) {

  const id =
    String(
      productId
    );


  if (
    isInWishlist(
      id
    )
  ) {

    state.wishlist =
      state.wishlist.filter(
        item =>
          item !== id
      );

  } else {

    state.wishlist.push(
      id
    );

  }


  saveWishlist();

  updateWishlistCount();

  renderFeatured();

  renderNewArrivals();

  renderCatalogue();


  if (
    elements.wishlistDrawer?.classList.contains(
      "active"
    )
  ) {

    renderWishlist();

  }

}


function updateWishlistCount() {

  if (
    !elements.wishlistCount
  ) {
    return;
  }


  const visibleIds =
    new Set(
      getVisibleProducts()
        .map(
          product =>
            String(
              product.id
            )
        )
    );


  const count =
    state.wishlist.filter(
      id =>
        visibleIds.has(
          String(
            id
          )
        )
    ).length;


  elements.wishlistCount.textContent =
    String(
      count
    );

}


/* ============================================================
   WISHLIST DRAWER
============================================================ */

function openWishlist() {

  renderWishlist();


  if (
    elements.wishlistDrawer
  ) {

    elements.wishlistDrawer.classList.add(
      "active"
    );

    elements.wishlistDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  if (
    elements.drawerBackdrop
  ) {

    elements.drawerBackdrop.classList.add(
      "active"
    );

  }


  document.body.classList.add(
    "no-scroll"
  );

}


function closeWishlist() {

  if (
    elements.wishlistDrawer
  ) {

    elements.wishlistDrawer.classList.remove(
      "active"
    );

    elements.wishlistDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  if (
    elements.drawerBackdrop
  ) {

    elements.drawerBackdrop.classList.remove(
      "active"
    );

  }


  restoreBodyScrollIfPossible();

}


function renderWishlist() {

  if (
    !elements.wishlistContent
  ) {
    return;
  }


  const visibleProducts =
    getVisibleProducts();


  const products =
    state.wishlist

      .map(
        id =>
          visibleProducts.find(
            product =>
              String(
                product.id
              ) ===
              String(
                id
              )
          )
      )

      .filter(
        Boolean
      );


  if (
    products.length === 0
  ) {

    elements.wishlistContent.innerHTML = `

      <div class="wishlist-empty">

        <span>
          ♡
        </span>

        <h3>
          Nothing saved yet
        </h3>

        <p>
          Tap the heart on any jewellery piece
          to save it here.
        </p>

      </div>

    `;

    return;

  }


  elements.wishlistContent.innerHTML =
    products
      .map(
        product => {

          const image =
            product.image_url ||
            (
              product.images &&
              product.images[0]
            ) ||
            getPlaceholderImage();


          return `

            <div
              class="wishlist-item"
              data-product-id="${escapeAttribute(
                String(
                  product.id
                )
              )}"
            >

              <div class="wishlist-item-image">

                <img
                  src="${escapeAttribute(
                    image
                  )}"
                  alt="${escapeAttribute(
                    product.name
                  )}"
                  loading="lazy"
                  onerror="this.src='${getPlaceholderImage()}'"
                >

              </div>


              <div class="wishlist-item-info">

                <h3>
                  ${escapeHTML(
                    product.name
                  )}
                </h3>

                <span>
                  ${escapeHTML(
                    formatPublicCategory(
                      product.category
                    )
                  )}
                </span>

                <strong>
                  ${formatPrice(
                    product.price
                  )}
                </strong>

              </div>


              <button
                type="button"
                class="wishlist-item-remove"
                data-wishlist-remove="${escapeAttribute(
                  String(
                    product.id
                  )
                )}"
                aria-label="Remove from wishlist"
              >
                ×
              </button>

            </div>

          `;

        }
      )
      .join("");

}


/* ============================================================
   SEARCH PANEL
============================================================ */

function openSearch() {

  if (
    elements.searchPanel
  ) {

    elements.searchPanel.classList.add(
      "active"
    );

  }


  window.setTimeout(
    () => {

      if (
        elements.globalSearch
      ) {

        elements.globalSearch.focus();

      }

    },
    250
  );

}


function closeSearchPanel() {

  if (
    elements.searchPanel
  ) {

    elements.searchPanel.classList.remove(
      "active"
    );

  }

}


/* ============================================================
   MOBILE NAV
============================================================ */

function toggleMobileNav() {

  if (
    !elements.mainNav
  ) {
    return;
  }


  const active =
    elements.mainNav.classList.toggle(
      "active"
    );


  if (
    elements.menuToggle
  ) {

    elements.menuToggle.setAttribute(
      "aria-expanded",
      active
        ? "true"
        : "false"
    );

  }

}


function closeMobileNav() {

  if (
    elements.mainNav
  ) {

    elements.mainNav.classList.remove(
      "active"
    );

  }


  if (
    elements.menuToggle
  ) {

    elements.menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

  }

}


/* ============================================================
   EVENT BINDING
============================================================ */

function bindEvents() {


  /* ----------------------------------------------------------
     GOLD / SILVER
  ---------------------------------------------------------- */

  if (
    elements.metalToggle
  ) {

    elements.metalToggle.addEventListener(
      "click",
      () => {

        const nextMode =
          state.metalMode === "gold"
            ? "silver"
            : "gold";


        setMetalMode(
          nextMode
        );

      }
    );

  }


  /* ----------------------------------------------------------
     MOBILE MENU
  ---------------------------------------------------------- */

  if (
    elements.menuToggle
  ) {

    elements.menuToggle.addEventListener(
      "click",
      toggleMobileNav
    );

  }


  /* ----------------------------------------------------------
     MOBILE NAV LINKS
  ---------------------------------------------------------- */

  if (
    elements.mainNav
  ) {

    elements.mainNav
      .querySelectorAll("a")
      .forEach(
        link => {

          link.addEventListener(
            "click",
            closeMobileNav
          );

        }
      );

  }


  /* ----------------------------------------------------------
     SEARCH
  ---------------------------------------------------------- */

  if (
    elements.searchToggle
  ) {

    elements.searchToggle.addEventListener(
      "click",
      openSearch
    );

  }


  if (
    elements.closeSearch
  ) {

    elements.closeSearch.addEventListener(
      "click",
      closeSearchPanel
    );

  }


  if (
    elements.globalSearch
  ) {

    elements.globalSearch.addEventListener(
      "input",
      event => {

        setSearchTerm(
          event.target.value
        );

      }
    );

  }


  /* ----------------------------------------------------------
     SORT
  ---------------------------------------------------------- */

  if (
    elements.sortSelect
  ) {

    elements.sortSelect.addEventListener(
      "change",
      event => {

        state.sort =
          event.target.value ||
          "newest";

        renderCatalogue();

      }
    );

  }


  /* ----------------------------------------------------------
     CLEAR FILTERS
  ---------------------------------------------------------- */

  if (
    elements.clearFiltersBtn
  ) {

    elements.clearFiltersBtn.addEventListener(
      "click",
      clearFilters
    );

  }


  /* ----------------------------------------------------------
     WISHLIST
  ---------------------------------------------------------- */

  if (
    elements.wishlistToggle
  ) {

    elements.wishlistToggle.addEventListener(
      "click",
      openWishlist
    );

  }


  if (
    elements.closeWishlist
  ) {

    elements.closeWishlist.addEventListener(
      "click",
      closeWishlist
    );

  }


  if (
    elements.drawerBackdrop
  ) {

    elements.drawerBackdrop.addEventListener(
      "click",
      closeWishlist
    );

  }


  /* ----------------------------------------------------------
     PRODUCT MODAL
  ---------------------------------------------------------- */

  if (
    elements.modalClose
  ) {

    elements.modalClose.addEventListener(
      "click",
      closeProductModal
    );

  }


  if (
    elements.modalBackdrop
  ) {

    elements.modalBackdrop.addEventListener(
      "click",
      closeProductModal
    );

  }


  /* ----------------------------------------------------------
     GLOBAL CLICK DELEGATION
  ---------------------------------------------------------- */

  document.addEventListener(
    "click",
    handleDocumentClick
  );


  /* ----------------------------------------------------------
     ESCAPE KEY
  ---------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      closeSearchPanel();

      closeWishlist();

      closeProductModal();

      closeMobileNav();

    }
  );


  /* ----------------------------------------------------------
     WINDOW RESIZE
  ---------------------------------------------------------- */

  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth > 820
      ) {

        closeMobileNav();

      }

    }
  );

}


/* ============================================================
   GLOBAL CLICK HANDLER
============================================================ */

function handleDocumentClick(
  event
) {


  /* ----------------------------------------------------------
     CATEGORY CARD
  ---------------------------------------------------------- */

  const categoryButton =
    event.target.closest(
      ".category-card"
    );


  if (
    categoryButton
  ) {

    const category =
      categoryButton.dataset.category ||
      "all";


    setCategory(
      category
    );


    const collection =
      document.getElementById(
        "collection"
      );


    if (
      collection
    ) {

      collection.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"

      });

    }


    return;

  }


  /* ----------------------------------------------------------
     FILTER BUTTON
  ---------------------------------------------------------- */

  const filterButton =
    event.target.closest(
      ".filter-button"
    );


  if (
    filterButton
  ) {

    setCategory(
      filterButton.dataset.filter ||
      "all"
    );


    return;

  }


  /* ----------------------------------------------------------
     WISHLIST BUTTON
  ---------------------------------------------------------- */

  const wishlistButton =
    event.target.closest(
      "[data-wishlist-id]"
    );


  if (
    wishlistButton
  ) {

    event.preventDefault();

    event.stopPropagation();


    toggleWishlist(
      wishlistButton.dataset.wishlistId
    );


    return;

  }


  /* ----------------------------------------------------------
     WISHLIST REMOVE
  ---------------------------------------------------------- */

  const wishlistRemove =
    event.target.closest(
      "[data-wishlist-remove]"
    );


  if (
    wishlistRemove
  ) {

    event.preventDefault();

    event.stopPropagation();


    toggleWishlist(
      wishlistRemove.dataset.wishlistRemove
    );


    return;

  }


  /* ----------------------------------------------------------
     PRODUCT VIEW
  ---------------------------------------------------------- */

  const productView =
    event.target.closest(
      "[data-product-id]"
    );


  if (
    productView &&
    !event.target.closest(
      "[data-wishlist-id]"
    )
  ) {

    const productId =
      productView.dataset.productId;


    if (
      productId
    ) {

      openProduct(
        productId
      );

    }

  }

}


/* ============================================================
   CLEAR FILTERS
============================================================ */

function clearFilters() {

  state.activeCategory =
    "all";

  state.searchTerm =
    "";

  state.sort =
    "newest";


  if (
    elements.globalSearch
  ) {

    elements.globalSearch.value =
      "";

  }


  if (
    elements.sortSelect
  ) {

    elements.sortSelect.value =
      "newest";

  }


  renderCatalogue();

}


/* ============================================================
   SCROLL REVEAL
============================================================ */

function initializeRevealAnimations() {

  const revealElements =
    document.querySelectorAll(
      [
        ".section-header",
        ".category-card",
        ".product-card",
        ".bridal",
        ".about-photo",
        ".about-content",
        ".why-item",
        ".contact-content",
        ".contact-card"
      ].join(",")
    );


  revealElements.forEach(
    element => {

      element.setAttribute(
        "data-reveal",
        ""
      );

    }
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

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "revealed"
              );

              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold:
          0.08,

        rootMargin:
          "0px 0px -40px 0px"

      }
    );


  revealElements.forEach(
    element =>
      observer.observe(
        element
      )
  );

}


/* ============================================================
   YEAR
============================================================ */

function setCurrentYear() {

  if (
    elements.currentYear
  ) {

    elements.currentYear.textContent =
      String(
        new Date().getFullYear()
      );

  }

}


/* ============================================================
   BODY SCROLL
============================================================ */

function restoreBodyScrollIfPossible() {

  const modalOpen =
    elements.productModal?.classList.contains(
      "active"
    );


  const drawerOpen =
    elements.wishlistDrawer?.classList.contains(
      "active"
    );


  if (
    !modalOpen &&
    !drawerOpen
  ) {

    document.body.classList.remove(
      "no-scroll"
    );

  }

}


/* ============================================================
   PLACEHOLDER IMAGE
============================================================ */

function getPlaceholderImage() {

  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 900"
      >

        <rect
          width="800"
          height="900"
          fill="#eee9e2"
        />

        <circle
          cx="400"
          cy="385"
          r="145"
          fill="none"
          stroke="#c49a4a"
          stroke-width="3"
          opacity=".55"
        />

        <text
          x="400"
          y="380"
          text-anchor="middle"
          font-family="Georgia, serif"
          font-size="58"
          fill="#8a672b"
        >
          KJ
        </text>

        <text
          x="400"
          y="450"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="20"
          letter-spacing="5"
          fill="#77716b"
        >
          KRISHNA JEWELLERS
        </text>

      </svg>

    `)
  );

}


/* ============================================================
   TEXT HELPERS
============================================================ */

function normalizeText(
  value
) {

  return String(
    value ?? ""
  )

    .trim()

    .toLowerCase()

    .replace(
      /\s+/g,
      " "
    );

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


/* ============================================================
   PUBLIC API
============================================================ */

window.KrishnaJewellers = {

  refreshCatalogue:
    async function () {

      await loadProducts();

      renderEverything();

    },


  openProduct:
    function (
      productId
    ) {

      openProduct(
        productId
      );

    },


  sendWhatsAppEnquiry:
    function (
      productId
    ) {

      sendWhatsAppEnquiry(
        productId
      );

    },


  setMetal:
    function (
      metal
    ) {

      setMetalMode(
        metal
      );

    },


  getCurrentMetal:
    function () {

      return state.metalMode;

    },


  getProducts:
    function () {

      return [
        ...state.products
      ];

    }

};
