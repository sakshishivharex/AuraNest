/* AuraNest — vanilla JS: mobile nav, newsletter, cart interactions. */
(function () {
  "use strict";

  var api = {
    get: function (url) {
      return fetch(url, { credentials: "same-origin" });
    },
    send: function (url, method, body) {
      return fetch(url, {
        method: method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
      });
    }
  };

  /* ------------------------------------------------- mobile navigation */

  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (toggle && mobileNav) {
    var iconOpen = '<path d="M4 7h16M4 12h16M4 17h16"/>';
    var iconClose = '<path d="M6 6l12 12M18 6L6 18"/>';

    function setOpen(open) {
      mobileNav.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
        (open ? iconClose : iconOpen) + "</svg>";
    }

    toggle.addEventListener("click", function () {
      setOpen(mobileNav.hidden);
    });

    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mobileNav.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768 && !mobileNav.hidden) setOpen(false);
    });
  }

  /* ------------------------------------------------- cart badge helper */

  function updateBadge(units) {
    var badge = document.querySelector("[data-cart-count]");
    if (!badge) return;
    badge.textContent = units;
    badge.hidden = !units;
  }

  function announce(text, kind) {
    var box = document.querySelector("[data-cart-toast]");
    if (!box) return;
    box.textContent = text;
    box.className = "cart-toast cart-toast--" + (kind || "ok");
    box.hidden = false;
    window.clearTimeout(announce.timer);
    announce.timer = window.setTimeout(function () { box.hidden = true; }, 3200);
  }

  /* -------------------------------------------------- cart page wiring */

  var summary = {
    subtotal: document.querySelector("[data-summary-subtotal]"),
    shipping: document.querySelector("[data-summary-shipping]"),
    total: document.querySelector("[data-summary-total]"),
    note: document.querySelector("[data-free-shipping-note]")
  };

  function paintSummary(cart) {
    if (summary.subtotal) summary.subtotal.textContent = cart.subtotal;
    if (summary.shipping) summary.shipping.textContent = cart.shipping;
    if (summary.total) summary.total.textContent = cart.total;
    if (summary.note) {
      summary.note.textContent = cart.amount_to_free_shipping_paise
        ? "Spend " + cart.amount_to_free_shipping + " more for free nationwide delivery."
        : "Free nationwide delivery applied.";
    }
  }

  function applyCart(cart) {
    updateBadge(cart.units);
    paintSummary(cart);
    return cart;
  }

  // Remove a line and, if the cart empties, drop the stale rows.
  function removeLine(lineId) {
    var row = document.querySelector('.cart-line[data-line="' + lineId + '"]');
    if (row) row.classList.add("cart-line--busy");

    return api.send("/api/cart/" + lineId, "DELETE")
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.data.error || "Could not remove that item.");
        if (r.data.cart.units === 0) {
          window.location.reload();
          return;
        }
        if (row) row.remove();
        applyCart(r.data.cart);
        announce("Removed from cart.");
      });
  }

  function setQty(lineId, qty) {
    var row = document.querySelector('.cart-line[data-line="' + lineId + '"]');
    if (row) row.classList.add("cart-line--busy");

    return api.send("/api/cart/" + lineId, "PATCH", { quantity: qty })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.data.error || "Could not update quantity.");
        if (r.data.cart.units === 0) {
          window.location.reload();
          return;
        }
        applyCart(r.data.cart);
        if (row) {
          var input = row.querySelector("[data-qty-input]");
          if (input) input.value = findQty(r.data.cart, lineId);
          var total = row.querySelector("[data-line-total]");
          var line = findLine(r.data.cart, lineId);
          if (total && line) total.textContent = line.line_total;
        }
      })
      .catch(function (err) { announce(err.message, "error"); })
      .then(function () {
        if (row && document.body.contains(row)) row.classList.remove("cart-line--busy");
      });
  }

  function findLine(cart, lineId) {
    for (var i = 0; i < cart.items.length; i++) {
      if (cart.items[i].line_id === lineId) return cart.items[i];
    }
    return null;
  }

  function findQty(cart, lineId) {
    var line = findLine(cart, lineId);
    return line ? line.quantity : 1;
  }

  var cartRoot = document.querySelector(".cart-layout");

  if (cartRoot) {
    cartRoot.addEventListener("click", function (e) {
      var dec = e.target.closest("[data-qty-dec]");
      var inc = e.target.closest("[data-qty-inc]");
      var del = e.target.closest("[data-remove]");
      var clear = e.target.closest("[data-clear]");

      if (clear) {
        if (!window.confirm("Remove everything from your cart?")) return;
        api.send("/api/cart", "DELETE").then(function () { window.location.reload(); });
        return;
      }

      var row = e.target.closest(".cart-line");
      if (!row) return;
      var lineId = parseInt(row.getAttribute("data-line"), 10);
      var input = row.querySelector("[data-qty-input]");

      if (del) {
        e.preventDefault();
        removeLine(lineId).catch(function (err) { announce(err.message, "error"); });
        return;
      }
      if (dec || inc) {
        e.preventDefault();
        var current = parseInt(input.value, 10) || 1;
        var next = dec ? current - 1 : current + 1;
        if (next < 1) { removeLine(lineId).catch(function () {}); return; }
        if (next === current) return;
        setQty(lineId, next);
      }
    });

    cartRoot.addEventListener("change", function (e) {
      var input = e.target.closest("[data-qty-input]");
      if (!input) return;
      var row = input.closest(".cart-line");
      var qty = parseInt(input.value, 10);
      if (!row || isNaN(qty) || qty < 1) {
        input.value = 1;
        return;
      }
      setQty(parseInt(row.getAttribute("data-line"), 10), qty);
    });
  }

  /* ------------------------------------------------- add to cart (fetch) */

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (!btn) return;
    e.preventDefault();
    btn.disabled = true;

    api.send("/api/cart", "POST", { slug: btn.getAttribute("data-add"), quantity: 1 })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.data.error || "Could not add to cart.");
        applyCart(r.data.cart);
        announce("Added to your cart.");
      })
      .catch(function (err) { announce(err.message, "error"); })
      .then(function () { btn.disabled = false; });
  });

  /* ------------------------------------------------ newsletter signup */

  var form = document.querySelector("[data-newsletter]");
  var msg = document.querySelector("[data-newsletter-msg]");

  if (form && msg) {
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');

    function say(text, kind) {
      msg.textContent = text;
      msg.className = "form-message " +
        (kind === "ok" ? "form-message--ok" : "form-message--error");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = input.value.trim();

      if (!input.validity.valid || !email) {
        say("Please enter a valid email address.", "error");
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = "Sending…";

      api.send("/api/subscribe", "POST", { email: email })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          if (r.ok) {
            say(r.data.message || "You are on the list.", "ok");
            form.reset();
          } else {
            say(r.data.error || "Something went wrong. Please try again.", "error");
          }
        })
        .catch(function () { say("Network error — please try again.", "error"); })
        .then(function () {
          button.disabled = false;
          button.textContent = "Subscribe";
        });
    });
  }
})();