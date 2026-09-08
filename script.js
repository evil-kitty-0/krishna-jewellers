"use strict";

/* =========================================================
   KRISHNA JEWELLERS
   Storefront Application
   ========================================================= */

const PRODUCTS = [
  {
    id: 1,
    name: "Lakshmi Gold Necklace",
    category: "necklaces",
    collection: "Heritage",
    price: 185000,
    material: "22K Gold",
    purity: "22K / 916",
    badge: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
    description:
      "A richly detailed necklace inspired by traditional Indian motifs, reimagined for modern celebrations."
  },

  {
    id: 2,
    name: "Aarohi Diamond Ring",
    category: "rings",
    collection: "Solitaire",
    price: 78500,
    material: "18K Gold + Diamond",
    purity: "18K",
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
    description:
      "A refined diamond ring designed to catch the light beautifully while remaining effortlessly wearable."
  },

  {
    id: 3,
    name: "Meera Jhumka Earrings",
    category: "earrings",
    collection: "Heritage",
    price: 64500,
    material: "22K Gold",
    purity: "22K / 916",
    badge: "",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
    description:
      "Classic jhumkas with intricate detailing and graceful movement, perfect for festive occasions."
  },

  {
    id: 4,
    name: "Rajputana Gold Kada",
    category: "bracelets",
    collection: "Royal",
    price: 112000,
    material: "22K Gold",
    purity: "22K / 916",
    badge: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
    description:
      "A bold traditional kada featuring elegant engraved details and a substantial gold finish."
  },

  {
    id: 5,
    name: "Noor Diamond Pendant",
    category: "necklaces",
    collection: "Noor",
    price: 92500,
    material: "18K Gold + Diamond",
    purity: "18K",
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=900&q=85",
    description:
      "A delicate diamond pendant designed for everyday elegance and understated luxury."
  },

  {
    id: 6,
    name: "Kashi Diamond Band",
    category: "rings",
    collection: "Noor",
    price: 56500,
    material: "18K Gold + Diamond",
    purity: "18K",
    badge: "",
    image:
      "https://images.unsplash.com/photo-1603561596112-db4f4e2bce9e?auto=format&fit=crop&w=900&q=85",
    description:
      "A contemporary diamond band with a polished finish and timeless silhouette."
  },

  {
    id: 7,
    name: "Gulabo Gold Hoops",
    category: "earrings",
    collection: "Everyday",
    price: 42000,
    material: "18K Gold",
    purity: "18K",
    badge: "",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=900&q=85",
    description:
      "Sculptural gold hoops made to elevate everyday outfits with a warm, polished glow."
  },

  {
    id: 8,
    name: "Vrinda Diamond Bracelet",
    category: "bracelets",
    collection: "Noor",
    price: 99500,
    material: "18K Gold + Diamond",
    purity: "18K",
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&w=900&q=85",
    description:
      "An elegant diamond bracelet with a fine profile and subtle brilliance."
  },

  {
    id: 9,
    name: "Rani Polki Choker",
    category: "necklaces",
    collection: "Bridal",
    price: 245000,
    material: "22K Gold + Polki",
    purity: "22K / 916",
    badge: "Bridal",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85",
    description:
      "A statement polki choker designed for brides who want heritage glamour with a contemporary finish."
  },

  {
    id: 10,
    name: "Madhavi Gold Ring",
    category: "rings",
    collection: "Everyday",
    price: 31500,
    material: "18K Gold",
    purity: "18K",
    badge: "",
    image:
      "https://images.unsplash.com/photo-1627293509201-cd2d4d6d8b52?auto=format&fit=crop&w=900&q=85",
    description:
      "A graceful everyday ring with softly curved lines and a polished gold finish."
  },

  {
    id: 11,
    name: "Tara Diamond Drops",
    category: "earrings",
    collection: "Noor",
    price: 87500,
    material: "18K Gold + Diamond",
    purity: "18K",
    badge: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=85",
    description:
      "Elegant drop earrings featuring brilliant diamonds and a sophisticated silhouette."
  },

  {
    id: 12,
    name: "Anika Gold Bracelet",
    category: "bracelets",
    collection: "Everyday",
    price: 53500,
    material: "18K Gold",
    purity: "18K",
    badge: "",
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85",
    description:
      "A refined gold bracelet that layers beautifully with other pieces or stands alone."
  }
];

/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
  filter: "all",
  search: "",
  sort: "featured",

  cart: loadStorage("krishna-cart", []),

  wishlist: loadStorage("krishna-wishlist", [])
};

