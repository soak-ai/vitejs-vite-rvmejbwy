// Heartfelt — v2 (based on App_v1_gw_correct_49_)
// Changes from base:
// 1. .cat-card:hover wrapped in @media(hover:hover) — no ghost hover on mobile tap
// 2. .cat-grid responsive: single column (1fr) at ≤480px
// 3. className="cat-grid" added to home grid div — CSS media query was never applying
// 4. CatCard default border: rgba(255,255,255,.9) → cat.accent+"38" (colored outline always visible)
// 5. wallMessages persisted in localStorage (cards survive refresh/sleep)
// 6. Home footer shows total card count: WALL_SEED.length + wallMessages.length
// UNTOUCHED: GratitudeWall, burstPop *3.5, polish-star, ai-star, all animations

import { useState, useEffect, useCallback } from "react";

const SUPA_URL = "https://kazfdohlmupbkfyliovs.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthemZkb2hsbXVwYmtmeWxpb3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTY5MjAsImV4cCI6MjA4OTkzMjkyMH0.flbkl6d8GGfSmoIfvmxZPPQsusXrJ_D9uxD3Wsqj-XA";
const supa = { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json" } };

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Sacramento&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    :root {
      --sand-50:  #fef9f4;
      --sand-100: #f7f1e8;
      --sand-200: #ede3d3;
      --sand-300: #ddd0bc;
      --ink:      #18120e;
      --ink-2:    #4a3728;
      --ink-3:    #7a6050;
      --white:    #ffffff;
    }

    body {
      margin: 0;
      background: var(--sand-50);
      font-family: 'Lato', sans-serif;
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* ── INPUTS ── */
    .hf-input {
      width: 100%; padding: 11px 14px;
      border-radius: 12px; border: 1.5px solid var(--sand-200);
      background: var(--white);
      font-family: 'Lato', sans-serif; font-size: 14px; color: var(--ink);
      outline: none; transition: border-color .28s ease-out, box-shadow .28s ease-out;
    }
    .hf-input:focus { border-color: var(--sand-300); box-shadow: none; }
    .hf-input::placeholder { color: var(--ink-3); }
    textarea.hf-input { resize: none; line-height: 1.75; }

    /* ── BUTTONS ── */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: 'Lato', sans-serif; font-weight: 500;
      cursor: pointer; border: none; transition: all .28s ease-out;
      border-radius: 999px; white-space: nowrap;
    }
    .btn:active:not(:disabled) { transform: scale(.97); }
    .btn:disabled { opacity: .45; cursor: not-allowed; }
    button:focus { outline: none; } button:focus-visible { outline: none; }

    .btn-primary {
      padding: 11px 24px; font-size: 14px;
      background: var(--ink); color: var(--white);
      box-shadow: 0 2px 8px rgba(24,18,14,.18);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(24,18,14,.24); }

    .btn-secondary {
      padding: 10px 22px; font-size: 14px;
      background: var(--white); color: var(--ink);
      border: 1.5px solid var(--sand-200) !important;
    }
    .btn-secondary:hover:not(:disabled) { border-color: var(--ink) !important; transform: translateY(-1px); }

    .btn-ghost {
      padding: 9px 16px; font-size: 13px;
      background: transparent; color: var(--ink-3);
    }
    .btn-ghost:hover:not(:disabled) { background: var(--sand-100); color: var(--ink-2); }

    .btn-accent {
      padding: 11px 24px; font-size: 14px; color: var(--white);
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }
    .btn-accent:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,.1); filter: brightness(.94); }

    /* ── CATEGORY CARD ── */
    .cat-card {
      background: rgba(255,255,255,.96);
      border: 1.5px solid var(--sand-200);
      border-radius: 20px; padding: 22px;
      cursor: pointer;
      transition: transform .22s, box-shadow .22s, border-color .22s;
      position: relative; overflow: hidden;
    }
    .cat-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 55%);
      border-radius: 20px; pointer-events: none;
    }
    /* CHANGE 1: hover only on real pointer devices — no ghost tap on mobile */
    @media (hover: hover) {
      .cat-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,.1); border-color: var(--accent-color, #c0392b) !important; }
      .cat-card:hover .cat-icon { transform: scale(1.14) rotate(-6deg); }
    }
    /* Tap feedback on mobile — satisfying press feel */
    .cat-card:active { transform: scale(.97); box-shadow: 0 2px 8px rgba(0,0,0,.06); transition: transform .18s ease-out, box-shadow .18s ease-out; }
    .cat-icon { transition: transform .22s cubic-bezier(.34,1.56,.64,1); }

    /* ── PROMPT PILL ── */
    .prompt-pill {
      text-align: left; width: 100%;
      padding: 9px 13px; border-radius: 10px;
      border: 1.5px solid var(--sand-200);
      background: rgba(255,255,255,.65);
      font-family: 'Lato', sans-serif; font-size: 13px; color: var(--ink-2);
      cursor: pointer; line-height: 1.5; transition: all .28s ease-out;
    }
    .prompt-pill:hover { background: rgba(255,255,255,.95); border-color: var(--sand-300); }

    /* ── CARD PREVIEW PATTERNS ── */
    .pat-sunflower{ background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ctext x='4' y='22' font-size='18' opacity='.16'%3E%F0%9F%8C%BC%3C/text%3E%3C/svg%3E"); }
    .pat-stars    { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='34'%3E%3Ctext x='4' y='24' font-size='18' opacity='.18'%3E%E2%AD%90%3C/text%3E%3C/svg%3E"); }
    .pat-stars-silver { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='34'%3E%3Ctext x='4' y='24' font-size='18' fill='%23a8a8c0' opacity='.22'%3E%E2%AD%90%3C/text%3E%3C/svg%3E"); }
    .pat-hearts   { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ctext x='5' y='20' font-size='15' fill='%23000' opacity='.08'%3E%E2%99%A1%3C/text%3E%3C/svg%3E"); }
    .pat-bows     { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Cpath d='M10 10 Q18 18 10 26' stroke='rgba(0,0,0,.09)' stroke-width='1.5' fill='none'/%3E%3Cpath d='M26 10 Q18 18 26 26' stroke='rgba(0,0,0,.09)' stroke-width='1.5' fill='none'/%3E%3Ccircle cx='18' cy='18' r='2' fill='rgba(0,0,0,.08)'/%3E%3C/svg%3E"); }
    .pat-waves    { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='24'%3E%3Cpath d='M0 12 Q12 0 24 12 Q36 24 48 12' stroke='rgba(0,0,0,.07)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); }
    .pat-dots     { background-image: radial-gradient(circle,rgba(0,0,0,.07) 1.5px,transparent 1.5px); background-size:18px 18px; }
    .pat-yhearts  { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ctext x='4' y='20' font-size='15' opacity='.13'%3E%F0%9F%92%9B%3C/text%3E%3C/svg%3E"); }
    .pat-confetti { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='4' y='5' width='6' height='6' rx='1' fill='%23000' opacity='.07' transform='rotate(20 7 8)'/%3E%3Ccircle cx='28' cy='10' r='3' fill='%23000' opacity='.06'/%3E%3Crect x='18' y='26' width='5' height='5' rx='1' fill='%23000' opacity='.06' transform='rotate(-15 20 28)'/%3E%3Ccircle cx='8' cy='30' r='2' fill='%23000' opacity='.05'/%3E%3C/svg%3E"); }

    /* ── SHIMMER bg option ── */
    @keyframes shimmerSweep {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .shimmer-card-glow {
      background-image: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.55) 50%, transparent 100%) !important;
      background-size: 400px 100% !important;
      animation: shimmerSweep 2.8s linear infinite !important;
    }

    /* ── ENVELOPE SEND ANIMATION ── */
    @keyframes cardSlideIntoEnv {
      0%   { transform: translateY(0)  scale(1);    opacity: 1; }
      100% { transform: translateY(62px) scale(.78); opacity: 0; }
    }
    @keyframes envFlapClose {
      0%   { transform: rotateX(0deg); }
      100% { transform: rotateX(-175deg); }
    }
    @keyframes envShrinkAway {
      0%   { transform: scale(1);    opacity: 1; }
      60%  { transform: scale(.22);  opacity: .7; }
      100% { transform: scale(.02);  opacity: 0; }
    }
    @keyframes dotExpand {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes tickIn {
      0%   { stroke-dashoffset: 40; opacity: 0; }
      100% { stroke-dashoffset: 0;  opacity: 1; }
    }

    /* ── GRATITUDE WALL (App 3 exact — UNTOUCHED) ── */
    .masonry-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: start; }
    .masonry-item { align-self: start; }
    .sticky-0 { --r: -2deg; }   .sticky-1 { --r: 1.5deg; }
    .sticky-2 { --r: -1deg; }   .sticky-3 { --r: 2.5deg; }
    .sticky-4 { --r: -1.5deg; } .sticky-5 { --r: 1deg; }
    .sticky-note {
      transition: transform .2s ease, box-shadow .2s ease;
      transform: rotate(var(--r, 0deg));
    }
    .sticky-note-hover:hover {
      transform: rotate(0deg) translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,.12) !important;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .compose-grid { grid-template-columns: 1fr !important; }
      .compose-preview { position: static !important; }
    }
   @media (max-width: 680px) {
  .nav-logo-beta { display: none !important; }
  .nav-wrap { padding: 0 12px !important; }
  .page-wrap { padding: 0 16px !important; }
}
    /* Mobile: single column for cat cards and wall — one card at a time, calm feel */
    @media (max-width: 700px) {
      .cat-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
      .masonry-grid { grid-template-columns: 1fr !important; }
      .masonry-item { max-width: 480px; margin: 0 auto; width: 100%; }
      .sent-btns { flex-direction: column !important; align-items: stretch !important; }
      .sent-btns button { justify-content: center; }
      .share-row { flex-direction: column !important; }
      .share-row button { width: 100%; justify-content: center; }
    }
.footer-beta { display: inline; }
@media (min-width: 681px) {
  .footer-beta { display: none; }
}
    /* ── STEP DOT ── */
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Lato', sans-serif; font-size: 11px;
      transition: all .3s ease;
    }

    /* ── SHARE BTN ── */
    .sh-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 14px; border-radius: 10px;
      font-family: 'Lato', sans-serif; font-size: 13px; font-weight: 500;
      cursor: pointer; border: 1.5px solid transparent;
      transition: transform .16s, box-shadow .16s;
    }
    .sh-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,.1); }

    /* ── KEYFRAMES ── */
    @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes blinkDot { 0%,100%{opacity:1} 50%{opacity:.2} }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn  { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
    @keyframes popIn    { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
    @keyframes stickyPop{ from{opacity:0;transform:translateY(8px) rotate(var(--r,0deg))} to{opacity:1;transform:translateY(0) rotate(var(--r,0deg))} }
    @keyframes aiPulse  { 0%,100%{opacity:.35;transform:scale(.82)} 50%{opacity:1;transform:scale(1.18)} }
    @keyframes heartPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 60%{transform:scale(1.28) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
    @keyframes arrowPulse { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
    @keyframes navPress   { 0%{transform:scale(1)} 40%{transform:scale(.94)} 100%{transform:scale(1)} }
    @keyframes foldDown   { 0%{transform:scaleY(1);opacity:1} 100%{transform:scaleY(0);opacity:0;transform-origin:top} }
    @keyframes foldUp     { 0%{transform:scaleY(0);opacity:0} 100%{transform:scaleY(1);opacity:1;transform-origin:top} }
    @keyframes sealStamp  { 0%{transform:scale(0) rotate(-20deg);opacity:0} 55%{transform:scale(1.22) rotate(4deg);opacity:1} 75%{transform:scale(.92) rotate(-2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
    @keyframes sealInk    { 0%{transform:scale(0);opacity:.7} 100%{transform:scale(2.4);opacity:0} }
    @keyframes sealFadeIn { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
    .nav-item-press:active { animation: navPress .18s ease both; }
    @keyframes shimmerStar { 0%,100%{opacity:.5;transform:scale(.9) rotate(-5deg)} 50%{opacity:1;transform:scale(1.25) rotate(5deg)} }
    @keyframes starPop { 0%{transform:scale(1) rotate(0)} 50%{transform:scale(1.5) rotate(20deg)} 100%{transform:scale(1) rotate(0)} }
    @keyframes spin        { to{transform:rotate(360deg)} }
    @keyframes fadeInUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cardFadeOut { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.88)} }
    /* burstPop *3.5 — original dramatic confetti, UNTOUCHED */
    @keyframes burstPop    { 0%{transform:translate(var(--bx),var(--by)) scale(0);opacity:1} 60%{opacity:1} 100%{transform:translate(calc(var(--bx)*3.5),calc(var(--by)*3.5)) scale(1);opacity:0} }
    @keyframes floatUp     { 0%{transform:translateY(0) scale(1) rotate(0deg);opacity:1} 100%{transform:translateY(-160px) scale(.4) rotate(var(--spin,180deg));opacity:0} }
    @keyframes sentBounce  { 0%{transform:scale(0) rotate(-12deg);opacity:0} 60%{transform:scale(1.18) rotate(4deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
    @keyframes confDrop { 0%{transform:translateY(-8px) rotate(0);opacity:1} 100%{transform:translateY(90px) rotate(540deg);opacity:0} }
@keyframes cardSeal { 0%{box-shadow:0 0 0 0 rgba(0,0,0,0)} 15%{box-shadow:0 0 22px 6px var(--seal-color)} 65%{box-shadow:0 0 22px 6px var(--seal-color)} 100%{box-shadow:0 0 0 0 rgba(0,0,0,0)} }
@media (max-width: 700px) {
.card-sealing { animation: cardSeal 1.9s ease-in-out both; }
}
    .anim-fadeup  { animation: fadeUp  .72s ease-out both; }
    .anim-slidein { animation: slideIn .6s ease-out both; }
    .anim-popin   { animation: popIn   .55s cubic-bezier(.22,1,.36,1) both; }
  `}</style>
);

// ── DATA ──────────────────────────────────────────────────────────────────────
const CATS = [
  { id:"gratitude", glyph:"🙏",  label:"Gratitude",   sub:"Thank someone who shaped you",         accent:"#d97706", light:"#fffbeb", pat:"sunflower"},
  { id:"love",      glyph:"❤️",  label:"Love",         sub:"Tell them they mean the world",         accent:"#c2185b", light:"#fce4ec", pat:"hearts"   },
  { id:"birthday",  glyph:"🎂",  label:"Birthday",     sub:"Make their day unforgettable",          accent:"#7b1fa2", light:"#f3e5f5", pat:"stars"     },
  { id:"cheer",     glyph:"☀️",  label:"Cheer Up",     sub:"Lift them when they need it most",      accent:"#1565c0", light:"#e3f2fd", pat:"waves"    },
  { id:"amends",    glyph:"🤝",  label:"Make Amends",  sub:"Heal with honest, heartfelt words",     accent:"#2e7d32", light:"#e8f5e9", pat:"yhearts"  },
  { id:"celebrate", glyph:"🏆",  label:"Celebrate",    sub:"Honor every achievement",               accent:"#e65100", light:"#fff3e0", pat:"confetti" },
];

const TEMPLATES = {
  gratitude:["You showed up when I least expected it — exactly when I needed it most.","The kindness you carry has quietly changed the way I see the world.","I keep thinking how different things would be without you in them."],
  love:     ["There's no version of a good day that doesn't have you somewhere in it.","You make ordinary moments feel like something worth remembering.","I don't say it enough — but you are everything I didn't know I needed."],
  birthday: ["Another year of you existing in the world — honestly, a gift to all of us.","May this one feel like the beginning of something extraordinary.","Celebrating you today and quietly glad you were born."],
  cheer:    ["You are so much closer than it feels right now. Keep going.","I see what you're carrying. You don't have to carry it alone.","The version of you on the other side of this will be remarkable."],
  amends:   ["I've thought about this more than you know. I'm sorry.","You deserved better from me, and I want to do better.","I hope there's still a way back. I'll meet you halfway."],
  celebrate:["You worked for this. Every quiet effort, every doubt — it shows.","Look how far. Seriously — look how far.","This is not the peak. This is the view from base camp."],
};

const AI_POOL = {
  gratitude:[
    "Something about you always made me feel safe. I don't say that lightly.",
    "I noticed the small things you did when no one else would.",
    "The way you show up for people without being asked — so rare.",
    "You've changed how I see kindness. That doesn't go away.",
    "There are people who shift the mood of a room. You're one.",
    "I carry something you said years ago. You probably don't remember.",
    "You didn't have to, but you did. Every time.",
    "Watching how you treat people taught me how to be better.",
    "You made ordinary moments feel like they mattered. They did.",
    "I think about your generosity more than you know.",
    "The grace you carry — I've never seen anything like it.",
    "You gave me something I didn't know I needed until I had it.",
    "Some people leave a mark on how you see the world. You're one.",
    "Thank you for not making me ask twice.",
    "There's a version of my life without you in it. I'm glad that's not this one.",
    "You showed up quietly and changed everything.",
    "The care you put into people — it doesn't go unnoticed.",
    "I hope you know how much light you carry.",
    "You made me feel less alone at exactly the right time.",
    "Grateful doesn't quite cover it. But it's where I start.",
  ],
  love:[
    "With you, even ordinary Tuesdays feel worth writing home about.",
    "Being known by you is one of the quiet honours of my life.",
    "I didn't know love could be this quiet and still this full.",
    "You're the reason some of my best memories exist.",
    "Some feelings have no clean word. You're one of them.",
    "You make me want to be more careful with people.",
    "I didn't know I was waiting for you until you were already there.",
    "Being loved by you is one of the best things that ever happened to me.",
    "You make ordinary moments feel like something worth remembering.",
    "I don't say it enough — but you are everything I didn't know I needed.",
    "There's no version of a good day that doesn't have you somewhere in it.",
    "You are my favourite hello and my hardest goodbye.",
    "I feel most like myself when I'm with you.",
    "You changed what I thought was possible to feel.",
    "Every version of my future I can picture — you're in it.",
    "You love quietly and completely. I don't take that lightly.",
    "The way you look at me still catches me off guard.",
    "Home stopped being a place the moment I met you.",
    "You make me braver than I actually am.",
    "I would choose you again. Without question.",
  ],
  birthday:[
    "Here's to the year you stop apologising for taking up space.",
    "May this be the chapter you look back on and say — yes.",
    "You deserve a day as good as you make everyone feel.",
    "Another year wiser, softer, more yourself.",
    "The world is better because you're in it.",
    "I hope today surprises you in the best possible way.",
    "You were born and the world quietly got better. That's just true.",
    "Another year of you existing — honestly, a gift to everyone who knows you.",
    "May this one feel like the beginning of something extraordinary.",
    "Celebrating you today and quietly glad you were born.",
    "I hope this year gives you everything last year didn't.",
    "You deserve softness today. And every day, honestly.",
    "Here's to the version of you that's still becoming.",
    "A whole year older and still the best person I know.",
    "May this birthday mark the start of your favourite chapter yet.",
    "You've earned every good thing coming your way.",
    "I'm so glad you exist. Today especially.",
    "Here's to you — fully, loudly, unapologetically.",
    "Another year of being remarkable. Congratulations.",
    "Today is yours. All of it.",
  ],
  cheer:[
    "On the days you can't find your footing, I'll be the ground.",
    "Hard seasons reveal what you're made of. You're remarkable.",
    "I'm not going anywhere. Take all the time you need.",
    "Even your hard days show how much you care.",
    "You're carrying more than you should. I see that.",
    "One breath at a time. I'm right here.",
    "You are so much closer than it feels right now. Keep going.",
    "I see what you're carrying. You don't have to carry it alone.",
    "The version of you on the other side of this will be remarkable.",
    "You've survived every hard day so far. This one too.",
    "You don't have to be okay right now. I'll wait.",
    "Your strength doesn't mean you have to carry it silently.",
    "I believe in you on the days you can't believe in yourself.",
    "This is hard. You are harder.",
    "Rest if you need to. Just don't give up.",
    "You're not behind. You're right where you need to be.",
    "The light at the end of this — I can already see it for you.",
    "Hard doesn't mean wrong. Keep going.",
    "You matter more than you're letting yourself feel right now.",
    "I'm proud of you for still showing up.",
  ],
  amends:[
    "Some mistakes need more than an apology. I'm working on mine.",
    "I keep returning to the moment I let you down.",
    "I can't undo it. But I can show up differently.",
    "You didn't deserve that. I'm sorry it took this long.",
    "There's no good enough reason. But a genuine sorry.",
    "I hope this is a beginning, not an ending.",
    "I've thought about this more than you know. I'm sorry.",
    "You deserved better from me, and I want to do better.",
    "I hope there's still a way back. I'll meet you halfway.",
    "I was wrong. I'm sorry. I want to do better.",
    "I let pride get in the way. That was my mistake, not yours.",
    "I should have said this sooner. I'm saying it now.",
    "I'm not asking you to forget. Just hoping you'll let me try again.",
    "The silence between us has cost me more than I expected.",
    "You gave me more grace than I gave you. I'm sorry for that.",
    "I miss you. And I know that's partly my fault.",
    "I don't need you to understand right away. I just need you to know I'm sorry.",
    "I handled that badly. You deserved so much better.",
    "An apology without change means nothing. I'm working on the change.",
    "You meant too much for me to leave this unsaid.",
  ],
  celebrate:[
    "The gap between who you were and who you are — your doing.",
    "Lucky to witness someone grow like this.",
    "The version of you that doubted this is so proud right now.",
    "You turned effort into evidence. That's everything.",
    "This is a big deal. Let yourself feel it completely.",
    "This achievement belongs entirely to you.",
    "You worked for this. Every quiet effort, every doubt — it shows.",
    "Look how far. Seriously — look how far.",
    "This is not the peak. This is the view from base camp.",
    "Every late night and early morning — this is what they were for.",
    "You didn't just reach the goal. You became someone who could.",
    "I always knew. Now the world gets to know too.",
    "This is not luck. This is years of quiet effort finally visible.",
    "You earned every single part of this.",
    "The doubt didn't stop you. That says everything.",
    "Here's to you — and to everything still ahead.",
    "You made the difficult look almost easy. Almost.",
    "This is your moment. Be in it completely.",
    "Not just proud of what you did — proud of how you did it.",
    "The work was invisible for a long time. Now it isn't.",
  ],
};

const BG_OPTIONS = [
  { id:"tinted", label:"Tinted" },
  { id:"white",  label:"White"  },
  { id:"warm",   label:"Warm"   },
];

const FONT_OPTIONS = [
  { id:"clean",      label:"Clean",    style:{ fontFamily:"'Lato', sans-serif", fontWeight:400 } },
  { id:"warm",       label:"Warm",     style:{ fontFamily:"'Lora',serif",          fontStyle:"italic" } },
  { id:"sacramento", label:"Script",   style:{ fontFamily:"'Sacramento',cursive", fontSize:"1.5em", lineHeight:1.55 } },
];

// WALL SEED — always shown on Gratitude Wall, name optional
const WALL_SEED = [
  { id:1,  cat:"gratitude", message:"You showed up every single time I needed someone. I hope you know how rare that is.",  color:"#fef2f2", accent:"#d97706" },
  { id:2,  cat:"love",      message:"My world is genuinely brighter because you're in it. That's not a small thing.",        color:"#fce4ec", accent:"#c2185b" },
  { id:3,  cat:"cheer",     message:"You are closer than it feels. Keep walking.",                                           color:"#e3f2fd", accent:"#1565c0" },
  { id:4,  cat:"birthday",  message:"Another year of you existing — honestly, a gift to everyone who knows you.",            color:"#f3e5f5", accent:"#7b1fa2" },
  { id:5,  cat:"celebrate", message:"Look how far. Seriously. Look. How. Far.",                                              color:"#fff3e0", accent:"#e65100" },
  { id:6,  cat:"gratitude", message:"I don't think I ever properly thanked you. This is me trying to start.",               color:"#fef2f2", accent:"#d97706" },
  { id:7,  cat:"amends",    message:"I hope there's still a way back. I'll meet you halfway.",                               color:"#e8f5e9", accent:"#2e7d32" },
  { id:8,  cat:"love",      message:"You make ordinary Tuesday evenings feel like something worth remembering.",              color:"#fce4ec", accent:"#c2185b" },
  { id:9,  cat:"cheer",     message:"The version of you on the other side of this is going to be remarkable.",               color:"#e3f2fd", accent:"#1565c0" },
  { id:10, cat:"gratitude", message:"Some people are home. You are home.",                                                   color:"#fffbeb", accent:"#d97706" },
  { id:11, cat:"celebrate", message:"This is not luck. This is years of quiet effort finally visible.",                      color:"#fff3e0", accent:"#e65100" },
  { id:12, cat:"love",      message:"I didn't know I was waiting for you until you were already there.",                     color:"#fce4ec", accent:"#c2185b" },
  { id:13, cat:"birthday",  message:"You were born and the world quietly got better. That's just true.",                    color:"#f3e5f5", accent:"#7b1fa2" },
  { id:14, cat:"amends",    message:"I was wrong. I'm sorry. I want to do better. That's all.",                             color:"#e8f5e9", accent:"#2e7d32" },
  { id:15, cat:"cheer",     message:"Hard days are not the whole story. You are not the whole story yet.",                  color:"#e3f2fd", accent:"#1565c0" },
  { id:16, cat:"gratitude", message:"You changed how I move through the world. Thank you.",                                 color:"#fffbeb", accent:"#d97706" },
  { id:17, cat:"celebrate", message:"Every single doubt you pushed through brought you here. Own it.",                      color:"#fff3e0", accent:"#e65100" },
  { id:18, cat:"love",      message:"Being loved by you is one of the best things that ever happened to me.",               color:"#fce4ec", accent:"#c2185b" },
];

// ── FLOATING BG ───────────────────────────────────────────────────────────────
function FloatingBg() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {["♡","✦","◇","·","✧","♡","◦","✦","·","♡"].map((g,i) => (
        <div key={i} style={{ position:"absolute", left:`${4+i*10}%`, top:`${5+(i*17%72)}%`, fontSize:12+(i%4)*7, color:"rgba(24,18,14,.042)", animation:`floatY ${4.5+i*.55}s ease-in-out infinite`, animationDelay:`${i*.6}s` }}>{g}</div>
      ))}
    </div>
  );
}

// ── STEP BAR ──────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  const steps = ["Choose","Write","Preview"];
  const idx = { compose:1, preview:2, sent:3 }[current] ?? 0;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:40 }}>
      {steps.map((s,i) => (
        <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div className="step-dot" style={{ background:i<idx?"var(--ink)":"transparent", border:`1.5px solid ${i<=idx?"var(--ink)":"var(--sand-200)"}`, color:i<idx?"#fff":i===idx?"var(--ink)":"var(--ink-3)" }}>
            {i<idx ? "✓" : i+1}
          </div>
          <span style={{ fontSize:13, color:i===idx?"var(--ink)":"var(--ink-3)" }}>{s}</span>
          {i < steps.length-1 && <div style={{ width:32, height:1, background:i<idx?"var(--ink)":"var(--sand-200)", transition:"background .4s" }}/>}
        </div>
      ))}
    </div>
  );
}

// ── PREVIEW CARD ──────────────────────────────────────────────────────────────
function PreviewCard({ cat, to, from, message, bgMode, shimmerOn, fontId, animate, compact }) {
  if (!cat) return null;

  const getBg = () => {
    if (bgMode === "white") return { background:"#ffffff" };
    if (bgMode === "warm")  return { background:"#fffbf4" };
    return { background: cat.light };
  };

  const patClass = (cat.pat === 'stars' && bgMode === 'white') ? 'pat-stars-silver' : `pat-${cat.pat}`;
  const fontStyle = FONT_OPTIONS.find(f => f.id === fontId)?.style || {};

  return (
    <div style={{ ...getBg(), borderRadius:18, padding:compact?"15px 14px":"28px 26px", position:"relative", overflow:"hidden", border:`1px solid ${cat.accent}28`, boxShadow:animate?`0 20px 56px ${cat.accent}1a`:"0 2px 8px rgba(0,0,0,.05)", animation:animate?"popIn .45s cubic-bezier(.34,1.56,.64,1) both":"none", transition:"background .25s" }}>
      {shimmerOn && <div style={{ position:"absolute", inset:0, borderRadius:18, zIndex:1, backgroundImage:"linear-gradient(90deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%)", backgroundSize:"400px 100%", animation:"shimmerSweep 2.8s linear infinite", pointerEvents:"none" }}/>}
      <div className={patClass} style={{ position:"absolute", inset:0, borderRadius:18, opacity:.65 }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"42%", background:"linear-gradient(180deg,rgba(255,255,255,.34),rgba(255,255,255,0))", borderRadius:"18px 18px 0 0", pointerEvents:"none", zIndex:1 }}/>
      <div style={{ position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:compact?10:18 }}>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:9, letterSpacing:".14em", color:cat.accent, textTransform:"uppercase", marginBottom:4, fontFamily:"'Lato', sans-serif" }}>{cat.label} · heartfelt</div>
            <div style={{ fontSize:compact?14:16, color:"#4a3728", fontFamily:"'Lato', sans-serif", textAlign:"left", fontWeight:400 }}>{to ? `Dear ${to},` : <span style={{ color:"#d0bfb0" }}>Dear …</span>}</div>
          </div>
          <div style={{ width:compact?28:36, height:compact?28:36, borderRadius:10, background:`linear-gradient(135deg,${cat.light},${cat.accent}22)`, border:`1px solid ${cat.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:compact?12:15, color:cat.accent, fontWeight:700, flexShrink:0 }}>{cat.glyph}</div>
        </div>
        <div style={{ ...fontStyle, fontSize:fontId==="sacramento"?(compact?20:22):(compact?14:16), color:"var(--ink)", lineHeight:fontId==="sacramento"?1.7:1.85, minHeight:compact?28:52, marginBottom:compact?10:18, transition:"all .2s", textAlign:"left" }}>
          {message || <span style={{ color:"#d0bfb0", fontFamily:"'Lato', sans-serif", fontStyle:"normal", fontSize:13, fontWeight:400, textTransform:"none", letterSpacing:"normal" }}>Your words will appear here…</span>}
        </div>
        <div style={{ paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:compact?11:12, color:"#4a3728", textAlign:"left", fontFamily:"'Lato', sans-serif" }}>with warmth, <strong style={{ color:"var(--ink)" }}>{from || <span style={{ color:"#d0bfb0", fontWeight:400 }}>you</span>}</strong></div>
          <div style={{ fontSize:9, color:cat.accent, opacity:.42, letterSpacing:".1em", fontFamily:"'Lato', sans-serif" }}>heartfelt ◇</div>
        </div>
      </div>
    </div>
  );
}

// ── POLISH BUTTON — powered by Gemini 1.5 Flash (free tier) ──────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
function PolishButton({ message, onPolished, accent }) {
  const [state, setState] = useState("idle");

  const polish = async () => {
    if (state === "loading" || !message.trim()) return;
    setState("loading");
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Fix all grammar, capitalisation and spelling errors. Then make this message sound more warm, beautiful and heartfelt — improve the flow, replace generic words with more specific ones, make it feel more human and emotionally resonant. Keep the same meaning and voice. Return ONLY the improved message, nothing else.\n\nOriginal: " + message
              }]
            }]
          })
        }
      );
      const data = await res.json();
      const polished = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (polished) {
        onPolished(polished);
        setState("done");
        setTimeout(() => setState("idle"), 2500);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const label = { idle:"✦ Say it better", loading:"Refining…", done:"✓ Refined", error:"Try again" }[state];
  const col   = state==="done" ? "#2e7d32" : state==="error" ? accent : "var(--ink-3)";

  return (
    <button onClick={polish} disabled={state==="loading" || !message.trim()}
      title="Keeps your meaning — just makes it sound more beautiful"
      style={{ marginTop:7, display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:999, border:`1.5px solid ${state==="done"?"#a8dbb8":state==="error"?accent+"88":"var(--sand-200)"}`, background:"rgba(255,255,255,.75)", fontFamily:"'Lato', sans-serif", fontSize:12, color:col, cursor:state==="loading"||!message.trim()?"not-allowed":"pointer", transition:"all .18s", opacity:!message.trim()?.45:1 }}
      onMouseOver={e=>{ if(state==="idle"&&message.trim()){ e.currentTarget.style.borderColor=accent; e.currentTarget.style.color=accent; const star=e.currentTarget.querySelector('.polish-star'); if(star) star.style.animation="shimmerStar .6s ease-in-out"; }}}
      onMouseOut={e=>{ if(state==="idle"){ e.currentTarget.style.borderColor="var(--sand-200)"; e.currentTarget.style.color="var(--ink-3)"; const star=e.currentTarget.querySelector('.polish-star'); if(star) star.style.animation="none"; }}}>
      {state==="loading" && <span style={{ width:10, height:10, borderRadius:"50%", border:"1.5px solid currentColor", borderTopColor:"transparent", display:"inline-block", animation:"spin .7s linear infinite" }}/>}
      {state==="idle" && <span className="polish-star" style={{ fontSize:11 }}>✦</span>}
      {state==="idle" ? " Say it better" : label.replace("✦ ","")}
    </button>
  );
}

// ── AI SUGGEST ────────────────────────────────────────────────────────────────
function AISuggest({ catId, onUse }) {
  const [used, setUsed]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText]       = useState("");
  const [shown, setShown]     = useState(false);

  const suggest = useCallback(async () => {
    setLoading(true); setShown(true); setText("");
    await new Promise(r => setTimeout(r, 950));
    const pool = AI_POOL[catId] || AI_POOL.gratitude;
    const avail = pool.filter(l => !used.includes(l));
    const pick  = avail.length ? avail[Math.floor(Math.random()*avail.length)] : pool[Math.floor(Math.random()*pool.length)];
    setUsed(u => [...u.slice(-4), pick]);
    setText(pick);
    setLoading(false);
  }, [catId, used]);

  if (!shown) return (
    <button onClick={suggest}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:999, border:"1.5px solid var(--sand-200)", background:"rgba(255,255,255,.75)", fontFamily:"'Lato', sans-serif", fontSize:13, fontWeight:500, color:"var(--ink-3)", cursor:"pointer", transition:"all .18s" }}
      onMouseOver={e => { e.currentTarget.style.borderColor="var(--sand-300)"; e.currentTarget.style.color="var(--ink-2)"; }}
      onMouseOut={e  => { e.currentTarget.style.borderColor="var(--sand-200)"; e.currentTarget.style.color="var(--ink-3)"; }}>
      ✦ Suggest something heartfelt
    </button>
  );

  return (
<div style={{ borderRadius:12, border:"1.5px solid var(--sand-200)", background:"rgba(255,255,255,.88)", padding:"14px 16px", minHeight:148 }}>
    <div style={{ fontSize:11, color:"var(--ink-3)", marginBottom:8 }}>✦ heartfelt suggestion</div>
      {loading
? <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"center", minHeight:96 }}>
      {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"var(--sand-200)", animation:`aiPulse 1.2s ease ${i*.2}s infinite` }}/>)}
          </div>
        : <>
            <div style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:14, color:"var(--ink)", lineHeight:1.75, marginBottom:10 }}>{text}</div>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              <button onClick={() => onUse(text)}
                style={{ padding:"7px 14px", borderRadius:999, border:`1.5px solid var(--ink)`, background:"var(--ink)", color:"#fff", fontFamily:"'Lato', sans-serif", fontSize:13, cursor:"pointer", transition:"all .18s" }}
                onMouseOver={e=>{ e.currentTarget.style.opacity=".88"; }}
                onMouseOut={e=> { e.currentTarget.style.opacity="1"; }}>
                Use this
              </button>
              <button onClick={suggest}
                style={{ padding:"7px 14px", borderRadius:999, border:"1.5px solid var(--sand-200)", background:"transparent", color:"var(--ink-3)", fontFamily:"'Lato', sans-serif", fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4, transition:"border-color .18s, color .18s" }}
                onMouseOver={e=>{ e.currentTarget.style.borderColor="var(--sand-300)"; e.currentTarget.style.color="var(--ink-2)"; const star=e.currentTarget.querySelector('.ai-star'); if(star) star.style.animation="shimmerStar .6s ease-in-out"; }}
                onMouseOut={e=> { e.currentTarget.style.borderColor="var(--sand-200)"; e.currentTarget.style.color="var(--ink-3)"; const star=e.currentTarget.querySelector('.ai-star'); if(star) star.style.animation="none"; }}>
                Another <span className="ai-star" style={{ display:"inline-block", fontSize:12 }}>✦</span>
              </button>
            </div>
          </>}
    </div>
  );
}

