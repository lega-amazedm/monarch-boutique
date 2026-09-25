(function () {
  const lock = document.getElementById("admin-lock");
  const app = document.getElementById("admin-app");
  const form = document.getElementById("product-form");
  const settingsForm = document.getElementById("settings-form");
  const listBox = document.getElementById("product-cards");
  const sizeRows = document.getElementById("size-rows");
  const catBox = document.getElementById("cat-toggles");
  const catImagesBox = document.getElementById("cat-images");
  const saleOn = document.getElementById("sale-on");
  const saleFields = document.getElementById("sale-fields");
  let sizesState = [];

  function authed() {
    return sessionStorage.getItem(MB.AUTH_KEY) === "1";
  }

  function toggleSaleFields() {
    if (!saleFields || !saleOn) return;
    saleFields.classList.toggle("hidden", !saleOn.checked);
  }

  function setPane(name) {
    document.querySelectorAll(".admin-pane").forEach(function (p) {
      p.classList.toggle("active", p.id === "pane-" + name);
    });
    document.querySelectorAll("#admin-tabs button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-pane") === name);
    });
    
    if (name === "stats") {
      renderStats();
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showApp() {
    lock.style.display = "none";
    app.style.display = "block";
    fillCategorySelect();
    renderSizes();
    render();
    fillSettings();
    renderCatToggles();
    renderCatImages();
    renderStats();
    toggleSaleFields();
  }

  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const pass = document.getElementById("admin-pass").value.trim();
    if (pass === MB.ADMIN_PASS) {
      sessionStorage.setItem(MB.AUTH_KEY, "1");
      showApp();
    } else {
      document.getElementById("login-error").textContent = "Неверный пароль";
    }
  });

  document.getElementById("logout").addEventListener("click", function () {
    sessionStorage.removeItem(MB.AUTH_KEY);
    location.reload();
  });

  document.getElementById("admin-tabs").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-pane]");
    if (!btn) return;
    setPane(btn.getAttribute("data-pane"));
  });

  if (saleOn) saleOn.addEventListener("change", toggleSaleFields);

  function fillCategorySelect() {
    const sel = form.category;
    const current = sel.value;
    sel.innerHTML = MB.GROUPS.map(function (g) {
      return '<optgroup label="' + g.name + '">' + g.children.map(function (c) {
        return '<option value="' + c + '">' + c + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
    if (current) sel.value = current;
  }

  function renderSizes() {
    sizeRows.innerHTML = sizesState.map(function (s, i) {
      return (
        '<div class="size-edit">' +
        '<input data-si="' + i + '" data-f="name" value="' + String(s.name).replace(/"/g, "") + '" placeholder="Размер">' +
        '<input data-si="' + i + '" data-f="qty" type="number" min="0" step="1" value="' + (Number(s.qty) || 0) + '" placeholder="шт">' +
        '<button class="btn ghost" type="button" data-rm="' + i + '">×</button>' +
        "</div>"
      );
    }).join("") || '<p class="muted">Добавьте размеры, которые есть в наличии.</p>';
  }

  sizeRows.addEventListener("input", function (e) {
    const inp = e.target.closest("[data-si]");
    if (!inp) return;
    const i = Number(inp.getAttribute("data-si"));
    const f = inp.getAttribute("data-f");
    if (!sizesState[i]) return;
    sizesState[i][f] = f === "qty" ? Number(inp.value) : inp.value;
  });

  sizeRows.addEventListener("click", function (e) {
    const rm = e.target.closest("[data-rm]");
    if (!rm) return;
    sizesState.splice(Number(rm.getAttribute("data-rm")), 1);
    renderSizes();
  });

  document.getElementById("add-size").addEventListener("click", function () {
    const name = document.getElementById("new-size-name").value.trim();
    const qty = Number(document.getElementById("new-size-qty").value);
    if (!name) return;
    sizesState.push({ name: name, qty: isNaN(qty) ? 0 : qty });
    document.getElementById("new-size-name").value = "";
    document.getElementById("new-size-qty").value = "";
    renderSizes();
  });

  document.getElementById("fill-preset").addEventListener("click", function () {
    const preset = MB.sizePreset(form.category.value);
    sizesState = preset.map(function (name) {
      const found = sizesState.find(function (s) { return s.name === name; });
      return { name: name, qty: found ? Number(found.qty) || 0 : 1 };
    });
    renderSizes();
  });

  form.category.addEventListener("change", function () {
    if (!sizesState.length) {
      sizesState = MB.sizePreset(form.category.value).map(function (name) {
        return { name: name, qty: 1 };
      });
      renderSizes();
    }
  });

  function fillSettings() {
    const s = MB.loadSettings();
    settingsForm.addressTitle.value = s.addressTitle;
    settingsForm.city.value = s.city;
    settingsForm.hours.value = s.hours;
    settingsForm.address.value = s.address;
    settingsForm.delivery.value = s.delivery || "";
  }

  settingsForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const prev = MB.loadSettings();
    MB.saveSettings({
      addressTitle: settingsForm.addressTitle.value.trim(),
      city: settingsForm.city.value.trim(),
      hours: settingsForm.hours.value.trim(),
      address: settingsForm.address.value.trim(),
      delivery: settingsForm.delivery.value.trim(),
      disabledCategories: prev.disabledCategories || []
    });
    document.getElementById("settings-ok").textContent = "Сохранено";
  });

  function renderCatToggles() {
    const off = MB.loadSettings().disabledCategories || [];
    catBox.innerHTML = MB.GROUPS.map(function (g) {
      const parentOn = off.indexOf(g.name) < 0;
      return (
        '<div class="cat-block">' +
        '<label class="switch-row"><span>' + g.name + "</span>" +
        '<input type="checkbox" data-cat="' + g.name + '"' + (parentOn ? " checked" : "") + ">" +
        "</label>" +
        g.children.map(function (c) {
          const on = off.indexOf(c) < 0;
          return '<label class="switch-row nested"><span>' + c + "</span>" +
            '<input type="checkbox" data-cat="' + c + '"' + (on ? " checked" : "") + "></label>";
        }).join("") +
        "</div>"
      );
    }).join("");
  }

  catBox.addEventListener("change", function (e) {
    const inp = e.target.closest("[data-cat]");
    if (!inp) return;
    const s = MB.loadSettings();
    const name = inp.getAttribute("data-cat");
    const off = (s.disabledCategories || []).filter(function (x) { return x !== name; });
    if (!inp.checked) off.push(name);
    s.disabledCategories = off;
    MB.saveSettings(s);
  });

  function catImageRow(name, isGroup) {
    const url = MB.getCategoryImage(name);
    const has = !!(url && url.trim() !== "");
    return (
      '<div class="cat-image-row' + (isGroup ? " cat-image-row-group" : "") + '">' +
      '<div class="cat-image-thumb">' +
      (has ? '<img src="' + url + '" alt="">' : '<span>' + name.charAt(0) + "</span>") +
      "</div>" +
      '<div class="cat-image-info">' +
      "<b>" + name + "</b>" +
      '<div class="cat-image-actions">' +
      '<label class="btn ghost">Загрузить<input type="file" accept="image/*" data-cat-upload="' + name + '" style="display:none"></label>' +
      (has ? '<button type="button" class="btn ghost" data-cat-remove="' + name + '">Убрать фото</button>' : "") +
      "</div></div></div>"
    );
  }

  function renderCatImages() {
    if (!catImagesBox) return;
    const rows = [];
    MB.GROUPS.forEach(function (g) {
      rows.push(catImageRow(g.name, true));
      g.children.forEach(function (c) { rows.push(catImageRow(c, false)); });
    });
    catImagesBox.innerHTML = rows.join("");
  }

  if (catImagesBox) {
    catImagesBox.addEventListener("change", function (e) {
      const inp = e.target.closest("[data-cat-upload]");
      if (!inp) return;
      const file = inp.files && inp.files[0];
      if (!file) return;
      const name = inp.getAttribute("data-cat-upload");
      const reader = new FileReader();
      reader.onload = function () {
        MB.setCategoryImage(name, reader.result);
        renderCatImages();
        showToast("Фото категории «" + name + "» обновлено");
      };
      reader.readAsDataURL(file);
    });

    catImagesBox.addEventListener("click", function (e) {
      const rm = e.target.closest("[data-cat-remove]");
      if (!rm) return;
      const name = rm.getAttribute("data-cat-remove");
      MB.removeCategoryImage(name);
      renderCatImages();
      showToast("Фото категории «" + name + "» удалено");
    });
  }

  function render() {
    const list = MB.loadProducts();
    listBox.innerHTML = list.map(function (p) {
      const sizes = MB.parseSizes(p.sizes, p.qty).map(function (s) { return s.name + ":" + s.qty; }).join(", ");
      const hidden = MB.isDisabled(p.category) ? " · скрыт" : "";
      const sale = MB.saleInfo(p);
      return (
        '<article class="admin-card">' +
        '<img src="' + p.image + '" alt="">' +
        "<div>" +
        "<h3>" + p.name + "</h3>" +
        '<p class="muted">' + p.category + hidden + " · " + p.id + "</p>" +
        '<p class="muted">' + sizes + "</p>" +
        "<p>" + (sale.on ? MB.money(sale.price) + " · было " + MB.money(sale.oldPrice) : MB.money(p.price)) +
        " · " + MB.totalQty(p) + " шт</p>" +
        '<div class="row-actions">' +
        '<button class="btn" data-edit="' + p.id + '">Изменить</button>' +
        '<button class="btn ghost" data-del="' + p.id + '">Удалить</button>' +
        "</div></div></article>"
      );
    }).join("") || '<div class="empty">Товаров пока нет</div>';
  }

  listBox.addEventListener("click", function (e) {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    const list = MB.loadProducts();
    if (edit) {
      const p = list.find(function (x) { return x.id === edit.getAttribute("data-edit"); });
      if (!p) return;
      form.id.value = p.id;
      form.name.value = p.name;
      form.category.value = p.category;
      form.price.value = p.price;
      form.oldPrice.value = p.oldPrice || "";
      saleOn.checked = !!p.saleOn;
      toggleSaleFields();
      form.image.value = p.image;
      form.description.value = p.description || "";
      sizesState = MB.parseSizes(p.sizes, p.qty);
      renderSizes();
      setPane("card");
    }
    if (del) {
      const id = del.getAttribute("data-del");
      if (!confirm("Удалить товар?")) return;
      MB.saveProducts(list.filter(function (x) { return x.id !== id; }));
      render();
    }
  });

  document.getElementById("image-file").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () { form.image.value = reader.result; };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const price = Number(form.price.value);
    const oldPrice = Number(form.oldPrice.value) || 0;
    if (saleOn.checked && !(oldPrice > price)) {
      document.getElementById("product-error").textContent = "Старая цена должна быть больше новой";
      return;
    }
    const list = MB.loadProducts();
    const item = {
      id: form.id.value.trim() || ("mb-" + Date.now()),
      name: form.name.value.trim(),
      category: form.category.value,
      price: price,
      oldPrice: oldPrice,
      saleOn: saleOn.checked,
      image: form.image.value.trim(),
      sizes: sizesState.map(function (s) {
        return { name: String(s.name || "").trim(), qty: Number(s.qty) || 0 };
      }).filter(function (s) { return s.name; }),
      description: form.description.value.trim()
    };
    if (!item.sizes.length) {
      document.getElementById("product-error").textContent = "Добавьте хотя бы один размер";
      return;
    }
    document.getElementById("product-error").textContent = "";
    const idx = list.findIndex(function (x) { return x.id === item.id; });
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
    MB.saveProducts(list);
    form.reset();
    form.id.value = "";
    saleOn.checked = false;
    toggleSaleFields();
    sizesState = [];
    fillCategorySelect();
    renderSizes();
    render();
    setPane("goods");
  });

  document.getElementById("reset-form").addEventListener("click", function () {
    form.reset();
    form.id.value = "";
    saleOn.checked = false;
    toggleSaleFields();
    sizesState = [];
    fillCategorySelect();
    renderSizes();
  });

  // Statistics functionality
  function renderStats() {
    const products = MB.loadProducts();
    const totalProducts = products.length;
    const totalQty = products.reduce(function (sum, p) { return sum + MB.totalQty(p); }, 0);
    const saleProducts = products.filter(function (p) { return MB.saleInfo(p).on; }).length;
    const totalValue = products.reduce(function (sum, p) {
      const sale = MB.saleInfo(p);
      const price = sale.on ? sale.price : Number(p.price);
      return sum + (price * MB.totalQty(p));
    }, 0);

    const statsGrid = document.getElementById("stats-grid");
    if (statsGrid) {
      statsGrid.innerHTML =
        '<div class="stat-card">' +
        '<div class="stat-label">Всего товаров</div>' +
        '<div class="stat-value">' + totalProducts + '</div>' +
        '</div>' +
        '<div class="stat-card">' +
        '<div class="stat-label">Всего в наличии</div>' +
        '<div class="stat-value">' + totalQty + ' шт</div>' +
        '</div>' +
        '<div class="stat-card">' +
        '<div class="stat-label">Со скидкой</div>' +
        '<div class="stat-value">' + saleProducts + '</div>' +
        '</div>' +
        '<div class="stat-card">' +
        '<div class="stat-label">Общая стоимость</div>' +
        '<div class="stat-value">' + MB.money(totalValue) + '</div>' +
        '</div>';
    }

    // Popular products (by quantity)
    const popularProducts = document.getElementById("popular-products");
    if (popularProducts) {
      const sorted = products.slice().sort(function (a, b) {
        return MB.totalQty(b) - MB.totalQty(a);
      }).slice(0, 5);

      popularProducts.innerHTML = sorted.map(function (p, i) {
        return (
          '<div class="admin-card">' +
          '<img src="' + p.image + '" alt="">' +
          '<div>' +
          '<h3>' + (i + 1) + '. ' + p.name + '</h3>' +
          '<p class="muted">' + p.category + ' · ' + MB.totalQty(p) + ' шт</p>' +
          '<p>' + MB.priceHtml(p) + '</p>' +
          '</div></div>'
        );
      }).join("") || '<div class="empty">Нет товаров</div>';
    }
  }

  // Export data functionality
  document.getElementById("export-data").addEventListener("click", function () {
    const data = {
      products: MB.loadProducts(),
      settings: MB.loadSettings(),
      categoryImages: MB.loadCategoryImages(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monarch-boutique-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("Данные экспортированы");
  });

  // Import data functionality
  document.getElementById("import-data").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.products && Array.isArray(data.products)) {
          MB.saveProducts(data.products);
        }
        
        if (data.settings && typeof data.settings === "object") {
          MB.saveSettings(data.settings);
        }

        if (data.categoryImages && typeof data.categoryImages === "object") {
          MB.saveCategoryImages(data.categoryImages);
        }
        
        showToast("Данные импортированы успешно");
        render();
        renderStats();
        renderCatToggles();
        renderCatImages();
        fillSettings();
      } catch (err) {
        showToast("Ошибка при импорте данных");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // Reset data functionality
  document.getElementById("reset-data").addEventListener("click", function () {
    if (!confirm("Вы уверены? Все товары и настройки будут удалены. Это действие нельзя отменить.")) return;
    if (!confirm("Подтвердите сброс данных. Все данные будут потеряны!")) return;
    
    localStorage.removeItem(MB.PRODUCTS_KEY);
    localStorage.removeItem(MB.SETTINGS_KEY);
    
    showToast("Данные сброшены");
    location.reload();
  });

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = message;
      toast.classList.add("show");
      setTimeout(function () { toast.classList.remove("show"); }, 3000);
    }
  }

  if (authed()) showApp();

  // The admin panel should never hide its content behind a scroll animation
  document.querySelectorAll(".section").forEach(function (section) {
    section.classList.add("visible");
  });
})();