let activeProductId = null;

/* =========================================================
   DOM REFERENCES
   ========================================================= */

const productGrid = document.getElementById("productGrid");

const cartDrawer = document.getElementById("cartDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");

const productModal = document.getElementById("productModal");
const checkoutModal = document.getElementById("checkoutModal");

const modalOverlay = document.getElementById("modalOverlay");

const toast = document.getElementById("toast");

/* =========================================================
   STORAGE
   ========================================================= */

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(`Unable to read ${key}`, error);

    return fallback;
  }
}

function saveState() {
  localStorage.setItem(
    "krishna-cart",
    JSON.stringify(state.cart)
  );

  localStorage.setItem(
    "krishna-wishlist",
    JSON.stringify(state.wishlist)
  );
}

/* =========================================================
   UTILITIES
   ========================================================= */

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function getProduct(productId) {
  return PRODUCTS.find(
    (product) => product.id === Number(productId)
  );
}

function showToast(message) {
  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* =========================================================
   PRODUCT FILTERING
   ========================================================= */

function getFilteredProducts() {
  let products = PRODUCTS.filter((product) => {

    const categoryMatch =
      state.filter === "all" ||
      product.category === state.filter;

    const searchableText =
      `${product.name}
       ${product.category}
       ${product.collection}
       ${product.material}`
        .toLowerCase();

    const searchMatch =
      searchableText.includes(
        state.search.toLowerCase()
      );

    return categoryMatch && searchMatch;
  });

  switch (state.sort) {

    case "price-low":
      products.sort(
        (a, b) => a.price - b.price
      );
      break;

    case "price-high":
      products.sort(
        (a, b) => b.price - a.price
      );
      break;

    case "name":
      products.sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );
      break;

    default:
      break;
  }

  return products;
}

/* =========================================================
   PRODUCT RENDERING
   ========================================================= */

