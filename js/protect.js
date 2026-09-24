(function () {
  function block(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  document.addEventListener("contextmenu", block);
  document.addEventListener("selectstart", function (e) {
    const tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    block(e);
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.tagName === "IMG") block(e);
  });
  document.addEventListener("keydown", function (e) {
    const key = (e.key || "").toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    if (
      e.key === "F12" ||
      (ctrl && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
      (ctrl && (key === "u" || key === "s" || key === "p"))
    ) {
      block(e);
    }
  });

})();