// ── SHARE CTA ─────────────────────────────────────────────────────────────────
function ShareCTA({ accent, recip, sender, cardId, onHome }) {
const [copied, setCopied] = useState(false);
  const [instacopied, setInstacopied] = useState(false);
  const link = "https://heartfelt-send.vercel.app/?id=" + (cardId || "");
  const waText = "Someone made something just for you 💛 " + link;
  const copy = () => {
    navigator.clipboard.writeText(waText).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const shareBtn = {
    width:"100%", padding:"9px 16px", borderRadius:12,
    fontFamily:"'Lato', sans-serif", fontSize:13, fontWeight:400,
    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
    gap:10, transition:"background .2s, border-color .2s",
    background:"transparent",
  };
  const icon = (em) => <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>{em}</span>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9, width:"100%" }}>
      <button style={{ ...shareBtn, color:"#1a7a42", border:"1.5px solid #a8dbb8" }}
        onClick={() => window.open("https://wa.me/?text="+encodeURIComponent(waText),"_blank")}
        onMouseOver={e=>{ e.currentTarget.style.background="#e6f7ed"; e.currentTarget.style.borderColor="transparent"; }}
        onMouseOut={e=> { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="#a8dbb8"; }}>
        {icon("💬")} Send via WhatsApp
      </button>
      <button style={{ ...shareBtn, color:"#b5467a", border:"1.5px solid #f0b8d4" }}
        onClick={() => { navigator.clipboard.writeText(link).catch(()=>{}); setInstacopied(true); setTimeout(()=>setInstacopied(false),2500); }}
        onMouseOver={e=>{ e.currentTarget.style.background="#fce8f2"; e.currentTarget.style.borderColor="transparent"; }}
        onMouseOut={e=> { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="#f0b8d4"; }}>
        {icon(instacopied?"✓":"📷")} {instacopied?"Copied! Paste in Instagram DM.":"Share on Instagram"}
      </button>
      <button style={{ ...shareBtn, color:copied?"#2e7d32":"#2563a8", border:`1.5px solid ${copied?"#a8dbb8":"#a8c4e8"}` }}
        onClick={copy}
        onMouseOver={e=>{ e.currentTarget.style.background=copied?"#e8f5e9":"#e8f0fb"; e.currentTarget.style.borderColor="transparent"; }}
        onMouseOut={e=> { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=copied?"#a8dbb8":"#a8c4e8"; }}>
        {icon(copied?"✓":"🔗")} {copied?"Copied! Paste it anywhere.":"Copy link"}
      </button>
      <div style={{ height:1, background:"var(--sand-200)", margin:"6px 0" }}/>
      <div style={{ display:"flex", justifyContent:"center", marginTop:6 }}>
        <button style={{ padding:"7px 18px", borderRadius:999, fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:400, color:"var(--ink-3)", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:5, border:"1.5px solid var(--sand-300)", background:"transparent", transition:"border-color .18s, color .18s, background .18s" }}
          onClick={onHome}
          onMouseOver={e=>{ e.currentTarget.style.borderColor="var(--ink)"; e.currentTarget.style.color="var(--ink)"; }}
          onMouseOut={e=> { e.currentTarget.style.borderColor="var(--sand-300)"; e.currentTarget.style.color="var(--ink-3)"; }}>
          ✦ Send another
          <span style={{ display:"inline-block", animation:"arrowPulse 1.4s ease-in-out infinite", fontSize:12 }}>→</span>
        </button>
      </div>
    </div>
  );
}

