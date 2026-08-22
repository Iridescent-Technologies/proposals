/*
 * Demo-only mock backend for the Little Zav widget.
 *
 * The real widget (index.html + littlezav.js, copied verbatim from the littlezav
 * repo) normally talks to a token-authenticated Django backend. For a static,
 * shareable customer demo there is no backend. So this shim overrides fetch()
 * and answers the three calls the widget makes with hand-authored sample data:
 *
 *   GET  /api/public/tenants/:t/branding/  -> 404 (widget falls back to the
 *                                             default DM Sans + teal Zavmo theme)
 *   GET  /api/today/                       -> today's interaction (chosen by ?item=)
 *   POST /api/play/                        -> lights the next spark
 *
 * The host page (learner.html) drives which interaction shows via ?item= and how
 * many sparks are already lit via ?lit=, so a "Try another" button just reloads
 * the iframe with the next type. Nothing here runs in production.
 */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var TYPE = q.get("item") || "quiz";
  var LIT = Math.max(0, Math.min(11, parseInt(q.get("lit"), 10) || 5));
  var TOTAL = 12;

  // One authored sample per interaction type. Content shapes match the backend
  // contract in services/interactions.py.
  var ITEMS = {
    quiz: {
      greeting: "Morning Jordan. One quick thing from your feedback lesson.",
      item: { type: "quiz", topic: "Giving feedback", content: {
        q: "What makes feedback most likely to actually land?",
        options: [
          "Save it all up for the annual review",
          "Tie it to a specific, recent example",
          "Focus on what their personality is like",
          "Deliver it in front of the whole team"
        ],
        correct: 1
      } }
    },
    scenario_timed: {
      greeting: "You've got a few seconds. Go with your gut.",
      item: { type: "scenario_timed", topic: "Prioritising under pressure", content: {
        eyebrow: "Scenario · beat the timer",
        stem: "It's 9am and three things land at once: an angry client email, a teammate blocked and waiting on you, and a report due at noon. What do you touch first?",
        options: [
          "The report: the deadline is fixed",
          "Unblock your teammate: it frees two people up",
          "Fire back at the client while you're annoyed",
          "Make a coffee and think about it"
        ],
        correct: 1,
        seconds: 10
      } }
    },
    swipe_myth: {
      greeting: "Myth or fact? Quick flick.",
      item: { type: "swipe_myth", topic: "How learning works", content: {
        statement: "You learn best by sticking to your one fixed ‘learning style’.",
        answer: "myth"
      } }
    },
    would_you_rather: {
      greeting: "No wrong answer here. Just curious.",
      item: { type: "would_you_rather", topic: "Ways of working", content: {
        a: "Own one big project end to end",
        b: "Move between lots of smaller ones"
      } }
    },
    reflect_agree: {
      greeting: "A tiny check-in. How true does this feel today?",
      item: { type: "reflect_agree", topic: "Mindset", content: {
        statement: "I find it easy to ask for help when I'm stuck."
      } }
    },
    tip: {
      greeting: "Here's a little something for you.",
      item: { type: "tip", topic: "Focus", content: {
        tip: "Before you start work, try a two-minute brain dump. Get every open loop out of your head and onto paper, then pick the one that actually matters. It quietly clears the clutter that slows down your first hour."
      } }
    }
  };

  function todayPayload() {
    var picked = ITEMS[TYPE] || ITEMS.quiz;
    return {
      delivery_id: "demo-" + TYPE,
      greeting: picked.greeting,
      item: picked.item,
      sparks: { lit: LIT, total: TOTAL, rings: 0 },
      chat_enabled: false
    };
  }

  function json(body, status) {
    return Promise.resolve(new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { "Content-Type": "application/json" }
    }));
  }

  var realFetch = window.fetch ? window.fetch.bind(window) : null;

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";

    // Branding is public and fails soft in the widget. A 404 keeps the default
    // Zavmo teal/dark theme, which is exactly the look we want in the demo.
    if (url.indexOf("/branding/") !== -1) {
      return Promise.resolve(new Response("", { status: 404 }));
    }
    if (url.indexOf("/api/today/") !== -1 || url.indexOf("/play/today/") !== -1) {
      return json(todayPayload());
    }
    if (url.indexOf("/api/play/") !== -1) {
      var body = {};
      try { body = JSON.parse((init && init.body) || "{}"); } catch (e) {}
      var awarded = body.correct !== false;           // wrong answers don't earn a spark
      var lit = Math.min(TOTAL, LIT + (awarded ? 1 : 0));
      return json({ sparks: { lit: lit, total: TOTAL, rings: 0 }, spark_awarded: awarded });
    }
    if (url.indexOf("/api/chat/") !== -1) {
      return json({ reply: "I'm just a demo here. In the real thing I would pick this up from where you left off." });
    }
    // Anything else (e.g. the Google Fonts stylesheet) goes to the real network.
    return realFetch ? realFetch(input, init) : json({}, 200);
  };
})();
