(function () {
  document.documentElement.classList.add("js-motion");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll(".lead-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      if (note) note.textContent = "Project captured. Connect this form to WhatsApp, email, or CRM before launch.";
    });
  });

  if (!window.gsap || prefersReduced) {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.style.display = "none";
    return;
  }

  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  } else {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.style.display = "none";
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  /* ═══════════════════════════════════════════════════════
     LENIS SMOOTH SCROLL INTEGRATION
     ═══════════════════════════════════════════════════════ */
  let lenis;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: "vertical",
      smoothWheel: true
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  /* ═══════════════════════════════════════════════════════
     SMOOTH LERP LOOP — Custom Cursor, Glow Ring, and Orbs
     ═══════════════════════════════════════════════════════ */
  const dot = document.querySelector(".cursor-dot");
  const glow = document.querySelector(".cursor-glow");
  const orbs = document.querySelectorAll(".hero-3d-orbs .orb");
  const preloader = document.querySelector(".preloader");
  const preloaderWrap = document.querySelector(".preloader-wrap");

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let currentDot = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let currentGlow = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  let targetOrbMouse = { x: 0, y: 0 };
  let currentOrbMouse = { x: 0, y: 0 };

  if (window.matchMedia("(pointer: fine)").matches) {
    if (dot) gsap.set(dot, { opacity: 1, xPercent: -50, yPercent: -50 });
    if (glow) gsap.set(glow, { opacity: 1, xPercent: -50, yPercent: -50 });

    window.addEventListener("mousemove", (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;

      if (preloader) {
        const mxPercent = (event.clientX / window.innerWidth) * 100;
        const myPercent = (event.clientY / window.innerHeight) * 100;
        preloader.style.setProperty("--mx", `${mxPercent}%`);
        preloader.style.setProperty("--my", `${myPercent}%`);
      }

      const hero = document.querySelector(".hero");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        targetOrbMouse.x = (event.clientX - rect.left) / rect.width - 0.5;
        targetOrbMouse.y = (event.clientY - rect.top) / rect.height - 0.5;
      }
    });

    gsap.ticker.add(() => {
      // Lerp for Dot (snappy but smooth)
      currentDot.x += (mouse.x - currentDot.x) * 0.25;
      currentDot.y += (mouse.y - currentDot.y) * 0.25;
      if (dot) {
        gsap.set(dot, { x: currentDot.x, y: currentDot.y });
      }

      // Lerp for Glow (slow, trailing trail)
      currentGlow.x += (mouse.x - currentGlow.x) * 0.08;
      currentGlow.y += (mouse.y - currentGlow.y) * 0.08;
      if (glow) {
        gsap.set(glow, { x: currentGlow.x, y: currentGlow.y });
      }

      // Lerp for Hero Orbs (ultra smooth flow)
      currentOrbMouse.x += (targetOrbMouse.x - currentOrbMouse.x) * 0.05;
      currentOrbMouse.y += (targetOrbMouse.y - currentOrbMouse.y) * 0.05;
      if (orbs.length) {
        orbs.forEach((orb, i) => {
          const depth = 20 + i * 15;
          gsap.set(orb, {
            x: currentOrbMouse.x * depth,
            y: currentOrbMouse.y * depth
          });
        });
      }
    });

    // Expand cursor ring on interactive elements
    const interactiveEls = document.querySelectorAll(
      ".tilt, .service-tile, .price-card, .work-card, .process-rail article, .button, .floating-card, .device-shell, .brand-mark, .patient-card"
    );
    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (dot) {
          gsap.to(dot, {
            width: 48,
            height: 48,
            borderColor: "rgba(124,255,191,0.6)",
            backgroundColor: "rgba(124,255,191,0.06)",
            duration: 0.3,
            ease: "power2.out"
          });
        }
        if (glow) {
          gsap.to(glow, {
            scale: 1.4,
            duration: 0.4,
            ease: "power2.out"
          });
        }
      });
      el.addEventListener("mouseleave", () => {
        if (dot) {
          gsap.to(dot, {
            width: 18,
            height: 18,
            borderColor: "rgba(124,255,191,0.8)",
            backgroundColor: "transparent",
            duration: 0.3,
            ease: "power2.out"
          });
        }
        if (glow) {
          gsap.to(glow, {
            scale: 1.0,
            duration: 0.4,
            ease: "power2.out"
          });
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     PAGE INTRO TIMELINE — Orchestrated Page Load Sequence
     ═══════════════════════════════════════════════════════ */
  const headline = document.querySelector("[data-split]");
  if (headline) {
    const words = headline.textContent.trim().split(" ");
    headline.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(" ");
  }

  const introTL = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

  // Pre-set some element properties for clean intro fade-ins
  gsap.set(".status-pill, .hero-actions > *, .hero-proof span, .showcase > *", { opacity: 0 });

  // 1. Status Pill entry
  if (document.querySelector(".status-pill")) {
    introTL.fromTo(".status-pill",
      { opacity: 0, y: 15, scale: 0.94, rotateX: -10 },
      { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.8 },
      "+=0.15"
    );
  }

  // 2. Headline 3D word reveal
  if (headline) {
    introTL.fromTo(".word",
      { opacity: 0, y: 50, rotateX: -60, scale: 0.82, transformPerspective: 600 },
      { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.95, stagger: 0.04 },
      "-=0.55"
    );
  }

  // 3. Scramble description text
  introTL.add(() => {
    const scramble = document.querySelector("[data-scramble]");
    if (scramble) {
      const finalText = scramble.dataset.scramble;
      const glyphs = "ISOCODELABS0101";
      let frame = 0;
      const timer = setInterval(() => {
        scramble.textContent = finalText
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            return index < frame ? finalText[index] : glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join("");
        frame += 1;
        if (frame > finalText.length) {
          scramble.textContent = finalText;
          clearInterval(timer);
        }
      }, 16);
    }
  }, "-=0.3");

  // 4. Hero buttons entry
  introTL.fromTo(".hero-actions > *",
    { opacity: 0, y: 20, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 },
    "-=0.2"
  );

  // 5. Hero proof chips entry
  introTL.fromTo(".hero-proof span",
    { opacity: 0, y: 15, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08 },
    "-=0.3"
  );

  // 6. Showcase entry
  introTL.fromTo(".showcase > *",
    { opacity: 0, y: 70, scale: 0.9, rotateX: -15, transformPerspective: 800 },
    { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.15, stagger: 0.12 },
    "-=0.6"
  );

  // Preloader mask reveal trigger logic with safety timeout
  const safetyTimeout = setTimeout(() => {
    startReveal();
  }, 3500);

  function startReveal() {
    clearTimeout(safetyTimeout);
    if (preloader && !preloader.classList.contains("revealing")) {
      const mxPercent = (mouse.x / window.innerWidth) * 100;
      const myPercent = (mouse.y / window.innerHeight) * 100;
      preloader.style.setProperty("--mx", `${mxPercent}%`);
      preloader.style.setProperty("--my", `${myPercent}%`);

      preloader.classList.add("revealing");

      const revealTL = gsap.timeline({
        onComplete: () => {
          preloader.style.display = "none";
          ScrollTrigger.refresh();
        }
      });

      if (preloaderWrap) {
        revealTL.to(preloaderWrap, {
          opacity: 0,
          scale: 0.85,
          y: -20,
          duration: 0.6,
          ease: "power2.inOut"
        });
      }

      let revealObj = { radius: 0 };
      revealTL.to(revealObj, {
        radius: 150,
        duration: 1.5,
        ease: "power3.inOut",
        onUpdate: () => {
          preloader.style.setProperty("--reveal-radius", `${revealObj.radius}%`);
        }
      }, "-=0.35");

      revealTL.add(() => {
        introTL.play();
      }, "-=0.95");
    } else if (!preloader) {
      introTL.play();
    }
  }

  if (document.readyState === "complete") {
    startReveal();
  } else {
    window.addEventListener("load", startReveal);
  }

  /* ═══════════════════════════════════════════════════════
     SCROLL PROGRESS INDICATOR
     ═══════════════════════════════════════════════════════ */
  const progress = document.querySelector(".scroll-progress");
  if (progress) {
    gsap.to(progress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     CINEMATIC SECTION CLIP-PATH REVEALS
     ═══════════════════════════════════════════════════════ */
  gsap.utils.toArray(".clip-section").forEach((sec) => {
    gsap.fromTo(sec,
      { clipPath: "inset(8% 6% round 24px)" },
      {
        clipPath: "inset(0% 0% round 0px)",
        ease: "none",
        scrollTrigger: {
          trigger: sec,
          start: "top bottom",
          end: "top 22%",
          scrub: 0.8
        }
      }
    );
  });

  /* ═══════════════════════════════════════════════════════
     STAGGERED BATCH REVEALS
     ═══════════════════════════════════════════════════════ */
  ScrollTrigger.batch(".reveal:not(.section-head)", {
    interval: 0.08,
    batchMax: 4,
    onEnter: (batch) => {
      gsap.fromTo(batch,
        { opacity: 0, y: 70, rotateX: -10, scale: 0.96, transformPerspective: 800 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.95,
          stagger: 0.12,
          ease: "power3.out",
          overwrite: "auto"
        }
      );
    },
    once: true
  });

  /* ═══════════════════════════════════════════════════════
     SECTION HEAD REVEALS
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".section-head.reveal").forEach((head) => {
    gsap.fromTo(head,
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: {
          trigger: head,
          start: "top 88%",
          once: true
        }
      }
    );
  });

  /* ═══════════════════════════════════════════════════════
     LINE-BY-LINE TEXT REVEALS
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".line-reveal").forEach((el) => {
    const span = el.querySelector("span");
    if (span) {
      gsap.to(span, {
        y: "0%",
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true
        }
      });
    }
  });

  /* ═══════════════════════════════════════════════════════
     PARALLAX SCROLLING — Multi-Depth 3D Layers
     ═══════════════════════════════════════════════════════ */
  gsap.to(".device-shell", {
    y: -50,
    rotate: -2,
    scale: 0.98,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".floating-card", {
    y: -90,
    ease: "none",
    stagger: 0.06,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  // Dynamic parallax depth inside work-card visuals
  document.querySelectorAll(".work-card").forEach((card) => {
    const visualChild = card.querySelector(".mini-dashboard, .email-builder, .product-page");
    if (visualChild) {
      gsap.fromTo(visualChild,
        { y: "6%" },
        {
          y: "-6%",
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    }
  });

  gsap.to(".work-card", {
    backgroundPosition: "80px 40px",
    ease: "none",
    scrollTrigger: { trigger: ".work", start: "top bottom", end: "bottom top", scrub: true }
  });

  gsap.to(".motion-field i", {
    yPercent: -140,
    rotate: 120,
    scale: 0.6,
    ease: "none",
    stagger: 0.1,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  /* ═══════════════════════════════════════════════════════
     SERVICE TILES — 3D Scroll Parallax
     ═══════════════════════════════════════════════════════ */
  gsap.utils.toArray(".service-tile").forEach((tile, index) => {
    gsap.fromTo(
      tile,
      {
        y: 80,
        rotateX: -12,
        transformPerspective: 800,
        opacity: 0
      },
      {
        y: index % 2 === 0 ? -34 : 34,
        rotateX: 0,
        opacity: 1,
        rotate: index % 2 === 0 ? -1.6 : 1.6,
        ease: "none",
        scrollTrigger: { trigger: ".services", start: "top bottom", end: "bottom top", scrub: true }
      }
    );
  });

  /* ═══════════════════════════════════════════════════════
     PRICING CARDS — 3D Flip-In Reveal + Dynamic Counter
     ═══════════════════════════════════════════════════════ */
  gsap.utils.toArray(".price-card").forEach((card, i) => {
    gsap.fromTo(
      card,
      {
        y: 90,
        rotateX: -20,
        rotateY: i === 0 ? 8 : i === 2 ? -8 : 0,
        scale: 0.9,
        transformPerspective: 1000,
        opacity: 0
      },
      {
        y: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 90%", end: "top 55%", scrub: true }
      }
    );
  });

  // Numbers Count Up on Pricing scroll entry
  gsap.utils.toArray(".price-count").forEach((el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    gsap.fromTo(el,
      { textContent: 0 },
      {
        textContent: target,
        duration: 1.6,
        ease: "power2.out",
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: ".pricing",
          start: "top 78%",
          once: true
        }
      }
    );
  });

  /* ═══════════════════════════════════════════════════════
     MAGNETIC BUTTONS — Premium GSAP Demo-Style
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      gsap.to(button, {
        x: x * 0.22,
        y: y * 0.28,
        rotateX: y * -0.06,
        rotateY: x * 0.06,
        transformPerspective: 600,
        duration: 0.2,
        ease: "power2.out",
        overwrite: true
      });
    });
    button.addEventListener("mouseleave", () => {
      gsap.to(button, {
        x: 0, y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "power3.out",
        overwrite: true
      });
    });
  });

  /* ═══════════════════════════════════════════════════════
     BUTTON FILL-REVEAL — Fame Estate style
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".button").forEach((btn) => {
    const fill = btn.querySelector(".btn-fill");
    if (!fill) return;

    btn.addEventListener("mouseenter", () => {
      gsap.killTweensOf(fill);
      gsap.set(fill, { transformOrigin: "bottom" });
      gsap.to(fill, {
        scaleY: 1,
        duration: 0.4,
        ease: "power3.out"
      });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.killTweensOf(fill);
      gsap.set(fill, { transformOrigin: "top" });
      gsap.to(fill, {
        scaleY: 0,
        duration: 0.4,
        ease: "power3.out"
      });
    });
  });

  /* ═══════════════════════════════════════════════════════
     SHOWCASE — 3D Mouse-Responsive Depth Layers
     ═══════════════════════════════════════════════════════ */
  const showcase = document.querySelector(".showcase");
  if (showcase && window.matchMedia("(pointer: fine)").matches) {
    showcase.addEventListener("mousemove", (event) => {
      const rect = showcase.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      showcase.querySelectorAll("[data-depth]").forEach((el) => {
        const depth = Number(el.dataset.depth || 16);
        gsap.to(el, {
          x: (x / rect.width) * depth,
          y: (y / rect.height) * depth,
          rotateX: (y / rect.height) * -3,
          rotateY: (x / rect.width) * 3,
          transformPerspective: 800,
          duration: 0.5,
          ease: "power2.out",
          overwrite: true
        });
      });
    });
    showcase.addEventListener("mouseleave", () => {
      showcase.querySelectorAll("[data-depth]").forEach((el) => {
        gsap.to(el, {
          x: 0, y: 0,
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: true
        });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     CARD INTERACTIVE TILT & SPOTLIGHT SYSTEM — GSAP Powered
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".service-tile, .price-card, .work-card, .process-rail article, .contact-panel").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.classList.add("is-hovering");
    });

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      // Gentle tilt (max ±5 degrees) for sleek aesthetics
      const maxTilt = 5;
      const rx = (py - 0.5) * -maxTilt;
      const ry = (px - 0.5) * maxTilt;

      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);

      // conic-gradient angle for holographic orbs/cards if needed
      const angle = Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI) + 180;
      card.style.setProperty("--angle", String(angle));

      gsap.to(card, {
        rotateX: rx,
        rotateY: ry,
        scale: 1.018,
        transformPerspective: 1000,
        transformOrigin: "center",
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto"
      });
    });

    card.addEventListener("mouseleave", () => {
      card.classList.remove("is-hovering");
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto"
      });
    });
  });

  /* ═══════════════════════════════════════════════════════
     BRAND MARK — 3D Flip on Hover
     ═══════════════════════════════════════════════════════ */
  const brandMark = document.querySelector(".brand-mark");
  if (brandMark) {
    const brand = document.querySelector(".brand");
    if (brand) {
      brand.addEventListener("mouseenter", () => {
        gsap.to(brandMark, {
          rotateY: 180,
          scale: 1.15,
          duration: 0.6,
          ease: "power3.out"
        });
      });
      brand.addEventListener("mouseleave", () => {
        gsap.to(brandMark, {
          rotateY: 0,
          scale: 1,
          duration: 0.5,
          ease: "power3.out"
        });
      });
    }
  }

  /* ═══════════════════════════════════════════════════════
     TICKER — Scroll-Velocity Responsive Skew
     ═══════════════════════════════════════════════════════ */
  const ticker = document.querySelector(".ticker div");
  if (ticker) {
    ScrollTrigger.create({
      trigger: ".ticker",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        let velocity = self.getVelocity() / 300;
        let skew = gsap.utils.clamp(-8, 8, velocity);
        gsap.to(ticker, {
          skewX: skew,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     NAVBAR THEME TRANSITIONS — Light/Dark Mode Scroll Toggles
     ═══════════════════════════════════════════════════════ */
  const header = document.querySelector(".site-header");
  if (header) {
    document.querySelectorAll(".services, .pricing").forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: "top 44px",
        end: "bottom 44px",
        onEnter: () => header.classList.add("light-mode"),
        onEnterBack: () => header.classList.add("light-mode"),
        onLeave: () => header.classList.remove("light-mode"),
        onLeaveBack: () => header.classList.remove("light-mode")
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     PATIENT CARDS — 3D Slide + Smooth Return
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".patient-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        x: 10,
        scale: 1.03,
        rotateY: 3,
        transformPerspective: 600,
        borderColor: "rgba(124,255,191,0.5)",
        duration: 0.3,
        ease: "power2.out"
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        x: 0,
        scale: 1,
        rotateY: 0,
        borderColor: card.classList.contains("active")
          ? "rgba(0,185,118,0.55)"
          : "rgba(255,255,255,0.14)",
        duration: 0.45,
        ease: "power3.out"
      });
    });
  });

  /* ═══════════════════════════════════════════════════════
     HERO PROOF BADGES — 3D Pop on Hover
     ═══════════════════════════════════════════════════════ */
  document.querySelectorAll(".hero-proof span").forEach((badge) => {
    badge.addEventListener("mouseenter", () => {
      gsap.to(badge, {
        y: -5,
        scale: 1.08,
        rotateX: 8,
        transformPerspective: 500,
        duration: 0.25,
        ease: "power2.out"
      });
    });
    badge.addEventListener("mouseleave", () => {
      gsap.to(badge, {
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.4,
        ease: "power3.out"
      });
    });
  });
})();