function renderProducts() {
  const products = getFilteredProducts();

  if (!products.length) {

    productGrid.innerHTML = `
      <div class="no-results">
        <h3>No jewellery found.</h3>
        <p>
          Try another search or category.
        </p>
      </div>
    `;

    return;
  }

  productGrid.innerHTML = products
    .map((product) => {

      const isWishlisted =
        state.wishlist.includes(product.id);

      return `
        <article class="product-card">

          <div class="product-image">

            <img
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
            >

            ${
              product.badge
                ? `
                  <span class="product-badge">
                    ${product.badge}
                  </span>
                `
                : ""
            }

            <button
              class="product-wishlist ${
                isWishlisted ? "active" : ""
              }"
              data-wishlist="${product.id}"
              aria-label="Wishlist ${product.name}"
            >
              ${isWishlisted ? "♥" : "♡"}
            </button>

          </div>

          <div class="product-info">

            <div class="product-category">
              ${product.category}
            </div>

            <h3 class="product-name">
              ${product.name}
            </h3>

            <div class="product-price">
              ${formatPrice(product.price)}
              <small> onwards</small>
            </div>

            <div class="product-actions">

              <button
                class="small-button"
                data-view="${product.id}"
              >
                View Details
              </button>

              <button
                class="small-button primary"
                data-add="${product.id}"
              >
                Add to Bag
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}

/* =========================================================
   CART
   ========================================================= */

function addToCart(productId) {
  const id = Number(productId);

  const existingItem =
    state.cart.find(
      (item) => item.id === id
    );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id,
      quantity: 1
    });
  }

  saveState();

  updateCounts();

  renderCart();

  const product = getProduct(id);

  showToast(
    `${product.name} added to your bag.`
  );
}

function changeQuantity(productId, amount) {
  const id = Number(productId);

  const item =
    state.cart.find(
      (entry) => entry.id === id
    );

  if (!item) {
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {

    state.cart =
      state.cart.filter(
        (entry) => entry.id !== id
      );
  }

  saveState();

  updateCounts();

  renderCart();
}

function removeFromCart(productId) {
  const id = Number(productId);

  state.cart =
    state.cart.filter(
      (item) => item.id !== id
    );

  saveState();

  updateCounts();

  renderCart();

  showToast(
    "Item removed from your bag."
  );
}

function getCartTotal() {
  return state.cart.reduce(
    (total, item) => {

      const product =
        getProduct(item.id);

      if (!product) {
        return total;
      }

      return total +
        product.price * item.quantity;

    },
    0
  );
}

function renderCart() {
  const container =
    document.getElementById("cartItems");

  if (!state.cart.length) {

    container.innerHTML = `
      <div class="empty-cart">
        <div>
          <strong>
            Your bag is empty.
          </strong>

          <p>
            Discover something beautiful.
          </p>
        </div>
      </div>
    `;

    document.getElementById(
      "cartSubtotal"
    ).textContent = "₹0";

    document.getElementById(
      "cartTotal"
    ).textContent = "₹0";

    return;
  }

  container.innerHTML =
    state.cart.map((item) => {

      const product =
        getProduct(item.id);

      const itemTotal =
        product.price * item.quantity;

      return `
        <div class="cart-item">

          <img
            class="cart-item-image"
            src="${product.image}"
            alt="${product.name}"
          >

          <div>

            <div class="cart-item-name">
              ${product.name}
            </div>

            <div class="cart-item-price">
              ${formatPrice(itemTotal)}
            </div>

            <div class="quantity-controls">

              <button
                data-minus="${product.id}"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                data-plus="${product.id}"
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>

          </div>

          <button
            class="cart-remove"
            data-remove="${product.id}"
          >
            Remove
          </button>

        </div>
      `;
    }).join("");

  const subtotal =
    getCartTotal();

  document.getElementById(
    "cartSubtotal"
  ).textContent =
    formatPrice(subtotal);

  document.getElementById(
    "cartTotal"
  ).textContent =
    formatPrice(subtotal);
}

/* =========================================================
   COUNTERS
   ========================================================= */

function updateCounts() {
  const cartQuantity =
    state.cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  document.getElementById(
    "cartCount"
  ).textContent =
    cartQuantity;

  document.getElementById(
    "wishlistCount"
  ).textContent =
    state.wishlist.length;
}

/* =========================================================
   CART DRAWER
   ========================================================= */

function openCart() {
  closeProductModal();
  closeCheckoutModal();

  cartDrawer.classList.add("open");

  drawerOverlay.classList.add("open");

  document.body.classList.add(
    "modal-open"
  );
}

function closeCart() {
  cartDrawer.classList.remove("open");

  drawerOverlay.classList.remove("open");

  if (
    !productModal.classList.contains("open") &&
    !checkoutModal.classList.contains("open")
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }
}

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProductModal(productId) {
  const product =
    getProduct(productId);

  if (!product) {
    return;
  }

  activeProductId =
    product.id;

  document.getElementById(
    "modalProductImage"
  ).src = product.image;

  document.getElementById(
    "modalProductImage"
  ).alt = product.name;

  document.getElementById(
    "modalProductCategory"
  ).textContent =
    product.category;

  document.getElementById(
    "modalProductName"
  ).textContent =
    product.name;

  document.getElementById(
    "modalProductPrice"
  ).textContent =
    formatPrice(product.price);

  document.getElementById(
    "modalProductDescription"
  ).textContent =
    product.description;

  document.getElementById(
    "modalProductMaterial"
  ).textContent =
    product.material;

  document.getElementById(
    "modalProductPurity"
  ).textContent =
    product.purity;

  document.getElementById(
    "modalProductCollection"
  ).textContent =
    product.collection;

  productModal.classList.add("open");

  modalOverlay.classList.add("open");

  document.body.classList.add(
    "modal-open"
  );
}

function closeProductModal() {
  productModal.classList.remove("open");

  if (
    !checkoutModal.classList.contains("open")
  ) {
    modalOverlay.classList.remove("open");

    document.body.classList.remove(
      "modal-open"
    );
  }
}

/* =========================================================
   CHECKOUT
   ========================================================= */

function renderCheckoutSummary() {
  const container =
    document.getElementById(
      "checkoutSummary"
    );

  if (!state.cart.length) {

    container.innerHTML = `
      <p>Your bag is empty.</p>
    `;

    return;
  }

  container.innerHTML = `
    ${state.cart.map((item) => {

      const product =
        getProduct(item.id);

      return `
        <div class="checkout-line">

          <span>
            ${product.name}
            × ${item.quantity}
          </span>

          <strong>
            ${formatPrice(
              product.price *
              item.quantity
            )}
          </strong>

        </div>
      `;

    }).join("")}

    <div class="checkout-line">

      <span>
        <strong>Total</strong>
      </span>

      <strong>
        ${formatPrice(
          getCartTotal()
        )}
      </strong>

    </div>
  `;
}

function openCheckoutModal() {
  if (!state.cart.length) {

    showToast(
      "Your bag is empty."
    );

    return;
  }

  closeCart();

  renderCheckoutSummary();

  checkoutModal.classList.add(
    "open"
  );

  modalOverlay.classList.add(
    "open"
  );

  document.body.classList.add(
    "modal-open"
  );
}

function closeCheckoutModal() {
  checkoutModal.classList.remove(
    "open"
  );

  if (
    !productModal.classList.contains("open")
  ) {
    modalOverlay.classList.remove(
      "open"
    );

    document.body.classList.remove(
      "modal-open"
    );
  }
}

function completeCheckout(event) {
  event.preventDefault();

  const firstName =
    document.getElementById(
      "firstName"
    ).value.trim();

  if (!firstName) {
    return;
  }

  const orderNumber =
    `KJ-${Date.now()
      .toString()
      .slice(-8)}`;

  document.getElementById(
    "checkoutContent"
  ).innerHTML = `
    <div class="success-message">

      <div class="success-icon">
        ✓
      </div>

      <h2>
        Thank you, ${firstName}.
      </h2>

      <p>
        Your jewellery enquiry has been received.

        Reference number:
        <strong>
          ${orderNumber}
        </strong>.

        Our team will contact you to confirm
        availability, final pricing and payment.
      </p>

      <button
        class="button"
        id="successClose"
      >
        Continue Shopping
      </button>

    </div>
  `;

  state.cart = [];

  saveState();

  updateCounts();

  renderCart();

  document
    .getElementById("successClose")
    .addEventListener(
      "click",
      closeCheckoutModal
    );
}

/* =========================================================
   WISHLIST
   ========================================================= */

function toggleWishlist(productId) {
  const id = Number(productId);

  if (
    state.wishlist.includes(id)
  ) {

    state.wishlist =
      state.wishlist.filter(
        (wishlistId) =>
          wishlistId !== id
      );

    showToast(
      "Removed from wishlist."
    );

  } else {

    state.wishlist.push(id);

    showToast(
      "Added to wishlist."
    );
  }

  saveState();

  updateCounts();

  renderProducts();
}

/* =========================================================
   PRODUCT GRID EVENTS
   ========================================================= */

productGrid.addEventListener(
  "click",
  (event) => {

    const addButton =
      event.target.closest(
        "[data-add]"
      );

    const viewButton =
      event.target.closest(
        "[data-view]"
      );

    const wishlistButton =
      event.target.closest(
        "[data-wishlist]"
      );

    if (addButton) {

      addToCart(
        addButton.dataset.add
      );
    }

    if (viewButton) {

      openProductModal(
        viewButton.dataset.view
      );
    }

    if (wishlistButton) {

      toggleWishlist(
        wishlistButton.dataset.wishlist
      );
    }
  }
);

/* =========================================================
   CART EVENTS
   ========================================================= */

document
  .getElementById("cartItems")
  .addEventListener(
    "click",
    (event) => {

      const plus =
        event.target.closest(
          "[data-plus]"
        );

      const minus =
        event.target.closest(
          "[data-minus]"
        );

      const remove =
        event.target.closest(
          "[data-remove]"
        );

      if (plus) {

        changeQuantity(
          plus.dataset.plus,
          1
        );
      }

      if (minus) {

        changeQuantity(
          minus.dataset.minus,
          -1
        );
      }

      if (remove) {

        removeFromCart(
          remove.dataset.remove
        );
      }
    }
  );

/* =========================================================
   FILTERS
   ========================================================= */

document
  .getElementById("filterButtons")
  .addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-filter]"
        );

      if (!button) {
        return;
      }

      state.filter =
        button.dataset.filter;

      document
        .querySelectorAll(
          ".filter-button"
        )
        .forEach((filterButton) => {

          filterButton.classList.toggle(
            "active",
            filterButton.dataset.filter ===
              state.filter
          );
        });

      renderProducts();
    }
  );

/* =========================================================
   SORT
   ========================================================= */

document
  .getElementById("sortSelect")
  .addEventListener(
    "change",
    (event) => {

      state.sort =
        event.target.value;

      renderProducts();
    }
  );

/* =========================================================
   SEARCH
   ========================================================= */

document
  .getElementById("searchInput")
  .addEventListener(
    "input",
    (event) => {

      state.search =
        event.target.value;

      renderProducts();
    }
  );

document
  .getElementById("mobileSearchButton")
  .addEventListener(
    "click",
    () => {

      const search =
        document.getElementById(
          "searchInput"
        );

      search.focus();

      search.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  );

/* =========================================================
   CART BUTTON
   ========================================================= */

document
  .getElementById("cartButton")
  .addEventListener(
    "click",
    openCart
  );

document
  .getElementById("cartClose")
  .addEventListener(
    "click",
    closeCart
  );

drawerOverlay.addEventListener(
  "click",
  closeCart
);

/* =========================================================
   PRODUCT MODAL BUTTONS
   ========================================================= */

document
  .getElementById("productModalClose")
  .addEventListener(
    "click",
    closeProductModal
  );

document
  .getElementById("modalAddButton")
  .addEventListener(
    "click",
    () => {

      if (!activeProductId) {
        return;
      }

      addToCart(
        activeProductId
      );

      closeProductModal();

      openCart();
    }
  );

/* =========================================================
   CHECKOUT BUTTONS
   ========================================================= */

document
  .getElementById("checkoutButton")
  .addEventListener(
    "click",
    openCheckoutModal
  );

document
  .getElementById("checkoutClose")
  .addEventListener(
    "click",
    closeCheckoutModal
  );

document
  .getElementById("checkoutForm")
  .addEventListener(
    "submit",
    completeCheckout
  );

/* =========================================================
   MODAL OVERLAY
   ========================================================= */

modalOverlay.addEventListener(
  "click",
  () => {

    closeProductModal();

    closeCheckoutModal();
  }
);

/* =========================================================
   NEWSLETTER
   ========================================================= */

document
  .getElementById("newsletterForm")
  .addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const email =
        document.getElementById(
          "newsletterEmail"
        ).value.trim();

      if (!email) {
        return;
      }

      showToast(
        "Thank you for subscribing."
      );

      event.target.reset();
    }
  );

/* =========================================================
   FAQ ACCORDION
   ========================================================= */

document
  .querySelectorAll(".faq-question")
  .forEach((question) => {

    question.addEventListener(
      "click",
      () => {

        const answer =
          question.nextElementSibling;

        const symbol =
          question.querySelector(
            "span"
          );

        const currentlyOpen =
          answer.style.maxHeight;

        document
          .querySelectorAll(
            ".faq-answer"
          )
          .forEach((item) => {

            item.style.maxHeight =
              null;
          });

        document
          .querySelectorAll(
            ".faq-question span"
          )
          .forEach((item) => {

            item.textContent = "+";
          });

        if (!currentlyOpen) {

          answer.style.maxHeight =
            `${answer.scrollHeight}px`;

          symbol.textContent = "−";
        }
      }
    );
  });

/* =========================================================
   CATEGORY CARDS
   ========================================================= */

document
  .querySelectorAll(
    "[data-category-link]"
  )
  .forEach((link) => {

    link.addEventListener(
      "click",
      () => {

        const category =
          link.dataset.categoryLink;

        state.filter =
          category;

        document
          .querySelectorAll(
            ".filter-button"
          )
          .forEach((button) => {

            button.classList.toggle(
              "active",
              button.dataset.filter ===
                category
            );
          });

        renderProducts();
      }
    );
  });

/* =========================================================
   WISHLIST BUTTON
   ========================================================= */

document
  .getElementById("wishlistButton")
  .addEventListener(
    "click",
    () => {

      if (!state.wishlist.length) {

        showToast(
          "Your wishlist is empty."
        );

        return;
      }

      state.filter = "all";

      state.search = "";

      document.getElementById(
        "searchInput"
      ).value = "";

      document
        .querySelectorAll(
          ".filter-button"
        )
        .forEach((button) => {

          button.classList.toggle(
            "active",
            button.dataset.filter ===
              "all"
          );
        });

      renderProducts();

      document
        .getElementById("shop")
        .scrollIntoView({
          behavior: "smooth"
        });

      showToast(
        `${state.wishlist.length} item(s) in your wishlist.`
      );
    }
  );

/* =========================================================
   MOBILE MENU
   ========================================================= */

document
  .getElementById("mobileMenuButton")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("navInner")
        .classList.toggle(
          "open"
        );
    }
  );

document
  .querySelectorAll(".nav-link")
  .forEach((link) => {

    link.addEventListener(
      "click",
      () => {

        document
          .getElementById("navInner")
          .classList.remove(
            "open"
          );
      }
    );
  });

/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key !== "Escape") {
      return;
    }

    closeCart();

    closeProductModal();

    closeCheckoutModal();
  }
);

/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeStore() {
  renderProducts();

  renderCart();

  updateCounts();
}

initializeStore();
