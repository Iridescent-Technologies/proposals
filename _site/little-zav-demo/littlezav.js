/*
 * Little Zav embeddable widget (vanilla JS, no framework).
 *
 * Config comes from the iframe URL (?api=&tenant=&token=) or, for a real embed,
 * the host posts the token via postMessage({type:'littlezav:token', token}).
 * The widget fetches branding (public), themes itself, loads today's item,
 * renders it, and posts the play result back.
 */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var API = (params.get("api") || "").replace(/\/$/, "");
  var TENANT = params.get("tenant") || "zavmo";
  var TOKEN = params.get("token") || null;
  // Two surfaces, one runtime (§0): the default companion card (activity-driven
  // nudge/chat) vs the Play tile (?surface=play — content-driven authored games).
  var SURFACE = params.get("surface") === "play" ? "play" : "companion";
  var root = document.getElementById("little-zav");

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "littlezav:token" && e.data.token) {
      TOKEN = e.data.token;
      boot();
    }
  });

  var THEME = { accent: "#2FCFA8", bg: "#091522", text: "#EAFBF4",
    surface: "rgba(234,251,244,0.06)", font: "DM Sans" };
  var PLACEHOLDER = "Say hi to Little Zav";
  var CHAT = []; // the running conversation with Little Zav ({role, content})

  function applyTheme() {
    var s = document.documentElement.style;
    s.setProperty("--lz-accent", THEME.accent);
    s.setProperty("--lz-bg", THEME.bg);
    s.setProperty("--lz-text", THEME.text);
    s.setProperty("--lz-surface", THEME.surface);
    document.body.style.fontFamily = "'" + THEME.font + "', -apple-system, sans-serif";
  }
  function loadFont(family) {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(family) + ":wght@200;400;500;600&display=swap";
    document.head.appendChild(l);
  }

  function headers(extra) {
    var h = extra || {};
    if (TOKEN) h["Authorization"] = "Bearer " + TOKEN;
    return h;
  }

  function fetchBranding() {
    return fetch(API + "/api/public/tenants/" + TENANT + "/branding/")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.branding) {
          var b = d.branding;
          THEME.accent = b.accent_color || THEME.accent;
          THEME.bg = b.background_color || THEME.bg;
          THEME.text = b.text_color || THEME.text;
          THEME.surface = b.surface_color || THEME.surface;
          THEME.font = b.font_family || THEME.font;
          PLACEHOLDER = b.input_placeholder || PLACEHOLDER;
        }
        loadFont(THEME.font);
        applyTheme();
        return d;
      })
      .catch(function () { applyTheme(); return null; });
  }

  function fetchToday() {
    var path = SURFACE === "play" ? "/api/play/today/" : "/api/today/";
    return fetch(API + path, { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error("today " + r.status);
      return r.json();
    });
  }
  function play(deliveryId, correct, response) {
    // `response` (optional) is the learner's actual answer on a Reflect probe —
    // it feeds the anonymised disposition analytics. Undefined keys drop out of
    // the JSON, so a plain game sends exactly what it did before.
    return fetch(API + "/api/play/", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ delivery_id: deliveryId, correct: correct, response: response }),
    }).then(function (r) { return r.json(); });
  }
  function chat(messages) {
    return fetch(API + "/api/chat/", {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ messages: messages }),
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("chat " + r.status)); });
  }

  // --- Mascot + spark halo ------------------------------------------------
  // The learner's spark wallet, mirrored client-side so we can animate the halo
  // filling and detect the moment a ring closes.
  var sparks = { lit: 0, total: 12, rings: 0 };

  function _orbit(a, d, rev) {
    var km = rev ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : "";
    return '<g transform="rotate(' + a + ' 32 32)"><ellipse cx="32" cy="32" rx="13" ry="5.6" fill="none" stroke="' +
      THEME.accent + '" stroke-opacity=".35" stroke-width="1.1"/><circle r="2.2" fill="' + THEME.accent +
      '"><animateMotion dur="' + d + '" repeatCount="indefinite"' + km + '><mpath href="#lzorb"/></animateMotion></circle></g>';
  }
  function _atomDefs() {
    return '<defs><radialGradient id="lznuc" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f2fffb"/>' +
      '<stop offset=".5" stop-color="' + THEME.accent + '"/><stop offset="1" stop-color="' + THEME.accent + '"/></radialGradient>' +
      '<path id="lzorb" d="M19,32 a13,5.6 0 1,0 26,0 a13,5.6 0 1,0 -26,0" fill="none"/></defs>';
  }
  function _atomBody() {
    return _orbit(0, "2.6s", false) + _orbit(60, "3.5s", false) + _orbit(120, "2.1s", true) +
      '<circle class="lz-nuc" cx="32" cy="32" r="5" fill="url(#lznuc)"/><circle cx="32" cy="32" r="1.7" fill="#f2fffb"/>';
  }
  function atom(sz) {
    return '<svg id="lz-m" width="' + sz + '" height="' + sz + '" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
      _atomDefs() + _atomBody() + "</svg>";
  }
  // The Zavmo logomark: the atom + a 12-dot halo the learner completes with
  // sparks. Each earned spark lights the next dot; 12 closes the ring.
  function mascot(size, lit, celebrate) {
    var R = 29, dots = "";
    for (var i = 0; i < 12; i++) {
      var a = (-90 + i * 30) * Math.PI / 180, on = i < lit;
      var x = (32 + R * Math.cos(a)).toFixed(2), y = (32 + R * Math.sin(a)).toFixed(2);
      dots += '<circle class="lz-sd' + (on ? " on" : "") + '" id="lz-sd-' + i + '" cx="' + x + '" cy="' + y +
        '" r="2.3" stroke-width="1" fill="' + (on ? THEME.accent : "none") + '" stroke="' + THEME.accent +
        '" stroke-opacity="' + (on ? "0" : ".3") + '"/>';
    }
    return '<svg id="lz-m" class="lz-mascot' + (celebrate ? " lz-celebrate" : "") + '" width="' + size + '" height="' +
      size + '" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' + _atomDefs() + _atomBody() + dots + "</svg>";
  }
  function sparksText(s) {
    return s.lit + " / " + s.total + " sparks" + (s.rings ? " · " + s.rings + " ring" + (s.rings > 1 ? "s" : "") : "");
  }
  function pop() {
    var m = document.getElementById("lz-m");
    if (!m) return;
    m.style.animation = "zavpop .5s ease";
    setTimeout(function () { if (m) m.style.animation = ""; }, 520);
  }

  function messageCard(text) {
    return '<div class="lz-card"><div class="lz-row" style="align-items:center;gap:11px;">' +
      atom(40) + '<div class="lz-muted">' + text + "</div></div></div>";
  }

  function render(data) {
    sparks = data.sparks;
    var isPlay = SURFACE === "play";
    var name = isPlay ? "Play" : "Little Zav";
    var head =
      '<div class="lz-row" style="align-items:center;gap:12px;margin-bottom:2px;">' +
      '<span id="lz-mascot">' + mascot(56, data.sparks.lit) + "</span>" +
      '<div style="flex:1;"><div style="font-size:15px;font-weight:500;">' + name + "</div>" +
      '<div id="lz-sparks" class="lz-muted">' + sparksText(data.sparks) + "</div></div>";

    // Play tile at rest — no authored game live for this learner (§0): calm, not
    // empty; never fabricates a game (that's the companion card's job).
    if (isPlay && data.resting) {
      root.innerHTML =
        '<div class="lz-card">' + head + "</div>" +
        '<div class="lz-bubble">' + esc(data.greeting) + "</div></div>";
      return;
    }

    var pill = isPlay ? "Challenge" : "New";
    root.innerHTML =
      '<div class="lz-card">' + head +
      '<span class="lz-pill">' + pill + "</span></div>" +
      '<div class="lz-bubble" id="lz-voice">' + esc(data.greeting) + "</div>" +
      '<div id="lz-game"></div>' +
      (!isPlay && data.chat_enabled ? chatSection() : "") +
      "</div>";
    renderInteraction(data);
    if (!isPlay && data.chat_enabled) wireChat();
  }

  // --- Chat — a proactive, in-character conversation ---------------------
  function chatSection() {
    return '<div id="lz-chat"><div id="lz-chat-thread"></div>' +
      '<div class="lz-chatbar">' +
      '<input id="lz-chat-input" class="lz-chatinput" autocomplete="off" placeholder="' + esc(PLACEHOLDER) + '">' +
      '<button class="lz-btn" id="lz-chat-send">Send</button></div></div>';
  }
  function pushMsg(role, text, cls) {
    var thread = document.getElementById("lz-chat-thread");
    if (!thread) return null;
    var el = document.createElement("div");
    el.className = "lz-msg " + (role === "user" ? "me" : "zav") + (cls ? " " + cls : "");
    el.textContent = text;
    thread.appendChild(el);
    thread.scrollTop = thread.scrollHeight;
    return el;
  }
  function wireChat() {
    var input = document.getElementById("lz-chat-input");
    var send = document.getElementById("lz-chat-send");
    if (!input || !send) return;
    // Re-render restores prior turns (the thread lives in CHAT, not the DOM).
    CHAT.forEach(function (m) { pushMsg(m.role, m.content); });
    function go() {
      var text = (input.value || "").trim();
      if (!text || send.disabled) return;
      input.value = "";
      CHAT.push({ role: "user", content: text });
      pushMsg("user", text);
      send.disabled = true; input.disabled = true;
      var typing = pushMsg("zav", "…", "typing");
      chat(CHAT)
        .then(function (res) {
          var reply = (res && res.reply) || "Hmm, my words ran out. Try me again.";
          CHAT.push({ role: "assistant", content: reply });
          if (typing) typing.remove();
          pushMsg("zav", reply);
        })
        .catch(function () {
          if (typing) { typing.textContent = "I couldn't reply just then — try again in a moment."; typing.className = "lz-msg zav"; }
        })
        .then(function () { send.disabled = false; input.disabled = false; input.focus(); });
    }
    send.onclick = go;
    input.onkeydown = function (e) { if (e.key === "Enter") go(); };
  }

  function setVoice(t) { var v = document.getElementById("lz-voice"); if (v) v.textContent = t; }
  function setSparksText(s) { var el = document.getElementById("lz-sparks"); if (el) el.textContent = sparksText(s); }
  function drawMascot(lit, celebrate) { var w = document.getElementById("lz-mascot"); if (w) w.innerHTML = mascot(56, lit, celebrate); }
  function popDot(i) { var d = document.getElementById("lz-sd-" + i); if (d) d.style.animation = "lzsd .5s ease"; }

  // Reflect the play result on the halo: light the newly earned dot, or — when
  // the 12th spark closes the ring — fill it, celebrate, then reset to the fresh
  // ring. `rings` going up is how we know a ring just completed (the server
  // resets `lit` to 0 in the same response).
  function applySparks(res, correct) {
    if (!res || !res.sparks) { pop(); return; }
    var s = res.sparks;
    if (s.rings > sparks.rings) {
      drawMascot(12, true);
      setSparksText({ lit: 12, total: s.total, rings: sparks.rings });
      setVoice("Ring complete — that's the whole Zav. Nice one.");
      setTimeout(function () { drawMascot(s.lit); setSparksText(s); sparks = s; }, 1300);
      return;
    }
    drawMascot(s.lit);
    setSparksText(s);
    if (res.spark_awarded && s.lit > 0) popDot(s.lit - 1);
    sparks = s;
    setVoice(correct === false ? "Not quite — but nice try." : (res.spark_awarded ? "Spark lit." : "Got it."));
    pop();
  }

  var _startedAt = 0;  // when the current interaction was shown (for time-to-answer)

  function finish(deliveryId, correct, response) {
    // Attach the calibration signals (PLAY-7): how long they took, plus anything the
    // renderer passed (e.g. answer-switching). Undefined keys drop out of the JSON.
    var meta = { time_ms: _startedAt ? Date.now() - _startedAt : undefined };
    if (response) { for (var k in response) meta[k] = response[k]; }
    play(deliveryId, correct, meta).then(function (res) { applySparks(res, correct); });
  }

  function renderInteraction(data) {
    var g = document.getElementById("lz-game");
    var item = data.item, c = item.content || {}, did = data.delivery_id;
    _startedAt = Date.now();  // start the clock for time-to-answer

    if (item.type === "quiz") {
      g.innerHTML = '<div class="lz-q">' + esc(c.q) + "</div>" +
        (c.options || []).map(function (o, i) {
          return '<div class="lz-opt" data-i="' + i + '">' + esc(o) + "</div>";
        }).join("");
      var done = false;
      g.querySelectorAll(".lz-opt").forEach(function (el) {
        el.onclick = function () {
          if (done) return; done = true;
          var correct = +this.dataset.i === c.correct;
          this.classList.add(correct ? "ok" : "no");
          finish(did, correct);
        };
      });

    } else if (item.type === "swipe_myth") {
      g.innerHTML = '<div class="lz-opt" style="text-align:center;cursor:default;">' + esc(c.statement) + "</div>" +
        '<div class="lz-row"><div class="lz-opt" data-a="myth" style="flex:1;text-align:center;">Myth</div>' +
        '<div class="lz-opt" data-a="fact" style="flex:1;text-align:center;">Fact</div></div>';
      var d2 = false;
      g.querySelectorAll("[data-a]").forEach(function (el) {
        el.onclick = function () {
          if (d2) return; d2 = true;
          var correct = this.dataset.a === c.answer;
          this.classList.add(correct ? "ok" : "no");
          finish(did, correct);
        };
      });

    } else if (item.type === "swipe_sort") {
      g.innerHTML = (c.cards || []).map(function (card, i) {
        return '<div class="lz-sortrow" data-k="' + card.k + '" data-done="0" style="margin-bottom:8px;">' +
          '<div class="lz-muted" style="margin-bottom:4px;">' + esc(card.h) + "</div>" +
          '<div class="lz-row"><div class="lz-opt sb" data-side="' + c.left.key + '" style="flex:1;text-align:center;">' + esc(c.left.label) + "</div>" +
          '<div class="lz-opt sb" data-side="' + c.right.key + '" style="flex:1;text-align:center;">' + esc(c.right.label) + "</div></div></div>";
      }).join("");
      var total = (c.cards || []).length, solved = 0;
      g.querySelectorAll(".lz-sortrow").forEach(function (row) {
        row.querySelectorAll(".sb").forEach(function (btn) {
          btn.onclick = function () {
            if (row.dataset.done === "1") return;
            if (this.dataset.side === row.dataset.k) {
              row.dataset.done = "1"; this.classList.add("ok"); solved++;
              if (solved === total) finish(did, true);
            } else {
              this.classList.add("no");
              var self = this;
              setTimeout(function () { self.classList.remove("no"); }, 400);
              setVoice("Not that side — have another look.");
            }
          };
        });
      });

    } else if (item.type === "would_you_rather") {
      g.innerHTML = '<div class="lz-opt" data-x="a" style="text-align:center;font-weight:500;">' + esc(c.a) + "</div>" +
        '<div class="lz-muted" style="text-align:center;margin:2px 0;">or</div>' +
        '<div class="lz-opt" data-x="b" style="text-align:center;font-weight:500;">' + esc(c.b) + "</div>";
      var d3 = false;
      g.querySelectorAll("[data-x]").forEach(function (el) {
        el.onclick = function () {
          if (d3) return; d3 = true; this.classList.add("ok");
          finish(did, null, { choice: this.dataset.x });  // "a" | "b" — learning preference
        };
      });

    } else if (item.type === "reflect_agree") {
      g.innerHTML = '<div class="lz-opt" style="text-align:center;cursor:default;">' + esc(c.statement) + "</div>" +
        '<div class="lz-row"><div class="lz-opt" data-x="agree" style="flex:1;text-align:center;">Agree</div>' +
        '<div class="lz-opt" data-x="disagree" style="flex:1;text-align:center;">Disagree</div></div>';
      var d4 = false;
      g.querySelectorAll("[data-x]").forEach(function (el) {
        el.onclick = function () {
          if (d4) return; d4 = true; this.classList.add("ok");
          finish(did, null, { agree: this.dataset.x === "agree" });  // mindset probe
        };
      });

    } else if (item.type === "tip") {
      g.innerHTML = '<div class="lz-bubble" style="border-radius:12px;">' + esc(c.tip) + "</div>" +
        '<button class="lz-btn" id="lz-tip">Nice, save it</button>';
      var d5 = false;
      g.querySelector("#lz-tip").onclick = function () {
        if (d5) return; d5 = true; this.style.opacity = ".6"; this.textContent = "Saved"; finish(did, null);
      };

    } else if (item.type === "scenario_timed") {
      // Signature type: a timed judgement call. Wrong springs back (no punish);
      // the countdown is gentle — time running out never fails you, it just eases off.
      var secs = Math.max(3, Math.min(30, +c.seconds || 8));
      g.innerHTML =
        (c.eyebrow ? '<div class="lz-muted" style="margin-bottom:4px;">' + esc(c.eyebrow) + "</div>" : "") +
        '<div class="lz-q">' + esc(c.stem) + "</div>" +
        '<div style="height:4px;border-radius:99px;background:rgba(234,251,244,.12);overflow:hidden;margin-bottom:10px;">' +
          '<div id="lz-tbar" style="height:100%;width:100%;background:currentColor;opacity:.55;"></div></div>' +
        (c.options || []).map(function (o, i) { return '<div class="lz-opt" data-i="' + i + '">' + esc(o) + "</div>"; }).join("");
      var sdone = false, sswitch = 0, sbar = g.querySelector("#lz-tbar");
      if (sbar) { sbar.style.transition = "width " + secs + "s linear"; requestAnimationFrame(function () { sbar.style.width = "0%"; }); }
      g.querySelectorAll(".lz-opt").forEach(function (opt) {
        opt.onclick = function () {
          if (sdone) return;
          if (+this.dataset.i === c.correct) {
            sdone = true; this.classList.add("ok"); if (sbar) sbar.style.transition = "none";
            finish(did, true, { switches: sswitch });
          } else {
            sswitch++;  // a wrong reach before the right call — answer-switching signal
            var self = this; self.classList.add("no");
            setTimeout(function () { self.classList.remove("no"); }, 480);  // spring back
          }
        };
      });

    } else if (item.type === "branch") {
      // Signature type: a short branching scenario. Pick the right move to go on;
      // a wrong move springs back — never a dead end. Spark on the final right call.
      var steps = c.steps || [], bidx = 0, bdone = false, bswitch = 0;
      var drawStep = function () {
        var s = steps[bidx] || {};
        g.innerHTML =
          '<div class="lz-muted" style="margin-bottom:4px;">Step ' + (bidx + 1) + " of " + steps.length + "</div>" +
          '<div class="lz-q">' + esc(s.stem) + "</div>" +
          (s.options || []).map(function (o, i) { return '<div class="lz-opt" data-i="' + i + '">' + esc(o.label) + "</div>"; }).join("");
        g.querySelectorAll(".lz-opt").forEach(function (opt) {
          opt.onclick = function () {
            if (bdone) return;
            var chosen = (s.options || [])[+this.dataset.i] || {};
            if (chosen.correct) {
              this.classList.add("ok");
              if (bidx >= steps.length - 1) { bdone = true; finish(did, true, { switches: bswitch }); }
              else { bidx++; setTimeout(drawStep, 260); }
            } else {
              bswitch++;  // a wrong reach at this step — answer-switching signal
              var self = this; self.classList.add("no");
              setTimeout(function () { self.classList.remove("no"); }, 480);  // spring back
            }
          };
        });
      };
      if (steps.length) drawStep();
      else g.innerHTML = '<div class="lz-muted">Nothing to show right now.</div>';

    } else {
      g.innerHTML = '<div class="lz-muted">Nothing to show right now.</div>';
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function boot() {
    if (!TOKEN) { root.innerHTML = messageCard("Waiting for sign-in…"); return; }
    root.innerHTML = messageCard("Loading…");
    fetchToday().then(render).catch(function () {
      root.innerHTML = messageCard("Couldn’t load Little Zav.");
    });
  }

  fetchBranding().then(function () {
    if (TOKEN) boot();
    else root.innerHTML = messageCard("Waiting for sign-in…");
  });
})();