// ── SENT PAGE ─────────────────────────────────────────────────────────────────
function SentPage({ cat, formData, cardId, onHome, onViewWall }) {
  const [burst, setBurst] = useState(false);
  const recip = formData?.recipient ? formData.recipient.charAt(0).toUpperCase()+formData.recipient.slice(1) : "";

  const catParticles = {
    gratitude:["🌼","✦","🌼","✧","🌼","✦","✧","🌼","✦","🌼","✧","✦"],
    love:     ["❤️","♡","❤️","✦","♡","❤️","✧","♡","❤️","♡","✦","❤️"],
    birthday: ["⭐","🎂","⭐","✦","⭐","🎂","✦","⭐","✦","🎂","⭐","✦"],
    cheer:    ["☀️","✦","☀️","✧","☀️","✦","◇","☀️","✦","☀️","✧","◇"],
    amends:   ["💛","🤝","💛","✦","💛","🤝","✧","💛","✦","💛","🤝","💛"],
    celebrate:["🏆","🎉","✦","🏆","🎉","✦","🏆","✦","🎉","🏆","✦","🎉"],
  };
  const emojis = catParticles[cat.id] || catParticles.love;
  const positions = [
    {bx:-55,by:-70,d:0,s:24},  {bx:55,by:-70,d:.05,s:20}, {bx:-85,by:-20,d:.1,s:18},  {bx:85,by:-20,d:.08,s:22},
    {bx:-40,by:65,d:.12,s:20}, {bx:40,by:65,d:.06,s:18},  {bx:-100,by:25,d:.04,s:16}, {bx:100,by:25,d:.09,s:22},
    {bx:0,by:-90,d:.02,s:22},  {bx:-65,by:50,d:.11,s:18}, {bx:65,by:50,d:.07,s:20},   {bx:0,by:90,d:.03,s:16},
    {bx:-110,by:-40,d:.06,s:14},{bx:110,by:-40,d:.13,s:16},{bx:-30,by:-110,d:.08,s:18},{bx:30,by:-110,d:.04,s:14},
    {bx:-120,by:10,d:.15,s:16},{bx:120,by:10,d:.02,s:18}, {bx:-70,by:-90,d:.09,s:20}, {bx:70,by:-90,d:.14,s:22},
  ];
  useEffect(() => { setTimeout(() => setBurst(true), 200); }, []);

  return (
    <div className="anim-popin" style={{ maxWidth:420, margin:"0 auto", padding:"64px 24px", textAlign:"center", position:"relative" }}>
      {burst && positions.map((p,i) => (
        <div key={i} style={{ position:"fixed", top:"50%", left:"50%", fontSize:p.s||22, lineHeight:1,
          "--bx":`${p.bx}px`, "--by":`${p.by}px`,
          animation:`burstPop 1.4s cubic-bezier(.22,1,.36,1) ${p.d*.8}s both`,
          pointerEvents:"none", zIndex:50 }}>{emojis[i % emojis.length]}</div>
      ))}
      <div style={{ fontSize:52, marginBottom:14, animation:"sentBounce .5s cubic-bezier(.34,1.56,.64,1) both", lineHeight:1 }}>💌</div>
      <h2 style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:22, color:"var(--ink)", marginBottom:8, lineHeight:1.2 }}>
        Your card is sealed <span style={{display:"inline-block",animation:"shimmerStar 1.8s ease-in-out infinite"}}>✦</span>
      </h2>
      <p style={{ fontSize:14, color:"var(--ink-3)", lineHeight:1.7, marginBottom:6 }}>
        Pick how you want to share it with <strong style={{ color:"var(--ink)" }}>{recip}</strong>.
      </p>
      <p style={{ fontSize:12, color:cat.accent, marginBottom:24, letterSpacing:".04em" }}>✦ Pinned to the Gratitude Wall anonymously</p>
      <ShareCTA accent={cat.accent} recip={recip} sender={formData?.sender} cardId={cardId} onHome={onHome}/>
    </div>
  );
}

