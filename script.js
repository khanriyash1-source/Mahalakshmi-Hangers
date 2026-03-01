
/* =========================
   CART INITIALISATION
   - Start at 0 items on first
     visit to the home page
     in this browser tab
========================= */
(function resetCartOnFirstHomeVisit() {
  try {
    const path = window.location.pathname || "";
    const isHomePage =
      path.endsWith("index.html") ||
      path === "/" ||
      path === "";

    if (!isHomePage) return;

    if (!sessionStorage.getItem("cartInitialized")) {
      localStorage.removeItem("cart");
      sessionStorage.setItem("cartInitialized", "1");
    }
  } catch (e) {
    // ignore – fall back to existing cart
  }
})();

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =========================
   UPDATE CART COUNT
========================= */
function updateCartCount() {
  const count = document.getElementById("cart-count");
  if (count) {
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    count.innerText = totalItems;
  }
}

/* =========================
   GO TO PRODUCT PAGE
========================= */
function goToProduct(name, price, image) {
  const product = { name, price, image };
  localStorage.setItem("selectedProduct", JSON.stringify(product));
  window.location.href = "product.html";
}

/* =========================
   LOAD PRODUCT ON PRODUCT PAGE
========================= */
const selectedProduct = JSON.parse(localStorage.getItem("selectedProduct"));

if (selectedProduct && document.getElementById("product-name")) {
  document.getElementById("product-name").innerText = selectedProduct.name;
  document.getElementById("product-price").innerText = "₹" + selectedProduct.price;
  document.getElementById("product-img").src = selectedProduct.image;
}

/* =========================
   ADD SELECTED PRODUCT TO CART
========================= */
function addSelectedProduct() {
  if (!selectedProduct) return;

  cart.push(selectedProduct);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  playAddToCartSound();
  showCartAddedToast();
}
/* =========================
   REMOVE ITEM
========================= */
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCart();
  updateCartCount();
}

/* =========================
   DISPLAY CART
========================= */
function displayCart() {
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("total");

  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const lineTotal = qty * item.price;
    cartItems.innerHTML += `
      <div class="cart-item">
        <span>${item.name} - ₹${lineTotal}</span>
        <div class="cart-actions">
          <button class="qty-btn" onclick="changeQuantity(${index}, -1)">−</button>
          <span class="qty-value">${qty}</span>
          <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
        </div>
      </div>
    `;
    total += lineTotal;
  });

  if (totalEl) totalEl.innerText = "Total: ₹" + total;
}


/* =========================
   INITIAL CALLS
========================= */
updateCartCount();
displayCart();

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  const overlay = document.getElementById("sidebarOverlay");
  if (!nav) return;

  const isOpening = !nav.classList.contains("active");

  nav.classList.toggle("active");
  if (overlay) {
    overlay.classList.toggle("active");
  }

  // Prevent background scrolling when sidebar is open (better mobile UX)
  document.body.style.overflow = isOpening ? "hidden" : "";
}

function goBack() {
  window.history.back();
}

function addToCart(name, price, image) {
  let cartData = JSON.parse(localStorage.getItem("cart")) || [];
  const existingIndex = cartData.findIndex(
    (p) => p.name === name && p.price === price
  );
  if (existingIndex > -1) {
    cartData[existingIndex].quantity =
      (cartData[existingIndex].quantity || 1) + 1;
  } else {
    cartData.push({ name, price, image, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cartData));
  cart = cartData;
  updateCartCount();
  playAddToCartSound();
  showCartAddedToast();
}

// Lightweight "added to cart" sound without popup
function playAddToCartSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880; // pleasant short beep

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    // Fail silently if audio is not supported or blocked
  }
}

// Small "Cart Added" message at bottom-right
function showCartAddedToast() {
  const id = "cart-added-toast";
  let toast = document.getElementById(id);

  if (!toast) {
    toast = document.createElement("div");
    toast.id = id;
    toast.textContent = "Cart Added";
    toast.style.position = "fixed";
    toast.style.right = "16px";
    toast.style.bottom = "16px";
    toast.style.zIndex = "2000";
    toast.style.background =
      "rgba(4, 126, 134, 0.98)";
    toast.style.color = "#fff";
    toast.style.padding = "8px 14px";
    toast.style.borderRadius = "999px";
    toast.style.fontSize = "13px";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "opacity 0.25s ease-out, transform 0.25s ease-out";
    document.body.appendChild(toast);
  }

  // Reset animation
  toast.style.display = "block";
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Hide after 1.5 seconds
  clearTimeout(showCartAddedToast._hideTimer);
  showCartAddedToast._hideTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => {
      toast.style.display = "none";
    }, 250);
  }, 1500);
}

function changeQuantity(index, delta) {
  const item = cart[index];
  if (!item) return;
  const newQty = (item.quantity || 1) + delta;
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    item.quantity = newQty;
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCart();
  updateCartCount();
}

function placeOrder() {
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  let message = "New order from Mahalakshmi Hangers:\n\n";
  let total = 0;

  cart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const lineTotal = qty * item.price;
    total += lineTotal;
    message += `${index + 1}. ${item.name} x ${qty} - ₹${lineTotal}\n`;
  });

  message += `\nTotal: ₹${total}`;

  const phone = "919884480279";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function cancelOrder() {
  window.location.href = "index.html";
}

/* =========================
   SEARCH FUNCTIONALITY
========================= */
function filterProducts() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const products = document.querySelectorAll(".product");
  const grids = document.querySelectorAll(".product-grid");

  let visibleCount = 0;

  products.forEach((product) => {
    const nameElement = product.querySelector("p, h3");
    const productName = nameElement?.textContent.toLowerCase() || "";
    const productDataName =
      product.getAttribute("data-product-name")?.toLowerCase() || "";
    const matches =
      searchTerm !== "" &&
      (productName.includes(searchTerm) || productDataName.includes(searchTerm));

    if (searchTerm === "" || matches) {
      product.style.display = "";
      if (searchTerm !== "" && matches) visibleCount += 1;
    } else {
      product.style.display = "none";
    }
  });

  const hasSearch = searchTerm !== "";

  // Apply "single result" layout when exactly one product is visible
  if (grids.length) {
    const singleMode = hasSearch && visibleCount === 1;
    grids.forEach((grid) => {
      grid.classList.toggle("search-active", hasSearch);
      grid.classList.toggle("search-single", singleMode);
    });
  }

  // Hide footer while searching so only matching products are visible
  document.querySelectorAll(".footer").forEach((footer) => {
    footer.style.display = hasSearch ? "none" : "";
  });
}
