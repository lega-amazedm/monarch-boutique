(function () {
  const PRODUCTS_KEY = "mb_products_v4";
  const SETTINGS_KEY = "mb_settings_v5";
  const AUTH_KEY = "mb_admin_ok";
  const CART_KEY = "mb_cart_v1";
  const CATEGORY_IMAGES_KEY = "mb_category_images_v1";

  const PHONE = "89887736246";
  const PHONE_INTL = "79887736246";
  const PHONE_NICE = "+7 (988) 773-62-46";
  const TELEGRAM = "sa1dik077";
  const TELEGRAM_CHANNEL = "MONARCH_DERBENT";
  const SHOP = "MONARCH BOUTIQUE";

  const GROUPS = [
    {
      name: "Одежда",
      children: [
        "Джинсы", "Спортивки", "Футболки", "Худи", "Кофты", "Свитшоты",
        "Лонгсливы", "Поло", "Рубашки", "Свитеры", "Кардиганы", "Шорты",
        "Карго-брюки", "Куртки", "Ветровки", "Бомберы", "Жилетки", "Пальто"
      ]
    },
    { name: "Обувь", children: ["Кроссовки", "Ботинки", "Лоферы"] },
    { name: "Головные уборы", children: ["Шапки", "Кепки"] }
  ];

  const CLOTHES = ["S", "M", "L", "XL", "XXL"];
  const SHOES = ["40", "41", "42", "43", "44", "45"];
  const HATS = ["56", "57", "58", "59"];

  const defaultSettings = {
    addressTitle: "Самовывоз и доставка",
    address: "ул. Эмиргамзаева, 44",
    hours: "Ежедневно 11:00–21:00",
    city: "Дербент",
    delivery: "Доставка по всей России. По Дербенту — бесплатно.",
    disabledCategories: []
  };

  function sz(list, qty) {
    return list.map(function (name) { return { name: name, qty: qty }; });
  }

  const defaultProducts = [];

  function money(n) {
    return new Intl.NumberFormat("ru-RU").format(Number(n) || 0) + " ₽";
  }

  function saleInfo(p) {
    const price = Number(p && p.price) || 0;
    const oldPrice = Number(p && p.oldPrice) || 0;
    const on = !!(p && p.saleOn) && oldPrice > price && price > 0;
    const pct = on ? Math.max(1, Math.round((1 - price / oldPrice) * 100)) : 0;
    return { on: on, price: price, oldPrice: oldPrice, pct: pct };
  }

  function priceHtml(p) {
    const s = saleInfo(p);
    if (!s.on) return '<span class="price">' + money(s.price) + "</span>";
    return (
      '<span class="price-box">' +
      '<span class="price-old">' + money(s.oldPrice) + "</span>" +
      '<span class="price sale">' + money(s.price) + "</span>" +
      '<span class="sale-pct">-' + s.pct + "%</span>" +
      "</span>"
    );
  }

  function leaves() {
    const list = [];
    GROUPS.forEach(function (g) { g.children.forEach(function (c) { list.push(c); }); });
    return list;
  }

  function groupOf(cat) {
    const g = GROUPS.find(function (x) { return x.name === cat || x.children.indexOf(cat) >= 0; });
    return g ? g.name : "";
  }

  function sizePreset(cat) {
    const g = groupOf(cat);
    if (g === "Обувь") return SHOES.slice();
    if (g === "Головные уборы") return HATS.slice();
    return CLOTHES.slice();
  }

  function parseSizes(value, fallbackQty) {
    const qty = Number(fallbackQty);
    const useQty = isNaN(qty) ? 1 : qty;
    if (Array.isArray(value) && value.length) {
      if (typeof value[0] === "object") {
        return value.map(function (s) {
          return { name: String(s.name || s.size || "").trim(), qty: Number(s.qty) || 0 };
        }).filter(function (s) { return s.name; });
      }
      return value.map(function (s) {
        return { name: String(s).trim(), qty: useQty };
      }).filter(function (s) { return s.name; });
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(/[,;/]+/).map(function (s) {
        return { name: s.trim(), qty: useQty };
      }).filter(function (s) { return s.name; });
    }
    return [];
  }

  function totalQty(product) {
    const sizes = parseSizes(product && product.sizes, product && product.qty);
    if (!sizes.length) return Number(product && product.qty) || 0;
    return sizes.reduce(function (sum, s) { return sum + (Number(s.qty) || 0); }, 0);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const data = raw ? Object.assign({}, defaultSettings, JSON.parse(raw)) : Object.assign({}, defaultSettings);
      if (!Array.isArray(data.disabledCategories)) data.disabledCategories = [];
      if (!data.delivery) data.delivery = defaultSettings.delivery;
      return data;
    } catch (e) {
      return Object.assign({}, defaultSettings);
    }
  }

  function saveSettings(data) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  }

  function isDisabled(name) {
    const off = loadSettings().disabledCategories || [];
    if (off.indexOf(name) >= 0) return true;
    const parent = groupOf(name);
    return parent && parent !== name && off.indexOf(parent) >= 0;
  }

  function enabledGroups() {
    return GROUPS.filter(function (g) { return !isDisabled(g.name); }).map(function (g) {
      return { name: g.name, children: g.children.filter(function (c) { return !isDisabled(c); }) };
    }).filter(function (g) { return g.children.length; });
  }

  // Category images (photos shown on category cards instead of the default icon)
  function loadCategoryImages() {
    try {
      const raw = localStorage.getItem(CATEGORY_IMAGES_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function saveCategoryImages(map) {
    localStorage.setItem(CATEGORY_IMAGES_KEY, JSON.stringify(map || {}));
  }

  function getCategoryImage(name) {
    const map = loadCategoryImages();
    return (map && map[name]) ? map[name] : "";
  }

  function setCategoryImage(name, url) {
    const map = loadCategoryImages();
    map[name] = url;
    saveCategoryImages(map);
    return map;
  }

  function removeCategoryImage(name) {
    const map = loadCategoryImages();
    delete map[name];
    saveCategoryImages(map);
    return map;
  }

  function loadProducts() {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
      return defaultProducts.slice();
    } catch (e) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));
      return defaultProducts.slice();
    }
  }

  function saveProducts(list) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
  }

  function visibleProducts() {
    const allowed = leaves();
    return loadProducts().filter(function (p) {
      return allowed.indexOf(p.category) >= 0 && !isDisabled(p.category);
    });
  }

  function getProduct(id) {
    return loadProducts().find(function (p) { return p.id === id; }) || null;
  }

  // A real, clickable link only exists once the site is served over
  // http(s) — from the shop's own domain, or from the local server that
  // start.bat launches (http://localhost:8080). Opening index.html by
  // double-clicking it runs the page as file:///C:/..., and a link built
  // from that address is useless to a customer (it only exists on this
  // computer), so we simply don't build one in that case.
  function siteBaseUrl() {
    const origin = location.origin;
    if (origin && /^https?:\/\//i.test(origin)) {
      return origin + location.pathname.replace(/[^/]*$/, "");
    }
    return "";
  }

  function productUrl(id) {
    const base = siteBaseUrl();
    if (!base) return "";
    return base + "product.html?id=" + encodeURIComponent(id);
  }

  function orderText(product, size) {
    const s = loadSettings();
    const sale = saleInfo(product);
    const priceLine = sale.on
      ? "Цена: " + money(sale.price) + " (было " + money(sale.oldPrice) + ", скидка -" + sale.pct + "%)"
      : "Цена: " + money(sale.price);
    const url = productUrl(product.id);
    const lines = [
      "Здравствуйте! Хочу оформить заказ в " + SHOP + ".",
      "",
      "Товар: " + product.name,
      "Категория: " + product.category,
      "Размер: " + (size || "не выбран"),
      priceLine,
      "Артикул: " + product.id,
      "Количество: 1"
    ];
    if (url) {
      lines.push("", "Ссылка на товар:", url);
    }
    lines.push(
      "",
      "Доставка: " + (s.delivery || "по всей России, по Дербенту бесплатно"),
      "Самовывоз: " + s.city + ", " + s.address
    );
    return lines.join("\n");
  }

  function waLink(product, size) {
    return "https://api.whatsapp.com/send?phone=" + PHONE_INTL + "&text=" + encodeURIComponent(orderText(product, size));
  }

  function tgLink(product, size) {
    const text = orderText(product, size);
    const link = productUrl(product.id);
    return {
      chat: "https://t.me/" + TELEGRAM,
      share: link
        ? "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(text)
        : "https://t.me/" + TELEGRAM,
      text: text,
      link: link
    };
  }

  // Cart functions
  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function sanitizeCart(cart) {
    const products = loadProducts();
    const valid = {};
    products.forEach(function (p) { valid[p.id] = true; });
    const clean = [];
    (cart || []).forEach(function (item) {
      if (!item || !item.productId || !valid[item.productId]) return;
      const qty = Math.min(99, Math.max(0, Number(item.quantity) || 0));
      if (qty <= 0) return;
      const size = String(item.size || "").trim();
      if (!size) return;
      const existing = clean.find(function (x) {
        return x.productId === item.productId && x.size === size;
      });
      if (existing) existing.quantity = Math.min(99, existing.quantity + qty);
      else clean.push({ productId: item.productId, size: size, quantity: qty });
    });
    return clean;
  }

  function loadCart() {
    const raw = readCart();
    const clean = sanitizeCart(raw);
    if (JSON.stringify(raw) !== JSON.stringify(clean)) {
      localStorage.setItem(CART_KEY, JSON.stringify(clean));
    }
    return clean;
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(sanitizeCart(cart)));
    paintCartBadges();
  }

  function getCartCount() {
    return getCartDetails().reduce(function (sum, item) {
      return sum + (Number(item.quantity) || 0);
    }, 0);
  }

  function paintCartBadges() {
    const count = getCartCount();
    const label = count > 99 ? "99+" : String(count);
    document.querySelectorAll("#cart-count, [data-cart-count]").forEach(function (el) {
      el.textContent = label;
      el.classList.toggle("hidden", count === 0);
    });
  }

  function addToCart(productId, size, quantity) {
    const cart = loadCart();
    const existingItem = cart.find(function (item) {
      return item.productId === productId && item.size === size;
    });

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.push({
        productId: productId,
        size: size,
        quantity: Number(quantity)
      });
    }

    saveCart(cart);
    return cart;
  }

  function removeFromCart(productId, size) {
    const cart = loadCart();
    const newCart = cart.filter(function (item) {
      return !(item.productId === productId && item.size === size);
    });
    saveCart(newCart);
    return newCart;
  }

  function updateCartQuantity(productId, size, quantity) {
    const cart = loadCart();
    const item = cart.find(function (item) {
      return item.productId === productId && item.size === size;
    });

    if (item) {
      item.quantity = Number(quantity);
      if (item.quantity <= 0) {
        return removeFromCart(productId, size);
      }
      saveCart(cart);
    }

    return cart;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    paintCartBadges();
    return [];
  }

  function getCartDetails() {
    const cart = loadCart();
    const products = loadProducts();
    const cartItems = [];

    cart.forEach(function (cartItem) {
      const product = products.find(function (p) { return p.id === cartItem.productId; });
      if (product) {
        const sale = saleInfo(product);
        const price = sale.on ? sale.price : Number(product.price);
        cartItems.push({
          product: product,
          size: cartItem.size,
          quantity: cartItem.quantity,
          price: price,
          totalPrice: price * cartItem.quantity
        });
      }
    });

    return cartItems;
  }

  function getCartTotal() {
    const cartItems = getCartDetails();
    return cartItems.reduce(function (sum, item) { return sum + item.totalPrice; }, 0);
  }

  function generateCartLink() {
    const cart = loadCart();
    if (!cart.length) return null;

    const base = siteBaseUrl();
    if (!base) return "";

    const cartData = encodeURIComponent(JSON.stringify(cart));
    return base + "cart.html?data=" + cartData;
  }

  function loadCartFromUrl() {
    const params = new URLSearchParams(location.search);
    const cartData = params.get("data");
    if (cartData) {
      try {
        const cart = JSON.parse(decodeURIComponent(cartData));
        if (Array.isArray(cart)) {
          saveCart(cart);
          return true;
        }
      } catch (e) {
        console.error("Failed to load cart from URL:", e);
      }
    }
    return false;
  }

  function cartOrderText() {
    const cartItems = getCartDetails();
    const s = MB.loadSettings();
    
    if (!cartItems.length) {
      return "Здравствуйте! Хочу оформить заказ в " + SHOP + ".";
    }

    const lines = [
      "Здравствуйте! Хочу оформить заказ в " + SHOP + ".",
      "",
      "Товары в корзине:"
    ];

    cartItems.forEach(function (item) {
      const sale = MB.saleInfo(item.product);
      const priceLine = sale.on
        ? MB.money(sale.price) + " (было " + MB.money(sale.oldPrice) + ", скидка -" + sale.pct + "%)"
        : MB.money(item.price);
      
      lines.push(
        "• " + item.product.name,
        "  Категория: " + item.product.category,
        "  Размер: " + item.size,
        "  Цена: " + priceLine,
        "  Количество: " + item.quantity,
        "  Сумма: " + MB.money(item.totalPrice),
        "  Артикул: " + item.product.id,
        ""
      );
    });

    lines.push("Итого: " + MB.money(getCartTotal()));

    const cartLink = generateCartLink();
    if (cartLink) {
      lines.push("", "Ссылка на корзину:", cartLink);
    }

    lines.push(
      "",
      "Доставка: " + (s.delivery || "по всей России, по Дербенту бесплатно"),
      "Самовывоз: " + s.city + ", " + s.address
    );

    return lines.join("\n");
  }

  function cartWaLink() {
    return "https://api.whatsapp.com/send?phone=" + PHONE_INTL + "&text=" + encodeURIComponent(cartOrderText());
  }

  function cartTgLink() {
    const text = cartOrderText();
    const link = generateCartLink();
    return {
      chat: "https://t.me/" + TELEGRAM,
      share: link
        ? "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(text)
        : "https://t.me/" + TELEGRAM,
      text: text,
      link: link
    };
  }

  window.MB = {
    PRODUCTS_KEY: PRODUCTS_KEY,
    SETTINGS_KEY: SETTINGS_KEY,
    AUTH_KEY: AUTH_KEY,
    CART_KEY: CART_KEY,
    CATEGORY_IMAGES_KEY: CATEGORY_IMAGES_KEY,
    PHONE: PHONE,
    PHONE_INTL: PHONE_INTL,
    PHONE_NICE: PHONE_NICE,
    TELEGRAM: TELEGRAM,
    TELEGRAM_CHANNEL: TELEGRAM_CHANNEL,
    SHOP: SHOP,
    GROUPS: GROUPS,
    ADMIN_PASS: "200812345678Said0404",
    defaultProducts: defaultProducts,
    money: money,
    saleInfo: saleInfo,
    priceHtml: priceHtml,
    leaves: leaves,
    groupOf: groupOf,
    sizePreset: sizePreset,
    parseSizes: parseSizes,
    totalQty: totalQty,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadCategoryImages: loadCategoryImages,
    saveCategoryImages: saveCategoryImages,
    getCategoryImage: getCategoryImage,
    setCategoryImage: setCategoryImage,
    removeCategoryImage: removeCategoryImage,
    isDisabled: isDisabled,
    enabledGroups: enabledGroups,
    loadProducts: loadProducts,
    saveProducts: saveProducts,
    visibleProducts: visibleProducts,
    getProduct: getProduct,
    productUrl: productUrl,
    orderText: orderText,
    waLink: waLink,
    tgLink: tgLink,
    loadCart: loadCart,
    saveCart: saveCart,
    getCartCount: getCartCount,
    paintCartBadges: paintCartBadges,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateCartQuantity: updateCartQuantity,
    clearCart: clearCart,
    getCartDetails: getCartDetails,
    getCartTotal: getCartTotal,
    generateCartLink: generateCartLink,
    loadCartFromUrl: loadCartFromUrl,
    cartOrderText: cartOrderText,
    cartWaLink: cartWaLink,
    cartTgLink: cartTgLink,
    copyText: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
      }
      fallbackCopy(text);
    }
  };

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "true");
    area.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(area);
  }
})();
