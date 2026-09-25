(function () {
  const toast = document.getElementById("toast");
  const modal = document.getElementById("buy-modal");
  let currentProduct = null;
  let currentSize = "";

  // Иконки категорий — используются вместо пустого фона на карточках категорий
  const CAT_ICON_PATHS = {
    hanger: '<circle cx="12" cy="4.4" r="1.4"/><path d="M12 5.8v1"/><path d="M12 6.8 3 12.6h18Z"/><path d="M3 15.4h18"/>',
    shirt: '<path d="M9 3.5 5 7l2 2.5 2-1.2V20h6V8.3l2 1.2L19 7l-4-3.5c-.6 1-1.7 1.6-3 1.6S9.6 4.5 9 3.5Z"/>',
    jacket: '<path d="M8 3.5 4 7l2 2.5 2-1.3V20h3V9h2v11h3V8.2l2 1.3L19 7l-4-3.5-3 2-3-2Z"/><path d="M12 9v11"/>',
    pants: '<path d="M6 3h12l.8 5-2 13h-3l-.8-9-.8 9H9L7 8Z"/>',
    shoe: '<path d="M3 17c0-2 1.5-3 3-3.5l6-2c1-1.5 2.5-2.5 4-2.5l3 .5v4l3 1v3.5c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1Z"/>',
    cap: '<path d="M4 13c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M4 13h16v1c0 .8-.7 1.5-1.5 1.5h-13C4.7 14.5 4 13.8 4 13Z"/><path d="M9 5.3c1-.5 2-.8 3-.8"/>'
  };

  const CAT_ICON_MAP = {
    "Одежда": "hanger",
    "Обувь": "shoe",
    "Головные уборы": "cap",
    "Джинсы": "pants",
    "Карго-брюки": "pants",
    "Шорты": "pants",
    "Худи": "shirt",
    "Свитшоты": "shirt",
    "Кофты": "shirt",
    "Свитеры": "shirt",
    "Кардиганы": "shirt",
    "Футболки": "shirt",
    "Поло": "shirt",
    "Лонгсливы": "shirt",
    "Рубашки": "shirt",
    "Спортивки": "pants",
    "Куртки": "jacket",
    "Ветровки": "jacket",
    "Бомберы": "jacket",
    "Жилетки": "jacket",
    "Пальто": "jacket",
    "Кроссовки": "shoe",
    "Ботинки": "shoe",
    "Лоферы": "shoe",
    "Шапки": "cap",
    "Кепки": "cap"
  };

  // Builds a "framed" image: the photo is shown in full (never cropped),
  // and any empty space around it is filled with a soft blurred copy of
  // the same photo instead of ugly bare margins.
  function frameImg(url, alt) {
    const safeUrl = String(url).replace(/'/g, "%27").replace(/"/g, "&quot;");
    const safeAlt = String(alt || "").replace(/"/g, "");
    return (
      '<div class="media-frame">' +
      '<div class="media-blur" style="background-image:url(\'' + safeUrl + '\')"></div>' +
      '<img class="media-fg" src="' + url + '" alt="' + safeAlt + '">' +
      "</div>"
    );
  }

  function categoryIcon(name) {
    const key = CAT_ICON_MAP[name] || "hanger";
    const inner = CAT_ICON_PATHS[key] || CAT_ICON_PATHS.hanger;
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + "</svg>";
  }

  // Category card media: uses the photo set in the admin panel if there is
  // one, otherwise falls back to the default line icon.
  function categoryMediaHtml(name) {
    const img = MB.getCategoryImage ? MB.getCategoryImage(name) : "";
    if (img && img.trim() !== "") {
      return '<div class="category-card-bg has-image">' + frameImg(img, name) + '</div>';
    }
    return '<div class="category-card-bg">' + categoryIcon(name) + '</div>';
  }

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2800);
  }

  function closeModal() {
    if (modal) modal.classList.remove("open");
    const imageModal = document.getElementById("image-modal");
    if (imageModal) imageModal.classList.remove("open");
    currentProduct = null;
    currentSize = "";
  }

  function inStockSizes(product) {
    return MB.parseSizes(product.sizes, product.qty).filter(function (s) { return Number(s.qty) > 0; });
  }

  function renderSizes(product, preset) {
    const row = document.getElementById("buy-sizes");
    if (!row) return;
    const sizes = inStockSizes(product);
    currentSize = preset && sizes.some(function (s) { return s.name === preset; }) ? preset : "";
    row.innerHTML = sizes
      .map(function (s) {
        return '<button type="button" class="size-chip' + (s.name === currentSize ? " active" : "") + '" data-size="' + s.name + '">' + s.name + "</button>";
      })
      .join("") || '<span class="muted">Нет доступных размеров</span>';
  }

  function openBuy(id, presetSize) {
    const product = MB.getProduct(id);
    if (!product || MB.isDisabled(product.category)) return;
    if (MB.totalQty(product) <= 0) {
      showToast("Товара нет в наличии");
      return;
    }
    currentProduct = product;
    const sale = MB.saleInfo(product);
    document.getElementById("buy-title").textContent = product.name;
    document.getElementById("buy-meta").innerHTML = MB.priceHtml(product) + " · " + MB.totalQty(product) + " шт";
    renderSizes(product, presetSize);
    modal.classList.add("open");
  }



  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
      const sizeBtn = e.target.closest("[data-size]");
      if (sizeBtn) {
        currentSize = sizeBtn.getAttribute("data-size");
        modal.querySelectorAll(".size-chip").forEach(function (x) {
          x.classList.toggle("active", x === sizeBtn);
        });
      }
    });
  }

  const imageModal = document.getElementById("image-modal");
  if (imageModal) {
    imageModal.addEventListener("click", function (e) {
      if (e.target === imageModal || e.target.classList.contains("close-image")) {
        imageModal.classList.remove("open");
      }
    });
  }

  const quickViewModal = document.getElementById("quick-view-modal");
  if (quickViewModal) {
    quickViewModal.addEventListener("click", function (e) {
      if (e.target === quickViewModal || e.target.classList.contains("close-quick-view")) {
        quickViewModal.classList.remove("open");
      }
    });
  }



  const addToCartBtn = document.getElementById("add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function () {
      if (!currentProduct || !currentSize) {
        showToast("Сначала выберите размер");
        return;
      }
      MB.addToCart(currentProduct.id, currentSize, 1);
      updateCartCount();
      closeModal();
      showToast("Товар добавлен в корзину");
    });
  }

  function cardHtml(p) {
    const out = MB.totalQty(p) <= 0;
    const sale = MB.saleInfo(p);
    const sizes = inStockSizes(p)
      .slice(0, 6)
      .map(function (s) { return '<span class="mini-size">' + s.name + "</span>"; })
      .join("");
    const hasImage = p.image && p.image.trim() !== "";
    const imageHtml = hasImage 
      ? frameImg(p.image, p.name)
      : '<div class="card-placeholder"><span>' + p.name.charAt(0) + '</span></div>';
    
    return (
      '<article class="card">' +
      '<a class="card-media" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      (out ? '<span class="badge">Нет в наличии</span>' : '<span class="badge">' + p.category + "</span>") +
      (sale.on && !out ? '<span class="badge sale">-' + sale.pct + "%</span>" : "") +
      imageHtml +
      "</a>" +
      '<div class="card-body">' +
      "<h3>" + p.name + "</h3>" +
      '<div class="mini-sizes">' + sizes + "</div>" +
      '<div class="meta">' + MB.priceHtml(p) +
      '<span class="qty' + (out ? " out" : "") + '">' + (out ? "0 шт" : MB.totalQty(p) + " шт") + "</span></div>" +
      '<div class="card-actions">' +
      '<button class="btn wide" ' + (out ? "disabled" : "") + ' data-add-cart="' + p.id + '">' +
      (out ? "Нет в наличии" : "В корзину") +
      "</button>" +
      '<button class="btn ghost quick-view-btn" data-quick-view="' + p.id + '" title="Быстрый просмотр">👁</button>' +
      "</div></div></article>"
    );
  }

  function bindBuy(root) {
    (root || document).querySelectorAll("[data-add-cart]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const productId = btn.getAttribute("data-add-cart");
        openAddToCart(productId);
      });
    });

    // Quick view functionality
    (root || document).querySelectorAll("[data-quick-view]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const productId = btn.getAttribute("data-quick-view");
        openQuickView(productId);
      });
    });
  }

  function openAddToCart(productId) {
    const product = MB.getProduct(productId);
    if (!product || MB.isDisabled(product.category)) return;
    if (MB.totalQty(product) <= 0) {
      showToast("Товара нет в наличии");
      return;
    }

    const sizes = inStockSizes(product);
    if (!sizes.length) {
      showToast("Нет доступных размеров");
      return;
    }

    // If only one size available, add directly
    if (sizes.length === 1) {
      MB.addToCart(productId, sizes[0].name, 1);
      updateCartCount();
      showToast("Товар добавлен в корзину");
      return;
    }

    // Otherwise show size selection modal
    currentProduct = product;
    const sale = MB.saleInfo(product);
    document.getElementById("buy-title").textContent = product.name;
    document.getElementById("buy-meta").innerHTML = MB.priceHtml(product) + " · " + MB.totalQty(product) + " шт";
    renderSizes(product);
    modal.classList.add("open");
  }

  function updateCartCount() {
    const cart = MB.loadCart();
    const count = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.classList.toggle("hidden", count === 0);
    }
  }

  function openQuickView(productId) {
    const product = MB.getProduct(productId);
    if (!product || MB.isDisabled(product.category)) return;

    const quickViewModal = document.getElementById("quick-view-modal");
    const quickViewContent = document.getElementById("quick-view-content");
    
    if (!quickViewModal || !quickViewContent) return;

    const out = MB.totalQty(product) <= 0;
    const sale = MB.saleInfo(product);
    const sizeBtns = inStockSizes(product)
      .map(function (s) {
        return '<button type="button" class="size-chip" data-pick-size="' + s.name + '">' + s.name + "</button>";
      })
      .join("");

    const hasImage = product.image && product.image.trim() !== "";
    const imageHtml = hasImage 
      ? frameImg(product.image, product.name)
      : '<div class="product-placeholder"><span>' + product.name.charAt(0) + '</span></div>';

    quickViewContent.innerHTML =
      '<div class="quick-view-image">' +
      (sale.on ? '<span class="badge sale">-' + sale.pct + "%</span>" : "") +
      imageHtml +
      '</div>' +
      '<div class="quick-view-details">' +
      '<div class="eyebrow">' + product.category + " · " + product.id + "</div>" +
      "<h2>" + product.name + "</h2>" +
      '<p class="muted">' + (product.description || "") + "</p>" +
      '<div class="meta">' + MB.priceHtml(product) +
      '<span class="qty' + (out ? " out" : "") + '">В наличии: ' + MB.totalQty(product) + " шт</span></div>" +
      '<div class="size-label">Размер</div>' +
      '<div class="size-row">' + (sizeBtns || '<span class="muted">Нет размеров</span>') + "</div>" +
      '<div class="modal-actions">' +
      '<button class="btn solid btn-cta" ' + (out ? "disabled" : "") + ' data-add-cart="' + product.id + '"><span>' + (out ? "Нет в наличии" : "В корзину") + '</span><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
      '<a class="btn ghost" href="product.html?id=' + encodeURIComponent(product.id) + '">Подробнее</a>' +
      "</div></div>";

    quickViewModal.classList.add("open");

    // Handle size selection in quick view
    let quickViewSize = "";
    quickViewContent.addEventListener("click", function (e) {
      const pick = e.target.closest("[data-pick-size]");
      if (!pick) return;
      quickViewSize = pick.getAttribute("data-pick-size");
      quickViewContent.querySelectorAll("[data-pick-size]").forEach(function (x) {
        x.classList.toggle("active", x === pick);
      });
      const buy = quickViewContent.querySelector("[data-buy]");
      if (buy) buy.setAttribute("data-size", quickViewSize);
    });

    bindBuy(quickViewContent);
  }

  function matchFilter(p, group, leaf, search) {
    if (leaf) return p.category === leaf;
    if (group) return MB.groupOf(p.category) === group;
    if (search) {
      const query = search.toLowerCase();
      return p.name.toLowerCase().indexOf(query) >= 0 ||
             p.category.toLowerCase().indexOf(query) >= 0 ||
             (p.description && p.description.toLowerCase().indexOf(query) >= 0);
    }
    return true;
  }

  const catalog = document.getElementById("catalog-grid");
  if (catalog) {
    const featured = catalog.getAttribute("data-limit");
    const groups = MB.enabledGroups();
    let activeGroup = "";
    let activeLeaf = "";
    let searchQuery = "";
    let sortBy = "default";
    const params = new URLSearchParams(location.search);
    const q = params.get("cat") || "";
    if (q) {
      const g = groups.find(function (x) { return x.name === q; });
      if (g) activeGroup = g.name;
      else {
        groups.forEach(function (x) {
          if (x.children.indexOf(q) >= 0) {
            activeGroup = x.name;
            activeLeaf = q;
          }
        });
      }
    }

    function sortProducts(list) {
      const sorted = list.slice();
      switch (sortBy) {
        case "price-asc":
          sorted.sort(function (a, b) { return Number(a.price) - Number(b.price); });
          break;
        case "price-desc":
          sorted.sort(function (a, b) { return Number(b.price) - Number(a.price); });
          break;
        case "name":
          sorted.sort(function (a, b) { return a.name.localeCompare(b.name); });
          break;
        case "sale":
          sorted.sort(function (a, b) {
            const saleA = MB.saleInfo(a).on ? 1 : 0;
            const saleB = MB.saleInfo(b).on ? 1 : 0;
            if (saleA !== saleB) return saleB - saleA;
            return MB.saleInfo(b).pct - MB.saleInfo(a).pct;
          });
          break;
        default:
          break;
      }
      return sorted;
    }

    function currentList() {
      const all = MB.visibleProducts();
      const filtered = all.filter(function (p) { return matchFilter(p, activeGroup, activeLeaf, searchQuery); });
      const sorted = sortProducts(filtered);
      return featured ? sorted.slice(0, Number(featured)) : sorted;
    }

    function paintGrid() {
      // On the catalog picker screens (no subcategory chosen yet, and no
      // search running) we only want the category cards — not a product
      // grid underneath them. Only render products once the user has
      // drilled down into an actual subcategory (or is searching).
      if (!featured && !activeLeaf && !searchQuery) {
        catalog.innerHTML = "";
        return;
      }
      const list = currentList();
      catalog.innerHTML = list.map(cardHtml).join("") || '<div class="empty">По вашему запросу ничего не найдено</div>';
      bindBuy(catalog);
    }

    // Search functionality
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        searchQuery = this.value.trim();
        paintGrid();
      });
      
      searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          searchQuery = this.value.trim();
          paintGrid();
        }
      });
    }
    
    if (searchBtn) {
      searchBtn.addEventListener("click", function () {
        if (searchInput) {
          searchQuery = searchInput.value.trim();
          paintGrid();
        }
      });
    }

    // Sort functionality
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        sortBy = this.value;
        paintGrid();
      });
    }

    paintGrid();
  }



  const productRoot = document.getElementById("product-page");
  if (productRoot) {
    const id = new URLSearchParams(location.search).get("id");
    const product = MB.getProduct(id);
    if (!product || MB.isDisabled(product.category)) {
      productRoot.innerHTML = '<div class="empty">Товар не найден. <a href="catalog.html">В каталог</a></div>';
    } else {
      const out = MB.totalQty(product) <= 0;
      const sale = MB.saleInfo(product);
      const sizeBtns = inStockSizes(product)
        .map(function (s) {
          return '<button type="button" class="size-chip" data-pick-size="' + s.name + '">' + s.name + "</button>";
        })
        .join("");
      const hasImage = product.image && product.image.trim() !== "";
      const imageHtml = hasImage 
        ? frameImg(product.image, product.name)
        : '<div class="product-placeholder"><span>' + product.name.charAt(0) + '</span></div>';
      
      productRoot.innerHTML =
        '<div class="product-photo">' +
        (sale.on ? '<span class="badge sale">-' + sale.pct + "%</span>" : "") +
        imageHtml +
        '</div>' +
        '<div class="product-info">' +
        '<p class="product-tagline">' + MB.SHOP + '</p>' +
        '<div class="eyebrow">' + product.category + " · " + product.id + "</div>" +
        "<h1>" + product.name + "</h1>" +
        '<p class="muted">' + (product.description || "Стиль · Комфорт · Качество") + "</p>" +
        '<div class="product-features">' +
        '<div class="feature-mini"><svg viewBox="0 0 24 24"><path d="M12 3l2.2 4.6L19 8.2l-3.5 3.3.9 5.2L12 14.8 7.6 16.7l.9-5.2L5 8.2l4.8-.6L12 3z"/></svg><span>Premium<br>качество</span></div>' +
        '<div class="feature-mini"><svg viewBox="0 0 24 24"><path d="M6 3c0 3 3 3 3 6s-3 3-3 6 3 3 3 6"/><path d="M12 3c0 3 3 3 3 6s-3 3-3 6 3 3 3 6"/><path d="M18 3c0 3 3 3 3 6s-3 3-3 6 3 3 3 6"/></svg><span>Приятная<br>ткань</span></div>' +
        '<div class="feature-mini"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Стильный<br>дизайн</span></div>' +
        "</div>" +
        '<div class="meta">' + MB.priceHtml(product) +
        '<span class="qty' + (out ? " out" : "") + '">В наличии: ' + MB.totalQty(product) + " шт</span></div>" +
        '<div class="size-label">Размер</div>' +
        '<div class="size-row" id="page-sizes">' + (sizeBtns || '<span class="muted">Нет размеров</span>') + "</div>" +
        '<div class="product-actions">' +
        '<button class="btn solid btn-cta" ' + (out ? "disabled" : "") + ' data-add-cart="' + product.id + '"><span>' + (out ? "Нет в наличии" : "Добавить в корзину") + '</span><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
        '<a class="btn ghost" href="catalog.html?cat=' + encodeURIComponent(product.category) + '">В каталог</a>' +
        "</div></div>";
      let pageSize = "";
      productRoot.addEventListener("click", function (e) {
        const pick = e.target.closest("[data-pick-size]");
        if (!pick) return;
        pageSize = pick.getAttribute("data-pick-size");
        productRoot.querySelectorAll("[data-pick-size]").forEach(function (x) {
          x.classList.toggle("active", x === pick);
        });
        const buy = productRoot.querySelector("[data-buy]");
        if (buy) buy.setAttribute("data-size", pageSize);
      });
      bindBuy(productRoot);

      // Image zoom functionality
      const productPhoto = productRoot.querySelector(".product-photo");
      const imageModal = document.getElementById("image-modal");
      const modalImage = document.getElementById("modal-image");
      
      if (productPhoto && imageModal && modalImage) {
        productPhoto.style.cursor = "zoom-in";
        productPhoto.addEventListener("click", function () {
          modalImage.src = product.image;
          imageModal.classList.add("open");
        });
      }

      // Related products
      const relatedGrid = document.getElementById("related-grid");
      if (relatedGrid) {
        const allProducts = MB.visibleProducts();
        const group = MB.groupOf(product.category);
        const related = allProducts
          .filter(function (p) {
            return p.id !== product.id && (p.category === product.category || MB.groupOf(p.category) === group);
          })
          .slice(0, 4);
        
        relatedGrid.innerHTML = related.map(cardHtml).join("") || '<div class="empty">Похожих товаров пока нет</div>';
        bindBuy(relatedGrid);
      }
    }
  }

  const settings = MB.loadSettings();
  document.querySelectorAll("[data-phone]").forEach(function (el) {
    el.textContent = MB.PHONE_NICE;
    if (el.tagName === "A") el.href = "tel:+" + MB.PHONE_INTL;
  });
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.href = "https://wa.me/" + MB.PHONE_INTL;
  });
  document.querySelectorAll("[data-tg]").forEach(function (el) {
    el.href = "https://t.me/" + MB.TELEGRAM;
    if (el.hasAttribute("data-show-user")) el.textContent = "@" + MB.TELEGRAM;
  });
  document.querySelectorAll("[data-channel]").forEach(function (el) {
    el.href = "https://t.me/" + MB.TELEGRAM_CHANNEL;
  });
  document.querySelectorAll("[data-delivery]").forEach(function (el) {
    el.textContent = settings.delivery || "Доставка по всей России. По Дербенту — бесплатно.";
  });
  document.querySelectorAll("[data-address]").forEach(function (el) {
    el.textContent = settings.address;
  });
  document.querySelectorAll("[data-address-title]").forEach(function (el) {
    el.textContent = settings.addressTitle;
  });
  document.querySelectorAll("[data-hours]").forEach(function (el) {
    el.textContent = settings.hours;
  });
  document.querySelectorAll("[data-city]").forEach(function (el) {
    el.textContent = settings.city;
  });

  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      drawer.classList.toggle("open");
      burger.classList.toggle("open");
    });
  }

  const secret = document.getElementById("secret-dot");
  if (secret) {
    let clicks = 0;
    secret.addEventListener("click", function () {
      clicks += 1;
      if (clicks >= 5) location.href = "vault.html";
    });
  }

  // Initialize cart count on page load
  updateCartCount();

  // Timer countdown
  function startTimer() {
    const totalSeconds = 2 * 24 * 60 * 60 + 18 * 60 * 60 + 45 * 60 + 30; // 2 days, 18 hours, 45 minutes, 30 seconds
    
    function updateTimer() {
      const daysEl = document.getElementById("days");
      const hoursEl = document.getElementById("hours");
      const minutesEl = document.getElementById("minutes");
      const secondsEl = document.getElementById("seconds");
      
      if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
      
      let remaining = totalSeconds;
      
      const days = Math.floor(remaining / (24 * 60 * 60));
      remaining %= 24 * 60 * 60;
      
      const hours = Math.floor(remaining / (60 * 60));
      remaining %= 60 * 60;
      
      const minutes = Math.floor(remaining / 60);
      remaining %= 60;
      
      const seconds = remaining;
      
      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // Start timer if elements exist
  if (document.getElementById("days")) {
    startTimer();
  }

  // Categories grid on main page and catalog
  const categoriesGrid = document.getElementById("categories-grid");
  const backBtn = document.getElementById("back-to-cats");
  const catalogSubtitle = document.querySelector(".section-subtitle");

  if (categoriesGrid) {
    const groups = MB.enabledGroups();

    // Check if this is catalog page by checking URL
    const isCatalogPage = location.pathname.includes('catalog.html');
    const params = new URLSearchParams(location.search);
    const q = params.get("cat") || "";

    if (isCatalogPage) {
      if (q) {
        // A specific category or group is selected
        const g = groups.find(function (x) { return x.name === q; });
        if (g) {
          // A main group is selected - show its children as cards
          if (backBtn) backBtn.style.display = "inline-block";
          categoriesGrid.classList.remove("hidden");
          if (catalogSubtitle) catalogSubtitle.textContent = g.name + " — выберите категорию";
          categoriesGrid.innerHTML = g.children.map(function (c) {
            return (
              '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(c) + '">' +
              categoryMediaHtml(c) +
              '<div class="category-card-content">' +
              '<h3>' + c + '</h3>' +
              '<p>' + g.name + '</p>' +
              '</div></a>'
            );
          }).join("");
        } else {
          // A subcategory (leaf) is selected - the picker is no longer needed, show products instead
          let parentGroup = null;
          groups.forEach(function (x) {
            if (x.children.indexOf(q) >= 0) parentGroup = x;
          });
          if (parentGroup) {
            if (backBtn) backBtn.style.display = "inline-block";
            categoriesGrid.classList.add("hidden");
            categoriesGrid.innerHTML = "";
            if (catalogSubtitle) catalogSubtitle.textContent = parentGroup.name + " · " + q;
          } else {
            // Invalid category in URL - fall back to top-level groups
            if (backBtn) backBtn.style.display = "none";
            categoriesGrid.classList.remove("hidden");
            if (catalogSubtitle) catalogSubtitle.textContent = "Выберите категорию";
            categoriesGrid.innerHTML = groups.map(function (g) {
              return (
                '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(g.name) + '">' +
                categoryMediaHtml(g.name) +
                '<div class="category-card-content">' +
                '<h3>' + g.name + '</h3>' +
                '<p>' + g.children.length + ' категорий</p>' +
                '</div></a>'
              );
            }).join("");
          }
        }
      } else {
        // No category selected - show main groups
        if (backBtn) backBtn.style.display = "none";
        categoriesGrid.classList.remove("hidden");
        if (catalogSubtitle) catalogSubtitle.textContent = "Выберите категорию";
        categoriesGrid.innerHTML = groups.map(function (g) {
          return (
            '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(g.name) + '">' +
            categoryMediaHtml(g.name) +
            '<div class="category-card-content">' +
            '<h3>' + g.name + '</h3>' +
            '<p>' + g.children.length + ' категорий</p>' +
            '</div></a>'
          );
        }).join("");
      }
    } else {
      // On main page, show popular subcategories
      if (backBtn) backBtn.style.display = "none";
      const allCategories = [];
      groups.forEach(function (g) {
        g.children.forEach(function (c) {
          allCategories.push({ name: c, group: g.name });
        });
      });

      const popularCategories = allCategories.slice(0, 6);
      categoriesGrid.innerHTML = popularCategories.map(function (cat) {
        return (
          '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(cat.name) + '">' +
          categoryMediaHtml(cat.name) +
          '<div class="category-card-content">' +
          '<h3>' + cat.name + '</h3>' +
          '<p>' + cat.group + '</p>' +
          '</div></a>'
        );
      }).join("");
    }
  }
  
  // Back button functionality
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      const groups = MB.enabledGroups();
      const params = new URLSearchParams(location.search);
      const q = params.get("cat") || "";
      const isGroup = groups.some(function (x) { return x.name === q; });
      if (q && !isGroup) {
        let parentGroup = null;
        groups.forEach(function (x) {
          if (x.children.indexOf(q) >= 0) parentGroup = x;
        });
        window.location.href = parentGroup ? "catalog.html?cat=" + encodeURIComponent(parentGroup.name) : "catalog.html";
      } else {
        window.location.href = "catalog.html";
      }
    });
  }

  // Sale grid on main page
  const saleGrid = document.getElementById("sale-grid");
  if (saleGrid) {
    const allProducts = MB.visibleProducts();
    const saleProducts = allProducts.filter(function (p) {
      return MB.saleInfo(p).on;
    }).slice(0, 3);
    
    saleGrid.innerHTML = saleProducts.map(cardHtml).join("") || '<div class="empty">Акционные товары скоро появятся</div>';
    bindBuy(saleGrid);
  }

  // Contact form functionality
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const name = formData.get("name");
      const contact = formData.get("contact");
      const message = formData.get("message");
      
      const text = [
        "Новое сообщение с сайта MONARCH BOUTIQUE",
        "",
        "Имя: " + name,
        "Контакт: " + contact,
        "Сообщение: " + message,
        "",
        "Отправлено с страницы контактов"
      ].join("\n");
      
      // Send to WhatsApp
      const waLink = "https://api.whatsapp.com/send?phone=" + MB.PHONE_INTL + "&text=" + encodeURIComponent(text);
      window.open(waLink, "_blank");
      
      showToast("Сообщение отправлено в WhatsApp");
      contactForm.reset();
    });
  }

  // Scroll animations
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".section").forEach(function (section) {
      observer.observe(section);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll(".section").forEach(function (section) {
      section.classList.add("visible");
    });
  }
})();
