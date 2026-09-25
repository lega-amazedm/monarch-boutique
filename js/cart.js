(function () {
  const toast = document.getElementById("toast");
  const checkoutModal = document.getElementById("checkout-modal");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartSummaryContainer = document.getElementById("cart-summary");
  const emptyCartContainer = document.getElementById("empty-cart");
  const cartContent = document.getElementById("cart-content");

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2800);
  }

  function openCheckout() {
    if (checkoutModal) checkoutModal.classList.add("open");
  }

  function closeCheckout() {
    if (checkoutModal) checkoutModal.classList.remove("open");
  }

  function renderCart() {
    const cartItems = MB.getCartDetails();
    
    if (!cartItems.length) {
      cartContent.style.display = "none";
      emptyCartContainer.style.display = "block";
      return;
    }

    cartContent.style.display = "block";
    emptyCartContainer.style.display = "none";

    cartItemsContainer.innerHTML = cartItems.map(function (item) {
      const sale = MB.saleInfo(item.product);
      return (
        '<div class="cart-item" data-product-id="' + item.product.id + '" data-size="' + item.size + '">' +
        '<div class="cart-item-image">' +
        '<img src="' + item.product.image + '" alt="' + item.product.name + '">' +
        '</div>' +
        '<div class="cart-item-details">' +
        '<h3>' + item.product.name + '</h3>' +
        '<p class="muted">' + item.product.category + ' · Размер: ' + item.size + '</p>' +
        '<div class="cart-item-price">' + MB.priceHtml(item.product) + '</div>' +
        '</div>' +
        '<div class="cart-item-quantity">' +
        '<button class="qty-btn" data-action="decrease">−</button>' +
        '<input type="number" value="' + item.quantity + '" min="1" max="99" data-qty>' +
        '<button class="qty-btn" data-action="increase">+</button>' +
        '</div>' +
        '<div class="cart-item-total">' + MB.money(item.totalPrice) + '</div>' +
        '<button class="cart-item-remove" data-remove>×</button>' +
        '</div>'
      );
    }).join("");

    const total = MB.getCartTotal();
    cartSummaryContainer.innerHTML =
      '<div class="cart-summary-row">' +
      '<span>Товаров:</span>' +
      '<span>' + cartItems.length + '</span>' +
      '</div>' +
      '<div class="cart-summary-row total">' +
      '<span>Итого:</span>' +
      '<span>' + MB.money(total) + '</span>' +
      '</div>' +
      '<div class="cart-actions">' +
      '<button class="btn solid" id="checkout-btn">Оформить заказ</button>' +
      '<button class="btn ghost" id="share-cart-btn">Поделиться корзиной</button>' +
      '<button class="btn ghost" id="clear-cart-btn">Очистить корзину</button>' +
      '</div>';

    bindCartEvents();
  }

  function bindCartEvents() {
    // Quantity changes
    cartItemsContainer.querySelectorAll(".qty-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cartItem = this.closest(".cart-item");
        const productId = cartItem.getAttribute("data-product-id");
        const size = cartItem.getAttribute("data-size");
        const action = this.getAttribute("data-action");
        const qtyInput = cartItem.querySelector("[data-qty]");
        let currentQty = Number(qtyInput.value);

        if (action === "increase") {
          currentQty++;
        } else if (action === "decrease" && currentQty > 1) {
          currentQty--;
        }

        MB.updateCartQuantity(productId, size, currentQty);
        renderCart();
      });
    });

    cartItemsContainer.querySelectorAll("[data-qty]").forEach(function (input) {
      input.addEventListener("change", function () {
        const cartItem = this.closest(".cart-item");
        const productId = cartItem.getAttribute("data-product-id");
        const size = cartItem.getAttribute("data-size");
        let qty = Number(this.value);

        if (qty < 1) qty = 1;
        if (qty > 99) qty = 99;

        MB.updateCartQuantity(productId, size, qty);
        renderCart();
      });
    });

    // Remove items
    cartItemsContainer.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cartItem = this.closest(".cart-item");
        const productId = cartItem.getAttribute("data-product-id");
        const size = cartItem.getAttribute("data-size");

        if (confirm("Удалить товар из корзины?")) {
          MB.removeFromCart(productId, size);
          renderCart();
          showToast("Товар удален из корзины");
        }
      });
    });

    // Checkout button
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", openCheckout);
    }

    // Share cart button
    const shareBtn = document.getElementById("share-cart-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        const cartLink = MB.generateCartLink();
        if (cartLink) {
          MB.copyText(cartLink);
          showToast("Ссылка на корзину скопирована");
        } else if (cartLink === null) {
          showToast("Корзина пуста");
        } else {
          showToast("Ссылка появится, когда сайт будет открыт по адресу (не файлом с компьютера)");
        }
      });
    }

    // Clear cart button
    const clearBtn = document.getElementById("clear-cart-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (confirm("Очистить корзину?")) {
          MB.clearCart();
          renderCart();
          showToast("Корзина очищена");
        }
      });
    }
  }

  // Checkout modal events
  if (checkoutModal) {
    checkoutModal.addEventListener("click", function (e) {
      if (e.target === checkoutModal) closeCheckout();
    });

    document.querySelectorAll("[data-close-modal]").forEach(function (el) {
      el.addEventListener("click", closeCheckout);
    });

    const checkoutWa = document.getElementById("checkout-wa");
    if (checkoutWa) {
      checkoutWa.addEventListener("click", function () {
        MB.copyText(MB.cartOrderText());
        window.open(MB.cartWaLink(), "_blank");

        closeCheckout();
        showToast("Заказ отправлен в WhatsApp");
      });
    }

    const checkoutTg = document.getElementById("checkout-tg");
    if (checkoutTg) {
      checkoutTg.addEventListener("click", function () {
        const tg = MB.cartTgLink();

        MB.copyText(tg.text);
        window.open(tg.share, "_blank");

        closeCheckout();
        showToast("Текст заказа скопирован. Выберите чат @" + MB.TELEGRAM);
      });
    }
  }

  // Load cart from URL if present
  if (MB.loadCartFromUrl()) {
    showToast("Корзина загружена из ссылки");
  }

  // Initial render
  renderCart();

  // Burger menu
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      drawer.classList.toggle("open");
      burger.classList.toggle("open");
    });
  }

  // Secret dot for admin
  const secret = document.getElementById("secret-dot");
  if (secret) {
    let clicks = 0;
    secret.addEventListener("click", function () {
      clicks += 1;
      if (clicks >= 5) location.href = "vault.html";
    });
  }

  // Scroll reveal for sections
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".section").forEach(function (section) {
      observer.observe(section);
    });
  } else {
    document.querySelectorAll(".section").forEach(function (section) {
      section.classList.add("visible");
    });
  }
})();