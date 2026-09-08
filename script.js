"use strict";

(() => {

  const config = window.KRISHNA_SUPABASE || {};

  const SUPABASE_URL = String(config.url || "").replace(/\/$/, "");
  const SUPABASE_KEY = String(config.key || "");

  const supabaseClient =
    window.supabase &&
    SUPABASE_URL &&
    SUPABASE_KEY &&
    !SUPABASE_KEY.includes("YOUR_")
      ? window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        )
      : null;


  const DEMO_PRODUCTS = [

    {
      id: "demo-ring",
      name: "Golden Promise Ring",
      category: "rings",
      price: 0,
      description:
        "A delicate gold ring designed for timeless everyday elegance.",
      material: "Gold",
      sku: "DEMO-RING-001",
      image_url:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
      images: [],
      featured: true,
      is_published: true,
      created_at: new Date().toISOString()
    },

    {
      id: "demo-necklace",
      name: "Royal Gold Necklace",
      category: "necklaces",
      price: 0,
      description:
        "A graceful statement necklace for weddings and celebrations.",
      material: "Gold",
      sku: "DEMO-NK-001",
      image_url:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      images: [],
      featured: true,
      is_published: true,
      created_at: new Date().toISOString()
    },

    {
      id: "demo-earrings",
      name: "Pearl Glow Earrings",
      category: "earrings",
      price: 0,
      description:
        "Elegant earrings created for a soft and sophisticated look.",
      material: "Gold & Pearl",
      sku: "DEMO-EAR-001",
      image_url:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
      images: [],
      featured: true,
      is_published: true,
      created_at: new Date().toISOString()
    },

    {
      id: "demo-bangles",
      name: "Heritage Gold Bangles",
      category: "bangles",
      price: 0,
      description:
        "Traditional-inspired bangles with a refined contemporary finish.",
      material: "Gold",
      sku: "DEMO-BAN-001",
      image_url:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
      images: [],
      featured: false,
      is_published: true,
      created_at: new Date().toISOString()
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


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    setupHeader();

    setupMobileMenu();

    setupSearch();

    setupWishlist();

    setupModal();

    setupCategories();

    setupSorting();

    setupCategoryCards();

    setupClearFilters();

    setupScrollAnimations();

    setCurrentYear();

    await loadProducts();

  }


  /* PRODUCTS */

  async function loadProducts() {

    let products = [];

    if (supabaseClient) {

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

          console.error(
            "Supabase catalogue error:",
            error
          );

        } else {

          products =
            (data || [])
              .map(normalizeProduct);

        }

      } catch (error) {

        console.error(
          "Catalogue error:",
          error
        );

      }

    }


    state.products =
      products.length
        ? products
        : DEMO_PRODUCTS;


    applyFilters();

    renderFeatured();

    renderNewArrivals();

  }


  function normalizeProduct(product) {

    let images = [];

    if (Array.isArray(product.images)) {

      images =
        product.images
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


    return {

      id: product.id,

      name:
        product.name ||
        "Beautiful Jewellery",

      category:
        String(
          product.category || "other"
        ).toLowerCase(),

      price:
        Number(product.price || 0),

      description:
        product.description ||
        "Beautifully crafted jewellery from Krishna Jewellers.",

      material:
        product.material ||
        "Gold",

      sku:
        product.sku ||
        "",

      image_url:
        product.image_url ||
        images[0]?.url ||
        "",

      images,

      featured:
        Boolean(product.featured),

      is_published:
        Boolean(product.is_published),

      created_at:
        product.created_at ||
        new Date().toISOString()

    };

  }


  /* FILTER */

  function applyFilters() {

    let products =
      [...state.products];


    if (
      state.activeCategory !== "all"
    ) {

      products =
        products.filter(
          product =>
            product.category ===
            state.activeCategory
        );

    }


    if (state.searchTerm) {

      const term =
        state.searchTerm.toLowerCase();


      products =
        products.filter(
          product =>
            [
              product.name,
              product.category,
              product.description,
              product.material,
              product.sku
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)
        );

    }


    products.sort(
      (a, b) => {

        switch (state.sort) {

          case "newest":

            return (
              new Date(b.created_at) -
              new Date(a.created_at)
            );


          case "name":

            return a.name.localeCompare(
              b.name
            );


          case "price-low":

            return a.price - b.price;


          case "price-high":

            return b.price - a.price;


          case "featured":

          default:

            return (
              Number(b.featured) -
              Number(a.featured)
            );

        }

      }
    );


    state.filteredProducts =
      products;


    renderAllProducts();

  }


  /* FEATURED */

  function renderFeatured() {

    const container =
      document.getElementById(
        "featuredGrid"
      );

    if (!container) return;


    let products =
      [...state.products]
        .filter(product =>
          product.featured
        );


    if (!products.length) {

      products =
        [...state.products]
          .slice(0, 4);

    }


    renderProductCollection(
      container,
      products.slice(0, 4)
    );

  }


  /* NEW ARRIVALS */

  function renderNewArrivals() {

    const container =
      document.getElementById(
        "newArrivalsGrid"
      );

    if (!container) return;


    const products =
      [...state.products]
        .sort(
          (a, b) =>
            new Date(b.created_at) -
            new Date(a.created_at)
        )
        .slice(0, 4);


    renderProductCollection(
      container,
      products
    );

  }


  /* ALL PRODUCTS */

  function renderAllProducts() {

    const container =
      document.getElementById(
        "productGrid"
      );

    if (!container) return;


    renderProductCollection(
      container,
      state.filteredProducts
    );


    const result =
      document.getElementById(
        "productResultText"
      );


    if (result) {

      result.textContent =
        `${state.filteredProducts.length} ${
          state.filteredProducts.length === 1
            ? "piece"
            : "pieces"
        } available`;

    }


    const empty =
      document.getElementById(
        "emptyState"
      );


    if (empty) {

      empty.classList.toggle(
        "hidden",
        state.filteredProducts.length > 0
      );

    }

  }


  function renderProductCollection(
    container,
    products
  ) {

    container.innerHTML = "";


    products.forEach(
      (product, index) => {

        const card =
          createProductCard(
            product,
            index
          );

        container.appendChild(card);

      }
    );

  }


  /* CARD */

  function createProductCard(
    product,
    index
  ) {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "product-card";


    card.style.animationDelay =
      `${Math.min(index * 70, 450)}ms`;


    const image =
      product.image_url ||
      product.images?.[0]?.url ||
      fallbackImage();


    const wished =
      state.wishlist.includes(
        product.id
      );


    card.innerHTML = `

      <div class="product-image">

        <img
          src="${escapeAttribute(image)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
        >

        ${
          product.featured
            ? `<span class="product-badge">
                 Featured
               </span>`
            : ""
        }

        <button
          class="product-wishlist ${
            wished ? "active" : ""
          }"
          type="button"
          aria-label="Wishlist"
        >
          ${wished ? "♥" : "♡"}
        </button>

      </div>


      <div class="product-info">

        <div class="product-category">
          ${escapeHTML(
            formatCategory(
              product.category
            )
          )}
        </div>

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

        <div class="product-price">
          ${
            product.price > 0
              ? formatCurrency(
                  product.price
                )
              : "Price on enquiry"
          }
        </div>


        <div class="product-actions">

          <button
            class="btn btn-outline view-product"
            type="button"
          >
            View
          </button>

          <button
            class="btn btn-gold enquire-product"
            type="button"
          >
            Enquire
          </button>

        </div>

      </div>

    `;


    card
      .querySelector(
        ".product-wishlist"
      )
      ?.addEventListener(
        "click",
        () =>
          toggleWishlist(
            product.id
          )
      );


    card
      .querySelector(
        ".view-product"
      )
      ?.addEventListener(
        "click",
        () =>
          openProductModal(
            product.id
          )
      );


    card
      .querySelector(
        ".enquire-product"
      )
      ?.addEventListener(
        "click",
        () =>
          sendWhatsAppEnquiry(
            product
          )
      );


    return card;

  }


  /* CATEGORY */

  function setupCategories() {

    document
      .querySelectorAll(
        ".filter-button"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".filter-button"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            state.activeCategory =
              button.dataset.category ||
              "all";


            applyFilters();

          }
        );

      });

  }


  function setupCategoryCards() {

    document
      .querySelectorAll(
        ".category-button"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const category =
              button.dataset.category;


            state.activeCategory =
              category;


            document
              .querySelectorAll(
                ".filter-button"
              )
              .forEach(
                filter => {

                  filter.classList.toggle(
                    "active",
                    filter.dataset.category ===
                      category
                  );

                }
              );


            applyFilters();


            document
              .getElementById(
                "all-products"
              )
              ?.scrollIntoView({
                behavior: "smooth"
              });

          }
        );

      });

  }


  /* SORT */

  function setupSorting() {

    document
      .getElementById(
        "sortProducts"
      )
      ?.addEventListener(
        "change",
        event => {

          state.sort =
            event.target.value;

          applyFilters();

        }
      );

  }


  /* SEARCH */

  function setupSearch() {

    const toggle =
      document.getElementById(
        "searchToggle"
      );

    const panel =
      document.getElementById(
        "searchPanel"
      );

    const close =
      document.getElementById(
        "searchClose"
      );

    const input =
      document.getElementById(
        "searchInput"
      );


    toggle?.addEventListener(
      "click",
      () => {

        panel?.classList.toggle(
          "open"
        );

        if (
          panel?.classList.contains(
            "open"
          )
        ) {

          setTimeout(
            () =>
              input?.focus(),
            100
          );

        }

      }
    );


    close?.addEventListener(
      "click",
      () => {

        panel?.classList.remove(
          "open"
        );

      }
    );


    input?.addEventListener(
      "input",
      event => {

        state.searchTerm =
          event.target.value.trim();

        applyFilters();

      }
    );

  }


  /* HEADER */

  function setupHeader() {

    const header =
      document.getElementById(
        "siteHeader"
      );


    const update =
      () => {

        header?.classList.toggle(
          "scrolled",
          window.scrollY > 15
        );

      };


    update();


    window.addEventListener(
      "scroll",
      update,
      {
        passive: true
      }
    );

  }


  /* MOBILE */

  function setupMobileMenu() {

    const button =
      document.getElementById(
        "mobileMenuBtn"
      );

    const nav =
      document.getElementById(
        "mainNav"
      );


    button?.addEventListener(
      "click",
      () => {

        nav?.classList.toggle(
          "open"
        );

      }
    );


    nav
      ?.querySelectorAll("a")
      .forEach(link => {

        link.addEventListener(
          "click",
          () =>
            nav.classList.remove(
              "open"
            )
        );

      });

  }


  /* WISHLIST */

  function loadWishlist() {

    try {

      const saved =
        localStorage.getItem(
          "krishna_wishlist"
        );


      const parsed =
        JSON.parse(
          saved || "[]"
        );


      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch {

      return [];

    }

  }


  function saveWishlist() {

    localStorage.setItem(
      "krishna_wishlist",
      JSON.stringify(
        state.wishlist
      )
    );

  }


  function setupWishlist() {

    document
      .getElementById(
        "wishlistBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          renderWishlist();

          openDrawer(
            document.getElementById(
              "wishlistDrawer"
            )
          );

        }
      );


    document
      .getElementById(
        "wishlistClose"
      )
      ?.addEventListener(
        "click",
        () => {

          closeDrawer(
            document.getElementById(
              "wishlistDrawer"
            )
          );

        }
      );


    updateWishlistCount();

  }


  function toggleWishlist(
    productId
  ) {

    const index =
      state.wishlist.indexOf(
        productId
      );


    if (index >= 0) {

      state.wishlist.splice(
        index,
        1
      );

      showToast(
        "Removed from wishlist"
      );

    } else {

      state.wishlist.push(
        productId
      );

      showToast(
        "Added to wishlist"
      );

    }


    saveWishlist();

    updateWishlistCount();

    renderAllProducts();

    renderFeatured();

    renderNewArrivals();

  }


  function updateWishlistCount() {

    const count =
      document.getElementById(
        "wishlistCount"
      );


    if (!count) return;


    count.textContent =
      state.wishlist.length;


    count.classList.toggle(
      "hidden",
      state.wishlist.length === 0
    );

  }


  function renderWishlist() {

    const container =
      document.getElementById(
        "wishlistItems"
      );


    if (!container) return;


    const products =
      state.wishlist
        .map(
          id =>
            state.products.find(
              product =>
                product.id === id
            )
        )
        .filter(Boolean);


    container.innerHTML = "";


    if (!products.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div>♡</div>

          <h3>
            Your wishlist is empty
          </h3>

          <p>
            Save beautiful pieces here.
          </p>

        </div>

      `;

      return;

    }


    products.forEach(
      product => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "wishlist-item";


        item.innerHTML = `

          <img
            src="${escapeAttribute(
              product.image_url
            )}"
            alt="${escapeAttribute(
              product.name
            )}"
          >

          <div>

            <h4>
              ${escapeHTML(
                product.name
              )}
            </h4>

            <p>
              ${escapeHTML(
                formatCategory(
                  product.category
                )
              )}
            </p>

          </div>

          <button
            class="wishlist-remove"
            type="button"
          >
            ×
          </button>

        `;


        item
          .querySelector(
            ".wishlist-remove"
          )
          ?.addEventListener(
            "click",
            () =>
              toggleWishlist(
                product.id
              )
          );


        container.appendChild(
          item
        );

      }
    );

  }


  /* MODAL */

  function setupModal() {

    const modal =
      document.getElementById(
        "productModal"
      );


    document
      .getElementById(
        "productModalClose"
      )
      ?.addEventListener(
        "click",
        () =>
          closeModal(modal)
      );


    modal?.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          closeModal(modal);

        }

      }
    );

  }


  function openProductModal(
    productId
  ) {

    const product =
      state.products.find(
        item =>
          item.id === productId
      );


    if (!product) return;


    state.currentProduct =
      product;


    const modal =
      document.getElementById(
        "productModal"
      );


    const image =
      product.image_url ||
      product.images?.[0]?.url ||
      fallbackImage();


    document.getElementById(
      "productModalImage"
    ).src = image;


    document.getElementById(
      "productModalImage"
    ).alt = product.name;


    document.getElementById(
      "productModalCategory"
    ).textContent =
      formatCategory(
        product.category
      );


    document.getElementById(
      "productModalName"
    ).textContent =
      product.name;


    document.getElementById(
      "productModalDescription"
    ).textContent =
      product.description;


    document.getElementById(
      "productModalMaterial"
    ).textContent =
      product.material;


    document.getElementById(
      "productModalPrice"
    ).textContent =
      product.price > 0
        ? formatCurrency(
            product.price
          )
        : "Price on enquiry";


    const button =
      document.getElementById(
        "productModalEnquire"
      );


    button.onclick =
      () =>
        sendWhatsAppEnquiry(
          product
        );


    modal?.classList.add(
      "open"
    );


    document.body.style.overflow =
      "hidden";

  }


  function closeModal(
    modal
  ) {

    modal?.classList.remove(
      "open"
    );

    document.body.style.overflow =
      "";

  }


  /* WHATSAPP */

  function sendWhatsAppEnquiry(
    product
  ) {

    const phone =
      "919839902006";


    const message =
      `Hello Krishna Jewellers,\n\n` +
      `I am interested in ${product.name}.\n\n` +
      `Category: ${formatCategory(
        product.category
      )}\n` +
      `SKU: ${product.sku || "N/A"}\n\n` +
      `Please share more details and current pricing.`;


    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );

  }


  /* DRAWER */

  function openDrawer(
    drawer
  ) {

    if (!drawer) return;


    drawer.classList.add(
      "open"
    );


    document.body.style.overflow =
      "hidden";


    let overlay =
      document.querySelector(
        ".drawer-overlay"
      );


    if (!overlay) {

      overlay =
        document.createElement(
          "div"
        );

      overlay.className =
        "drawer-overlay";


      Object.assign(
        overlay.style,
        {
          position: "fixed",
          inset: "0",
          zIndex: "2999",
          background:
            "rgba(25,18,27,.5)",
          opacity: "0",
          transition:
            "opacity .35s ease"
        }
      );


      document.body.appendChild(
        overlay
      );


      overlay.addEventListener(
        "click",
        () =>
          closeDrawer(drawer)
      );

    }


    requestAnimationFrame(
      () =>
        overlay.style.opacity =
          "1"
    );

  }


  function closeDrawer(
    drawer
  ) {

    drawer?.classList.remove(
      "open"
    );


    const overlay =
      document.querySelector(
        ".drawer-overlay"
      );


    if (overlay) {

      overlay.style.opacity =
        "0";


      setTimeout(
        () =>
          overlay.remove(),
        350
      );

    }


    document.body.style.overflow =
      "";

  }


  /* CLEAR FILTERS */

  function setupClearFilters() {

    document
      .getElementById(
        "clearFiltersBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          state.activeCategory =
            "all";

          state.searchTerm =
            "";

          document.getElementById(
            "searchInput"
          ).value = "";


          document
            .querySelectorAll(
              ".filter-button"
            )
            .forEach(
              button =>
                button.classList.toggle(
                  "active",
                  button.dataset.category ===
                    "all"
                )
            );


          applyFilters();

        }
      );

  }


  /* SCROLL ANIMATION */

  function setupScrollAnimations() {

    const elements =
      document.querySelectorAll(
        ".category-card, .section-heading, .occasion-card, .about-copy, .about-image, .trust-item"
      );


    elements.forEach(
      element =>
        element.dataset.reveal =
          "true"
    );


    if (
      !("IntersectionObserver" in window)
    ) {

      elements.forEach(
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
          threshold: .12
        }
      );


    elements.forEach(
      element =>
        observer.observe(
          element
        )
    );

  }


  /* HELPERS */

  function formatCategory(
    value
  ) {

    return String(
      value || "other"
    )
      .replace(
        /[-_]/g,
        " "
      )
      .replace(
        /\b\w/g,
        letter =>
          letter.toUpperCase()
      );

  }


  function formatCurrency(
    value
  ) {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }
    ).format(
      Number(value) || 0
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


  function fallbackImage() {

    return "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&q=85";

  }


  function setCurrentYear() {

    const year =
      document.getElementById(
        "currentYear"
      );


    if (year) {

      year.textContent =
        new Date().getFullYear();

    }

  }


  function showToast(
    message
  ) {

    let toast =
      document.querySelector(
        ".kj-toast"
      );


    if (!toast) {

      toast =
        document.createElement(
          "div"
        );

      toast.className =
        "kj-toast";


      Object.assign(
        toast.style,
        {
          position: "fixed",
          left: "50%",
          bottom: "30px",
          zIndex: "5000",
          transform:
            "translate(-50%,20px)",
          opacity: "0",
          padding:
            "12px 20px",
          borderRadius:
            "999px",
          background:
            "#29202b",
          color: "white",
          fontSize: "12px",
          boxShadow:
            "0 15px 40px rgba(0,0,0,.2)",
          transition:
            "all .3s ease"
        }
      );


      document.body.appendChild(
        toast
      );

    }


    toast.textContent =
      message;


    requestAnimationFrame(
      () => {

        toast.style.opacity =
          "1";

        toast.style.transform =
          "translate(-50%,0)";

      }
    );


    clearTimeout(
      showToast.timer
    );


    showToast.timer =
      setTimeout(
        () => {

          toast.style.opacity =
            "0";

          toast.style.transform =
            "translate(-50%,20px)";

        },
        2200
      );

  }


  window.KrishnaJewellers = {

    refreshCatalogue:
      loadProducts,

    openProduct:
      openProductModal,

    sendWhatsAppEnquiry

  };

})();