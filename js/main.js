/* ==========================================================================
   Academic performance regarding mental health in 9th grade
   Scroll narrative, motion and interaction layer.

   Every effect here is enhancement only: with JavaScript disabled or motion
   reduced, the document remains a complete, readable, ordered case study.
   ========================================================================== */

(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionQuery.matches;

  var clamp = function (v, min, max) { return v < min ? min : v > max ? max : v; };

  /* --- Scroll dispatcher -------------------------------------------------
     One rAF-throttled listener drives every scroll-linked effect, so the
     page never stacks competing handlers on the scroll event.             */

  var scrollTasks = [];
  var resizeTasks = [];
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      for (var i = 0; i < scrollTasks.length; i++) scrollTasks[i]();
      ticking = false;
    });
  }

  function onResize() {
    for (var i = 0; i < resizeTasks.length; i++) resizeTasks[i]();
    onScroll();
  }

  /* --- Reveal on enter ---------------------------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el, i) {
      var group = el.getAttribute('data-stagger');
      if (group) el.style.setProperty('--reveal-delay', (parseInt(group, 10) * 90) + 'ms');
      io.observe(el);
    });
  }

  /* --- ACT I · cinematic entrance ----------------------------------------
     Four still photographs are crossfaded and slowly de-zoomed against a
     continuous scroll index, so the sequence reads as one move from the
     building's exterior into its interior. No video is involved.          */

  function initCinema() {
    var cinema = document.querySelector('[data-cinema]');
    if (!cinema) return;

    var frames = Array.prototype.slice.call(cinema.querySelectorAll('.cinema__frame'));
    var copies = Array.prototype.slice.call(cinema.querySelectorAll('.cinema__copy'));
    var cue = cinema.querySelector('.scrollcue');
    var last = frames.length - 1;

    if (reduced || !frames.length) {
      cinema.classList.add('is-static');
      frames.forEach(function (f) { f.style.setProperty('--o', 1); });
      copies.forEach(function (c) { c.style.setProperty('--o', 1); c.style.setProperty('--y', 0); });
      return;
    }

    cinema.style.setProperty('--frames', frames.length);

    function update() {
      var rect = cinema.getBoundingClientRect();
      var travel = cinema.offsetHeight - window.innerHeight;
      if (travel <= 0) return;

      // Eased mapping: the opening frame holds while the title is being read,
      // then the sequence moves through the interiors at a steadier pace.
      var p = clamp(-rect.top / travel, 0, 1);
      var index = last * Math.pow(p, 1.3);

      for (var i = 0; i <= last; i++) {
        var d = index - i;
        // Each frame holds, then fades IN over the one before it across the
        // last third of the preceding segment and stays opaque afterwards:
        // the layer underneath is always solid, so the crossfade never lets
        // the background bleed through and never lingers as a double exposure.
        frames[i].style.setProperty('--o', clamp((d + 0.78) / 0.36, 0, 1).toFixed(3));
        // Fixed modest zoom, drift carried by translation: a large scale on a
        // raster photograph is the one thing here that visibly costs detail.
        var img = frames[i].firstElementChild;
        img.style.setProperty('--s', '1.03');
        img.style.setProperty('--ty', (clamp(d, -1, 1) * -12).toFixed(2) + 'px');

        // The line lingers as the room changes, clears while the new frame
        // settles, then arrives on a still image. Two captions never overlap.
        var co = 1 - clamp((Math.abs(d) - 0.18) / 0.22, 0, 1);
        copies[i].style.setProperty('--o', co.toFixed(3));
        copies[i].style.setProperty('--y', clamp(d, -1, 1).toFixed(3));
        // Frame 0 carries the page's <h1>; it is never hidden from assistive
        // technology, whatever the scroll position.
        if (i > 0) copies[i].setAttribute('aria-hidden', co < 0.12 ? 'true' : 'false');
      }

      if (cue) cue.style.setProperty('--cue', clamp(1 - p * 8, 0, 1).toFixed(3));
    }

    scrollTasks.push(update);
    resizeTasks.push(update);
    update();
  }

  /* --- Scroll progress + masthead ----------------------------------------- */

  function initChrome() {
    var fill = document.querySelector('[data-progress]');
    var masthead = document.querySelector('[data-masthead]');
    var lightSentinel = document.querySelector('[data-chrome-light]');
    var darkBands = Array.prototype.slice.call(
      document.querySelectorAll('.band--dark, .pivot, .colophon'));

    function update() {
      if (fill) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        fill.style.setProperty('--p', max > 0 ? clamp(window.scrollY / max, 0, 1).toFixed(4) : 0);
      }
      if (!masthead) return;

      if (lightSentinel) {
        masthead.classList.toggle('is-solid', lightSentinel.getBoundingClientRect().bottom <= 64);
      }
      // Invert the bar over dark bands so it never cuts a white strip across
      // a full-bleed photograph or a navy chapter.
      var probe = 34;
      var onDark = false;
      for (var i = 0; i < darkBands.length; i++) {
        var r = darkBands[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) { onDark = true; break; }
      }
      masthead.classList.toggle('is-dark', onDark);
    }

    scrollTasks.push(update);
    resizeTasks.push(update);
    update();
  }

  /* --- Headline statistics ----------------------------------------------
     These are the most consequential facts on the page, so they are never
     counted up: a number that briefly reads as a different, equally
     plausible figure is a real hazard on an assessed document. They are
     wiped into view at their true value and nothing else.                 */

  /* --- Magnitude bars grow on entry --------------------------------------- */

  function initBars() {
    var fills = document.querySelectorAll('.bars__fill');
    if (!fills.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      fills.forEach(function (el) { el.style.setProperty('--grow', 1); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        entry.target.style.setProperty('--grow', 1);
      });
    }, { threshold: 0.35 });

    fills.forEach(function (el, i) {
      el.style.setProperty('--grow', 0);
      el.style.setProperty('--reveal-delay', ((i % 5) * 80) + 'ms');
      io.observe(el);
    });
  }

  /* --- Chart hover linking -----------------------------------------------
     All values are permanently visible in each chart's key, so hovering
     emphasises a segment and its row rather than summoning a tooltip.    */

  function initChartHover() {
    document.querySelectorAll('[data-chart]').forEach(function (chart) {
      var segs = chart.querySelectorAll('[data-seg]');
      var rows = chart.querySelectorAll('[data-row]');
      if (!segs.length) return;

      function set(name) {
        chart.classList.toggle('is-hovering', !!name);
        segs.forEach(function (s) { s.classList.toggle('is-hot', s.dataset.seg === name); });
        rows.forEach(function (r) { r.classList.toggle('is-hot', r.dataset.row === name); });
      }

      segs.forEach(function (s) {
        s.addEventListener('mouseenter', function () { set(s.dataset.seg); });
      });
      rows.forEach(function (r) {
        r.addEventListener('mouseenter', function () { set(r.dataset.row); });
      });
      chart.addEventListener('mouseleave', function () { set(null); });
    });
  }

  /* --- Team sequence -------------------------------------------------------
     Pinned on wide screens: scroll selects which member is active, and the
     five resolve into the shared-outcome frame. On phones, and for anyone
     who has asked for reduced motion, the same markup flows as a list and
     each member simply reveals as it arrives. Nothing is scroll-locked.  */

  function initCrew() {
    var crew = document.querySelector('[data-crew]');
    if (!crew) return;

    var members = Array.prototype.slice.call(crew.querySelectorAll('.crew__member'));
    var dots = Array.prototype.slice.call(crew.querySelectorAll('[data-dot]'));
    if (!members.length) return;

    var flowQuery = window.matchMedia('(max-width: 900px)');
    var mode = null;
    var pinnedUpdate = null;
    var flowObserver = null;

    function setActive(i) {
      members.forEach(function (m, n) { m.classList.toggle('is-active', n === i); });
      dots.forEach(function (d, n) { d.classList.toggle('is-on', n === i); });
    }

    function usePinned() {
      if (mode === 'pinned') return;
      mode = 'pinned';
      crew.classList.remove('is-flow');
      if (flowObserver) { flowObserver.disconnect(); flowObserver = null; }

      pinnedUpdate = function () {
        var rect = crew.getBoundingClientRect();
        var travel = crew.offsetHeight - window.innerHeight;
        if (travel <= 0) return;
        var p = clamp(-rect.top / travel, 0, 1);
        setActive(clamp(Math.round(p * (members.length - 1)), 0, members.length - 1));
      };
      scrollTasks.push(pinnedUpdate);
      resizeTasks.push(pinnedUpdate);
      pinnedUpdate();
    }

    function useFlow() {
      if (mode === 'flow') return;
      mode = 'flow';
      crew.classList.add('is-flow');

      // Retire the pinned handler rather than leaving it running.
      var i = scrollTasks.indexOf(pinnedUpdate);
      if (i > -1) scrollTasks.splice(i, 1);
      i = resizeTasks.indexOf(pinnedUpdate);
      if (i > -1) resizeTasks.splice(i, 1);
      pinnedUpdate = null;

      dots.forEach(function (d) { d.classList.remove('is-on'); });

      if (reduced || !('IntersectionObserver' in window)) {
        members.forEach(function (m) { m.classList.add('is-active'); });
        return;
      }
      members.forEach(function (m) { m.classList.remove('is-active'); });
      flowObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-active');
          flowObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
      members.forEach(function (m) { flowObserver.observe(m); });
    }

    function decide() {
      if (reduced || flowQuery.matches) useFlow(); else usePinned();
    }

    decide();
    if (typeof flowQuery.addEventListener === 'function') {
      flowQuery.addEventListener('change', decide);
    }
  }

  /* --- Product showcase: which step is on screen -------------------------- */

  function initShowcase() {
    var shots = document.querySelectorAll('[data-step-shot]');
    var steps = document.querySelectorAll('[data-step]');
    if (!shots.length || !steps.length || !('IntersectionObserver' in window)) {
      steps.forEach(function (s) { s.classList.add('is-current'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('data-step-shot');
        steps.forEach(function (s) {
          s.classList.toggle('is-current', s.getAttribute('data-step') === id);
        });
      });
    }, { rootMargin: '-35% 0px -45% 0px' });

    shots.forEach(function (s) { io.observe(s); });
  }

  /* --- Parallax on full-bleed evidence photography ------------------------ */

  function initParallax() {
    var media = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!media.length || reduced) return;

    function update() {
      for (var i = 0; i < media.length; i++) {
        var el = media[i];
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) continue;
        var centre = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.setProperty('--py', (clamp(centre, -1, 1) * -34).toFixed(2) + 'px');
      }
    }

    scrollTasks.push(update);
    resizeTasks.push(update);
    update();
  }

  /* --- Testimonial player -------------------------------------------------
     The recording is never autoplayed and is not preloaded; the designed
     plate stands in for a poster frame until the viewer chooses to play.  */

  function initPlayer() {
    var player = document.querySelector('[data-player]');
    if (!player) return;

    var video = player.querySelector('video');
    var button = player.querySelector('[data-play]');
    if (!video || !button) return;

    button.addEventListener('click', function () {
      player.classList.add('is-playing');
      video.setAttribute('controls', '');
      video.preload = 'auto';
      var played = video.play();
      if (played && typeof played.catch === 'function') {
        played.catch(function () { video.focus(); });
      } else {
        video.focus();
      }
    });

    video.addEventListener('ended', function () {
      player.classList.remove('is-playing');
    });
  }

  /* --- Student perspective film ------------------------------------------
     Plays once, automatically, when its section is meaningfully on screen.
     Scroll decides only WHEN playback starts; it never drives the timeline,
     and the section is never pinned or scroll-locked.                     */

  function initPerspectiveFilm() {
    var film = document.querySelector('[data-film]');
    if (!film) return;

    var video = film.querySelector('video');
    var soundBtn = film.querySelector('[data-film-sound]');
    var replayBtn = film.querySelector('[data-film-replay]');
    if (!video) return;

    // Reduced motion: never autoplay. Native controls stay, and the
    // transcribed statement is already visible.
    if (reduced || !('IntersectionObserver' in window)) return;

    film.classList.add('is-armed');
    video.removeAttribute('controls');

    // Browsers allow sound only after the viewer has interacted with the
    // page, so track that and fall back to a muted start when they have not.
    var interacted = false;
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
      window.addEventListener(evt, function () { interacted = true; },
        { once: true, passive: true });
    });

    var soundWanted = false;
    var finished = false;
    var watchdog;

    function play(onFail) {
      var pr = video.play();
      if (pr && typeof pr.catch === 'function') pr.catch(onFail || function () {});
    }

    // Anything that stops playback from ever beginning — autoplay refused,
    // the file unreachable, a codec the browser cannot decode — must still
    // leave the viewer with the statement and a way to play it, never a
    // blank frame.
    function release() {
      clearTimeout(watchdog);
      film.classList.remove('is-armed');
      video.setAttribute('controls', '');
    }

    function attempt() {
      if (finished) return;
      video.muted = !(interacted || soundWanted);
      play(function () {
        // Sound was refused — retry silently, which browsers do allow.
        video.muted = true;
        play(release);
      });

      clearTimeout(watchdog);
      watchdog = setTimeout(function () {
        // readyState 0 means not even metadata arrived: the media failed
        // rather than merely buffering.
        if (video.readyState === 0) release();
      }, 3000);
    }

    video.addEventListener('error', release, true);

    video.addEventListener('playing', function () {
      clearTimeout(watchdog);
      film.classList.add('is-live');
      if (soundBtn) soundBtn.hidden = !video.muted;
    });

    video.addEventListener('ended', function () {
      finished = true;
      film.classList.remove('is-live');
      film.classList.add('is-done');
      if (soundBtn) soundBtn.hidden = true;
      if (replayBtn) replayBtn.hidden = false;
    });

    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        soundWanted = true;
        video.muted = false;
        soundBtn.hidden = true;
      });
    }

    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        finished = false;
        soundWanted = true;
        replayBtn.hidden = true;
        film.classList.remove('is-done');
        video.currentTime = 0;
        video.muted = false;
        play(function () {
          video.muted = true;
          play();
          if (soundBtn) soundBtn.hidden = false;
        });
      });
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) attempt();
        else if (!video.paused) video.pause();  // courtesy pause off screen
      });
    }, { threshold: 0.55 }).observe(film);
  }

  /* --- Chapter cards -------------------------------------------------------
     Two lines rise out of a mask when the card is reached. Nothing else on
     the screen moves.                                                      */

  function initCards() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
    if (!cards.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('is-flat'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var on = entry.isIntersecting;
        var el = entry.target;
        el.style.setProperty('--ce', on ? 1 : 0);
        el.style.setProperty('--cr', on ? 1 : 0);
        el.querySelectorAll('.card__line span').forEach(function (sp) {
          sp.style.setProperty('--cy', on ? '0%' : '105%');
        });
      });
    }, { threshold: 0.25 });
    cards.forEach(function (c) { io.observe(c); });
  }

  /* --- Pinned scene stages -------------------------------------------------
     Scroll selects which scene is active; the visual object beside it swaps
     layers. Scroll never scrubs an animation and the section is released as
     soon as its last scene has been read.                                  */

  function initStages() {
    var stages = Array.prototype.slice.call(document.querySelectorAll('[data-stage]'));
    if (!stages.length) return;

    var flowQuery = window.matchMedia('(max-width: 900px)');

    stages.forEach(function (stage) {
      var scenes = Array.prototype.slice.call(stage.querySelectorAll('[data-scene]'));
      var layers = Array.prototype.slice.call(stage.querySelectorAll('[data-for]'));
      var week = stage.querySelector('[data-week]');
      if (!scenes.length) return;

      var task = null;

      function apply(n) {
        scenes.forEach(function (s) { s.classList.toggle('is-on', +s.dataset.scene === n); });
        layers.forEach(function (l) {
          l.classList.toggle('is-on', l.dataset.for.split(',').indexOf(String(n)) > -1);
        });
        if (week) {
          week.classList.toggle('is-loaded', n >= 1);
          week.classList.toggle('is-sorted', n >= 2);
        }
      }

      function flat() {
        stage.classList.add('is-flat');
        if (task) { var i = scrollTasks.indexOf(task); if (i > -1) scrollTasks.splice(i, 1); task = null; }
        scenes.forEach(function (s) { s.classList.add('is-on'); });
        layers.forEach(function (l) { l.classList.add('is-on'); });
        if (week) week.classList.add('is-loaded', 'is-sorted');
      }

      function pinned() {
        stage.classList.remove('is-flat');
        if (task) return;
        task = function () {
          var rect = stage.getBoundingClientRect();
          var travel = stage.offsetHeight - window.innerHeight;
          if (travel <= 0) return;
          var p = clamp(-rect.top / travel, 0, 1);
          apply(clamp(Math.round(p * (scenes.length - 1)), 0, scenes.length - 1));
        };
        scrollTasks.push(task);
        resizeTasks.push(task);
        task();
      }

      function decide() { if (reduced || flowQuery.matches) flat(); else pinned(); }
      decide();
      if (typeof flowQuery.addEventListener === 'function') flowQuery.addEventListener('change', decide);
    });
  }

  /* --- Part V · text-led story ---------------------------------------------
     Ten states over one pinned composition. Words accumulate and crowd, the
     evidence clears the screen, the same words reorganise into a grid, three
     decisions take the floor in turn, and the section resolves. No platform
     imagery here — the showcase later keeps that reveal.                   */

  function initS05() {
    var root = document.querySelector('[data-s05]');
    if (!root) return;

    var blocks = Array.prototype.slice.call(root.querySelectorAll('[data-block]'));
    var typed = Array.prototype.slice.call(root.querySelectorAll('[data-line]'));
    var STATES = 11;

    // Scattered while the work piles up; a single aligned row once the
    // section turns from the problem to the response.
    var SCATTER = [[-31,-17],[29,-21],[-27,17],[31,13]];
    var GRID    = [[-33,26],[-11,26],[11,26],[33,26]];

    var flowQuery = window.matchMedia('(max-width: 900px)');
    var task = null;

    function place(el, x, y, s, o) {
      el.style.setProperty('--bx', x + 'px');
      el.style.setProperty('--by', y + 'px');
      el.style.setProperty('--bs', s);
      el.style.setProperty('--bo', o);
    }

    function apply(n) {
      var w = root.clientWidth || 1200;
      var pin = root.querySelector('.s05__pin');
      var h = (pin && pin.clientHeight) || 700;

      blocks.forEach(function (el, i) {
        var entry = i + 1;                     // one responsibility per state
        var lead = (n === entry);
        el.toggleAttribute('data-lead', lead);

        if (n < entry) { place(el, 0, 0, '0.9', '0'); return; }

        if (n <= 4) {                          // accumulating
          var age = n - entry;
          place(el, SCATTER[i][0] / 100 * w, SCATTER[i][1] / 100 * h,
                (lead ? 1.07 : Math.max(0.93, 1 - age * 0.035)).toFixed(3),
                (lead ? 1 : Math.max(0.4, 0.82 - age * 0.14)).toFixed(2));
        } else if (n === 5) {                  // secondary to the big statement
          place(el, SCATTER[i][0] / 100 * w, SCATTER[i][1] / 100 * h, '0.95', '0.42');
        } else if (n === 6) {                  // the evidence clears the screen
          place(el, SCATTER[i][0] / 100 * w, SCATTER[i][1] / 100 * h, '0.9', '0.05');
        } else if (n <= 9) {                   // back, aligned into order
          place(el, GRID[i][0] / 100 * w, GRID[i][1] / 100 * h, '1',
                n === 7 ? '0.62' : '0.3');
        } else {
          place(el, GRID[i][0] / 100 * w, GRID[i][1] / 100 * h, '1', '0');
        }
      });

      typed.forEach(function (el) { el.classList.toggle('is-on', +el.dataset.line === n); });
    }

    function flat() {
      root.classList.add('is-flat');
      if (task) { var i = scrollTasks.indexOf(task); if (i > -1) scrollTasks.splice(i, 1); task = null; }
      blocks.forEach(function (el) { el.removeAttribute('style'); el.removeAttribute('data-lead'); });
      typed.forEach(function (el) { el.classList.add('is-on'); });
    }

    function pinned() {
      root.classList.remove('is-flat');
      if (task) return;
      task = function () {
        var rect = root.getBoundingClientRect();
        var travel = root.offsetHeight - window.innerHeight;
        if (travel <= 0) return;
        var p = clamp(-rect.top / travel, 0, 1);
        apply(clamp(Math.round(p * (STATES - 1)), 0, STATES - 1));
      };
      scrollTasks.push(task);
      resizeTasks.push(task);
      task();
    }

    function decide() { if (reduced || flowQuery.matches) flat(); else pinned(); }
    decide();
    if (typeof flowQuery.addEventListener === 'function') flowQuery.addEventListener('change', decide);
  }

  /* --- Campaign exhibition -------------------------------------------------
     A stack of printed pieces that separates, then shows one poster at a
     time. On phones the same markup becomes a swipeable rail.             */

  function initExhibit() {
    var ex = document.querySelector('[data-exhibit]');
    if (!ex) return;

    var items = Array.prototype.slice.call(ex.querySelectorAll('.exhibit__item'));
    var count = ex.querySelector('[data-exhibit-count]');
    if (!items.length) return;

    var flowQuery = window.matchMedia('(max-width: 900px)');
    var task = null;

    function set(el, o) {
      for (var k in o) el.style.setProperty(k, o[k]);
    }

    function apply(state) {
      var w = items[0].offsetWidth || 260;
      items.forEach(function (it, i) {
        if (state === 0) {                       // the stack, as printed pieces
          set(it, { '--ex': (i * 7 - 14) + 'px', '--ey': (i * -5 + 10) + 'px',
                    '--er': ((i - 2) * 1.7) + 'deg', '--es': '0.95', '--eo': '1', '--ez': String(i + 1) });
          it.classList.remove('is-front');
        } else {
          var d = i - (state - 1);
          set(it, { '--ex': (d * w * 1.06).toFixed(1) + 'px', '--ey': '0px', '--er': '0deg',
                    '--es': d === 0 ? '1' : '0.86',
                    '--eo': Math.abs(d) > 2 ? '0' : (d === 0 ? '1' : '0.4'),
                    '--ez': String(10 - Math.abs(d)) });
          it.classList.toggle('is-front', d === 0);
        }
      });
      if (count) count.textContent = state === 0 ? 'The stack' :
        ('0' + state) + ' / 05';
    }

    function flat() {
      ex.classList.add('is-flat');
      if (task) { var i = scrollTasks.indexOf(task); if (i > -1) scrollTasks.splice(i, 1); task = null; }
      items.forEach(function (it) { it.removeAttribute('style'); it.classList.remove('is-front'); });
      if (count) count.textContent = '01 – 05';
    }

    function pinned() {
      ex.classList.remove('is-flat');
      if (task) return;
      task = function () {
        var rect = ex.getBoundingClientRect();
        var travel = ex.offsetHeight - window.innerHeight;
        if (travel <= 0) return;
        var p = clamp(-rect.top / travel, 0, 1);
        apply(clamp(Math.round(p * 5), 0, 5));
      };
      scrollTasks.push(task);
      resizeTasks.push(task);
      task();
    }

    function decide() { if (reduced || flowQuery.matches) flat(); else pinned(); }
    decide();
    if (typeof flowQuery.addEventListener === 'function') flowQuery.addEventListener('change', decide);
  }

  /* --- Contextual cursor label (fine pointers only) ------------------------ */

  function initCursor() {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var targets = document.querySelectorAll('[data-cursor]');
    if (!targets.length) return;

    var lab = document.createElement('div');
    lab.className = 'cursorlab';
    lab.setAttribute('aria-hidden', 'true');
    document.body.appendChild(lab);

    var x = 0, y = 0, queued = false;
    function draw() {
      queued = false;
      lab.style.setProperty('--cx', x + 'px');
      lab.style.setProperty('--cyy', y + 'px');
    }
    document.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(draw); }
    }, { passive: true });

    targets.forEach(function (t) {
      t.addEventListener('pointerenter', function () {
        lab.textContent = t.getAttribute('data-cursor');
        lab.classList.add('is-on');
      });
      t.addEventListener('pointerleave', function () { lab.classList.remove('is-on'); });
    });
  }

  /* --- Evidence index overlay --------------------------------------------- */

  function initIndex() {
    var panel = document.querySelector('[data-index]');
    var openers = document.querySelectorAll('[data-index-open]');
    if (!panel || !openers.length) return;

    var closers = panel.querySelectorAll('[data-index-close]');
    var links = panel.querySelectorAll('a[href^="#"]');
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      panel.classList.add('is-open');
      panel.removeAttribute('aria-hidden');
      document.body.classList.add('is-locked');
      openers.forEach(function (o) { o.setAttribute('aria-expanded', 'true'); });
      var first = panel.querySelector('a, button');
      if (first) first.focus();
    }

    function close() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      openers.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
      if (lastFocus) lastFocus.focus();
    }

    openers.forEach(function (o) { o.addEventListener('click', open); });
    closers.forEach(function (c) { c.addEventListener('click', close); });
    links.forEach(function (l) { l.addEventListener('click', close); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
    });
  }

  /* --- Lightbox for evidence screenshots ---------------------------------- */

  function initLightbox() {
    var box = document.querySelector('[data-lightbox]');
    if (!box) return;

    var stage = box.querySelector('[data-lightbox-stage]');
    var label = box.querySelector('[data-lightbox-label]');
    var prev = box.querySelector('[data-lightbox-prev]');
    var next = box.querySelector('[data-lightbox-next]');
    var close = box.querySelector('[data-lightbox-close]');
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-zoom]'));
    if (!triggers.length) return;

    var current = 0;
    var lastFocus = null;

    function render(i) {
      current = (i + triggers.length) % triggers.length;
      var t = triggers[current];
      stage.innerHTML = '';
      var img = document.createElement('img');
      img.src = t.getAttribute('data-zoom');
      img.alt = t.getAttribute('data-zoom-alt') || '';
      stage.appendChild(img);
      label.textContent = (current + 1) + ' / ' + triggers.length + ' · ' +
        (t.getAttribute('data-zoom-label') || '');
    }

    function open(i) {
      lastFocus = document.activeElement;
      render(i);
      box.classList.add('is-open');
      box.removeAttribute('aria-hidden');
      document.body.classList.add('is-locked');
      close.focus();
    }

    function hide() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      stage.innerHTML = '';
      if (lastFocus) lastFocus.focus();
    }

    triggers.forEach(function (t, i) {
      t.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    });
    close.addEventListener('click', hide);
    prev.addEventListener('click', function () { render(current - 1); });
    next.addEventListener('click', function () { render(current + 1); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') render(current - 1);
      if (e.key === 'ArrowRight') render(current + 1);
    });
  }

  /* --- Boot --------------------------------------------------------------- */

  function boot() {
    document.documentElement.classList.add('js');
    initReveal();
    initCinema();
    initChrome();
    initBars();
    initCrew();
    initCards();
    initStages();
    initS05();
    initExhibit();
    initCursor();
    initChartHover();
    initShowcase();
    initParallax();
    initPlayer();
    initPerspectiveFilm();
    initIndex();
    initLightbox();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', function () { window.location.reload(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
