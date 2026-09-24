(function () {
  const toast = document.getElementById("toast");
  const modal = document.getElementById("buy-modal");
  let currentProduct = null;
  let currentSize = "";

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
      ? '<img alt="' + p.name.replace(/"/g, "") + '" src="' + p.image + '">'
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
      ? '<img alt="" src="' + product.image + '">'
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
      '<button class="btn solid" ' + (out ? "disabled" : "") + ' data-add-cart="' + product.id + '">В корзину</button>' +
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
      const list = currentList();
      console.log("Current product list:", list.length, "items");
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

    console.log("Initial catalog load");
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
        ? '<img alt="" src="' + product.image + '">'
        : '<div class="product-placeholder"><span>' + product.name.charAt(0) + '</span></div>';
      
      productRoot.innerHTML =
        '<div class="product-photo">' +
        (sale.on ? '<span class="badge sale">-' + sale.pct + "%</span>" : "") +
        imageHtml +
        '</div>' +
        '<div class="product-info">' +
        '<div class="eyebrow">' + product.category + " · " + product.id + "</div>" +
        "<h1>" + product.name + "</h1>" +
        '<p class="muted">' + (product.description || "") + "</p>" +
        '<div class="meta">' + MB.priceHtml(product) +
        '<span class="qty' + (out ? " out" : "") + '">В наличии: ' + MB.totalQty(product) + " шт</span></div>" +
        '<div class="size-label">Размер</div>' +
        '<div class="size-row" id="page-sizes">' + (sizeBtns || '<span class="muted">Нет размеров</span>') + "</div>" +
        '<div class="product-actions">' +
        '<button class="btn solid" ' + (out ? "disabled" : "") + ' data-add-cart="' + product.id + '">В корзину</button>' +
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
  
  if (categoriesGrid) {
    const groups = MB.enabledGroups();
    console.log("Enabled groups:", groups);
    
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
          categoriesGrid.innerHTML = g.children.map(function (c) {
            return (
              '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(c) + '">' +
              '<div class="category-card-bg"></div>' +
              '<div class="category-card-content">' +
              '<h3>' + c + '</h3>' +
              '<p>' + g.name + '</p>' +
              '</div></a>'
            );
          }).join("");
        } else {
          // A subcategory is selected - show sibling subcategories of the same group, highlighting the active one
          if (backBtn) backBtn.style.display = "inline-block";
          let parentGroup = null;
          groups.forEach(function (x) {
            if (x.children.indexOf(q) >= 0) parentGroup = x;
          });
          if (parentGroup) {
            categoriesGrid.innerHTML = parentGroup.children.map(function (c) {
              return (
                '<a class="category-card' + (c === q ? " active" : "") + '" href="catalog.html?cat=' + encodeURIComponent(c) + '">' +
                '<div class="category-card-bg"></div>' +
                '<div class="category-card-content">' +
                '<h3>' + c + '</h3>' +
                '<p>' + parentGroup.name + '</p>' +
                '</div></a>'
              );
            }).join("");
          } else {
            categoriesGrid.innerHTML = groups.map(function (g) {
              return (
                '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(g.name) + '">' +
                '<div class="category-card-bg"></div>' +
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
        categoriesGrid.innerHTML = groups.map(function (g) {
          return (
            '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(g.name) + '">' +
            '<div class="category-card-bg"></div>' +
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
      console.log("Popular categories:", popularCategories);
      categoriesGrid.innerHTML = popularCategories.map(function (cat) {
        return (
          '<a class="category-card" href="catalog.html?cat=' + encodeURIComponent(cat.name) + '">' +
          '<div class="category-card-bg"></div>' +
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