// ── GRATITUDE WALL — empty state from App_perfect_gw_empty_state_49_ ─────────
function GratitudeWall({ wallMessages, onHome, hasEverSent }) {
  const getCat = id => CATS.find(c => c.id === id);
  const [supaCards, setSupaCards] = useState([]);

  useEffect(() => {
    if (!hasEverSent) return; // only load wall after user has sent a card
    fetch(`${SUPA_URL}/rest/v1/cards?select=id,cat,message,created_at&order=created_at.desc&limit=99`, {
      headers: supa.headers
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        setSupaCards(data.map(c => ({
          id: c.id,
          cat: c.cat,
          message: c.message,
          color: CATS.find(x => x.id === c.cat)?.light || "#f7f1e8",
          accent: CATS.find(x => x.id === c.cat)?.accent || "#888",
        })));
      }
    })
    .catch(() => {});
  }, [hasEverSent]);

  const allCards = supaCards;
  const isEmpty = !hasEverSent;

  return (
    <div className="anim-fadeup" style={{ maxWidth:1080, margin:"0 auto", padding:"56px 24px 80px" }}>

      {/* ── HEADER ── */}
      <div style={{ textAlign:"center", marginBottom: isEmpty ? 48 : 56 }}>
        <div style={{ fontSize:11, letterSpacing:".18em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:16 }}>heartfelt / gratitude wall</div>
        <h1 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:600, color:"var(--ink)", letterSpacing:"-.03em", lineHeight:1.1, marginBottom:14 }}>
          Words that were<br/><span style={{ fontWeight:300, fontStyle:"italic", fontFamily:"'Lora',serif" }}>waiting to be said.</span>
        </h1>
        <p style={{ fontSize:14, color:"var(--ink-3)", lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>
          {isEmpty ? "A space for real words, to real people." : "Real messages shared by people around the world."}
        </p>
      </div>

      {/* ── EMPTY STATE ── */}
      {isEmpty && (
        <div style={{ maxWidth:520, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:20, lineHeight:1 }}>💌</div>

          <h2 style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:"clamp(18px,3vw,24px)", color:"var(--ink)", marginBottom:10, lineHeight:1.3 }}>
            Be the first to bond.
          </h2>

          <p style={{ fontSize:14, color:"var(--ink-3)", lineHeight:1.7, marginBottom:24, maxWidth:340, margin:"0 auto 24px" }}>
            Say the thing you've been holding back.
          </p>

          <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:28 }}>
            {[
              { icon:"🙏", text:"Thank someone" },
              { icon:"❤️", text:"Say you care" },
              { icon:"✦",  text:"Celebrate them" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:999, border:"1.5px solid var(--sand-200)", background:"rgba(255,255,255,.7)", fontFamily:"'Lato', sans-serif", fontSize:12, color:"var(--ink-3)" }}>
                <span style={{ fontSize:12 }}>{icon}</span> {text}
              </div>
            ))}
          </div>

          <button onClick={onHome}
            style={{ padding:"9px 22px", borderRadius:999, border:"1.5px solid var(--ink)", background:"transparent", color:"var(--ink)", fontFamily:"'Lato', sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, transition:"background .18s, color .18s" }}
            onMouseOver={e=>{ e.currentTarget.style.background="var(--ink)"; e.currentTarget.style.color="#fff"; }}
            onMouseOut={e=> { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--ink)"; }}>
            Send a card
            <span style={{ display:"inline-block", animation:"arrowPulse 1.4s ease-in-out infinite" }}>→</span>
          </button>

          <p style={{ fontSize:11, color:"var(--ink-3)", marginTop:14, fontStyle:"italic", opacity:.65 }}>
            Anonymous · no account needed
          </p>
        </div>
      )}

      {/* ── CARDS — real user cards only, flat grid ── */}
      {!isEmpty && (
        <div className="masonry-grid" style={{ alignItems:"start" }}>
          {allCards.slice(0, 99).map((item, i) => {
            const cat = getCat(item.cat);
            const mod = i % 6;
          const isNew = item.isNew || (item.created_at && (Date.now() - new Date(item.created_at).getTime()) < 10*60*1000);
            return (
              <div key={item.id} className={`masonry-item sticky-${mod} sticky-note`}
                style={{ background:item.color, borderRadius:16, padding:24,
                  border:`1px solid ${cat?.accent||"#eee"}33`,
                  boxShadow:"0 4px 16px rgba(0,0,0,.07)",
                  animation:`stickyPop .4s ease both`, animationDelay:`${i*.05}s`,
                  position:"relative", cursor:"default", userSelect:"none" }}>
                {isNew && (
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:10, background:cat?.accent||"#888", color:"#fff", borderRadius:999, padding:"2px 10px", fontFamily:"'Lato', sans-serif", fontWeight:500, letterSpacing:".04em", display:"flex" }}>just now</span>
                  </div>
                )}
                <div style={{ fontSize:11, letterSpacing:".12em", textTransform:"uppercase", color:cat?.accent, marginBottom:12, fontFamily:"'Lato', sans-serif" }}>
                  {cat?.glyph} {cat?.label}
                </div>
                <p style={{ fontSize:14, color:"var(--ink)", lineHeight:1.75, fontStyle:"italic", fontFamily:"'Lora',serif", marginBottom:12 }}>
                  "{item.message}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── CATEGORY CARD ─────────────────────────────────────────────────────────────
function CatCard({ cat, onClick }) {
  const [active, setActive] = useState(false);
  return (
    // Colored border at rest (acc+"44"). Touch handlers make accent pop on tap.
    // onMouseEnter/Leave handle desktop hover via the same active state.
    <div className="cat-card" onClick={onClick}
      onMouseEnter={()=>setActive(true)} onMouseLeave={()=>setActive(false)}
      onTouchStart={()=>setActive(true)}
      onTouchEnd={()=>setTimeout(()=>setActive(false), 180)}
      onTouchCancel={()=>setActive(false)}
      style={{ "--accent-color":cat.accent, borderColor:active?cat.accent+"cc":cat.accent+"44", boxShadow:active?`0 10px 32px ${cat.accent}30`:"0 2px 8px rgba(0,0,0,.04)", display:"flex", flexDirection:"column", alignItems:"flex-start", transition:"border-color .22s ease-out, box-shadow .28s ease-out" }}>
      <div className="cat-icon" style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${cat.light},${cat.accent}28)`, border:`1px solid ${cat.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:cat.accent, fontWeight:700, marginBottom:14, transition:"all .22s cubic-bezier(.34,1.56,.64,1)", flexShrink:0 }}>
        {cat.glyph}
      </div>
      <div style={{ width:"100%", textAlign:"center", marginBottom:16, flex:1 }}>
        <div style={{ fontWeight:600, fontSize:15, color:"#18120e", marginBottom:4, fontFamily:"'Lato', sans-serif" }}>{cat.label}</div>
        <div style={{ fontSize:12, color:"#5a4838", lineHeight:1.5, fontFamily:"'Lato', sans-serif" }}>{cat.sub}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:cat.accent }}>
        Select <span style={{ display:"inline-block", animation:"arrowPulse 1.4s ease-in-out infinite", fontSize:14 }}>→</span>
      </div>
    </div>
  );
}

// ── COMPOSE ───────────────────────────────────────────────────────────────────
function ComposeStep({ cat, onPreview, onBack, draft }) {
  const [sender,    setSender]    = useState(draft?.sender    || "");
  const [recipient, setRecipient] = useState(draft?.recipient || "");
  const [message,   setMessage]   = useState(draft?.message   || "");
  const [bgMode,    setBgMode]    = useState(draft?.bgMode    || "tinted");
  const [shimmerOn, setShimmerOn] = useState(draft?.shimmerOn || false);
  const [fontId,    setFontId]    = useState(draft?.fontId    || "clean");
  const [focus,     setFocus]     = useState(null);
  const [swapAnim,  setSwapAnim]  = useState(false);

  const canGo = sender && recipient && message;
  const inp = n => ({ className:"hf-input", onFocus:()=>setFocus(n), onBlur:()=>setFocus(null), style:{ borderColor:focus===n?"var(--sand-300)":"var(--sand-200)" } });

  const swapNames = () => {
    setSwapAnim(true);
    setTimeout(() => setSwapAnim(false), 400);
    const tmp = sender;
    setSender(recipient);
    setRecipient(tmp);
  };

  return (
    <div className="anim-slidein" style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px 64px" }}>
      <StepBar current="compose"/>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:36 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:cat.light, border:`1.5px solid ${cat.accent}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:cat.accent, fontWeight:700 }}>{cat.glyph}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:"var(--ink)" }}>{cat.label}</div>
          <div style={{ fontSize:13, color:"var(--ink-3)" }}>{cat.sub}</div>
        </div>
      </div>

      <div className="compose-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"start" }}>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:12, letterSpacing:".08em", textTransform:"uppercase", color:"var(--ink-3)" }}>From &amp; To</div>
            <button
              onClick={swapNames}
              title="Swap sender & recipient"
              style={{
                width:32, height:32, borderRadius:"50%",
                border:"1.5px solid var(--sand-200)",
                outline:"none",
                background:"rgba(255,255,255,.85)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", fontSize:16, lineHeight:1,
                transition:"all .18s",
                transform: swapAnim ? "rotate(180deg) scale(1.15)" : "rotate(0deg) scale(1)",
                color:"var(--ink-3)",
                outline:"none",
             }}
              onFocus={e => { e.currentTarget.style.outline="none"; }}
              onMouseOver={e => { e.currentTarget.style.borderColor="var(--ink)"; e.currentTarget.style.color="var(--ink)"; e.currentTarget.style.background="#fff"; e.currentTarget.style.outline="none"; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor="var(--sand-200)"; e.currentTarget.style.color="var(--ink-3)"; e.currentTarget.style.background="rgba(255,255,255,.85)"; e.currentTarget.style.outline="none"; }}
            >
              ⇅
            </button>
          </div>

          {[
            { l:"Your name",      p:"e.g. Arjun",      v:sender,    s:setSender    },
            { l:"Recipient name", p:"e.g. Priya",      v:recipient, s:setRecipient },
          ].map(({ l,p,v,s }) => (
            <div key={l}>
              <label style={{ display:"block", fontSize:12, color:"var(--ink-3)", marginBottom:5 }}>{l}</label>
              <input value={v} onChange={e=>s(e.target.value)} placeholder={p} type="text" {...inp(l)}/>
            </div>
          ))}

          <div style={{ borderTop:"1px solid var(--sand-200)", paddingTop:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <label style={{ fontSize:12, color:"var(--ink-3)" }}>Your message</label>
              <span style={{ fontSize:12, color:message.length>230?"#c0392b":"var(--ink-3)" }}>{message.length}/250</span>
            </div>
            <textarea value={message} onChange={e=>{ if(e.target.value.length<=250) setMessage(e.target.value); }} placeholder="Write from the heart. Don't overthink it." rows={4} {...inp("msg")}/>
           
          </div>

<div style={{ marginTop:4 }}>
          <AISuggest catId={cat.id} onUse={t => setMessage(t)}/>
          </div>

          <div>
            <div style={{ fontSize:12, color:"var(--ink-3)", marginBottom:8 }}>Need a nudge?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {(TEMPLATES[cat.id]||[]).map((t,i) => (
                <button key={i} className="prompt-pill" onClick={() => setMessage(t)}>
                  <span style={{ opacity:.4, marginRight:5 }}>"</span>{t.slice(0,80)}{t.length>80?"…":""}<span style={{ opacity:.4 }}>"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="compose-preview" style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:80 }}>
          <div style={{ fontSize:12, color:"var(--ink-3)" }}>Live preview</div>
          <PreviewCard cat={cat} to={recipient} from={sender} message={message} bgMode={bgMode} shimmerOn={shimmerOn} fontId={fontId} compact/>

          <div>
            <div style={{ fontSize:12, color:"var(--ink-3)", marginBottom:8 }}>Card background</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              {BG_OPTIONS.map(o => (
                <button key={o.id} onClick={() => setBgMode(o.id)}
                  style={{ padding:"7px 14px", borderRadius:999, border:`1.5px solid ${bgMode===o.id?cat.accent:"var(--sand-200)"}`, background:bgMode===o.id?cat.accent+"18":"rgba(255,255,255,.75)", fontFamily:"'Lato', sans-serif", fontSize:13, color:bgMode===o.id?cat.accent:"var(--ink-3)", cursor:"pointer", transition:"all .18s" }}>
                  {o.label}
                </button>
              ))}
              <button onClick={() => setShimmerOn(s => !s)}
                style={{ padding:"7px 14px", borderRadius:999, border:`1.5px solid ${shimmerOn?cat.accent:"var(--sand-200)"}`, background:shimmerOn?cat.accent+"18":"rgba(255,255,255,.75)", fontFamily:"'Lato', sans-serif", fontSize:13, color:shimmerOn?cat.accent:"var(--ink-3)", cursor:"pointer", transition:"all .18s", display:"flex", alignItems:"center", gap:4 }}>
                ✨ Shimmer
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize:12, color:"var(--ink-3)", marginBottom:8 }}>Text style</div>
            <div style={{ display:"flex", gap:6 }}>
              {FONT_OPTIONS.map(f => (
                <button key={f.id} onClick={() => setFontId(f.id)}
                  style={{ flex:1, padding:"9px 10px", borderRadius:10, border:`1.5px solid ${fontId===f.id?cat.accent:"var(--sand-200)"}`, background:fontId===f.id?cat.accent+"18":"rgba(255,255,255,.75)", cursor:"pointer", transition:"all .16s", textAlign:"left" }}>
                  <div style={{ ...f.style, fontSize:f.id==="sacramento"?24:14, color:fontId===f.id?cat.accent:"var(--ink)", marginBottom:3 }}>Aa</div>
                  <div style={{ fontSize:11, color:fontId===f.id?cat.accent:"var(--ink-3)" }}>{f.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:40, paddingTop:28, borderTop:"1px solid var(--sand-200)" }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back to categories</button>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          {!canGo && <span style={{ fontSize:13, color:"var(--ink-3)" }}>Fill all fields to continue</span>}
          <button className="btn btn-accent" disabled={!canGo}
            onClick={() => onPreview({ sender, recipient, message, bgMode, shimmerOn, fontId })}
            style={{ background:canGo?cat.accent:"var(--sand-300)" }}>
            Preview card →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function CardViewerScene({ vc, viewCard }) {
  const [opened, setOpened] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const open = () => {
    if (opened) return;
    setOpened(true);
    setTimeout(() => { setShowCard(true); }, 900);
    setTimeout(() => { setShowCTA(true); }, 1600);
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--sand-50)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
      <div style={{ fontSize:11, letterSpacing:".18em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:32 }}>heartfelt · a card for you</div>

      {/* envelope */}
      {!opened && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }} onClick={open}>
          <span className="vc-envelope" style={{ fontSize:72, lineHeight:1, display:"block" }}>💌</span>
          <span style={{ fontSize:13, color:"var(--ink-3)", fontFamily:"'Lora',serif", fontStyle:"italic" }}>tap to open</span>
        </div>
      )}

      {/* card */}
      {showCard && (
        <div style={{ width:"100%", maxWidth:400, animation:"cardReveal .55s ease both" }}>
          <PreviewCard cat={vc} to={viewCard.recipient} from={viewCard.sender} message={viewCard.message} bgMode={viewCard.bg_mode} shimmerOn={viewCard.shimmer_on} fontId={viewCard.font_id} animate/>
        </div>
      )}

      {/* CTA */}
      {showCTA && (
        <div style={{ marginTop:28, textAlign:"center", animation:"cardReveal .5s ease both" }}>
          <p style={{ fontSize:13, color:"var(--ink-3)", marginBottom:16, fontFamily:"'Lora',serif", fontStyle:"italic" }}>Want to send one back?</p>
          <button onClick={() => window.location.href="https://heartfelt-send.vercel.app"}
            style={{ padding:"10px 24px", borderRadius:999, border:"none", background:"var(--ink)", color:"#fff", fontFamily:"'Lato',sans-serif", fontSize:13, cursor:"pointer" }}>
            Send a heartfelt card ✦
          </button>
        </div>
      )}
    </div>
  );
}
export default function Heartfelt() {
  const [page,         setPage]         = useState("home");
  const [selCat,       setSelCat]       = useState(null);
  const [formData,     setFormData]     = useState(null);
  const [celebrating,  setCelebrating]  = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [sharedCardId, setSharedCardId] = useState(null);
  const [hasEverSent, setHasEverSent] = useState(() => {
  try { return localStorage.getItem('hf_ever_sent') === 'true'; } catch { return false; }
});

  const [wallMessages, setWallMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('hf_wall_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try { localStorage.setItem('hf_wall_messages', JSON.stringify(wallMessages)); } catch {}
  }, [wallMessages]);

  // Fetch real total count from Supabase on load
  useEffect(() => {
    fetch(`${SUPA_URL}/rest/v1/cards?select=id`, {
      headers: { ...supa.headers, "Prefer": "count=exact", "Range": "0-0" }
    }).then(r => {
      const count = parseInt(r.headers.get("content-range")?.split("/")[1] || "0");
      setTotalMessages(WALL_SEED.length + count);
    }).catch(() => setTotalMessages(WALL_SEED.length + wallMessages.length));
  }, []);

const cat = CATS.find(c => c.id === selCat);
const goHome = () => { setPage("home"); setSelCat(null); setFormData(null); setCelebrating(false); };

// Card viewer — reads ?id= from URL and shows the card
const [viewCard, setViewCard] = useState(null);
const [viewLoading, setViewLoading] = useState(false);

useEffect(() => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;
  setViewLoading(true);
  fetch(`${SUPA_URL}/rest/v1/cards?id=eq.${id}&select=*`, { headers: supa.headers })
    .then(r => r.json())
    .then(data => { if (data?.[0]) setViewCard(data[0]); setViewLoading(false); })
    .catch(() => setViewLoading(false));
}, []);

  const handleSend = async () => {
    if (celebrating) return; // prevent double press
    setCelebrating(true); // disable immediately
    if (formData) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setSharedCardId(id);
      setHasEverSent(true);
      try { localStorage.setItem('hf_ever_sent', 'true'); } catch {}
      try {
        await fetch(`${SUPA_URL}/rest/v1/cards`, {
          method: "POST",
          headers: { ...supa.headers, "Prefer": "return=minimal" },
          body: JSON.stringify({
            id, cat: cat.id,
            message: formData.message,
            recipient: formData.recipient,
            sender: formData.sender,
            bg_mode: formData.bgMode,
            font_id: formData.fontId,
            shimmer_on: formData.shimmerOn,
          })
        });
        setTotalMessages(t => t + 1);
      } catch(e) { console.error("Save failed", e); }
      setWallMessages(prev => [{
        id: Date.now(), cat: cat.id,
        message: formData.message,
        color: cat.light, accent: cat.accent,
        isNew: true, timeLabel: "just now",
      }, ...prev]);
    }
    setTimeout(() => { setCelebrating(false); setPage("sent"); }, 900);
  };

  // totalMessages: WALL_SEED is social proof baseline; real user cards add on top

  // Show card viewer if URL has ?id=
if (viewLoading) return (<><Styles/><div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif", color:"var(--ink-3)", background:"var(--sand-50)" }}>💌 Opening your card…</div></>);

if (viewCard) {
  const vc = CATS.find(c => c.id === viewCard.cat) || CATS[0];
  return (
    <>
      <Styles/>
      <style>{`
        @keyframes gentleShake {
          0%,100%{transform:rotate(0deg)}
          20%{transform:rotate(-5deg)}
          40%{transform:rotate(5deg)}
          60%{transform:rotate(-3deg)}
          80%{transform:rotate(3deg)}
        }
        @keyframes tapShake {
          0%,100%{transform:rotate(0deg) scale(1)}
          15%{transform:rotate(-8deg) scale(1.1)}
          30%{transform:rotate(8deg) scale(1.1)}
          45%{transform:rotate(-5deg) scale(1.05)}
          60%{transform:rotate(5deg) scale(1.05)}
          80%{transform:rotate(-2deg)}
        }
        @keyframes cardReveal {
          from{opacity:0;transform:translateY(18px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes vcBurst {
          0%{transform:translate(var(--bx),var(--by)) scale(0);opacity:1}
          60%{opacity:1}
          100%{transform:translate(calc(var(--bx)*3.2),calc(var(--by)*3.2)) scale(1);opacity:0}
        }
        .vc-envelope { animation: gentleShake 2.4s ease-in-out infinite; cursor:pointer; transition: opacity .3s ease, transform .3s ease; transform-origin: center bottom; }
        .vc-envelope:hover { animation: tapShake .5s ease; }
      `}</style>
      <CardViewerScene vc={vc} viewCard={viewCard}/>
    </>
  );
}

return (
  <>
    <Styles/>
    <FloatingBg/>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:20, background:"rgba(253,250,246,.94)", backdropFilter:"blur(18px)", borderBottom:"1px solid var(--sand-200)", height:58 }}>
        <div className="nav-wrap" style={{ maxWidth:1152, margin:"0 auto", padding:"0 32px", height:"100%", display:"flex", alignItems:"center", position:"relative" }}>

          <div style={{ flex:1, display:"flex", alignItems:"center" }}>
            <button onClick={goHome} className="nav-item-press" style={{ display:"flex", alignItems:"center", gap:7, background:"none", border:"none", cursor:"pointer", padding:0, transition:"opacity .15s" }} onMouseOver={e=>e.currentTarget.style.opacity=".8"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
              <div style={{ width:40, height:40, borderRadius:11, background:"var(--ink)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20, fontWeight:700, lineHeight:1 }}>◇</div>
              <span style={{ fontSize:17, fontFamily:"'Lora',serif", fontStyle:"italic", fontWeight:600, color:"var(--ink)" }}>heartfelt</span>
<span className="nav-logo-beta" style={{ fontSize:10, color:"var(--ink-3)", border:"1px solid var(--sand-200)", borderRadius:999, padding:"2px 7px", letterSpacing:".06em", fontFamily:"'Lato', sans-serif" }}>BETA</span>
            </button>
          </div>

          <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
            <button onClick={goHome}
              className="nav-item-press" style={{ padding:"9px 22px", borderRadius:999, border:"none", background:"var(--ink)", color:"#fff", fontFamily:"'Lato', sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", transition:"box-shadow .16s, transform .12s", boxShadow:"0 2px 10px rgba(24,18,14,.18)", whiteSpace:"nowrap" }}
              onMouseOver={e => { e.currentTarget.style.boxShadow="0 4px 18px rgba(24,18,14,.28)"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseOut={e  => { e.currentTarget.style.boxShadow="0 2px 10px rgba(24,18,14,.18)"; e.currentTarget.style.transform="translateY(0)"; }}>
              Send a Card
            </button>
          </div>

          <div style={{ flex:1, display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8 }}>
            <button onClick={() => setPage("wall")} className="nav-item-press"
              style={{ background:"none", border:"none", fontFamily:"'Lato', sans-serif", fontSize:14, fontWeight:page==="wall"?600:400, color:"var(--ink-3)", cursor:"pointer", transition:"color .16s", position:"relative", paddingBottom:4 }}
              onMouseOver={e=>{ if(page!=="wall") e.currentTarget.style.color="var(--ink-2)"; }}
              onMouseOut={e=>{ if(page!=="wall") e.currentTarget.style.color="var(--ink-3)"; }}>
              Gratitude Wall
              <span style={{ position:"absolute", bottom:0, left:0, right:0, height:1.5, background:"var(--ink-3)", borderRadius:2, transform:page==="wall"?"scaleX(1)":"scaleX(0)", transformOrigin:"left", transition:"transform .4s cubic-bezier(.25,.1,.25,1)" }}/>
            </button>
          </div>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:1 }}>

        {page === "wall" && <GratitudeWall wallMessages={wallMessages} hasEverSent={hasEverSent} onHome={goHome}/>}
        
        {page !== "wall" && <>

          {/* HOME */}
          {page === "home" && (
            <div className="anim-fadeup" style={{ maxWidth:1080, margin:"0 auto", padding:"60px 24px 80px" }}>
              <div style={{ textAlign:"center", marginBottom:52 }}>
                <div style={{ fontSize:11, letterSpacing:".18em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:16 }}>heartfelt / send a message</div>
                <h1 style={{ fontSize:"clamp(30px,5.5vw,52px)", fontWeight:600, color:"var(--ink)", letterSpacing:"-.03em", lineHeight:1.08, marginBottom:16, fontFamily:"'Lora',serif", fontStyle:"italic" }}>
                  Say the thing<br/><span style={{ fontStyle:"normal" }}>you keep meaning to.</span>
                </h1>
                <p style={{ fontSize:15, color:"var(--ink-3)", lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>
                  Pick a category. Write your message. Felt, not generated.
                </p>
              </div>

              {/* CHANGE 3: className="cat-grid" added — responsive CSS now actually applies */}
              <div className="cat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                {CATS.map((c,i) => (
                  <div key={c.id} className="anim-fadeup" style={{ animationDelay:`${i*.06}s` }}>
<CatCard cat={c} onClick={() => { setSelCat(c.id); setTimeout(() => setPage("compose"), 160); }}/>
                  </div>
                ))}
              </div>

              {/* CHANGE 6: footer shows total messages delivered */}
              <div style={{ marginTop:48, paddingTop:20, borderTop:"1px solid var(--sand-200)", display:"flex", alignItems:"center", justifyContent:"center", gap:9 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#2e7d32", display:"inline-block", animation:"blinkDot 2.4s ease-in-out infinite" }}/>
                <span style={{ fontSize:13, color:"var(--ink-3)" }}>
{totalMessages} messages shared · free · no account needed · <span className="footer-beta" style={{ fontSize:11, color:"var(--ink-3)", border:"1px solid var(--sand-200)", borderRadius:999, padding:"1px 6px", letterSpacing:".06em" }}>BETA</span>
                </span>
              </div>
            </div>
          )}

          {/* COMPOSE */}
          {page === "compose" && cat && (
            <div style={{ paddingTop:44 }}>
              <ComposeStep cat={cat} draft={formData} onBack={() => setPage("home")} onPreview={d => { setFormData(d); setPage("preview"); }}/>
            </div>
          )}

          {/* PREVIEW */}
          {page === "preview" && cat && formData && (
            <div className="anim-slidein" style={{ paddingTop:44, paddingBottom:64, position:"relative", overflow:"hidden" }}>

              {celebrating && (() => {
                const catEmojis = {
                  gratitude:["🌼","✦","🌼","✧","🌼","✦","✧","🌼","✦","🌼","✧","✦"],
                  love:["❤️","♡","❤️","✦","♡","❤️","✧","♡","❤️","♡","✦","❤️"],
                  birthday:["⭐","🎂","⭐","✦","⭐","🎂","✦","⭐","✦","🎂","⭐","✦"],
                  cheer:["☀️","✦","☀️","✧","☀️","✦","◇","☀️","✦","☀️","✧","◇"],
                  amends:["💛","🤝","💛","✦","💛","🤝","✧","💛","✦","💛","🤝","💛"],
                  celebrate:["🏆","🎉","✦","🏆","🎉","✦","🏆","✦","🎉","🏆","✦","🎉"],
                };
                const emojis = catEmojis[cat.id] || catEmojis.love;
                const positions = [
                  {bx:-80,by:-100,d:0,s:26},{bx:80,by:-100,d:.05,s:22},{bx:-115,by:-30,d:.1,s:20},{bx:115,by:-30,d:.08,s:24},
                  {bx:-55,by:90,d:.12,s:22},{bx:55,by:90,d:.06,s:20},{bx:-135,by:35,d:.04,s:18},{bx:135,by:35,d:.09,s:26},
                  {bx:0,by:-125,d:.02,s:24},{bx:-90,by:70,d:.11,s:20},{bx:90,by:70,d:.07,s:22},{bx:0,by:125,d:.03,s:18},
                  {bx:-160,by:-50,d:.06,s:16},{bx:160,by:-50,d:.13,s:18},{bx:-45,by:-150,d:.08,s:20},{bx:45,by:-150,d:.04,s:16},
                  {bx:-175,by:20,d:.15,s:18},{bx:175,by:20,d:.02,s:20},{bx:-100,by:-120,d:.09,s:22},{bx:100,by:-120,d:.14,s:24},
                ];
                return positions.map((p,i) => (
                  <div key={i} style={{ position:"fixed", top:"48%", left:"50%", fontSize:p.s||22, lineHeight:1,
                    "--bx":`${p.bx}px`, "--by":`${p.by}px`,
                    animation:`burstPop 1.8s cubic-bezier(.22,1,.36,1) ${p.d}s both`,
                    pointerEvents:"none", zIndex:50 }}>{emojis[i % emojis.length]}</div>
                ));
              })()}

              <div style={{ maxWidth:580, margin:"0 auto", padding:"0 24px" }}>
                <StepBar current="preview"/>
                <div style={{ textAlign:"center", marginBottom:26 }}>
                  <h2 style={{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:24, color:"var(--ink)", marginBottom:6 }}>Here's your card <span style={{display:"inline-block",animation:"shimmerStar 1.8s ease-in-out infinite"}}>✦</span></h2>
                  <div style={{ fontSize:13, color:"var(--ink-3)" }}>For <strong style={{ color:"var(--ink)" }}>{formData.recipient ? formData.recipient.charAt(0).toUpperCase()+formData.recipient.slice(1) : ""}</strong></div>
                </div>
<div className={celebrating ? "card-sealing" : ""} style={{ "--seal-color": cat.accent+"55", borderRadius:18 }}>
  <PreviewCard cat={cat} to={formData.recipient} from={formData.sender} message={formData.message} bgMode={formData.bgMode} shimmerOn={formData.shimmerOn} fontId={formData.fontId} animate/>
</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:26 }}>
                  <button className="btn btn-ghost" onClick={() => setPage("compose")} disabled={celebrating}>← Edit</button>
                  <button className="btn btn-accent" onClick={handleSend} disabled={celebrating}
                    style={{ background:cat.accent, opacity:celebrating?.7:1, transition:"opacity .2s" }}>
                    {celebrating ? "✦ Sealing…" : "✦ Finalise Card"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {page === "sent" && cat && (
            <SentPage cat={cat} formData={formData} cardId={sharedCardId} onHome={goHome} onViewWall={()=>{goHome();setPage("wall");}}/>
          )}
        </>}
      </div>
    </>
  );
}
