/* ============================================================
   CODIQ · Interacțiuni
   - Nav sticky: schimbă la starea glass la scroll
   - Meniu mobil: toggle hamburger
   - Scroll lin la click pe ancore + închide meniul
   ============================================================ */

(function () {
  "use strict";

  const nav        = document.querySelector(".nav");
  const toggle     = document.querySelector(".nav__toggle");
  const links      = document.querySelector(".nav__links");
  const navAnchors = links ? links.querySelectorAll(".nav__link") : [];

  /* --------------------------------------------------------
     1. Nav sticky — adaugă .is-scrolled după un mic prag
     -------------------------------------------------------- */
  const SCROLL_THRESHOLD = 8;

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // stare inițială corectă la încărcare

  /* --------------------------------------------------------
     2. Meniu mobil — deschide/închide
     -------------------------------------------------------- */
  function closeMenu() {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    links.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });

    // Închide la tasta Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* --------------------------------------------------------
     3. Scroll lin la ancorele interne + închide meniul mobil
     -------------------------------------------------------- */
  navAnchors.forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
      }
      closeMenu(); // închide meniul mobil după selecție
    });
  });

  /* --------------------------------------------------------
     4. Animații de intrare la scroll (reveal)
     - Marcăm <body> cu .reveal-ready DOAR dacă rulăm JS, astfel
       conținutul rămâne vizibil dacă JS lipsește.
     - Respectăm prefers-reduced-motion: arătăm tot instant.
     -------------------------------------------------------- */
  const revealItems = document.querySelectorAll("[data-reveal]");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (revealItems.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      // Fără animație: totul vizibil imediat
      revealItems.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      document.body.classList.add("reveal-ready");
      const observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // animăm o singură dată
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

      revealItems.forEach(function (el) { observer.observe(el); });
    }
  }

  /* --------------------------------------------------------
     5. „Aprinderea" liniei de proces la scroll ([data-lit])
     Adaugă .is-lit când elementul intră în viewport, ceea ce
     face glow-ul violet→amber să curgă de-a lungul liniei.
     Sub prefers-reduced-motion apare instant (fără curgere).
     -------------------------------------------------------- */
  const litItems = document.querySelectorAll("[data-lit]");

  if (litItems.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      litItems.forEach(function (el) { el.classList.add("is-lit"); });
    } else {
      const litObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-lit");
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });

      litItems.forEach(function (el) { litObserver.observe(el); });
    }
  }

  /* --------------------------------------------------------
     6. FAQ accordion (accesibil)
     Fiecare item e independent. Butonul comută aria-expanded
     și afișează/ascunde panoul (atributul hidden).
     Controlabil din tastatură nativ (sunt <button>-uri).
     -------------------------------------------------------- */
  const faqTriggers = document.querySelectorAll(".faq-item__trigger");

  faqTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const panel = document.getElementById(trigger.getAttribute("aria-controls"));
      trigger.setAttribute("aria-expanded", String(!expanded));
      if (panel) panel.hidden = expanded; // dacă era deschis → ascunde
    });
  });

  /* --------------------------------------------------------
     7. Formular de contact — validare + submit (Formspree)
     ────────────────────────────────────────────────────
     • EDITEAZĂ FORMSPREE_ENDPOINT cu URL-ul tău Formspree.
     • La succes: mesaj de confirmare + evenimentul Meta „Lead".
     • Fără endpoint setat: rulează în „mod demo" (arată succesul
       fără a trimite nimic), ca să poți testa fluxul local.
     -------------------------------------------------------- */
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/mnjewrpe"; // ex: https://formspree.io/f/xxxxxx

  const form = document.getElementById("contact-form");

  if (form) {
    const statusEl  = document.getElementById("contact-status");
    const nameEl    = document.getElementById("cf-name");
    const contactEl = document.getElementById("cf-contact");

    // Validează un câmp „telefon sau email" — acceptă oricare dintre ele
    function isValidContact(value) {
      const v = value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const digits  = v.replace(/[\s()\-\.]/g, "");
      const phoneOk = /^\+?\d{9,15}$/.test(digits);
      return emailOk || phoneOk;
    }

    // Comută starea de eroare pe un câmp + mesajul asociat
    function setError(inputEl, errId, show) {
      const errEl = document.getElementById(errId);
      inputEl.classList.toggle("is-invalid", show);
      inputEl.setAttribute("aria-invalid", show ? "true" : "false");
      if (errEl) errEl.hidden = !show;
    }

    function showStatus(message, type) {
      statusEl.textContent = message;
      statusEl.classList.remove("is-success", "is-error");
      statusEl.classList.add(type === "success" ? "is-success" : "is-error");
      statusEl.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // ---- Validare client-side ----
      let valid = true;

      const nameOk = nameEl.value.trim().length > 0;
      setError(nameEl, "cf-name-err", !nameOk);
      if (!nameOk) valid = false;

      const contactOk = isValidContact(contactEl.value);
      setError(contactEl, "cf-contact-err", !contactOk);
      if (!contactOk) valid = false;

      if (!valid) {
        // Focus pe primul câmp cu eroare, pt. accesibilitate
        (!nameOk ? nameEl : contactEl).focus();
        return;
      }

      // ---- Trimitere ----
      const submitBtn = form.querySelector("button[type=submit]");
      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Se trimite…";

      // Succes comun: mesaj + eveniment Lead + reset
      function onSuccess() {
        showStatus("Mulțumim! Te contactăm în 24h.", "success");
        form.reset();

        /* ↓↓↓ META PIXEL — eveniment „Lead" la submit REUȘIT ↓↓↓
           Se declanșează DOAR aici, nu la încărcarea paginii. */
        if (typeof fbq === "function") {
          fbq("track", "Lead");
        }
        /* ↑↑↑ SFÂRȘIT eveniment Lead ↑↑↑ */
      }

      function onError() {
        showStatus("Ceva n-a mers. Încearcă din nou sau scrie-ne pe WhatsApp.", "error");
      }

      function done() {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }

      // Mod demo (endpoint nesetat) — arată fluxul fără a trimite
      if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT === "PUNE_AICI_ENDPOINT") {
        onSuccess();
        done();
        return;
      }

      // Trimitere reală către Formspree
      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (res) { res.ok ? onSuccess() : onError(); })
        .catch(onError)
        .finally(done);
    });

    // Curăță eroarea pe măsură ce utilizatorul corectează
    nameEl.addEventListener("input", function () {
      if (nameEl.value.trim()) setError(nameEl, "cf-name-err", false);
    });
    contactEl.addEventListener("input", function () {
      if (isValidContact(contactEl.value)) setError(contactEl, "cf-contact-err", false);
    });
  }

  /* --------------------------------------------------------
     8. Lightbox portofoliu
     Click pe un card → arată imaginea întreagă, mare.
     Închidere: buton ×, click pe fundal sau Escape.
     Gestionăm focusul (îl mutăm pe × și îl readucem la închidere).
     -------------------------------------------------------- */
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn    = lightbox.querySelector(".lightbox__close");
    const frames      = document.querySelectorAll(".project-card__frame");
    let lastFocused   = null;

    function openLightbox(img) {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      lastFocused = document.activeElement;
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";  // blochează scroll-ul din fundal
      closeBtn.focus();   // vizibil instant (vezi .lightbox visibility 0s), deci focusabil
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      lightboxImg.removeAttribute("src");
      if (lastFocused) lastFocused.focus();     // readu focusul pe cardul apăsat
    }

    // Deschidere de pe fiecare card
    frames.forEach(function (frame) {
      frame.addEventListener("click", function () {
        const img = frame.querySelector(".project-card__img");
        if (img) openLightbox(img);
      });
    });

    // Închidere: buton ×
    closeBtn.addEventListener("click", closeLightbox);

    // Închidere: click pe fundal (nu și pe imagine)
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Tastatură: Escape închide; Tab rămâne pe × (mic focus-trap)
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); }
    });
  }
})();
