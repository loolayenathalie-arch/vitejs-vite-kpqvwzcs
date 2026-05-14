import React, { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";


/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS — SOURCE UNIQUE DE VÉRITÉ
   Toutes les couleurs de l'app passent par ici.
   Pour changer un thème : modifier uniquement cette section.
══════════════════════════════════════════════════════════ */
const T = {
  rose: {
    main:    "#D4537E", light:  "#F4B8C8", bg:   "#FFF0F4",
    soft:    "#FFE0EC", text:   "#72243E", dark: "#8B1A40",
  },
  violet: {
    main:    "#7F77DD", light:  "#C8B8F0", bg:   "#F4EEFF",
    soft:    "#E4DCFF", text:   "#3C3489", dark: "#1E1860",
    glow:    "#AFA9EC", night:  "#534AB7",
  },
  mer: {
    main:    "#1A6AAA", light:  "#90C4E8", bg:   "#E8F4FF",
    soft:    "#C8E4FF", text:   "#0C3060", dark: "#0A2448",
    sky:     "#3AB0E8",
  },
  nuit: {
    main:    "#1A3A78", light:  "#8098C8", bg:   "#E8EEF8",
    soft:    "#C8D4F0", text:   "#0C1E50", dark: "#060C28",
    deep:    "#040614", purple: "#080720",
  },
  vert: {
    main:    "#1D9E75", light:  "#9FE1CB", bg:   "#E8F5EB",
    soft:    "#C8EED8", text:   "#085041", dark: "#043828",
    pale:    "#A8E8D8", bright: "#5DCAA5",
  },
  or: {
    main:    "#EF9F27", light:  "#FAC775", bg:   "#FFF8E6",
    soft:    "#FFF0B8", text:   "#633806", dark: "#3A1E00",
    warm:    "#D88A18",
  },
  neutral: {
    white:      "#FFFFFF", cream:      "#FDF8F1", beige:     "#F5E8CF",
    sand:       "#EAD5B0", tan:        "#DEC89A", brown:     "#3B2E22",
    brownMid:   "#7A6A60", brownLight: "#B4A89E", wood:      "#8B5A28",
    woodDark:   "#5A3418", woodLight:  "#D4A870",
  },
  sys: {
    error:    "#F0997B", success:  "#1D9E75", warning: "#EF9F27",
    info:     "#378ADD", overlay:  "rgba(30,20,10,0.75)",
    glass:    "rgba(255,255,255,0.85)", glassDark: "rgba(20,16,50,0.92)",
  },
  ui: {
    border:      "#E2D9CF", borderSoft: "#D3C9BC", input:      "#D3C9BC",
    bg:          "#FDFAF6", bgWarm:     "#FFF9F0", error:      "#FAECE7",
    errorText:   "#712B13", errorBorder:"#D85A30", success:    "#E8F5EB",
    wood:        "#5A3A20", woodMid:    "#8A7A70", nightBg:    "#1E1A3A",
    nightText:   "#EEEDFE", pinkAccent: "#ED93B1", pinkSoft:   "#F8C8DC",
    blueLight:   "#85B7EB", bluePale:   "#D6EAFF", greenDeep:  "#2A6B5A",
    textDark:    "#2A1810", textMid:    "#5A4A3A", roseAlt:    "#C85A7A",
  },
};

/* Raccourcis pratiques */

/* ── Animations adaptées prefers-reduced-motion ──
   safe(anim)     → animation complète ou {}
   safeTrans(t)   → transition complète ou instant
   ─────────────────────────────────────────────── */
const safe = (anim, reduced) => reduced ? {} : anim;
const safeTrans = (t, reduced) => reduced ? { duration:0 } : t;

const SHELF_COLORS = {
  boubou:  T.rose,
  cloud:   T.violet,
  trash:   T.mer,
  lettre:  T.nuit,
  bonheur: T.or,
};

/* ── TOKENS TYPOGRAPHIE ──────────────────────────────────
   5 niveaux + cas spéciaux
   XS   = 11  labels, dates, mentions légales
   SM   = 13  secondaire, captions, placeholders
   BASE = 15  corps de texte, descriptions
   LG   = 19  boutons principaux, sous-titres
   XL   = 24  titres (Fredoka One)
   ──────────────────────────────────────────────────────── */
const FS = { XS:11, SM:13, BASE:15, LG:19, XL:24 };

/* ── TOKENS TYPOGRAPHIE ── */

/* ── TOKENS OMBRES ── */
const SH = {
  sm:  "0 2px 8px rgba(59,46,34,0.10)",
  md:  "0 6px 24px rgba(59,46,34,0.14)",
  lg:  "0 12px 40px rgba(59,46,34,0.18)",
};
const FF = {
  body:  "Nunito, sans-serif",
  title: "'Fredoka One', cursive",
};


/* ── TOKENS ESPACEMENT (multiples de 8) ──────────────────
   S4=4  S8=8  S12=12  S16=16  S24=24  S32=32  S48=48
   ──────────────────────────────────────────────────────── */
const SP = { S4:4, S8:8, S12:12, S16:16, S24:24, S32:32, S48:48 };


/* ══════════════════════════════════════════════════════════
   CONSTANTES
══════════════════════════════════════════════════════════ */
const STORAGE_KEY  = "bibl_pensees_v1";
const ONBOARD_KEY  = "bibl_onboarded_v1";
const APP_VERSION  = "1.3.0";
const PIN_KEY      = "bibl_pin_v1";
const PROFILE_KEY  = "bibl_profile_v1";
const AGE_KEY      = "bibl_age_mode_v1"; // "young" (4-7) | "older" (8-12)
const HISTORY_KEY  = "bibl_history_v1";
const EMPTY        = { boubou:[], cloud:[], trash:[], lettre:[], bonheur:[] };

/* ── Mode nuit automatique (après 19h) ── */
function useNightMode() {
  const [isNight, setIsNight] = useState(() => {
    const h = new Date().getHours();
    return h >= 19 || h < 6;
  });
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      setIsNight(h >= 19 || h < 6);
    };
    const t = setInterval(check, 60000); // check toutes les minutes
    return () => clearInterval(t);
  }, []);
  return isNight;
}


/* ── Hook prefers-reduced-motion ── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ── Chiffrement PIN (SHA-256 via SubtleCrypto) ── */
async function hashPin(pin) {
  const buf  = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("bibl_salt_" + pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
async function verifyPin(pin, hash) {
  return (await hashPin(pin)) === hash;
}

/* ── Profil enfant ── */
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : { name:"", avatar:"🦊", ageMode:"young" };
  } catch { return { name:"", avatar:"🦊", ageMode:"young" }; }
}
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch(e) { console.warn("saveProfile:", e); } }

/* ── Historique multi-nuits (30 dernières nuits) ── */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveNightToHistory(thoughts) {
  try {
    const hist = loadHistory();
    const tonight = {
      date: new Date().toISOString().slice(0,10),
      thoughts: JSON.parse(JSON.stringify(thoughts)),
    };
    // évite les doublons du même soir
    const filtered = hist.filter(n => n.date !== tonight.date);
    const updated  = [tonight, ...filtered].slice(0, 30); // 30 nuits max
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
  } catch {}
}

const SHELVES = [
  { id:"boubou",  emoji:"🩹", label:"Mes douceurs à soigner",        desc:"Un câlin pour mon cœur ce soir",      placeholder:"Je prends soin de moi ce soir…",    bg:T.rose.bg,   border:T.rose.light,   dot:T.rose.main,   text:T.rose.text,   postit:T.rose.soft   },
  { id:"cloud",   emoji:"🌀", label:"Mes pensées du moment",         desc:"Je pose mes pensées ici",             placeholder:"Une pensée que je confie…",          bg:T.violet.bg, border:T.violet.light, dot:T.violet.main, text:T.violet.text, postit:T.violet.soft },
  { id:"trash",   emoji:"🌊", label:"Ce que je confie aux vagues",   desc:"Je le laisse voyager loin",           placeholder:"Je confie cette pensée aux vagues…", bg:T.mer.bg,    border:T.mer.light,    dot:T.mer.main,    text:T.mer.text,    postit:T.mer.soft    },
  { id:"lettre",  emoji:"✉️", label:"Ma petite lettre du soir",      desc:"Un mot que j'aimerais partager",      placeholder:"Ce que j'aimerais dire ce soir…",    bg:T.nuit.bg,   border:T.nuit.light,   dot:T.nuit.main,   text:T.nuit.text,   postit:T.nuit.soft   },
  { id:"bonheur", emoji:"⭐", label:"Ce que je garde dans mon cœur", desc:"Ce qui m'accompagne vers les rêves",  placeholder:"Ma douceur du soir…",                bg:T.or.bg,     border:T.or.light,     dot:T.or.main,     text:T.or.text,     postit:T.or.soft     },
];

/* ══════════════════════════════════════════════════════════
   ERROR BOUNDARY — Capture les crashes React
   Affiche un écran doux au lieu d'un écran blanc
══════════════════════════════════════════════════════════ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("BibliothequeDesPensees crash:", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ position:"fixed", inset:0, background:T.vert.bg,
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:24, fontFamily:"Nunito, sans-serif",
        textAlign:"center" }}>
        <div style={{ fontSize:72, marginBottom:16 }}>🐻</div>
        <h2 style={{ fontFamily:"'Fredoka One', cursive", fontSize:22,
          color:T.vert.text, marginBottom:12 }}>
          Oups ! Le doudou a besoin d'aide
        </h2>
        <p style={{ fontSize:14, color:T.vert.main, marginBottom:24, lineHeight:1.6 }}>
          Quelque chose s'est mal passé.<br/>
          Tes pensées sont en sécurité — recharge la page.
        </p>
        <button onClick={() => window.location.reload()}
          style={{ padding:"14px 32px", borderRadius:20, border:"none",
            background:"linear-gradient(135deg,#1D9E75,#15876A)",
            color:"#fff", fontSize:16, fontFamily:"'Fredoka One', cursive",
            cursor:"pointer" }}>
          Recharger l'app 🔄
        </button>
        <details style={{ marginTop:16, fontSize:11, color:T.neutral.brownMid, maxWidth:340 }}>
          <summary style={{ cursor:"pointer" }}>Détails techniques</summary>
          <pre style={{ textAlign:"left", marginTop:8, whiteSpace:"pre-wrap",
            wordBreak:"break-all" }}>
            {this.state.error?.message}
          </pre>
        </details>
      </div>
    );
  }
}

/* ══════════════════════════════════════════════════════════
   MULTILINGUE — FR / LU / DE
══════════════════════════════════════════════════════════ */
const LANGS = {
  fr: {
    name: "Français", flag: "🇫🇷",
    goodevening: (n) => n ? `Bonsoir ${n} ! 🌙` : "Bonsoir ! 🌙",
    libraryTitle: "Bibliothèque des Pensées",
    depositText: "Dépose tes pensées",
    sleepText: "et dors le cœur léger ✨",
    shelfLabels: {
      boubou: "Mes douceurs à soigner",
      cloud:  "Mes pensées du moment",
      trash:  "Ce que je confie aux vagues",
      lettre: "Ma petite lettre du soir",
      bonheur:"Ce que je garde dans mon cœur",
    },
    write: "✏️ Écrire", speak: "🎤 Parler", draw: "🎨 Dessiner",
    store: "Ranger",
    parentSpace: "👨‍👩‍👧 Espace parent",
    noThoughts: "Aucune pensée rangée ici encore…",
    welcomeTitle: (n) => n ? `Bonsoir ${n} ! 🌙` : "Bonsoir ! 🌙",
  },
  lu: {
    name: "Lëtzebuergesch", flag: "🇱🇺",
    goodevening: (n) => n ? `Guddenowend ${n} ! 🌙` : "Guddenowend ! 🌙",
    libraryTitle: "Gedanke-Bibliothéik",
    depositText: "Leg deng Gedanken hei of",
    sleepText: "a schlof roueg ✨",
    shelfLabels: {
      boubou: "Meng kleng Wéien",
      cloud:  "Meng Gedanken haut",
      trash:  "Wat ech de Welle soe",
      lettre: "Mäi klengen Owend-Bréif",
      bonheur:"Wat ech am Häerz droen",
    },
    write: "✏️ Schreiwen", speak: "🎤 Schwätzen", draw: "🎨 Moolen",
    store: "Aräumen",
    parentSpace: "👨‍👩‍👧 Elteren-Plaz",
    noThoughts: "Nach keng Gedanken hei…",
    welcomeTitle: (n) => n ? `Guddenowend ${n} ! 🌙` : "Guddenowend ! 🌙",
  },
  de: {
    name: "Deutsch", flag: "🇩🇪",
    goodevening: (n) => n ? `Guten Abend ${n} ! 🌙` : "Guten Abend ! 🌙",
    libraryTitle: "Gedanken-Bibliothek",
    depositText: "Leg deine Gedanken ab",
    sleepText: "und schlaf mit leichtem Herzen ✨",
    shelfLabels: {
      boubou: "Meine kleinen Wehwehchen",
      cloud:  "Meine Gedanken heute",
      trash:  "Was ich den Wellen anvertraue",
      lettre: "Mein kleiner Abendbrief",
      bonheur:"Was ich in meinem Herzen trage",
    },
    write: "✏️ Schreiben", speak: "🎤 Sprechen", draw: "🎨 Zeichnen",
    store: "Einräumen",
    parentSpace: "👨‍👩‍👧 Eltern-Bereich",
    noThoughts: "Noch keine Gedanken hier…",
    welcomeTitle: (n) => n ? `Guten Abend ${n} ! 🌙` : "Guten Abend ! 🌙",
  },
};

function useLang() {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("bibl_lang") || "fr"; } catch { return "fr"; }
  });
  const setLang = (l) => {
    try { localStorage.setItem("bibl_lang", l); } catch {}
    setLangState(l);
  };
  return { lang, setLang, t: LANGS[lang] || LANGS.fr };
}



const ONBOARD_STEPS = [
  { shelf:null,     emoji:"🐻", title:"Bonsoir, je suis ton doudou gardien",
    text:"Cette bibliothèque magique est faite pour toi. Chaque soir, viens déposer tes pensées pour dormir le cœur tout léger.",
    speech:"Bonsoir. Je suis ton doudou gardien. Ta bibliothèque magique t'attend. Chaque soir. Tu peux venir ici. Déposer tes pensées. Et dormir, le cœur tout léger.", bg:T.neutral.cream, dot:T.violet.main },
  { shelf:"boubou", emoji:"🩹", title:"Mes douceurs à soigner",
    text:"Parfois le cœur a besoin d'un petit câlin. Tu peux poser ici ce dont tu voudrais prendre soin. C'est doux de s'en occuper ensemble.",
    speech:"Parfois. Le cœur a besoin d'un petit câlin. Tu peux poser ici. Ce dont tu voudrais prendre soin. C'est doux. De s'en occuper ensemble.", bg:T.rose.bg,   dot:T.rose.main },
  { shelf:"cloud",  emoji:"🌀", title:"Mes pensées du moment",
    text:"Des pensées qui tourbillonnent dans ta tête ? Tu peux les confier ici. Le vent doux les prendra et les emmènera se promener.",
    speech:"Des pensées qui tourbillonnent dans ta tête ? Tu peux les confier ici. Le vent doux les prendra. Et les emmènera se promener. Pendant que tu dors paisiblement.", bg:T.violet.bg, dot:T.violet.main },
  { shelf:"trash",  emoji:"🌊", title:"Ce que je confie aux vagues",
    text:"Certaines pensées ont envie de voyager loin. Tu les glisses dans une bouteille, et les vagues joyeuses les emportent vers de nouveaux horizons.",
    speech:"Certaines pensées. Ont envie de voyager loin. Tu les glisses dans une bouteille. Et les vagues joyeuses. Les emportent vers de nouveaux horizons. Cette nuit.", bg:T.mer.bg,    dot:T.mer.main },
  { shelf:"lettre", emoji:"✉️", title:"Ma petite lettre du soir",
    text:"Tu as quelque chose de beau à partager avec quelqu'un ? Un merci, un sourire, un mot doux. Écris-le ici, il s'envolera vers la lune.",
    speech:"Tu as quelque chose de beau. À partager avec quelqu'un ? Un merci. Un sourire. Un mot doux. Écris-le ici. Il s'envolera. Vers la lune. Cette nuit.", bg:T.nuit.bg,   dot:T.nuit.main },
  { shelf:"bonheur",emoji:"⭐", title:"Ce que je garde dans mon cœur",
    text:"Termine toujours par quelque chose de beau ! Un souvenir qui te fait sourire, une personne chère, un moment doux. C'est cette lumière qui t'accompagne.",
    speech:"Et maintenant. Quelque chose de beau. Un souvenir qui te fait sourire. Une personne que tu aimes. Un moment doux. C'est cette lumière là. Qui reste près de ton cœur. Et t'accompagne. Vers les rêves.", bg:T.or.bg,     dot:T.or.main },
];


/* ══════════════════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════════════════ */
/* Test localStorage disponibilité */
function isStorageAvailable() {
  try { localStorage.setItem("_t","1"); localStorage.removeItem("_t"); return true; }
  catch { return false; }
}
const STORAGE_OK = isStorageAvailable();

function loadThoughts() {
  if (!STORAGE_OK) return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw);
    const m = {};
    for (const k of Object.keys(EMPTY)) {
      m[k] = (p[k] || []).map(item => {
        const base = typeof item === "string" ? { text: item, date: new Date().toISOString() } : item;
        return base.id ? base : { ...base, id: `${k}_legacy_${Math.random().toString(36).slice(2,7)}` };
      });
    }
    return m;
  } catch { return EMPTY; }
}
function saveThoughts(t) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {}
}
function fmtDate(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return "ce soir";
  if (diff === 1) return "hier";
  return new Date(iso).toLocaleDateString("fr-FR", { day:"numeric", month:"short" });
}

/* ══════════════════════════════════════════════════════════
   CONFIGURATION VOIX
   ─────────────────────────────────────────────────────────
   Option A — Variables d'environnement Vercel (RECOMMANDÉ)
     → vercel.com → Settings → Environment Variables
     → VITE_ELEVENLABS_KEY = sk_...
     → VITE_OPENAI_KEY     = sk-...
   Option B — Réglages dans l'app (Espace parent → Réglages)
     → Les clés saisies sont stockées en localStorage
   ─────────────────────────────────────────────────────────
   Priorité : Env var > localStorage > vide (Web Speech)
══════════════════════════════════════════════════════════ */
const ELEVENLABS_API_KEY  = (() => { try { return localStorage.getItem("bibl_elevenlabs_key") || ""; } catch { return ""; } })();
const ELEVENLABS_VOICE_ID = (() => { try { return localStorage.getItem("bibl_elevenlabs_voice") || "XB0fDUnXU5powFXDhCwa"; } catch { return "XB0fDUnXU5powFXDhCwa"; } })();
const OPENAI_API_KEY      = (() => { try { return localStorage.getItem("bibl_openai_key") || ""; } catch { return ""; } })();
const OPENAI_VOICE        = "nova";

/* ══════════════════════════════════════════════════════════
   HOOK VOIX — ElevenLabs + fallback Web Speech
══════════════════════════════════════════════════════════ */
function useSpeech() {
  const audioRef   = useRef(null);
  const synthRef   = useRef(null);
  const cacheRef   = useRef({});
  const okWS       = typeof window !== "undefined" && !!window.speechSynthesis;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (okWS) synthRef.current = window.speechSynthesis;
    return () => { stopAll(); };
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (okWS && synthRef.current) synthRef.current.cancel();
    setIsLoading(false);
  }, [okWS]);

  const speakElevenLabs = useCallback(async (text, opts = {}) => {
    stopAll();
    setIsLoading(true);

    const key = ELEVENLABS_VOICE_ID + "|" + text.slice(0, 80);
    let url = cacheRef.current[key];

    if (!url) {
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 6000); // 6s timeout
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              "xi-api-key":   ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
              "Accept":       "audio/mpeg",
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability:        0.72,
                similarity_boost: 0.80,
                style:            0.20,
                use_speaker_boost: true,
              },
            }),
          }
        );
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        cacheRef.current[key] = url;
      } catch (err) {
        console.warn("ElevenLabs → fallback:", err.message);
        setIsLoading(false);
        speakWebSpeech(text, opts);
        return;
      }
    }

    setIsLoading(false);
    const audio = new Audio(url);
    audio.volume      = opts.vol  ?? 0.88;
    audio.playbackRate = opts.rate ?? 0.92;
    audioRef.current  = audio;
    audio.onended = () => { audioRef.current = null; opts.onEnd?.(); };
    audio.onerror = () => { speakWebSpeech(text, opts); };
    audio.play().catch(() => { setIsLoading(false); speakWebSpeech(text, opts); });
  }, [stopAll]);

  /* ── OpenAI TTS ── */
  const speakOpenAI = useCallback(async (text, opts = {}) => {
    stopAll();
    setIsLoading(true);

    const key = "oai|" + OPENAI_VOICE + "|" + text.slice(0, 80);
    let url = cacheRef.current[key];

    if (!url) {
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify({
            model: "tts-1-hd",       // HD = meilleure qualité
            voice: OPENAI_VOICE,     // nova = douce et chaleureuse
            input: text,
            speed: 0.88,             // légèrement ralentie pour enfant
          }),
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        cacheRef.current[key] = url;
      } catch (err) {
        // Retry 1 fois après 1s avant fallback
        console.warn("OpenAI TTS erreur:", err.message);
        await new Promise(r => setTimeout(r, 1000));
        try {
          const res2 = await fetch("https://api.openai.com/v1/audio/speech", {
            method:"POST",
            headers:{ "Authorization":`Bearer ${OPENAI_API_KEY}`, "Content-Type":"application/json" },
            body: JSON.stringify({ model:"tts-1", voice:OPENAI_VOICE, input:text, speed:0.88 }),
          });
          if (res2.ok) {
            const blob2 = await res2.blob();
            url = URL.createObjectURL(blob2);
            cacheRef.current[key] = url;
          } else throw new Error("retry failed");
        } catch {
          setIsLoading(false);
          speakWebSpeech(text, opts);
          return;
        }
      }
    }

    setIsLoading(false);
    const audio = new Audio(url);
    audio.volume      = opts.vol  ?? 0.90;
    audio.playbackRate = 1.0; // déjà ralentie côté API
    audioRef.current  = audio;
    audio.onended = () => { audioRef.current = null; opts.onEnd?.(); };
    audio.onerror = () => { speakWebSpeech(text, opts); };
    audio.play().catch(() => { setIsLoading(false); speakWebSpeech(text, opts); });
  }, [stopAll]);

  /* ── Web Speech API (fallback) — optimisée Android ── */
  const bestVoice = useCallback(() => {
    if (!synthRef.current) return null;
    const all = synthRef.current.getVoices();
    const fr  = all.filter(v => v.lang.startsWith("fr"));

    // Score : plus haut = meilleure voix
    const sc = v => {
      const n = v.name.toLowerCase();
      // Voix premium / neuronales
      if (n.includes("neural") || n.includes("premium"))         return 10;
      if (n.includes("enhanced"))                                 return 9;
      // Google TTS sur Android — très bonne qualité
      if (n.includes("google") && (n.includes("fr") || n.includes("french"))) return 8;
      // Samsung TTS
      if (n.includes("samsung") && n.includes("fr"))             return 7;
      // Voix nommées qualité
      if (n.includes("amelie") || n.includes("amélie"))          return 6;
      if (n.includes("marie"))                                    return 5;
      if (n.includes("juliette") || n.includes("lea") || n.includes("léa")) return 5;
      if (n.includes("thomas"))                                   return 4;
      // Voix locale
      if (v.localService)                                         return 3;
      return 1;
    };
    const best = fr.sort((a,b) => sc(b)-sc(a))[0];

    // Si aucune voix fr, essayer fr-FR ou fr-BE ou fr-CA
    if (!best) {
      const wider = all.filter(v =>
        v.lang.includes("fr") || v.name.toLowerCase().includes("french")
      ).sort((a,b) => sc(b)-sc(a))[0];
      return wider || null;
    }
    return best;
  }, []);

  /* ── Humanisation du texte pour Web Speech ──
     Transforme le texte brut en séquences qui sonnent
     naturelles et douces, comme une vraie voix humaine   */
  const humanize = (raw) => {
    return raw
      // Remplacer les points d'exclamation/interrogation par des pauses expressives
      .replace(/\s*!\s*/g, "…  ")
      .replace(/\s*\?\s*/g, "…  ")
      // Pauses longues après les points
      .replace(/\.\s+/g, ".    ")
      // Pauses moyennes après les virgules
      .replace(/,\s+/g, ",  ")
      // Pauses après deux-points
      .replace(/\s*:\s*/g, ",  ")
      // Pauses après les tirets
      .replace(/\s*—\s*/g, ",  ")
      // Répétitions de voyelles pour l'emphase → pause naturelle
      .replace(/\.\.\./g, "…  ")
      // Mots de liaison → légère pause avant
      .replace(/\b(et|mais|donc|alors|puis|ensuite|enfin|voilà)\b/gi, " $1")
      // Prénoms et interpellations → pause après
      .replace(/\b(bonsoir|bonjour|salut)\b/gi, "$1,")
      .trim();
  };

  /* Découpe intelligente en phrases courtes pour un débit naturel */
  const splitSentences = (text) => {
    const humanized = humanize(text);
    // Découpe sur les pauses longues
    return humanized
      .split(/\s{3,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const speakWebSpeech = useCallback((text, opts = {}) => {
    if (!okWS || !synthRef.current) return;
    synthRef.current.cancel();

    const parts = splitSentences(text);
    let i = 0;

    const speakPart = () => {
      if (i >= parts.length) { opts.onEnd?.(); return; }

      const part = parts[i++];
      const u = new SpeechSynthesisUtterance(part);

      u.lang   = "fr-FR";
      // Vitesse légèrement variable par phrase → sonne moins robot
      u.rate   = (opts.rate ?? 0.76) + (Math.random() * 0.04 - 0.02);
      u.pitch  = opts.pitch ?? 0.88;
      u.volume = opts.vol   ?? 0.88;

      const v = bestVoice();
      if (v) u.voice = v;

      // Pause naturelle entre phrases — variable selon longueur
      const pauseMs = part.length > 60 ? 420 : part.length > 30 ? 320 : 240;
      u.onend = () => setTimeout(speakPart, pauseMs);

      // Fix Android : relancer si la synth se coince (bug connu)
      const watchdog = setTimeout(() => {
        if (synthRef.current?.speaking) {
          synthRef.current.cancel();
          setTimeout(speakPart, 200);
        }
      }, 8000);
      u.onend = () => { clearTimeout(watchdog); setTimeout(speakPart, pauseMs); };
      u.onerror = (e) => {
        clearTimeout(watchdog);
        console.warn("WebSpeech error:", e?.error);
        // Retry automatique après 500ms sur erreur réseau
        const delay = e?.error === 'network' ? 2000 : 200;
        setTimeout(speakPart, delay);
      };

      synthRef.current.speak(u);
    };

    // Android : attendre que les voix soient chargées
    const trySpeak = () => {
      const voices = synthRef.current?.getVoices() || [];
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          setTimeout(speakPart, 50);
        };
      } else {
        speakPart();
      }
    };

    setTimeout(trySpeak, 120);
  }, [okWS, bestVoice]);

  /* ── Routage : ElevenLabs > OpenAI > Web Speech ── */
  const speak = useCallback((text, opts = {}) => {
    if (ELEVENLABS_API_KEY?.trim()) {
      speakElevenLabs(text, opts);
    } else if (OPENAI_API_KEY?.trim()) {
      speakOpenAI(text, opts);
    } else {
      speakWebSpeech(text, opts);
    }
  }, [speakElevenLabs, speakOpenAI, speakWebSpeech]);

  const stop = useCallback(() => stopAll(), [stopAll]);

  return { speak, stop, isLoading };
}

/* ══════════════════════════════════════════════════════════
   HOOK SONS (Web Audio)
══════════════════════════════════════════════════════════ */
function useSound() {
  const ctx = useRef(null);
  const ac  = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.current.state === "suspended") ctx.current.resume();
    return ctx.current;
  };

  // Fermer l'AudioContext à la destruction du composant
  useEffect(() => {
    return () => { try { ctx.current?.close(); } catch {} };
  }, []);

  const noise = (dur, freqs, vol = 0.2) => {
    const c = ac(), buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate;
      d[i] = freqs.reduce((s,[f,a]) => s + Math.sin(2*Math.PI*f*t)*a, 0) * Math.exp(-t*3) * vol;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = 1;
    src.connect(g); g.connect(c.destination); src.start();
  };

  const creak    = () => noise(0.7, [[160,1],[300,0.35]], 0.18);
  const slam     = () => noise(0.9, [[100,1],[180,0.5]], 0.22);
  const paperRustle = () => {
    const c = ac(), buf = c.createBuffer(1, c.sampleRate*1.2, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate;
      d[i] = (Math.random()*2-1) * Math.exp(-t*3) * 0.08;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type="lowpass"; f.frequency.value=1800;
    const g = c.createGain(); g.gain.value=0.6;
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  };
  const windBlow = () => {
    const c = ac(), buf = c.createBuffer(1, c.sampleRate*1.8, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate;
      d[i] = (Math.random()*2-1) * (0.5+0.5*Math.sin(2*Math.PI*0.9*t)) * Math.sin(Math.PI*t/1.8) * 0.09;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const lp = c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=2000;
    const g = c.createGain(); g.gain.value=0.8;
    src.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
  };
  const wave = () => {
    const c = ac(), buf = c.createBuffer(1, c.sampleRate*2.5, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate;
      d[i] = (Math.random()*2-1) * Math.sin(2*Math.PI*0.6*t) * Math.exp(-t*0.5) * 0.07;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value=0.55;
    src.connect(g); g.connect(c.destination); src.start();
  };
  const letterSound = () => {
    paperRustle();
    const c = ac();
    [440,554].forEach((f,i) => {
      const o = c.createOscillator(), g = c.createGain();
      const t = c.currentTime + 0.15 + i*0.22;
      o.type="sine"; o.frequency.value=f;
      g.gain.setValueAtTime(0.1,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.9);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+0.9);
    });
  };
  const joyBell = () => {
    const c = ac();
    [523,659,784,1047,880,1047,1319].forEach((f,i) => {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
      const t = c.currentTime + i*0.1;
      o.type="sine"; o.frequency.value=f; o2.type="sine"; o2.frequency.value=f*1.26;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.14,t+0.03); g.gain.exponentialRampToValueAtTime(0.001,t+0.55);
      o.connect(g); o2.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t+0.56); o2.start(t); o2.stop(t+0.56);
    });
  };
  const lullaby = () => {
    const c = ac();
    [523,659,784,659,523,392,440,523].forEach((f,i) => {
      const o = c.createOscillator(), g = c.createGain();
      const t = c.currentTime + i*0.5;
      o.type="sine"; o.frequency.value=f;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.12,t+0.04); g.gain.exponentialRampToValueAtTime(0.001,t+0.49);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+0.5);
    });
  };
  return { creak, slam, paperRustle, windBlow, wave, letterSound, joyBell, lullaby };
}

/* ══════════════════════════════════════════════════════════
   POST-IT
══════════════════════════════════════════════════════════ */
function PostIt({ item, color, onRemove, index, onSpeak, parentReply }) {
  const [speaking, setSpeaking] = useState(false);
  const rots = [-3.5, 2, -1.5, 3, -2.5, 1.5, -4, 2.8];
  const text    = typeof item === "string" ? item : item.text;
  const date    = typeof item === "object" ? item.date : null;
  const drawing = typeof item === "object" ? item.drawing : null;
  const rot     = rots[index % rots.length];

  return (
    <motion.div layout
      initial={{ scale:0, rotate:rot-10, opacity:0 }}
      animate={{ scale:1, rotate:rot, opacity:1 }}
      exit={{ scale:0, opacity:0, y:-16 }}
      transition={{ type:"spring", stiffness:340, damping:20 }}
      whileHover={{ scale:1.10, rotate:0, zIndex:20, boxShadow:SH.sm }}
      style={{
        background: drawing
          ? color.postit
          : `linear-gradient(135deg, ${color.postit} 92%, ${color.border} 92%)`,
        border:`1.5px solid ${color.border}`,
        borderRadius: drawing ? 10 : "10px 10px 10px 0px",
        padding: drawing ? "6px 28px 6px 6px" : "10px 28px 12px 11px",
        fontSize:15, color:color.text,
        maxWidth: drawing ? 100 : 140,
        position:"relative", lineHeight:1.6, wordBreak:"break-word",
        boxShadow:`2px 3px 8px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.6)`,
        flexShrink:0,
      }}>
      {!drawing && (
        <div style={{
          position:"absolute", bottom:0, left:0,
          width:0, height:0, borderStyle:"solid",
          borderWidth:"10px 10px 0 0",
          borderColor:`${color.border} transparent transparent transparent`,
          opacity:0.6,
        }}/>
      )}
      {drawing
        ? <img src={drawing} alt="dessin" style={{ width:82, height:62, borderRadius:8, display:"block", objectFit:"cover" }} />
        : <>
            <div style={{ fontWeight:700, lineHeight:1.6 }}>{text}</div>
            {date && <div style={{ fontSize:11, color:color.dot, marginTop:4, opacity:0.85 }}>{fmtDate(date)}</div>}
            {parentReply && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                style={{
                  marginTop:4, padding:"11px 6px",
                  background:"rgba(250,199,117,0.25)",
                  borderRadius:8, borderLeft:`2.5px solid #EF9F27`,
                  fontSize:11, color:T.or.text, lineHeight:1.6,
                }}>
                💛 {parentReply.text}
              </motion.div>
            )}
          </>
      }
      {!drawing && onSpeak && (
        <button onClick={() => { setSpeaking(true); onSpeak(text, () => setSpeaking(false)); }}
          aria-label="Relire cette pensée"
          style={{
            position:"absolute", bottom:6, right:6,
            background:"none", border:"none", fontSize:15,
            color: speaking ? color.dot : color.dot+"88",
            cursor:"pointer", minHeight:44, padding:"11px",
            minWidth:28, minHeight:28,
            display:"flex", alignItems:"center", justifyContent:"center",
            animation: speaking ? "spin 1s linear infinite" : "none",
          }}>
          🔊
        </button>
      )}
      <button onClick={onRemove} aria-label="Supprimer cette pensée"
        style={{
          position:"absolute", top:4, right:5,
          background:"none", border:"none",
          fontSize:15, color:color.dot+"AA",
          cursor:"pointer", minHeight:44, fontWeight:800, lineHeight:1.3,
          padding:"11px", minWidth:28, minHeight:28,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color=color.dot}
        onMouseLeave={e => e.currentTarget.style.color=color.dot+"AA"}>
        ×
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MINI CANVAS DESSIN
══════════════════════════════════════════════════════════ */
const DRAW_COLORS = [T.rose.main,T.sys.info,T.or.main,T.vert.main,T.violet.main,T.ui.errorBorder,T.neutral.brown,"#fff"];
const BRUSH_SIZES = [3, 6, 11];

function MiniCanvas({ color, onSave }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const [brushColor, setBrushColor] = useState(color || T.rose.main);
  const [brushSize, setBrushSize]   = useState(6);
  const [isEraser, setIsEraser]     = useState(false);
  const [isEmpty, setIsEmpty]       = useState(true);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = T.ui.bgWarm; ctx.fillRect(0, 0, cv.width, cv.height);
  }, []);

  const getPos = (e, cv) => {
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left)*sx, y: (src.clientY - r.top)*sy };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const endDraw   = () => { drawing.current = false; lastPos.current = null; };
  const draw = (e) => {
    e.preventDefault(); if (!drawing.current) return;
    const cv = canvasRef.current, ctx = cv.getContext("2d");
    const pos = getPos(e, cv);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? T.ui.bgWarm : brushColor;
    ctx.lineWidth   = isEraser ? brushSize*3 : brushSize;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos; setIsEmpty(false);
  };
  const clear = () => {
    const cv = canvasRef.current, ctx = cv.getContext("2d");
    ctx.fillStyle = T.ui.bgWarm; ctx.fillRect(0, 0, cv.width, cv.height); setIsEmpty(true);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:8, flexWrap:"wrap" }}>
        {DRAW_COLORS.map(c => (
          <button key={c} onClick={() => { setBrushColor(c); setIsEraser(false); }}
            style={{ width:20, height:20, borderRadius:"50%", background:c, border:"none", cursor:"pointer", minHeight:44, flexShrink:0,
              outline: !isEraser && brushColor===c ? "2.5px solid #3B2E22" : "2px solid transparent",
              outlineOffset:2, boxShadow: c==="#fff" ? "0 0 0 1px #ccc inset" : "none" }} />
        ))}
        <div style={{ width:1, height:18, background:T.ui.border, margin:"0 2px" }} />
        {BRUSH_SIZES.map(s => (
          <button key={s} onClick={() => { setBrushSize(s); setIsEraser(false); }}
            style={{ width:s*3+4, height:s*3+4, borderRadius:"50%", border:"none", cursor:"pointer", minHeight:44, flexShrink:0,
              background: brushSize===s && !isEraser ? T.neutral.brown : T.ui.input }} />
        ))}
        <button onClick={() => setIsEraser(e => !e)}
          style={{ fontSize:15, background: isEraser ? T.rose.light : "transparent",
            border:`1.5px solid ${isEraser?T.rose.main:T.ui.input}`, borderRadius:8, padding:"1px 6px", cursor:"pointer", minHeight:44 }}>
          🧹
        </button>
      </div>
      <canvas ref={canvasRef} width={520} height={200}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        style={{ width:"100%", height:150, borderRadius:16, border:"1.5px solid #E2D9CF",
          background:T.ui.bgWarm, display:"block", cursor: isEraser ? "cell" : "crosshair", touchAction:"none" }} />
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button onClick={clear}
          style={{ flex:1, padding:"8px 0", borderRadius:8, fontSize:11, border:"1.5px solid #D3C9BC",
            background:"transparent", color:T.neutral.brownMid, cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
          Recommencer 🗑️
        </button>
        <button onClick={() => !isEmpty && onSave(canvasRef.current.toDataURL())} disabled={isEmpty}
          style={{ flex:2, padding:"8px 0", borderRadius:8, fontSize:11, fontWeight:600,
            border:"none", background: isEmpty ? T.ui.input : color, color:"#fff",
            cursor: isEmpty ? "default" : "pointer", fontFamily:FF.body }}>
          Ranger ce dessin 📌
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SCÈNES ILLUSTRÉES
══════════════════════════════════════════════════════════ */


function SoftTimer({ minutes = 5, onEnd }) {
  const [secs, setSecs]   = useState(minutes * 60);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active || secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, secs]);

  useEffect(() => {
    if (secs === 0 && active) { setActive(false); onEnd?.(); }
  }, [secs, active]);

  const mins = Math.floor(secs / 60);
  const s    = secs % 60;
  const pct  = secs / (minutes * 60);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ display:"flex", alignItems:"center", gap:8,
        background:"rgba(255,255,255,0.7)", borderRadius:24,
        padding:"6px 14px", backdropFilter:"blur(8px)",
        border:`1px solid ${T.or.light}` }}>
      {/* Arc circulaire */}
      <svg width="32" height="32" style={{ flexShrink:0 }}>
        <circle cx="16" cy="16" r="12" fill="none" stroke={T.or.soft} strokeWidth="3"/>
        <circle cx="16" cy="16" r="12" fill="none" stroke={T.or.main} strokeWidth="3"
          strokeDasharray={`${2*Math.PI*12*pct} ${2*Math.PI*12*(1-pct)}`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          style={{ transition:"stroke-dasharray 1s linear" }}/>
      </svg>
      <span style={{ fontFamily:FF.title, fontSize:15, color:T.or.text, minWidth:36 }}>
        {mins}:{s.toString().padStart(2,"0")}
      </span>
      <button onClick={() => setActive(a => !a)}
        style={{ background:"none", border:"none", fontSize:16,
          cursor:"pointer", padding:0, minHeight:32 }}>
        {active ? "⏸" : "▶️"}
      </button>
    </motion.div>
  );
}



const CHANGELOG = [
  { version:"1.3.0", date:"Mai 2026", items:[
    "✨ Multilingue : Français, Lëtzebuergesch, Deutsch",
    "🔔 Notifications du soir à 20h",
    "🖨️ Export PDF des pensées",
    "🌍 Consentement parental RGPD",
    "♿ Accessibilité améliorée",
    "⚡ Performances optimisées",
  ]},
  { version:"1.2.0", date:"Avril 2026", items:[
    "🐻 Doudou ourson remplace le hibou",
    "🎨 Nouvelles scènes animées par étagère",
    "🎵 Sons doux au rangement",
    "📊 Stats enfant sur la page d'accueil",
  ]},
  { version:"1.1.0", date:"Mars 2026", items:[
    "🌙 Mode nuit automatique après 19h",
    "👨‍👩‍👧 Espace parent avec PIN sécurisé",
    "✉️ Réponses parent visibles sur les post-its",
  ]},
];

function ChangelogScreen({ onClose }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:300,
        background:T.neutral.cream, display:"flex", flexDirection:"column",
        fontFamily:FF.body, overflow:"hidden" }}>
      <div style={{ padding:"20px 16px 8px", display:"flex",
        alignItems:"center", justifyContent:"space-between",
        borderBottom:`1px solid ${T.ui.border}` }}>
        <h2 style={{ fontFamily:FF.title, fontSize:22, color:T.neutral.brown }}>
          📋 Nouveautés
        </h2>
        <button onClick={onClose} aria-label="Fermer"
          style={{ background:"none", border:"none", fontSize:22,
            cursor:"pointer", minHeight:44, minWidth:44 }}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {CHANGELOG.map(v => (
          <div key={v.version} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <span style={{ fontFamily:FF.title, fontSize:15, color:T.violet.main }}>
                v{v.version}
              </span>
              <span style={{ fontSize:11, color:T.neutral.brownMid }}>{v.date}</span>
            </div>
            {v.items.map((item,i) => (
              <div key={i} style={{ fontSize:13, color:T.neutral.brown,
                padding:"6px 0", borderBottom:`1px solid ${T.ui.border}`,
                lineHeight:1.6 }}>
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  }, []);
  if (!offline) return null;
  return (
    <motion.div initial={{ y:-50, opacity:0 }} animate={{ y:0, opacity:1 }}
      style={{ position:"fixed", top:0, left:0, right:0, zIndex:9000,
        background:T.ui.nightBg, color:T.ui.nightText,
        padding:"10px 16px", textAlign:"center",
        fontFamily:FF.body, fontSize:13, fontWeight:600,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      📵 Mode hors-ligne — tes pensées sont sauvegardées localement
    </motion.div>
  );
}

function SkeletonShelf() {
  return (
    <div style={{ padding:"12px 16px", marginBottom:8 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          height:44, borderRadius:16, marginBottom:8,
          background:"linear-gradient(90deg,#E8E0D8 0%,#F5F0EA 50%,#E8E0D8 100%)",
          backgroundSize:"200% 100%",
          animation:"shimmer 1.4s infinite",
          opacity: 1 - i*0.15,
        }}/>
      ))}
    </div>
  );
}

/* ── Floater — décorations animées fond bibliothèque ── */
function Floater({ type, d }) {
  const night = false; // utilisé en dehors du contexte — couleur neutre
  const items = {
    star:  <svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill={T.or.main} opacity="0.7"/></svg>,
    cloud: <svg width="32" height="20" viewBox="0 0 32 20"><ellipse cx="16" cy="14" rx="14" ry="7" fill={T.mer.soft} opacity="0.6"/><ellipse cx="10" cy="11" rx="7" ry="6" fill={T.mer.soft} opacity="0.6"/><ellipse cx="22" cy="12" rx="6" ry="5" fill={T.mer.soft} opacity="0.6"/></svg>,
    moon:  <svg width="22" height="22" viewBox="0 0 22 22"><path d="M11 2 A9 9 0 1 0 11 20 A6 6 0 1 1 11 2Z" fill={T.violet.glow} opacity="0.6"/></svg>,
  };
  return items[type] || items.star;
}

function SceneBoubou({ count }) {
  if (!count) return null;
  return (
    <div style={{ background:"linear-gradient(135deg,#FFF0F6,#FFE4F0)", borderRadius:16, padding:"12px 14px 8px", border:"1.5px solid #F4B8C8", marginBottom:12 }}>
      <div style={{ fontSize:11, color:T.rose.text, fontWeight:600, marginBottom:4 }}>
        🩹 {count} douceur{count>1?"s":""} à soigner ce soir
      </div>
      <div style={{ fontSize:11, color:T.ui.roseAlt, marginBottom:8, fontStyle:"italic", lineHeight:1.6 }}>
        Parfois le cœur a besoin d'un câlin. Tes émotions peuvent se déposer ici. Tu peux les écrire.
      </div>
      <svg width="100%" viewBox="0 0 300 90" style={{ display:"block", overflow:"visible" }}>
        <rect width="300" height="90" rx="12" fill="#FFF5F9"/>

        {/* Fond doux rosé avec halo */}
        <ellipse cx="150" cy="55" rx="130" ry="35" fill="#FFD8E8" opacity="0.3"/>

        {/* Doudou ourson au centre qui fait un câlin */}
        <g transform="translate(106,8)">
          {/* Corps */}
          <ellipse cx="40" cy="64" rx="22" ry="20" fill="#F0EAE2"/>
          {/* Bras qui enserrent un cœur */}
          <path d="M18 60 Q6 50 10 40" fill="none" stroke="#E8DDD4" strokeWidth="10" strokeLinecap="round"/>
          <path d="M62 60 Q74 50 70 40" fill="none" stroke="#E8DDD4" strokeWidth="10" strokeLinecap="round"/>
          {/* Jambes */}
          <ellipse cx="30" cy="81" rx="10" ry="7" fill="#E8E0D4"/>
          <ellipse cx="50" cy="81" rx="10" ry="7" fill="#E8E0D4"/>
          {/* Oreilles */}
          <circle cx="22" cy="22" r="9"  fill="#F0EAE2"/>
          <circle cx="22" cy="22" r="5"  fill="#E8DDD4"/>
          <circle cx="58" cy="22" r="9"  fill="#F0EAE2"/>
          <circle cx="58" cy="22" r="5"  fill="#E8DDD4"/>
          {/* Tête */}
          <circle cx="40" cy="34" r="22" fill={T.neutral.cream}/>
          {/* Nez */}
          <ellipse cx="40" cy="38" rx="6" ry="4" fill="#2A2020"/>
          <ellipse cx="38" cy="37" rx="1.8" ry="1.2" fill="rgba(255,255,255,0.35)"/>
          {/* Yeux contents — fermés */}
          <path d="M30 29 Q33 26 36 29" fill="none" stroke="#5A4040" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M44 29 Q47 26 50 29" fill="none" stroke="#5A4040" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Sourire */}
          <path d="M33 44 Q40 50 47 44" fill="none" stroke="#C87060" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Joues */}
          <ellipse cx="26" cy="39" rx="5" ry="3.5" fill="#F0B0C0" opacity="0.6"/>
          <ellipse cx="54" cy="39" rx="5" ry="3.5" fill="#F0B0C0" opacity="0.6"/>
          {/* Grand cœur serré dans les bras */}
          <motion.g animate={{ scale:[1,1.18,1], y:[0,-2,0] }} transition={{ duration:1.4, repeat:Infinity, ease:"easeInOut" }}
            style={{ transformOrigin:"40px 55px" }}>
            <path d="M30 52 Q30 46 40 50 Q50 46 50 52 Q50 60 40 66 Q30 60 30 52Z" fill="#E8487A" opacity="0.9"/>
            <ellipse cx="35" cy="52" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.45)" transform="rotate(-25,35,52)"/>
          </motion.g>
        </g>

        {/* Petits cœurs flottants */}
        {[{x:30,y:20,s:0.7,d:0},{x:245,y:15,s:0.9,d:0.8},{x:270,y:45,s:0.6,d:1.4},{x:20,y:55,s:0.75,d:0.4}].map((h,i)=>(
          <motion.g key={i} animate={{ y:[h.y,h.y-18,h.y-30], opacity:[0,1,0], scale:[h.s,h.s*1.1,h.s*0.8] }}
            transition={{ duration:2.4+i*0.5, repeat:Infinity, delay:h.d, ease:"easeOut" }}>
            <path d={`M${h.x} ${h.y+4} Q${h.x} ${h.y} ${h.x+5} ${h.y+2} Q${h.x+10} ${h.y} ${h.x+10} ${h.y+4} Q${h.x+10} ${h.y+9} ${h.x+5} ${h.y+12} Q${h.x} ${h.y+9} ${h.x} ${h.y+4}Z`}
              fill={["#E8487A","#F08090",T.rose.main,"#FF90B0"][i]} opacity="0.85"/>
          </motion.g>
        ))}

        {/* Étincelles douces */}
        {[{x:60,y:12},{x:240,y:60},{x:12,y:38}].map((s,i)=>(
          <motion.g key={i}
            animate={{ opacity:[0,0.8,0], scale:[0.5,1,0.5] }}
            transition={{ duration:2+i*0.4, repeat:Infinity, delay:i*0.7 }}
            style={{ transformOrigin:`${s.x}px ${s.y}px` }}>
            <text x={s.x} y={s.y} fontSize="10" textAnchor="middle" fill={T.rose.main}>✦</text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

function SceneVent({ count }) {
  if (!count) return null;
  return (
    <div style={{ background:"linear-gradient(135deg,#F0ECFF,#E4D8FF)", borderRadius:16, padding:"12px 14px 8px", border:"1.5px solid #C8B8F0", marginBottom:12 }}>
      <div style={{ fontSize:11, color:T.violet.text, fontWeight:600, marginBottom:4 }}>
        🌬️ {count} pensée{count>1?"s":""} emportée{count>1?"s":""} par le vent…
      </div>
      <svg width="100%" viewBox="0 0 300 80" style={{ display:"block", overflow:"visible" }}>
        {/* Ciel dégradé */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#C8E8FF"/>
            <stop offset="100%" stopColor={T.mer.bg}/>
          </linearGradient>
        </defs>
        <rect width="300" height="80" rx="12" fill="url(#skyGrad)"/>

        {/* Lignes de vent doux */}
        {[
          {y:15,qy1:12,qy2:18,sw:1.20,op:0.50},
          {y:31,qy1:28,qy2:34,sw:1.05,op:0.55},
          {y:47,qy1:44,qy2:50,sw:0.90,op:0.60},
          {y:63,qy1:60,qy2:66,sw:0.75,op:0.65},
        ].map((w,i)=>(
          <motion.path key={i}
            d={`M-20 ${w.y} Q50 ${w.qy1} 110 ${w.y} Q170 ${w.qy2} 220 ${w.y}`}
            fill="none" stroke="#A8D0F0" strokeWidth={w.sw} strokeLinecap="round" opacity={w.op}
            animate={{ x:[0,320] }} transition={{ duration:3+i*0.6, repeat:Infinity, ease:"linear", delay:i*0.5 }}
          />
        ))}

        {/* 3 gros nuages qui dérivent */}
        {[
          {startX:-80, y:5,  dur:7,  d:0,   scale:1.0},
          {startX:-50, y:28, dur:9,  d:2.5, scale:0.75},
          {startX:-40, y:50, dur:11, d:1.2, scale:0.6},
        ].map((cl,i)=>(
          <motion.g key={i} animate={{ x:[cl.startX, 360] }}
            transition={{ duration:cl.dur, repeat:Infinity, ease:"linear", delay:cl.d }}>
            <g transform={`scale(${cl.scale})`}>
              <ellipse cx="20" cy="20" rx="20" ry="13" fill="#fff" opacity="0.92"/>
              <ellipse cx="38" cy="14" rx="18" ry="14" fill="#fff" opacity="0.95"/>
              <ellipse cx="55" cy="19" rx="16" ry="12" fill="#fff" opacity="0.90"/>
              <ellipse cx="70" cy="22" rx="14" ry="10" fill="#fff" opacity="0.85"/>
              <ellipse cx="38" cy="24" rx="30" ry="8"  fill="#fff" opacity="0.7"/>
              {/* Ombre douce sous nuage */}
              <ellipse cx="40" cy="33" rx="28" ry="4"  fill="#C0D8F0" opacity="0.2"/>
            </g>
          </motion.g>
        ))}

        {/* Oiseaux qui volent — forme V simple */}
        {[
          {sx:20,  y:14, dur:5,  d:0,   s:1.0},
          {sx:-30, y:38, dur:6.5,d:1.8, s:0.75},
          {sx:60,  y:22, dur:4.5,d:0.9, s:0.85},
          {sx:-10, y:58, dur:7,  d:2.8, s:0.6},
        ].map((b,i)=>(
          <motion.g key={i} animate={{ x:[b.sx-50, 350], y:[b.y, b.y-8, b.y+4, b.y-5, b.y] }}
            transition={{
              x:{ duration:b.dur, repeat:Infinity, ease:"linear", delay:b.d },
              y:{ duration:0.9, repeat:Infinity, ease:"easeInOut", delay:b.d }
            }}>
            <g transform={`scale(${b.s})`}>
              {/* Aile gauche — rotation au lieu de d */}
              <motion.g style={{ transformOrigin:"0px 0px" }}
                animate={{ rotate:[-25,25,-25] }}
                transition={{ duration:0.7, repeat:Infinity, ease:"easeInOut" }}>
                <path d="M0 0 L-12 -2" stroke="#5A8AB0" strokeWidth="2" strokeLinecap="round"/>
              </motion.g>
              {/* Aile droite */}
              <motion.g style={{ transformOrigin:"0px 0px" }}
                animate={{ rotate:[25,-25,25] }}
                transition={{ duration:0.7, repeat:Infinity, ease:"easeInOut" }}>
                <path d="M0 0 L12 -2" stroke="#5A8AB0" strokeWidth="2" strokeLinecap="round"/>
              </motion.g>
              {/* Corps */}
              <ellipse cx="0" cy="0" rx="3" ry="2" fill="#6A9AC0"/>
            </g>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

function SceneVagues({ count }) {
  if (!count) return null;
  /* Poissons variés */
  const FISH = [
    {x:20,  y:58, s:1.0, c:T.mer.sky, d:0,   rev:false},
    {x:180, y:65, s:0.7, c:"#2A80C8", d:1.4, rev:true},
    {x:240, y:55, s:0.85,c:"#7EC8E8", d:0.6, rev:false},
    {x:80,  y:68, s:0.6, c:T.mer.main, d:2.1, rev:true},
    {x:140, y:60, s:0.55,c:"#48A8D8", d:1.0, rev:false},
  ];
  return (
    <div style={{ background:"linear-gradient(160deg,#1A4A7A,#1E6AAA,#28A0C8)", borderRadius:16, padding:"12px 14px 8px", border:"1.5px solid #1A6AAA", marginBottom:12 }}>
      <div style={{ fontSize:11, color:"#A8D8FF", fontWeight:600, marginBottom:4 }}>
        🌊 {count} pensée{count>1?"s":""} confiée{count>1?"s":""} à la mer…
      </div>
      <svg width="100%" viewBox="0 0 300 90" style={{ display:"block", overflow:"visible" }}>
        <defs>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E90CC"/>
            <stop offset="40%"  stopColor="#1670AA"/>
            <stop offset="100%" stopColor="#0E4878"/>
          </linearGradient>
          <linearGradient id="skySeaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={T.mer.sky}/>
            <stop offset="100%" stopColor="#1E90CC"/>
          </linearGradient>
        </defs>
        {/* Ciel marin */}
        <rect width="300" height="38" rx="0" fill="url(#skySeaGrad)"/>
        {/* Mer */}
        <rect y="38" width="300" height="52" rx="0" fill="url(#seaGrad)"/>
        {/* Arrondi bas */}
        <rect width="300" height="90" rx="12" fill="transparent"/>

        {/* Reflets de lumière sur l'eau */}
        {[40,90,160,220,270].map((x,i)=>(
          <motion.g key={i}
            animate={{ opacity:[0.15,0.35,0.15], x:[0,10,-5,0] }}
            transition={{ duration:2+i*0.4, repeat:Infinity, delay:i*0.3 }}>
            <ellipse cx={x} cy="42" rx={8+i%3*4} ry="2" fill="#A8D8FF" opacity="0.25"/>
          </motion.g>
        ))}

        {/* Vagues de surface — animation translateY au lieu de d */}
        {[
          {y:40,s:"#5AC0E8",sw:2.0,op:0.70,dur:2.5},
          {y:44,s:"#3AA8D0",sw:1.2,op:0.60,dur:3.2},
          {y:48,s:"#2890B8",sw:1.2,op:0.50,dur:3.9},
        ].map((r,i)=>(
          <motion.g key={i}
            animate={{ y:[0,-5,0,5,0] }}
            transition={{ duration:r.dur, repeat:Infinity, ease:"easeInOut", delay:i*0.4 }}>
            <path
              d={"M-10 "+r.y+" Q35 "+(r.y-5)+" 80 "+r.y+" Q125 "+(r.y+5)+" 170 "+r.y+" Q215 "+(r.y-5)+" 260 "+r.y+" Q305 "+(r.y+5)+" 320 "+r.y}
              fill="none" stroke={r.s} strokeWidth={r.sw} opacity={r.op}/>
          </motion.g>
        ))}

        {/* Bateau */}
        <motion.g animate={{ x:[0,180,0], y:[0,-4,2,-3,0] }}
          transition={{ x:{duration:12,repeat:Infinity,ease:"easeInOut"}, y:{duration:2.2,repeat:Infinity,ease:"easeInOut"} }}>
          {/* Coque */}
          <path d="M5 36 Q20 44 35 36 L32 28 L8 28 Z" fill="#1A3A6A" stroke="#2A5A9A" strokeWidth="1.2"/>
          {/* Voile 1 */}
          <path d="M18 28 L18 8 L30 18 Z" fill={T.mer.bg} stroke="#A8C8E8" strokeWidth="0.8" opacity="0.95"/>
          {/* Voile 2 */}
          <path d="M18 28 L18 12 L8 20 Z" fill="#D0E8FF" stroke="#A8C8E8" strokeWidth="0.8" opacity="0.85"/>
          {/* Mât */}
          <line x1="18" y1="8" x2="18" y2="28" stroke="#2A4A7A" strokeWidth="1.2"/>
          {/* Hublot */}
          <circle cx="24" cy="34" r="2" fill="#3A8AC8" stroke="#5AAAE8" strokeWidth="0.5"/>
          {/* Reflet */}
          <path d="M8 44 Q20 48 32 44" fill="none" stroke="#3A8AC8" strokeWidth="1" opacity="0.3"/>
        </motion.g>

        {/* Poissons sous l'eau */}
        {FISH.map((f,i)=>(
          <motion.g key={i}
            animate={{ x: f.rev ? [f.x+80, f.x-30] : [f.x, f.x+80], y:[f.y, f.y-3, f.y+2, f.y] }}
            transition={{ x:{duration:4+i*0.8,repeat:Infinity,ease:"linear",delay:f.d}, y:{duration:1.2+i*0.2,repeat:Infinity,ease:"easeInOut"} }}>
            <g transform={f.rev ? `translate(${10*f.s*2},0) scale(-1,1)` : "scale(1,1)"}>
              {/* Corps poisson */}
              <ellipse cx="0" cy="0" rx={10*f.s} ry={5*f.s} fill={f.c} opacity="0.85"/>
              {/* Queue */}
              <path d={`M${-9*f.s} 0 L${-14*f.s} ${-5*f.s} L${-14*f.s} ${5*f.s}Z`} fill={f.c} opacity="0.7"/>
              {/* Œil */}
              <circle cx={6*f.s} cy={-1*f.s} r={1.5*f.s} fill="#fff"/>
              <circle cx={6*f.s} cy={-1*f.s} r={0.8*f.s} fill="#1A1A2A"/>
              {/* Nageoire */}
              <path d={`M0 ${-4*f.s} Q${3*f.s} ${-8*f.s} ${6*f.s} ${-4*f.s}`} fill={f.c} opacity="0.6" stroke={f.c} strokeWidth="0.5"/>
              {/* Écailles reflet */}
              <path d={`M${-2*f.s} 0 Q0 ${-2*f.s} ${2*f.s} 0`} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7"/>
            </g>
          </motion.g>
        ))}

        {/* Bulles */}
        {[60,120,200,250].map((x,i)=>(
          <motion.g key={i}
            animate={{ y:[0,-20], x:[0,5-i*2], opacity:[0.5,0] }}
            transition={{ duration:2.5+i*0.5, repeat:Infinity, delay:i*0.8 }}>
            <circle cx={x} cy={70-i*2} r={2+i%3}
              fill="none" stroke="#A8D8FF" strokeWidth="0.8"/>
          </motion.g>
        ))}

        {/* Soleil ou lune en haut */}
        <circle cx="268" cy="14" r="10" fill="#FAE060" opacity="0.85"/>
        <circle cx="274" cy="10" r="7"  fill={T.mer.sky} opacity="0.8"/>
      </svg>
    </div>
  );
}

function SceneLettre({ count }) {
  if (!count) return null;
  return (
    <div style={{ background:"linear-gradient(135deg,#C8D4F0,#D4DFFF,#E8EEFF)", borderRadius:16, padding:"12px 14px 8px", border:"1.5px solid #8098C8", marginBottom:12 }}>
      <div style={{ fontSize:11, color:T.nuit.text, fontWeight:600, marginBottom:4 }}>
        ✉️ {count} message{count>1?"s":""} envoyé{count>1?"s":""} vers le ciel…
      </div>
      <svg width="100%" viewBox="0 0 300 90" style={{ display:"block", overflow:"visible" }}>
        <defs>
          <linearGradient id="skyLettre" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#B8D4F8"/>
            <stop offset="100%" stopColor="#D8ECFF"/>
          </linearGradient>
        </defs>
        <rect width="300" height="90" rx="12" fill="url(#skyLettre)"/>

        {/* Nuages légers */}
        {[{x:-60,y:8,s:0.7,d:0,dur:12},{x:-40,y:45,s:0.5,d:3,dur:15}].map((cl,i)=>(
          <motion.g key={i} animate={{ x:[cl.x, 360] }}
            transition={{ duration:cl.dur, repeat:Infinity, ease:"linear", delay:cl.d }}>
            <g transform={`scale(${cl.s})`}>
              <ellipse cx="30" cy="18" rx="22" ry="12" fill="rgba(255,255,255,0.8)"/>
              <ellipse cx="48" cy="12" rx="18" ry="13" fill="rgba(255,255,255,0.6)"/>
              <ellipse cx="64" cy="18" rx="16" ry="11" fill="rgba(255,255,255,0.8)"/>
            </g>
          </motion.g>
        ))}

        {/* Lettres qui volent — enveloppes colorées */}
        {Array.from({length:Math.min(count,4)},(_,i) => {
          const startX = 20+i*60;
          const startY = 75-i*5;
          const cols   = ["#6A8AE8","#9A7AE0","#7ABAE8","#5A9AE0"][i];
          return (
            <motion.g key={i}
              animate={{
                x:  [startX, startX+50, startX+120, startX+200],
                y:  [startY, startY-20, startY-45, startY-65],
                rotate: [0, 8, -5, 10, -3],
                opacity:[0, 1, 1, 0],
              }}
              transition={{ duration:3.5+i*0.5, repeat:Infinity, ease:"easeOut", delay:i*1.0 }}>
              {/* Enveloppe */}
              <rect x="0" y="0" width="28" height="20" rx="3"
                fill={cols} stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              {/* Rabat */}
              <path d="M0 0 L14 10 L28 0" fill="none"
                stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
              {/* Ailes de papier — avion en papier */}
              <path d="M-8 10 Q-4 7 0 10" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8"/>
              <path d="M28 10 Q32 7 36 10" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8"/>
              {/* Petit cœur sur l'enveloppe */}
              <path d="M11 11 Q11 8 14 10 Q17 8 17 11 Q17 14 14 16 Q11 14 11 11Z"
                fill="rgba(255,255,255,0.8)"/>
            </motion.g>
          );
        })}

        {/* Avions en papier qui accompagnent */}
        {[{sx:10,y:25,d:0.5,s:1},{sx:200,y:55,d:1.8,s:0.7}].map((av,i)=>(
          <motion.g key={`av${i}`}
            animate={{ x:[av.sx, av.sx+250], y:[av.y, av.y-15, av.y-5, av.y-20] }}
            transition={{ x:{duration:6+i*2,repeat:Infinity,ease:"linear",delay:av.d}, y:{duration:1.5,repeat:Infinity,ease:"easeInOut"} }}>
            <g transform={`scale(${av.s})`}>
              {/* Avion en papier */}
              <path d="M0 5 L20 0 L15 8 Z" fill="rgba(255,255,255,0.6)" stroke="#A8C8F0" strokeWidth="0.8"/>
              <path d="M0 5 L20 0 L15 5 L10 10 Z" fill="rgba(200,220,255,0.7)" stroke="#A8C8F0" strokeWidth="0.5"/>
              <path d="M15 8 L10 10 L8 14 Z" fill="rgba(255,255,255,0.6)" stroke="#A8C8F0" strokeWidth="0.5"/>
            </g>
          </motion.g>
        ))}

        {/* Sillages / traînées */}
        {[{x:40,y:60,d:0},{x:140,y:45,d:1.2},{x:220,y:55,d:0.6}].map((tr,i)=>(
          <motion.path key={i}
            d={`M${tr.x} ${tr.y} Q${tr.x+20} ${tr.y-8} ${tr.x+40} ${tr.y}`}
            fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="3,4"
            animate={{ opacity:[0,0.6,0], x:[0,30] }}
            transition={{ duration:2+i*0.5, repeat:Infinity, delay:tr.d }}/>
        ))}

        {/* Lune pâle en haut à droite */}
        <circle cx="276" cy="16" r="12" fill="rgba(255,255,255,0.7)"/>
        <circle cx="281" cy="12" r="9"  fill="rgba(180,210,255,0.6)"/>
      </svg>
    </div>
  );
}

function SceneBonheur({ count }) {
  if (!count) return null;
  return (
    <div style={{
      background:"linear-gradient(135deg,#E8FFF8 0%,#F0FFFA 50%,#FAFFF0 100%)",
      borderRadius:16, padding:"12px 14px 8px",
      border:"1.5px solid #A8E8D0", marginBottom:12,
      overflow:"hidden", position:"relative",
    }}>
      <div style={{ fontSize:11, color:T.ui.greenDeep, fontWeight:600, marginBottom:8 }}>
        ⭐ {count} douceur{count>1?"s":""} gardée{count>1?"s":""} dans ton cœur
      </div>
      <svg width="100%" viewBox="0 0 300 120" style={{ display:"block", overflow:"visible" }}>
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#FFF0D0"/>
            <stop offset="100%" stopColor="#FAD7A0"/>
          </radialGradient>
          <radialGradient id="shirtGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#80DEC8"/>
            <stop offset="100%" stopColor="#3ABFA8"/>
          </radialGradient>
          <radialGradient id="pantGrad" cx="50%" cy="20%" r="80%">
            <stop offset="0%"   stopColor="#90C8FF"/>
            <stop offset="100%" stopColor={T.mer.sky}/>
          </radialGradient>
          <radialGradient id="heartGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#FF90B8"/>
            <stop offset="100%" stopColor="#E8487A"/>
          </radialGradient>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#3ABFA8" floodOpacity="0.2"/>
          </filter>
        </defs>

        {/* ── Fond doux avec cercles pastel ── */}
        <ellipse cx="150" cy="115" rx="120" ry="12" fill="#C8F0E8" opacity="0.4"/>
        <circle cx="40"  cy="30" r="18" fill={T.vert.pale} opacity="0.25"/>
        <circle cx="265" cy="25" r="14" fill="#F8C8DC" opacity="0.30"/>
        <circle cx="255" cy="85" r="10" fill={T.or.light} opacity="0.25"/>
        <circle cx="38"  cy="88" r="12" fill="#C8D8FF" opacity="0.25"/>

        {/* ── Personnage central ── */}
        <g transform="translate(110, 8)" filter="url(#softShadow)">

          {/* Ombre au sol */}
          <ellipse cx="40" cy="108" rx="28" ry="6" fill="#3ABFA8" opacity="0.15"/>

          {/* Jambes */}
          <rect x="22" y="80" width="14" height="28" rx="7"  fill="url(#pantGrad)"/>
          <rect x="44" y="80" width="14" height="28" rx="7"  fill="url(#pantGrad)"/>
          {/* Chaussures */}
          <ellipse cx="29" cy="108" rx="10" ry="5" fill="#4A8ACF"/>
          <ellipse cx="51" cy="108" rx="10" ry="5" fill="#4A8ACF"/>

          {/* Corps — T-shirt vert eau arrondi */}
          <rect x="14" y="40" width="52" height="44" rx="16" fill="url(#shirtGrad)"/>
          {/* Reflet sur le t-shirt */}
          <ellipse cx="30" cy="50" rx="10" ry="6" fill="rgba(255,255,255,0.25)" transform="rotate(-20,30,50)"/>

          {/* Bras gauche — levé joyeusement */}
          <motion.g
            animate={{ rotate:[-12, 8, -12] }}
            transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
            style={{ transformOrigin:"14px 48px" }}>
            <path d="M14 48 Q-8 38 -18 28" fill="none" stroke="url(#shirtGrad)" strokeWidth="14" strokeLinecap="round"/>
            {/* Main gauche */}
            <circle cx="-20" cy="26" r="8" fill="url(#bodyGrad)"/>
          </motion.g>

          {/* Bras droit — levé joyeusement */}
          <motion.g
            animate={{ rotate:[10, -8, 10] }}
            transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
            style={{ transformOrigin:"66px 48px" }}>
            <path d="M66 48 Q88 38 98 28" fill="none" stroke="url(#shirtGrad)" strokeWidth="14" strokeLinecap="round"/>
            {/* Main droite */}
            <circle cx="100" cy="26" r="8" fill="url(#bodyGrad)"/>
          </motion.g>

          {/* Cœur sur le t-shirt — pulsation */}
          <motion.g
            animate={{ scale:[1, 1.25, 1], y:[0,-2,0] }}
            transition={{ duration:1.4, repeat:Infinity, ease:"easeInOut" }}
            style={{ transformOrigin:"40px 58px" }}>
            <path d="M33 55 Q33 50 40 53 Q47 50 47 55 Q47 62 40 67 Q33 62 33 55Z"
              fill="url(#heartGrad)"/>
            {/* Reflet cœur */}
            <ellipse cx="37" cy="55" rx="3" ry="2" fill="rgba(255,255,255,0.5)" transform="rotate(-30,37,55)"/>
          </motion.g>

          {/* Cou */}
          <rect x="33" y="30" width="14" height="12" rx="5" fill="url(#bodyGrad)"/>

          {/* Tête */}
          <circle cx="40" cy="22" r="20" fill="url(#bodyGrad)"/>
          {/* Joues roses */}
          <circle cx="27" cy="27" r="5" fill="#F8A0B8" opacity="0.55"/>
          <circle cx="53" cy="27" r="5" fill="#F8A0B8" opacity="0.55"/>
          {/* Yeux */}
          <ellipse cx="33" cy="20" rx="4" ry="4.5" fill="#2A2A2A"/>
          <ellipse cx="47" cy="20" rx="4" ry="4.5" fill="#2A2A2A"/>
          {/* Reflets yeux */}
          <circle cx="35" cy="18" r="1.5" fill="white"/>
          <circle cx="49" cy="18" r="1.5" fill="white"/>
          {/* Sourcils heureux */}
          <path d="M29 15 Q33 12 37 14" fill="none" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M43 14 Q47 12 51 15" fill="none" stroke="#8B5E3C" strokeWidth="1.8" strokeLinecap="round"/>
          {/* Sourire large */}
          <path d="M30 30 Q40 38 50 30" fill="none" stroke="#C87050" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Petits cheveux */}
          <path d="M22 10 Q26 4 32 6" fill="none" stroke="#D4907A" strokeWidth="3" strokeLinecap="round"/>
          <path d="M40 4 Q43 2 46 5" fill="none" stroke="#D4907A" strokeWidth="3" strokeLinecap="round"/>
          <path d="M50 7 Q54 5 56 10" fill="none" stroke="#D4907A" strokeWidth="3" strokeLinecap="round"/>
        </g>

        {/* ── Étoiles et cœurs qui s'envolent ── */}
        {Array.from({length:Math.min(count,5)},(_,i) => {
          const configs = [
            {x:20,  y:70, emoji:"⭐", col:T.or.light},
            {x:260, y:65, emoji:"💛", col:"#F5D030"},
            {x:15,  y:30, emoji:"🌟", col:"#FFE060"},
            {x:265, y:30, emoji:"✨", col:T.violet.glow},
            {x:148, y:10, emoji:"💫", col:"#F8A0B8"},
          ];
          const c = configs[i];
          return (
            <motion.text key={i} x={c.x} y={c.y}
              fontSize={18+i%2*4} textAnchor="middle"
              animate={{
                y:[c.y, c.y-35, c.y-55],
                x:[c.x, c.x+(i%2===0?-15:15), c.x+(i%2===0?-25:25)],
                opacity:[0,1,0],
                scale:[0.5,1.2,0.5],
              }}
              transition={{ duration:2.5+i*0.4, repeat:Infinity, delay:i*0.6, ease:"easeOut" }}>
              {c.emoji}
            </motion.text>
          );
        })}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HOOK MICROPHONE (SpeechRecognition)
══════════════════════════════════════════════════════════ */
function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/* ── Le doudou répond avec un mot doux (IA) ── */
async function getDoudouReply(thoughts, childName) {
  const allText = Object.entries(thoughts)
    .flatMap(([shelf, items]) =>
      (items||[]).map(it => `[${shelf}] ${it.text||""}`)
    )
    .filter(t => t.trim().length > 5)
    .join("\n");

  if (!allText.trim()) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        messages: [{
          role: "user",
          content: `Tu es un doudou ourson bienveillant qui parle à ${childName||"un enfant"}. Voici ses pensées du soir :\n${allText}\n\nÉcris UN seul message doux et rassurant de 2-3 phrases maximum, en français simple pour un enfant de 6-12 ans. Commence par "Bonsoir" et son prénom si tu le connais. Pas de liste. Sois chaleureux et encourageant.`,
        }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch { return null; }
}

function useMic({ onResult, onEnd }) {
  const recRef       = useRef(null);
  const onResultRef  = useRef(onResult);
  const onEndRef     = useRef(onEnd);
  const [micError, setMicError] = useState(""); // message d'erreur affiché

  // Toujours garder les refs à jour sans recréer les callbacks
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onEndRef.current    = onEnd;    }, [onEnd]);

  const supported = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Cleanup sur démontage
  useEffect(() => {
    return () => { try { recRef.current?.stop(); } catch {} };
  }, []);

  const start = useCallback(async () => {
    if (!supported) { setMicError("Micro non supporté sur ce navigateur"); return; }
    setMicError("");

    // Demander la permission micro (mobile) puis libérer immédiatement le stream
    // pour ne pas bloquer SpeechRecognition
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Libérer IMMÉDIATEMENT — on a juste besoin de la permission
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMicError("Permission micro refusée — autorisez le micro dans les réglages du navigateur");
          try { navigator.vibrate?.([100, 50, 100]); } catch {}
          return;
        }
        // Sur certains appareils getUserMedia échoue mais SpeechRecognition marche quand même
        console.warn("getUserMedia:", err.message);
      }
    }

    // Arrêter une session précédente proprement
    try { recRef.current?.stop(); } catch {}
    // Petit délai pour laisser le système audio se libérer
    await new Promise(r => setTimeout(r, 150));

    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang            = "fr-FR";
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
      const isFinal    = e.results[e.results.length - 1].isFinal;
      onResultRef.current?.(transcript, isFinal);
    };

    rec.onend = () => {
      setActive(false);
      onEndRef.current?.();
    };

    rec.onerror = (e) => {
      setActive(false);
      if (e.error === "not-allowed")    { setMicError("Permission micro refusée"); try { navigator.vibrate?.([100,50,100]); } catch {} }
      else if (e.error === "no-speech") { setMicError("Rien entendu — réessaie !"); try { navigator.vibrate?.([50]); } catch {} }
      else if (e.error === "network")   setMicError("Pas de réseau pour la reconnaissance");
      else                              setMicError(`Erreur micro : ${e.error}`);
    };

    recRef.current = rec;
    try {
      rec.start();
      setActive(true);
    } catch (err) {
      setMicError("Impossible de démarrer le micro");
    }
  }, [supported]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setActive(false);
    setMicError("");
  }, []);

  return { start, stop, active, supported, micError };
}

/* ══════════════════════════════════════════════════════════
   SHELF PANEL
══════════════════════════════════════════════════════════ */
function ShelfPanel({ shelf, thoughts, onAdd, onRemove, speak, isNight, bookcaseRef }) {
  const isReduced = useReducedMotion();
  const [val, setVal]         = useState("");
  const debouncedVal = useDebounce(val, 200);
  const [mode, setMode]       = useState("text");
  const [interim, setInterim] = useState("");
  const [replies] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bibl_replies_v1")||"{}"); } catch { return {}; }
  });
  const [flying, setFlying]   = useState(null); // { text, fromRect, toRect }
  const submitBtnRef = useRef(null);

  /* Calcule la position cible dans le SVG pour l'étagère active */
  const getTargetRect = () => {
    if (!bookcaseRef?.current) return null;
    const svgRect = bookcaseRef.current.getBoundingClientRect();
    const svgH    = svgRect.height;
    const svgW    = svgRect.width;
    const idx     = ["boubou","cloud","trash","lettre","bonheur"].indexOf(shelf.id);
    if (idx === -1) return null;
    /* Position de l'étagère dans le viewBox 0 0 560 520 */
    const SHELF_Y_VB = [118, 196, 274, 352, 430];
    const y1vb = idx === 0 ? 40 : SHELF_Y_VB[idx-1] + 20;
    const y2vb = SHELF_Y_VB[idx];
    const midYvb = (y1vb + y2vb) / 2;
    /* Conversion viewBox → écran */
    const scaleX = svgW / 560;
    const scaleY = svgH / 520;
    return {
      left:   svgRect.left + 280 * scaleX - 24,
      top:    svgRect.top  + midYvb * scaleY - 20,
      width:  48, height: 48,
    };
  };

  const launchFly = (text, drawing) => {
    if (!submitBtnRef.current) return false;
    const fromRect = submitBtnRef.current.getBoundingClientRect();
    const toRect   = getTargetRect();
    if (!toRect) return false;
    setFlying({ text: drawing ? "🎨" : text, fromRect, toRect });
    return true;
  };

  const submit = () => {
    if (!val.trim()) return;
    const text = val.trim();
    setVal("");
    launchFly(text, false);
    onAdd({ text, date: new Date().toISOString() });
  };

  const { start, stop, active, supported: micOk, micError } = useMic({
    onResult: (text, isFinal) => {
      if (isFinal) { setVal(v => (v + " " + text).trim()); setInterim(""); }
      else setInterim(text);
    },
    onEnd: () => setInterim(""),
  });

  const btnLabel = shelf.id === "trash"   ? "Confier aux vagues 🌊"        :
                   shelf.id === "bonheur" ? "Garder dans mon cœur ⭐"       :
                   shelf.id === "boubou"  ? "Prendre soin de ça 🩹"         :
                   shelf.id === "lettre"  ? "Envoyer vers la lune ✉️"       : "Ranger ici 🌀";

  return (
    <>
      {/* Post-it volant — portail fixed */}
      {flying && (
        <FlyingPostit
          text={flying.text}
          shelfId={shelf.id}
          color={shelf}
          fromRect={flying.fromRect}
          toRect={flying.toRect}
          onDone={() => setFlying(null)}
        />
      )}
      <motion.div initial={{ opacity:0, y:10, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
        exit={{ opacity:0, y:6, scale:0.97 }} transition={{ duration:0.25 }}
      style={{
        background: isNight ? T.sys.glassDark : shelf.bg,
        border: `2px solid ${isNight ? shelf.dot+"88" : shelf.border}`,
        borderRadius:16, padding:"14px 16px", marginTop:12,
        boxShadow: isNight ? "0 6px 32px rgba(0,0,0,0.4)" : "0 6px 24px rgba(59,46,34,0.18)",
      }}>

      <div style={{ fontSize:13, fontWeight:600, color: isNight ? T.ui.nightText : shelf.text, marginBottom:8 }}>
        {shelf.id==="boubou"  ? "🩹 Je prends soin de mon cœur" :
         shelf.id==="cloud"   ? "🌬️ Je confie mes pensées au vent" :
         shelf.id==="trash"   ? "🌊 Les vagues vont les emmener" :
         shelf.id==="lettre"  ? "✉️ Mon mot s'envole vers la lune" : "⭐ Je garde ça près du cœur"}
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:8, minHeight:40, marginBottom:12 }}>
        <AnimatePresence>
          {thoughts.map((item, i) => (
            <PostIt key={i} item={item} color={shelf} index={i}
              parentReply={replies[`${shelf.id}-${i}`]}
              onRemove={() => onRemove(i)}
              onSpeak={(text, cb) => speak(text, { rate:0.78, pitch:0.96, onEnd:cb })} />
          ))}
        </AnimatePresence>
        {thoughts.length === 0 && (
          <span style={{ fontSize:13, color: isNight ? T.violet.glow : shelf.text+"99", fontStyle:"italic" }}>
            Aucune pensée rangée ici encore…
          </span>
        )}
      </div>

      {shelf.id === "boubou"  && <SceneBoubou count={thoughts.length} />}
      {shelf.id === "cloud"   && <SceneVent   count={thoughts.length} />}
      {shelf.id === "trash"   && <SceneVagues  count={thoughts.length} />}
      {shelf.id === "lettre"  && <SceneLettre  count={thoughts.length} />}
      {shelf.id === "bonheur" && <SceneBonheur count={thoughts.length} />}

      {/* ── sélecteur de mode ── */}
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        {[["text","✏️ Écrire"],["voice","🎤 Parler"],["draw","🎨 Dessiner"]].map(([m,lbl]) => {
          const isModeActive = mode === m;
          const disabled = m === "voice" && !micOk;
          return (
            <button key={m}
              aria-label={lbl}
              onClick={() => {
                if (disabled) return;
                if (m !== "voice" && active) stop();
                setMode(m);
                setInterim("");
              }}
              title={disabled ? "Micro non disponible — vérifiez les permissions du navigateur" : ""}
              style={{ flex:1, padding:"9px 0", borderRadius:8, fontSize:13, fontWeight:600,
                border:`1.5px solid ${isModeActive ? shelf.dot : (isNight ? shelf.dot+"44" : shelf.border)}`,
                background: isModeActive ? shelf.dot+"33" : (isNight ? "rgba(255,255,255,0.08)" : "#fff"),
                color: disabled ? (isNight?"#555":"#ccc") : isModeActive ? (isNight?"#fff":shelf.dot) : (isNight?T.ui.nightText:shelf.text),
                cursor: disabled ? "not-allowed" : "pointer",
                fontFamily:FF.body,
                opacity: disabled ? 0.4 : 1,
                transition:"all 0.15s",
              }}>
              {lbl}
            </button>
          );
        })}
      </div>

      {/* ── mode texte ── */}
      {mode === "text" && (
        <div style={{ display:"flex", gap:8 }}>
          <input autoFocus value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder={shelf.placeholder} maxLength={280}
            style={{ flex:1, borderRadius:8, border:`1.5px solid ${isNight?shelf.dot+"66":shelf.border}`,
              background: isNight ? "rgba(255,255,255,0.10)" : "#fff",
              padding:"9px 12px", fontSize:13, color: isNight ? T.ui.nightText : T.neutral.brown,
              outline:"none", fontFamily:FF.body }} />
          <button ref={submitBtnRef} onClick={submit}
            style={{ background: shelf.dot, color:"#fff", border:"none", borderRadius:8,
              padding:"10px 12px", fontSize:13, fontWeight:600, cursor:"pointer", minHeight:44,
              fontFamily:FF.body, whiteSpace:"nowrap",
              boxShadow: isNight ? `0 3px 14px ${shelf.dot}66` : "none" }}>
            {btnLabel}
          </button>
        </div>
      )}

      {/* Bouton "En savoir plus sur cette étagère" */}
      <div style={{ textAlign:"right", marginBottom:4 }}>
        <button onClick={() => speak(
          ONBOARD_STEPS.find(s=>s.shelf===shelf.id)?.speech || "",
          { rate:0.80, pitch:0.92 }
        )}
          style={{ background:"none", border:"none", fontSize:11,
            color:shelf.dot, cursor:"pointer", fontFamily:FF.body,
            textDecoration:"underline", textDecorationStyle:"dotted" }}>
          🔊 Rappel de l'étagère
        </button>
      </div>

          {/* Minuteur doux optionnel */}
          {mode === "text" && (
            <TimerWidget color={shelf.dot} />
          )}
      {/* ── mode vocal ── */}
      {mode === "voice" && (
        <div>
          {/* Message d'erreur micro */}
          {micError && (
            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
              style={{
                background:T.ui.error, border:"1px solid #F0997B",
                borderRadius:8, padding:"8px 12px", marginBottom:8,
                fontSize:13, color:T.ui.errorText, fontWeight:600,
                display:"flex", alignItems:"center", gap:8,
              }}>
              🎤 {micError}
            </motion.div>
          )}
          {/* zone transcript */}
          <div style={{ minHeight:44, background:"#fff", borderRadius:8,
            border:`1.5px solid ${active ? shelf.dot : shelf.border}`,
            padding:"9px 12px", fontSize:13, color:T.neutral.brown, marginBottom:8,
            fontFamily:FF.body, lineHeight:1.6,
            transition:"border-color 0.2s" }}>
            {val
              ? <span>{val}<span style={{ color:shelf.dot+"88" }}>{interim ? " "+interim : ""}</span></span>
              : <span style={{ color:shelf.text+"66", fontStyle:"italic" }}>
                  {active ? (interim || "J'écoute…") : "Appuie sur le micro pour parler"}
                </span>
            }
          </div>
          {/* boutons micro */}
          <div style={{ display:"flex", gap:8 }}>
            <motion.button
              whileTap={{ scale:0.95 }}
              onClick={active ? stop : start}
              animate={active ? { scale:[1,1.05,1] } : { scale:1 }}
              transition={active ? { duration:1, repeat:Infinity } : {}}
              style={{ flex:1, padding:"11px 0", borderRadius:16, border:"none", cursor:"pointer", minHeight:44,
                background: active ? T.ui.errorBorder : shelf.dot,
                color:"#fff", fontSize:13, fontWeight:600, fontFamily:FF.body,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {active
                ? <><span style={{ fontSize:19 }}>⏹</span> Arrêter</>
                : <><span style={{ fontSize:19 }}>🎤</span> Parler</>
              }
            </motion.button>
            {val && (
              <button ref={submitBtnRef} onClick={submit}
                style={{ flex:2, padding:"11px 0", borderRadius:16, border:"none",
                  background:shelf.dot, color:"#fff", fontSize:13, fontWeight:600,
                  cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
                {btnLabel}
              </button>
            )}
            {val && (
              <button onClick={() => { setVal(""); setInterim(""); }}
                style={{ padding:"11px 14px", borderRadius:16, border:`1px solid ${shelf.border}`,
                  background:"transparent", color:shelf.text, fontSize:13, cursor:"pointer", minHeight:44,
                  fontFamily:FF.body }}>
                ✕
              </button>
            )}
          </div>
          {active && (
            <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:8 }}>
              {[0,1,2,3,4].map(i => (
                <motion.div key={i}
                  animate={{ height:[8, 20+i*6, 8] }}
                  transition={{ duration:0.5+i*0.1, repeat:Infinity, delay:i*0.1 }}
                  style={{ width:4, background:shelf.dot, borderRadius:2 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── mode dessin ── */}
      {mode === "draw" && (
        <MiniCanvas color={shelf.dot}
          onSave={dataUrl => {
            if (submitBtnRef.current) {
              const fromRect = submitBtnRef.current.getBoundingClientRect();
              const toRect   = getTargetRect();
              if (toRect) setFlying({ text:"🎨", fromRect, toRect });
            }
            onAdd({ text:"🎨 Dessin", drawing:dataUrl, date:new Date().toISOString() });
            setMode("text");
          }} />
      )}
    </motion.div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   BIBLIOTHÈQUE SVG
══════════════════════════════════════════════════════════ */
const SHELF_Y = [118, 196, 274, 352, 430];

function BookcaseSVG({ isOpen, thoughts, onShelfClick, activeShelf }) {
  const svgLabels = {
    boubou: "🩹 Mes douceurs à soigner",
    cloud:  "🌀 Mes pensées du moment",
    trash:  "🌊 Je confie aux vagues",
    lettre: "✉️ Ma petite lettre",
    bonheur:"⭐ Ce que je garde",
  };

  /* Livres sur chaque étagère — 6 gauche + 6 droite */
  const SB = [
    [{w:11,h:32,c:T.rose.light},{w:13,h:40,c:T.or.light},{w:9,h:28,c:T.violet.glow},{w:12,h:36,c:T.vert.light},{w:10,h:42,c:T.sys.error},{w:14,h:30,c:T.rose.main},
     {w:11,h:38,c:T.vert.bright},{w:9,h:34,c:T.violet.main},{w:13,h:26,c:T.ui.blueLight},{w:10,h:44,c:T.or.main},{w:12,h:32,c:T.ui.pinkAccent},{w:8,h:38,c:"#639922"}],
    [{w:12,h:38,c:T.ui.blueLight},{w:9,h:30,c:T.or.main},{w:14,h:44,c:T.ui.pinkAccent},{w:10,h:34,c:"#639922"},{w:11,h:40,c:T.sys.info},{w:13,h:28,c:T.or.light},
     {w:8,h:36,c:T.ui.errorBorder},{w:12,h:42,c:T.violet.glow},{w:10,h:32,c:T.rose.light},{w:14,h:38,c:T.vert.light},{w:9,h:26,c:T.violet.main},{w:11,h:34,c:T.sys.error}],
    [{w:9,h:34,c:T.vert.light},{w:12,h:40,c:T.rose.light},{w:11,h:30,c:T.violet.main},{w:10,h:38,c:T.or.main},{w:13,h:44,c:T.vert.bright},{w:8,h:28,c:T.rose.main},
     {w:12,h:36,c:T.ui.blueLight},{w:10,h:42,c:T.sys.error},{w:14,h:32,c:T.or.light},{w:9,h:40,c:T.violet.glow},{w:11,h:28,c:T.ui.pinkAccent},{w:13,h:36,c:T.sys.info}],
    [{w:11,h:36,c:T.or.light},{w:9,h:30,c:T.violet.glow},{w:13,h:42,c:T.ui.pinkAccent},{w:10,h:34,c:T.sys.info},{w:12,h:44,c:T.vert.light},{w:8,h:28,c:T.or.main},
     {w:14,h:38,c:T.ui.errorBorder},{w:11,h:32,c:"#639922"},{w:9,h:40,c:T.rose.light},{w:13,h:36,c:T.violet.main},{w:10,h:26,c:T.ui.blueLight},{w:12,h:34,c:T.sys.error}],
    [{w:10,h:32,c:T.rose.light},{w:13,h:40,c:T.violet.main},{w:9,h:28,c:T.ui.blueLight},{w:12,h:36,c:T.or.light},{w:11,h:44,c:T.vert.bright},{w:8,h:30,c:T.rose.main},
     {w:14,h:38,c:T.or.main},{w:10,h:34,c:T.violet.glow},{w:13,h:42,c:T.sys.info},{w:9,h:28,c:T.sys.error},{w:11,h:36,c:T.ui.pinkAccent},{w:12,h:30,c:"#639922"}],
  ];

  /* Livres dansants du bas — délais variés pour effet aléatoire */
  const BB = [
    {x:62, w:13,h:26,c:T.rose.main,d:0.0},{x:77, w:10,h:20,c:T.sys.info,d:0.35},
    {x:89, w:15,h:28,c:T.or.main,d:0.7},{x:106,w:10,h:22,c:T.vert.main,d:1.1},
    {x:118,w:12,h:24,c:T.violet.main,d:0.2},{x:132,w:9, h:18,c:T.rose.light,d:0.85},
    {x:312,w:14,h:25,c:T.ui.errorBorder,d:0.5},{x:328,w:11,h:30,c:T.vert.bright,d:0.1},
    {x:341,w:9, h:20,c:T.or.light,d:0.9},{x:352,w:13,h:26,c:T.violet.glow,d:0.6},
    {x:427,w:15,h:27,c:T.or.main,d:0.3},{x:444,w:10,h:22,c:T.ui.pinkAccent,d:1.0},
    {x:456,w:13,h:25,c:"#639922",d:0.65},{x:471,w:11,h:20,c:T.sys.info,d:0.25},
  ];

  /* Zone gauche : x 66→258  |  Zone droite : x 292→494
     Le montant central (258→292) n'a PAS de livres ni d'étiquettes */
  const LEFT_END   = 256;
  const RIGHT_START= 294;

  return (
    <svg width="100%" viewBox="0 0 560 520"
      style={{ display:"block", filter:"drop-shadow(0 10px 32px rgba(59,46,34,0.18))", overflow:"visible" }}>
      <defs>
        <linearGradient id="bgWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D8AE72"/>
          <stop offset="100%" stopColor="#A8723A"/>
        </linearGradient>
        <linearGradient id="sideWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6A3E18"/>
          <stop offset="100%" stopColor="#9A6030"/>
        </linearGradient>
        <linearGradient id="interior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFAF2"/>
          <stop offset="100%" stopColor="#F8EDD8"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="0%" r="65%">
          <stop offset="0%"   stopColor="#FFF5C0" stopOpacity="0.40"/>
          <stop offset="100%" stopColor="#FFF5C0" stopOpacity="0.00"/>
        </radialGradient>
        <linearGradient id="shShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3A1E08" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#3A1E08" stopOpacity="0.00"/>
        </linearGradient>
      </defs>

      {/* Z-ORDER (SVG = last drawn = on top)
          1  Bois extérieur
          2  Fond intérieur clair
          3  Montants latéraux gauche & droit
          4  Montant central  (dessine AVANT livres ET etiquettes)
          5  Étagères + livres
          6  Charnières
          7  Socle
          8  Livres dansants bas
          9  Étiquettes cliquables  (toujours devant)
         10  Portes (framer-motion)
      */}

      {/* 1 — Bois extérieur + grain */}
      <rect x="40" y="24" width="480" height="468" rx="10" fill="url(#bgWood)"/>
      <rect x="40" y="24" width="480" height="468" rx="10" fill="none" stroke="#7A4A18" strokeWidth="2.5"/>
      {[70,140,210,285,355,425].map((y,i)=>(
        <path key={i} d={`M40 ${y} Q280 ${y+4} 520 ${y}`}
          fill="none" stroke="#C09048" strokeWidth="0.7" opacity="0.15"/>
      ))}

      {/* 2 — Fond intérieur clair */}
      <rect x="66" y="40" width="428" height="444" fill="url(#interior)"/>
      {isOpen && <rect x="66" y="40" width="428" height="444" fill="url(#glow)"/>}
      {/* légères rayures fond */}
      {[85,170,255,340,420,470].map((y,i)=>(
        <line key={i} x1="66" y1={y} x2="494" y2={y}
          stroke="#E5CFA0" strokeWidth="0.5" opacity="0.30"/>
      ))}

      {/* 3 — Montants latéraux */}
      <rect x="40"  y="24" width="28" height="468" rx="5" fill="url(#sideWood)"/>
      <rect x="40"  y="24" width="3"  height="468" fill="#C89048" opacity="0.5"/>
      <rect x="492" y="24" width="28" height="468" rx="5" fill="url(#sideWood)"/>
      <rect x="517" y="24" width="3"  height="468" fill="#C89048" opacity="0.35"/>

      {/* 4 — Montant CENTRAL — fin et clair, ne gêne pas la lecture */}
      <rect x="276" y="24" width="8" height="468" rx="2" fill="#C09048" opacity="0.55"/>
      <rect x="276" y="24" width="1.5" height="468" fill="#D4A860" opacity="0.5"/>

      {/* 5 — Étagères + livres (livres GAUCHE et DROIT du montant central) */}
      {SHELF_Y.map((y, si)=>{
        const floorY = y;
        const books  = SB[si];
        /* positions livres gauche */
        let lx = 70;
        const leftBooks = books.slice(0,6).reduce((acc,b)=>{
          if(lx + b.w + 2 <= LEFT_END){ acc.push({...b, bx:lx}); lx += b.w+2; }
          return acc;
        },[]);
        /* positions livres droite */
        let rx = RIGHT_START;
        const rightBooks = books.slice(6).reduce((acc,b)=>{
          if(rx + b.w + 2 <= 492){ acc.push({...b, bx:rx}); rx += b.w+2; }
          return acc;
        },[]);
        return (
          <g key={si}>
            {/* livres gauche */}
            {isOpen && leftBooks.map((b,bi)=>(
              <g key={`lg${bi}`}>
                <rect x={b.bx} y={floorY-b.h} width={b.w} height={b.h} rx="2" fill={b.c}/>
                <rect x={b.bx} y={floorY-b.h} width={Math.max(2,b.w*0.2)} height={b.h} rx="1" fill="rgba(0,0,0,0.08)"/>
                <rect x={b.bx+2} y={floorY-b.h+6}  width={b.w-4} height={1.8} rx="1" fill="rgba(255,255,255,0.50)"/>
                <rect x={b.bx+2} y={floorY-b.h+11} width={b.w-6} height={1.2} rx="1" fill="rgba(255,255,255,0.30)"/>
              </g>
            ))}
            {/* livres droite */}
            {isOpen && rightBooks.map((b,bi)=>(
              <g key={`rd${bi}`}>
                <rect x={b.bx} y={floorY-b.h} width={b.w} height={b.h} rx="2" fill={b.c}/>
                <rect x={b.bx} y={floorY-b.h} width={Math.max(2,b.w*0.2)} height={b.h} rx="1" fill="rgba(0,0,0,0.08)"/>
                <rect x={b.bx+2} y={floorY-b.h+6}  width={b.w-4} height={1.8} rx="1" fill="rgba(255,255,255,0.50)"/>
                <rect x={b.bx+2} y={floorY-b.h+11} width={b.w-6} height={1.2} rx="1" fill="rgba(255,255,255,0.30)"/>
              </g>
            ))}
            {/* planche */}
            <rect x="52" y={y}    width="456" height="20" rx="3" fill="#7A4E22"/>
            <rect x="52" y={y}    width="456" height="7"  rx="2" fill="#A87038"/>
            <rect x="52" y={y+14} width="456" height="6"  fill="#4A2C10" opacity="0.55"/>
            <rect x="52" y={y}    width="456" height="2"  fill="#D4A050" opacity="0.40"/>
            <rect x="52" y={y+20} width="456" height="14" fill="url(#shShadow)"/>
          </g>
        );
      })}

      {/* 6 — Charnières */}
      {[88,208,348,438].map(y=>(
        <g key={y}>
          <rect x="38" y={y} width="16" height="26" rx="4" fill="#907840"/>
          <rect x="38" y={y} width="16" height="26" rx="4" fill="none" stroke="#705820" strokeWidth="1"/>
          <circle cx="46" cy={y+13} r="4.5" fill="#C0A040"/>
          <circle cx="46" cy={y+13} r="2"   fill="#E8CC60"/>
          <rect x="506" y={y} width="16" height="26" rx="4" fill="#907840"/>
          <rect x="506" y={y} width="16" height="26" rx="4" fill="none" stroke="#705820" strokeWidth="1"/>
          <circle cx="514" cy={y+13} r="4.5" fill="#C0A040"/>
          <circle cx="514" cy={y+13} r="2"   fill="#E8CC60"/>
        </g>
      ))}

      {/* 7 — Socle */}
      <rect x="28" y="484" width="504" height="30" rx="10" fill="#6A4018"/>
      <rect x="28" y="484" width="504" height="9"  rx="5"  fill="#9A6030"/>
      <rect x="28" y="504" width="504" height="10" rx="5"  fill="#4A2808" opacity="0.4"/>

      {/* 8 — Livres DANSANTS du bas — animation bounce individuelle */}
      {BB.map((b,i)=>(
        <motion.g key={i}
          animate={{ y:[0, -(5+i%4*3), 0, -3, 0, -(2+i%3*2), 0] }}
          transition={{ duration:1.6+b.d*0.6, repeat:Infinity, ease:"easeInOut", delay:b.d }}>
          <rect x={b.x} y={468-b.h} width={b.w} height={b.h} rx="3" fill={b.c}/>
          <rect x={b.x} y={468-b.h} width={Math.max(2,b.w*0.22)} height={b.h} rx="1.5" fill="rgba(0,0,0,0.10)"/>
          <rect x={b.x+2} y={468-b.h+5}  width={b.w-4} height={2}   rx="1" fill="rgba(255,255,255,0.55)"/>
          <rect x={b.x+2} y={468-b.h+10} width={b.w-6} height={1.5} rx="1" fill="rgba(255,255,255,0.35)"/>
        </motion.g>
      ))}

      {/* 9 — ÉTIQUETTES — entrée en cascade + post-its sur étagères */}
      {isOpen && SHELVES.map((shelf, i)=>{
        const y1   = i===0 ? 40 : SHELF_Y[i-1]+20;
        const y2   = SHELF_Y[i];
        const midY = Math.round((y1+y2)/2);
        const act  = activeShelf === shelf.id;
        const items = thoughts[shelf.id] || [];

        /* Post-its miniatures sur l'étagère — côté droit de la pillule */
        const POSTIT_COLORS = {
          boubou:T.rose.soft, cloud:T.ui.bluePale, trash:T.vert.soft,
          lettre:T.violet.soft, bonheur:T.or.soft,
        };
        const pcol = POSTIT_COLORS[shelf.id] || T.or.bg;
        const pStartX = 305;
        const maxVisible = 6;

        return (
          <motion.g key={shelf.id} onClick={()=>onShelfClick(shelf.id)}
            role="button" tabIndex={0}
            aria-label={shelf.label}
            onKeyDown={e=>e.key==="Enter"&&onShelfClick(shelf.id)}
            style={{cursor:"pointer", minHeight:44}}
            initial={{ opacity:0, x:-24 }}
            animate={{ opacity:1, x:0 }}
            transition={{ delay: i * 0.09, duration:0.6, ease:"easeOut" }}>
            {/* zone de clic transparente */}
            <rect x="66" y={y1} width="428" height={y2-y1} fill="transparent"/>

            {/* Post-its miniatures côté droit de la pillule */}
            {items.slice(0, maxVisible).map((item, pi) => {
              const px  = pStartX + pi * 22;
              const py  = midY - 14;
              const rot = (pi % 3 - 1) * 4;
              if (px > 462) return null;
              return (
                <g key={pi} transform={`rotate(${rot} ${px+9} ${py+12})`}>
                  <rect x={px} y={py} width="18" height="22" rx="3"
                    fill={pcol} stroke={shelf.border} strokeWidth="1"/>
                  {/* coin plié */}
                  <path d={`M${px} ${py+17} L${px+5} ${py+22} L${px} ${py+22}Z`}
                    fill={shelf.border} opacity="0.5"/>
                  {/* lignes texte simulées */}
                  {item.drawing
                    ? <rect x={px+2} y={py+4} width="14" height="14" rx="2" fill={shelf.dot} opacity="0.3"/>
                    : <>
                        <rect x={px+2} y={py+5}  width="14" height="1.5" rx="1" fill={shelf.dot} opacity="0.5"/>
                        <rect x={px+2} y={py+9}  width="11" height="1.5" rx="1" fill={shelf.dot} opacity="0.4"/>
                        <rect x={px+2} y={py+13} width="12" height="1.5" rx="1" fill={shelf.dot} opacity="0.3"/>
                      </>
                  }
                </g>
              );
            })}
            {/* indicateur "+X" si plus de 6 */}
            {items.length > maxVisible && (
              <text x="463" y={midY+5} fontSize="10" fontWeight="800"
                fill={shelf.dot} fontFamily={FF.body} dominantBaseline="middle">
                +{items.length - maxVisible}
              </text>
            )}

            {/* ombre pillule */}
            <rect x="70" y={midY-16} width={act ? "300" : "220"} height="42" rx="16"
              fill="rgba(60,30,10,0.07)" transform="translate(2,4)"/>
            {/* pillule — plus courte si post-its visibles */}
            <rect x="70" y={midY-16} width={items.length > 0 ? "220" : "388"} height="42" rx="16"
              fill={act ? shelf.dot : "rgba(255,254,251,0.97)"}
              stroke={act ? "transparent" : shelf.border}
              strokeWidth="1.5"/>
            {/* texte */}
            <text x={items.length > 0 ? "180" : "280"} y={midY+5} fontSize="14" fontWeight="700"
              fill={act ? "#fff" : shelf.text}
              fontFamily={FF.body}
              textAnchor="middle"
              dominantBaseline="middle">
              {svgLabels[shelf.id]}
            </text>

            {/* badge compteur */}
            {items.length > 0 && (
              <g>
                <circle cx="87" cy={midY-18} r="13" fill={shelf.dot}
                  style={{filter:`drop-shadow(0 2px 6px ${shelf.dot}66)`}}/>
                <text x="87" y={midY-18} textAnchor="middle" fontSize="12"
                  fontWeight="800" fill="#fff" fontFamily={FF.body}
                  dominantBaseline="central">
                  {items.length}
                </text>
              </g>
            )}
            {/* badge nouveau mot parent */}
            {(() => {
              try {
                const reps = JSON.parse(localStorage.getItem("bibl_replies_v1")||"{}");
                const hasNew = thoughts[shelf.id]?.some(t => t.id && reps[t.id]);
                if (!hasNew) return null;
                return (
                  <g>
                    <circle cx="470" cy={midY-14} r="10" fill={T.or.main}
                      style={{filter:"drop-shadow(0 1px 4px rgba(239,159,39,0.6))"}}/>
                    <text x="470" y={midY-14} textAnchor="middle" fontSize="10"
                      dominantBaseline="central">💛</text>
                  </g>
                );
              } catch { return null; }
            })()}
          </motion.g>
        );
      })}

      {/* 10 — PORTES */}
      <motion.g
        initial={{scaleX:1, opacity:1}}
        animate={{scaleX: isOpen?0:1, opacity: isOpen?0:1}}
        transition={{duration:0.9, ease:[0.22,1,0.36,1]}}
        style={{transformOrigin:"68px 258px"}}>
        <rect x="68" y="24" width="208" height="468" rx="6" fill="#D0A858"/>
        <rect x="68" y="24" width="208" height="468" rx="6" fill="none" stroke="#8B6A30" strokeWidth="2"/>
        <rect x="82" y="42" width="180" height="196" rx="10"
          fill="rgba(220,170,80,0.12)" stroke="#A07830" strokeWidth="1.5"/>
        <rect x="82" y="250" width="180" height="220" rx="10"
          fill="rgba(220,170,80,0.12)" stroke="#A07830" strokeWidth="1.5"/>
        <circle cx="268" cy="258" r="13" fill="#C8A838" stroke="#8B6A30" strokeWidth="1.5"/>
        <circle cx="268" cy="258" r="7"  fill="#E8D058"/>
        <circle cx="265" cy="255" r="2.5" fill="rgba(255,255,255,0.75)"/>
        <path d="M88  24 Q106 240 88  492" fill="none" stroke="#A07828" strokeWidth="1" opacity="0.20"/>
        <path d="M148 24 Q166 240 148 492" fill="none" stroke="#A07828" strokeWidth="1" opacity="0.16"/>
        <path d="M208 24 Q226 240 208 492" fill="none" stroke="#A07828" strokeWidth="1" opacity="0.13"/>
      </motion.g>
      <motion.g
        initial={{scaleX:1, opacity:1}}
        animate={{scaleX: isOpen?0:1, opacity: isOpen?0:1}}
        transition={{duration:0.9, ease:[0.22,1,0.36,1]}}
        style={{transformOrigin:"492px 258px"}}>
        <rect x="284" y="24" width="208" height="468" rx="6" fill="#D0A858"/>
        <rect x="284" y="24" width="208" height="468" rx="6" fill="none" stroke="#8B6A30" strokeWidth="2"/>
        <rect x="298" y="42" width="180" height="196" rx="10"
          fill="rgba(220,170,80,0.12)" stroke="#A07830" strokeWidth="1.5"/>
        <rect x="298" y="250" width="180" height="220" rx="10"
          fill="rgba(220,170,80,0.12)" stroke="#A07830" strokeWidth="1.5"/>
        <circle cx="292" cy="258" r="13" fill="#C8A838" stroke="#8B6A30" strokeWidth="1.5"/>
        <circle cx="292" cy="258" r="7"  fill="#E8D058"/>
        <circle cx="289" cy="255" r="2.5" fill="rgba(255,255,255,0.75)"/>
        <path d="M372 24 Q354 240 372 492" fill="none" stroke="#A07828" strokeWidth="1" opacity="0.20"/>
        <path d="M432 24 Q414 240 432 492" fill="none" stroke="#A07828" strokeWidth="1" opacity="0.16"/>
        <path d="M492 24 Q474 240 492 492" fill="none" stroke="#A07828" strokeWidth="1" opacity="0.13"/>
      </motion.g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   ÉCRAN SOMMEIL
══════════════════════════════════════════════════════════ */
function SleepScreen({ bonheur, onReopen, onClearNight, profile = {} }) {
  const { speak, stop } = useSpeech();
  const [reading, setReading]     = useState(false);
  const [doudouMsg, setDoudouMsg] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const askDoudou = async () => {
    if (!bonheur?.length && Object.values({}).length === 0) return;
    setLoadingMsg(true);
    const msg = await getDoudouReply(
      Object.fromEntries(["boubou","cloud","trash","lettre","bonheur"].map(s => [s, []])),
      profile?.name
    );
    setLoadingMsg(false);
    if (msg) { setDoudouMsg(msg); speak(msg, { rate:0.80, pitch:0.92 }); }
  };

  const readBonheur = () => {
    if (!bonheur.length) return;
    setReading(true);
    const txts = bonheur.map((t,i) => i===0 ? `Voici tes douceurs du soir. ${t}` : t);
    let idx = 0;
    const next = () => {
      if (idx >= txts.length) { setReading(false); return; }
      speak(txts[idx++], { rate:0.72, pitch:0.94, vol:0.82, onEnd:() => setTimeout(next, 900) });
    };
    next();
  };

  /* shooting stars data */
  const shootingStars = Array.from({length:5},(_,i) => ({
    x: 10 + i*18, y: 5 + i*8,
    dur: 2.8 + i*1.4, delay: i*3.5
  }));

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:2 }}
      className="bibl-root" style={{ minHeight:"100dvh", background:`linear-gradient(180deg,${T.nuit.deep} 0%,${T.nuit.purple} 40%,#0E0830 100%)`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"40px 24px", position:"relative", overflow:"hidden", fontFamily:FF.body }}>

      {/* star field */}
      {Array.from({length:50},(_,i) => (
        <motion.div key={i} style={{ position:"absolute", borderRadius:"50%",
          background: i%5===0 ? T.or.light : i%7===0 ? T.ui.pinkAccent : T.violet.glow,
          width:1.5+(i%3)*0.8, height:1.5+(i%3)*0.8,
          left:`${(i*137.5)%100}%`, top:`${(i*73.1)%100}%` }}
          animate={{ opacity:[0.1, 0.7+(i%3)*0.2, 0.1], scale:[1,1.3,1] }}
          transition={{ duration:1.8+(i%4)*0.7, repeat:Infinity, delay:i*0.09 }} />
      ))}

      {/* shooting stars */}
      {shootingStars.map((s,i) => (
        <motion.div key={`ss-${i}`}
          style={{ position:"absolute", top:`${s.y}%`, left:`${s.x}%`,
            width:60, height:2, borderRadius:2,
            background:"linear-gradient(90deg, rgba(255,255,220,0.9), transparent)",
            transformOrigin:"left center" }}
          animate={{ x:[0, 200], y:[0, 80], opacity:[0, 1, 0], scaleX:[0.2, 1, 0.2] }}
          transition={{ duration:s.dur, delay:s.delay, repeat:Infinity, repeatDelay:8+i*4, ease:"easeOut" }}
        />
      ))}

      <motion.div style={{ textAlign:"center", zIndex:1, maxWidth:420 }}
        initial={{ y:30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.5, duration:1 }}>

        {/* Detailed moon SVG */}
        <svg width="110" height="110" viewBox="0 0 110 110" style={{ margin:"0 auto 20px", display:"block" }}>
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#EEEDFE" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#EEEDFE" stopOpacity="0"/>
            </radialGradient>
          </defs>
          {/* glow halo */}
          <circle cx="55" cy="55" r="48" fill="url(#moonGlow)"/>
          {/* moon crescent */}
          <motion.path d="M68 20 Q42 32 42 56 Q42 80 68 90 Q26 90 24 56 Q22 22 68 20Z"
            fill="#EEEDFE"
            animate={{ opacity:[0.82,1,0.82] }} transition={{ duration:4.5, repeat:Infinity }}/>
          {/* craters */}
          <circle cx="50" cy="40" r="3.5" fill="#D8D6F0" opacity="0.5"/>
          <circle cx="40" cy="60" r="2.2" fill="#D8D6F0" opacity="0.45"/>
          <circle cx="56" cy="70" r="2.8" fill="#D8D6F0" opacity="0.4"/>
          <circle cx="44" cy="50" r="1.8" fill="#D8D6F0" opacity="0.35"/>
          {/* stars near moon */}
          {[{x:82,y:25,s:3},{x:22,y:30,s:2.5},{x:88,y:65,s:2},{x:18,y:72,s:3.5}].map((st,i) => (
            <motion.circle key={i} cx={st.x} cy={st.y} r={st.s} fill={T.or.light} opacity="0.8"
              animate={{ opacity:[0.4,0.9,0.4], r:[st.s, st.s*1.3, st.s] }}
              transition={{ duration:1.5+i*0.6, repeat:Infinity, delay:i*0.4 }}/>
          ))}
        </svg>

        {/* Bonne nuit personnalisée */}
        {profile?.name && (
          <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:0.3 }}
            style={{ fontSize:19, fontWeight:700, color:T.or.light, marginBottom:8,
              textShadow:"0 0 20px rgba(250,199,117,0.5)" }}>
            {profile?.avatar} Bonne nuit, {profile?.name} !
          </motion.div>
        )}
        <h1 style={{ fontSize:24, fontWeight:800, color:T.ui.nightText, marginBottom:8, lineHeight:1.3,
          textShadow:"0 0 30px rgba(174,169,236,0.4)" }}>
          La bibliothèque se ferme doucement…
        </h1>
        <p style={{ fontSize:13, color:T.violet.glow, lineHeight:1.6, marginBottom:24 }}>
          Tes pensées sont bien rangées.<br/>Ton esprit peut souffler.<br/>La nuit t'enveloppe doucement.
        </p>

        {bonheur.length > 0 && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:1 }}
            style={{ background:"rgba(21,16,58,0.9)", borderRadius:16, padding:"16px 20px",
              border:"1px solid #534AB7", marginBottom:24,
              boxShadow:SH.md }}>
            <div style={{ fontSize:11, color:T.violet.glow, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>
              ⭐ Je garde dans mon cœur
            </div>
            {bonheur.map((t,i) => (
              <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:1.2+i*0.18 }}
                style={{ fontSize:13, color:T.or.light, padding:"11px 0", lineHeight:1.6,
                  borderBottom: i<bonheur.length-1 ? "1px solid rgba(83,74,183,0.2)" : "none" }}>
                ✦ {typeof t==="string" ? t : t.text}
              </motion.div>
            ))}
            <button onClick={reading ? stop : readBonheur}
              style={{ marginTop:12, width:"100%", padding:"10px 0", borderRadius:16,
                border:"1px solid #534AB7", background: reading ? T.violet.night : "transparent",
                color: reading ? "#fff" : T.violet.glow, fontSize:13, fontWeight:600,
                cursor:"pointer", minHeight:44, fontFamily:FF.body,
                transition:"all 0.2s" }}>
              {reading ? "🔊 En cours… touche pour arrêter" : "🐻 Le doudou lit tes pensées"}
            </button>
          </motion.div>
        )}

        {/* breathing circle */}
        <div style={{ position:"relative", width:96, height:96, margin:"0 auto 12px" }}>
          <motion.div animate={{ scale:[1,1.25,1], opacity:[0.3,0.6,0.3] }}
            transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
            style={{ position:"absolute", inset:"-14px", borderRadius:"50%",
              background:"rgba(83,74,183,0.15)" }}/>
          <motion.div animate={{ scale:[1,1.22,1] }} transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
            style={{ width:96, height:96, borderRadius:"50%",
              border:"2px solid #534AB7", background:"rgba(28,24,64,0.9)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>
            <Doudou size={32} pose="sleep" />
          </motion.div>
        </div>
        <p style={{ fontSize:13, color:T.violet.main, marginBottom:32, lineHeight:1.6 }}>
          Inspire quand le cercle grandit<br/>Expire quand il rétrécit
        </p>

        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={onReopen}
            style={{ background:"transparent", border:"1.5px solid #534AB7", borderRadius:24,
              padding:"11px 22px", fontSize:13, color:T.violet.glow, cursor:"pointer", minHeight:44,
              fontFamily:FF.body, transition:"all 0.2s" }}
            onMouseEnter={e => { e.target.style.background=T.violet.night; e.target.style.color="#fff"; }}
            onMouseLeave={e => { e.target.style.background="transparent"; e.target.style.color=T.violet.glow; }}>
            Rouvrir la bibliothèque
          </button>
          <button onClick={onClearNight}
            style={{ background:"transparent", border:"1.5px solid #3C3489", borderRadius:24,
              padding:"11px 22px", fontSize:13, color:T.violet.main, cursor:"pointer", minHeight:44,
              fontFamily:FF.body, transition:"all 0.2s" }}
            onMouseEnter={e => { e.target.style.background=T.violet.text; e.target.style.color="#fff"; }}
            onMouseLeave={e => { e.target.style.background="transparent"; e.target.style.color=T.violet.main; }}>
            Nouvelle nuit 🌅
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   DOUDOU OURSON — composant SVG réutilisable
   Inspiré des dessins au crayon doux fournis
══════════════════════════════════════════════════════════ */
function Doudou({ size = 80, animate: doAnim = true, pose = "sit", style: extraStyle = {}, reduced = false }) {
  /* pose: "sit" | "sleep" | "hug" | "wave" */

  const eyesClosed = pose === "sleep";
  const armUp      = pose === "wave";

  return (
    <motion.div
      style={{ display:"inline-block", lineHeight:1.3, ...extraStyle }}
      animate={doAnim && !reduced ? { y:[0,-6,0], rotate:[-1,1,-1] } : {}}
      transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}>
      <svg width={size} height={size*1.1} viewBox="0 0 100 110"
        style={{ overflow:"visible", filter:"drop-shadow(0 4px 12px rgba(180,160,140,0.35))" }}>
        <defs>
          <radialGradient id="bearBody" cx="45%" cy="35%" r="65%">
            <stop offset="0%"   stopColor={T.neutral.cream}/>
            <stop offset="60%"  stopColor="#E8E0D4"/>
            <stop offset="100%" stopColor="#D0C8BC"/>
          </radialGradient>
          <radialGradient id="bearFace" cx="40%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#FAF6F0"/>
            <stop offset="100%" stopColor="#E8E0D4"/>
          </radialGradient>
          <radialGradient id="bearNose" cx="40%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#5A5050"/>
            <stop offset="100%" stopColor="#1A1818"/>
          </radialGradient>
          <radialGradient id="bearEye" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#4A4040"/>
            <stop offset="100%" stopColor="#1A1010"/>
          </radialGradient>
          <filter id="bearSoft">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>

        {/* ── Ombre au sol ── */}
        <ellipse cx="50" cy="108" rx="32" ry="5" fill="#C0B8B0" opacity="0.3"/>

        {/* ── Corps ── */}
        <ellipse cx="50" cy="78" rx="26" ry="24" fill="url(#bearBody)"/>
        {/* texture douce corps */}
        {[0,1,2,3,4].map(i=>(
          <path key={i}
            d={`M${30+i*5} ${65+i*2} Q${38+i*4} ${70+i*2} ${50+i*3} ${65+i*2}`}
            fill="none" stroke="#D8D0C4" strokeWidth="0.4" opacity="0.4"/>
        ))}

        {/* ── Jambes ── */}
        <ellipse cx="38" cy="98" rx="11" ry="9" fill="url(#bearBody)"/>
        <ellipse cx="62" cy="98" rx="11" ry="9" fill="url(#bearBody)"/>
        {/* coussinets */}
        <ellipse cx="38" cy="103" rx="7"  ry="4" fill="#E0D8D0"/>
        <ellipse cx="62" cy="103" rx="7"  ry="4" fill="#E0D8D0"/>

        {/* ── Bras gauche ── */}
        <motion.g
          animate={doAnim ? (armUp
            ? { rotate:[-30,-45,-30] }
            : pose==="hug" ? { rotate:[5,0,5] } : { rotate:[8,4,8] })
          : {}}
          transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }}
          style={{ transformOrigin:"30px 68px" }}>
          <ellipse cx="24" cy="74" rx="10" ry="8" fill="url(#bearBody)" transform="rotate(-20,24,74)"/>
          <ellipse cx="18" cy="79" rx="7"  ry="5" fill="url(#bearBody)" transform="rotate(-30,18,79)"/>
          {/* coussinet patte */}
          <ellipse cx="14" cy="82" rx="5"  ry="3.5" fill="#E0D8D0" transform="rotate(-30,14,82)"/>
          <circle cx="12" cy="80" r="1.2" fill="#D0C8C0"/>
          <circle cx="14" cy="78" r="1.0" fill="#D0C8C0"/>
          <circle cx="16" cy="80" r="1.0" fill="#D0C8C0"/>
        </motion.g>

        {/* ── Bras droit ── */}
        <motion.g
          animate={doAnim ? (armUp
            ? { rotate:[30,45,30] }
            : pose==="hug" ? { rotate:[-5,0,-5] } : { rotate:[-8,-4,-8] })
          : {}}
          transition={{ duration:2.8, repeat:Infinity, ease:"easeInOut" }}
          style={{ transformOrigin:"70px 68px" }}>
          <ellipse cx="76" cy="74" rx="10" ry="8" fill="url(#bearBody)" transform="rotate(20,76,74)"/>
          <ellipse cx="82" cy="79" rx="7"  ry="5" fill="url(#bearBody)" transform="rotate(30,82,79)"/>
          <ellipse cx="86" cy="82" rx="5"  ry="3.5" fill="#E0D8D0" transform="rotate(30,86,82)"/>
          <circle cx="88" cy="80" r="1.2" fill="#D0C8C0"/>
          <circle cx="86" cy="78" r="1.0" fill="#D0C8C0"/>
          <circle cx="84" cy="80" r="1.0" fill="#D0C8C0"/>
        </motion.g>

        {/* ── Oreilles ── */}
        <circle cx="27" cy="24" r="11" fill="url(#bearBody)"/>
        <circle cx="27" cy="24" r="6.5" fill="#E8DDD4"/>
        <circle cx="73" cy="24" r="11" fill="url(#bearBody)"/>
        <circle cx="73" cy="24" r="6.5" fill="#E8DDD4"/>
        {/* texture oreilles */}
        {[-1,0,1].map(i=>(
          <path key={i} d={`M${26+i*2} 20 Q${28+i} 24 ${26+i*2} 28`}
            fill="none" stroke="#D8D0C8" strokeWidth="0.5" opacity="0.5"/>
        ))}

        {/* ── Tête ── */}
        <circle cx="50" cy="42" r="28" fill="url(#bearFace)"/>
        {/* texture douce tête */}
        {[0,1,2,3,4,5].map(i=>(
          <path key={i}
            d={`M${26+i*7} ${30+i%3*4} Q${32+i*6} ${35+i%2*3} ${28+i*7} ${40+i%3*3}`}
            fill="none" stroke="#E0D8D0" strokeWidth="0.35" opacity="0.5"/>
        ))}

        {/* ── Museau ── */}
        <ellipse cx="50" cy="50" rx="14" ry="10" fill="#EDE5DC"/>
        {/* texture museau */}
        {[-1,0,1].map(i=>(
          <path key={i} d={`M${42+i*5} ${46+i} Q${50} ${48+i} ${58+i*2} ${46+i}`}
            fill="none" stroke="#E0D8D0" strokeWidth="0.4" opacity="0.4"/>
        ))}

        {/* ── Nez ── */}
        <ellipse cx="50" cy="46" rx="8" ry="5.5" fill="url(#bearNose)"/>
        {/* texture nez poilue */}
        {[-3,-1,1,3].map(i=>(
          <line key={i} x1={50+i} y1="42" x2={50+i*0.8} y2="50"
            stroke="#3A3030" strokeWidth="0.4" opacity="0.4"/>
        ))}
        {/* reflet nez */}
        <ellipse cx="47" cy="44" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.35)" transform="rotate(-20,47,44)"/>

        {/* ── Bouche ── */}
        <path d="M46 53 Q50 57 54 53" fill="none" stroke="#8A7870" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="50" y1="51" x2="50" y2="53" stroke="#8A7870" strokeWidth="1.2" strokeLinecap="round"/>

        {/* ── Yeux ── */}
        {eyesClosed ? (
          <>
            <path d="M40 37 Q43 34 46 37" fill="none" stroke="#5A4A44" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M54 37 Q57 34 60 37" fill="none" stroke="#5A4A44" strokeWidth="1.5" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <circle cx="43" cy="37" r="5.5" fill="url(#bearEye)"/>
            <circle cx="57" cy="37" r="5.5" fill="url(#bearEye)"/>
            {/* reflets yeux brillants */}
            <circle cx="45" cy="35" r="2"   fill="rgba(255,255,255,0.6)"/>
            <circle cx="59" cy="35" r="2"   fill="rgba(255,255,255,0.6)"/>
            <circle cx="42" cy="38" r="0.8" fill="rgba(255,255,255,0.5)"/>
            <circle cx="56" cy="38" r="0.8" fill="rgba(255,255,255,0.5)"/>
          </>
        )}

        {/* ── Joues roses ── */}
        <motion.ellipse cx="34" cy="47" rx="6" ry="4"
          fill="#F0B8C0" opacity="0.5"
          animate={doAnim ? { opacity:[0.4,0.65,0.4] } : {}}
          transition={{ duration:2, repeat:Infinity }}/>
        <motion.ellipse cx="66" cy="47" rx="6" ry="4"
          fill="#F0B8C0" opacity="0.5"
          animate={doAnim ? { opacity:[0.4,0.65,0.4] } : {}}
          transition={{ duration:2.2, repeat:Infinity }}/>
      </svg>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   INDICATEUR CHARGEMENT VOIX
══════════════════════════════════════════════════════════ */
function VoiceLoading() {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.8 }}
      animate={{ opacity:1, scale:1 }}
      exit={{ opacity:0, scale:0.8 }}
      style={{
        position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
        background:T.sys.overlay,
        borderRadius:24, padding:"10px 20px",
        display:"flex", alignItems:"center", gap:8,
        zIndex:500, boxShadow:SH.sm,
        backdropFilter:"blur(6px)",
      }}>
      <Doudou size={36} pose="sit"/>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:T.ui.nightText }}>Le doudou prépare sa voix…</div>
        <div style={{ display:"flex", gap:4, marginTop:4 }}>
          {[0,1,2,3,4].map(i => (
            <motion.div key={i}
              animate={{ height:[3,12,3], background:[T.violet.glow,T.ui.nightText,T.violet.glow] }}
              transition={{ duration:0.8, repeat:Infinity, delay:i*0.12 }}
              style={{ width:4, borderRadius:2 }}/>
          ))}
        </div>
      </div>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════════════
   VERSIONING DONNÉES — migration localStorage
   Si la structure change, incrémenter DATA_VERSION
   et ajouter une migration dans migrateData()
══════════════════════════════════════════════════════════ */
const DATA_VERSION = "1.1.0";
const DATA_VER_KEY = "bibl_data_version";


/* ── Analytics locaux anonymes ── 
   Aucune donnée envoyée — comptage local uniquement
   Pour stats : accéder via Espace Parent → Stats
═══════════════════════════════════════════════════ */
function trackEvent(name, data = {}) {
  try {
    const key  = "bibl_analytics";
    const raw  = localStorage.getItem(key);
    const log  = raw ? JSON.parse(raw) : [];
    log.push({ event:name, ts:Date.now(), ...data });
    // Garder 500 événements max
    if (log.length > 500) log.splice(0, log.length - 500);
    localStorage.setItem(key, JSON.stringify(log));
  } catch {}
}

function migrateData() {
  try {
    const stored = localStorage.getItem(DATA_VER_KEY);
    if (stored === DATA_VERSION) return; // déjà à jour

    // Migration 1.0 → 1.1 : s'assurer que chaque pensée a un id
    try {
      const raw = localStorage.getItem("bibl_thoughts_v1");
      if (raw) {
        const thoughts = JSON.parse(raw);
        let changed = false;
        Object.keys(thoughts).forEach(shelf => {
          thoughts[shelf] = thoughts[shelf].map(t => {
            if (!t.id) {
              changed = true;
              return { ...t, id: `${shelf}_${Date.now()}_${Math.random().toString(36).slice(2,6)}` };
            }
            return t;
          });
        });
        try { if (changed) localStorage.setItem("bibl_thoughts_v1", JSON.stringify(thoughts)); } catch {}
      }
    } catch {}

    try { localStorage.setItem(DATA_VER_KEY, DATA_VERSION); } catch {}
  } catch {}
}

// Lancer la migration au démarrage
migrateData();


/* ── Notifications push soirée ── */
async function requestNotifPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const p = await Notification.requestPermission();
  return p === "granted";
}

function scheduleEveningNotif(childName) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now   = new Date();
  const notif = new Date();
  notif.setHours(20, 0, 0, 0);
  if (notif <= now) notif.setDate(notif.getDate() + 1);
  const delay = notif.getTime() - now.getTime();
  setTimeout(() => {
    try {
      new Notification("📚 Bibliothèque des Pensées", {
        body: childName ? `Bonsoir ${childName} ! Ton doudou t'attend. 🐻` : "Bonsoir ! Ton doudou t'attend. 🐻",
        icon: "/icons/icon-192.png",
        tag:  "evening-reminder",
      });
    } catch {}
    scheduleEveningNotif(childName);
  }, Math.min(delay, 2147483647));
}

/* ── Analytics anonymes (pas de tracking personnel) ── */





/* ── Minuteur doux ── */
function TimerWidget({ color }) {
  const [seconds, setSeconds] = useState(0);
  const [max]                 = useState(180); // 3 minutes
  const ref = useRef(null);

  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setSeconds(s => {
        if (s >= max) { clearInterval(ref.current); setActive(false); return max; }
        return s + 1;
      }), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [active, max]);

  const pct = seconds / max;
  const mins = Math.floor((max - seconds) / 60);
  const secs = (max - seconds) % 60;

  if (!active && seconds === 0) return (
    <button onClick={() => setActive(true)}
      style={{ background:"none", border:"none", fontSize:11,
        color: color + "88", cursor:"pointer", fontFamily:FF.body,
        marginBottom:4, minHeight:44 }}>
      ⏱ Démarrer un minuteur doux (3 min)
    </button>
  );

  return (
    <div style={{ marginBottom:8, padding:"8px 12px", borderRadius:16,
      background: color + "14", border:`1px solid ${color}33` }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:12, color, fontWeight:600 }}>
          {active ? `⏱ ${mins}:${secs.toString().padStart(2,"0")} restant` : "⏱ Terminé !"}
        </span>
        <button onClick={() => { setActive(false); setSeconds(0); }}
          style={{ background:"none", border:"none", fontSize:11,
            color: color + "88", cursor:"pointer", minHeight:44 }}>
          ✕
        </button>
      </div>
      <div style={{ height:4, borderRadius:2, background: color + "22" }}>
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration:1, ease:"linear" }}
          style={{ height:"100%", borderRadius:2, background: color }}
        />
      </div>
    </div>
  );
}


/* ── Changelog in-app ── */

function ChangelogModal({ onClose }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      role="dialog" aria-modal="true" aria-label="Notes de mise à jour"
      style={{ position:"fixed", inset:0, zIndex:300, background:T.sys.overlay,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        padding:"0 0 16px" }}>
      <motion.div initial={{ y:300 }} animate={{ y:0 }} exit={{ y:300 }}
        transition={{ type:"spring", stiffness:300, damping:30 }}
        style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px",
          maxWidth:480, width:"100%", maxHeight:"70vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:16 }}>
          <h2 style={{ fontFamily:FF.title, fontSize:19, color:T.neutral.brown }}>
            📋 Nouveautés v{APP_VERSION}
          </h2>
          <button onClick={onClose}
            style={{ background:"none", border:"none", fontSize:20,
              cursor:"pointer", minHeight:44, color:T.neutral.brownMid }}
            aria-label="Fermer">✕</button>
        </div>
        {Object.entries(CHANGELOG).map(([version, items]) => (
          <div key={version} style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.violet.main,
              marginBottom:8 }}>v{version}</div>
            {items.map((item, i) => (
              <div key={i} style={{ fontSize:13, color:T.neutral.brownMid,
                padding:"4px 0", borderBottom:`1px solid ${T.neutral.beige}`,
                lineHeight:1.6 }}>
                ✦ {item}
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
/* ── Page offline / 404 ── */
function OfflinePage() {
  return (
    <div style={{ position:"fixed", inset:0, background:T.vert.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:FF.body, padding:24, textAlign:"center" }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🐻</div>
      <h2 style={{ fontFamily:FF.title, fontSize:24, color:T.vert.text, marginBottom:8 }}>
        Pas de connexion
      </h2>
      <p style={{ fontSize:15, color:T.neutral.brownMid, lineHeight:1.6, marginBottom:24 }}>
        Ton doudou attend que la connexion revienne.<br/>
        Tes pensées sont bien sauvegardées sur cet appareil.
      </p>
      <button onClick={() => window.location.reload()}
        style={{ padding:"14px 32px", borderRadius:24, border:"none",
          background:T.vert.main, color:"#fff",
          fontFamily:FF.title, fontSize:17, cursor:"pointer", minHeight:44 }}>
        Réessayer
      </button>
    </div>
  );
}
/* ── Skeleton Loading ── */
function SkeletonPulse({ width="100%", height=16, radius=8, style={} }) {
  return (
    <div style={{
      width, height, borderRadius:radius,
      background: "linear-gradient(90deg, #E8E0D4 25%, #F5F0EA 50%, #E8E0D4 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }}/>
  );
}
/* ── Debounce hook ── */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/* ── Context global — évite le prop drilling ── */
const AppContext = createContext({
  isNight: false,
  isReduced: false,
  profile: { name:"", avatar:"🦊" },
  lang: "fr",
  t: {},
});
const useApp = () => useContext(AppContext);


/* ── Migration données localStorage ── */
// Exécuter la migration au démarrage
migrateData();

/* ── Analytics anonymes (local, sans RGPD) ── */


/* ══════════════════════════════════════════════════════════
   VERSIONING DONNÉES — migration automatique
══════════════════════════════════════════════════════════ */
// Exécuter au chargement
migrateData();


/* ── Analytics anonymes (pas de tracking personnel) ── */
const CONSENT_KEY = "bibl_consent_v1";

function ConsentScreen({ onAccept }) {
  const [checked, setChecked] = useState({ age: false, data: false, terms: false });
  const allChecked = Object.values(checked).every(Boolean);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      role="dialog" aria-modal="true" aria-label="Accord parental" style={{ position:"fixed", inset:0, zIndex:200,
        background:`linear-gradient(160deg,${T.nuit.bg},${T.nuit.soft})`,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"24px 20px", fontFamily:FF.body, overflow:"hidden" }}>

      {/* Logo */}
      <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
      <h1 style={{ fontFamily:FF.title, fontSize:22, color:T.nuit.text,
        marginBottom:6, textAlign:"center" }}>
        Bibliothèque des Pensées
      </h1>
      <p style={{ fontSize:12, color:T.nuit.light, marginBottom:24, textAlign:"center" }}>
        Amotessa SARL-S — Luxembourg
      </p>

      {/* Carte consentement */}
      <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:24,
        padding:"24px", maxWidth:420, width:"100%",
        boxShadow:SH.lg }}>

        <h2 style={{ fontFamily:FF.title, fontSize:18, color:T.nuit.text,
          marginBottom:8 }}>
          👨‍👩‍👧 Accord parental requis
        </h2>
        <p style={{ fontSize:13, color:T.neutral.brownMid, lineHeight:1.6,
          marginBottom:20 }}>
          Cette application est destinée aux enfants. En tant que parent ou tuteur légal,
          veuillez confirmer les points suivants avant de continuer.
        </p>

        {/* Cases à cocher */}
        {[
          { key:"age",   label:"Je confirme que mon enfant a moins de 18 ans et que j'ai l'autorité parentale pour lui permettre d'utiliser cette application." },
          { key:"data",  label:"J'accepte que les pensées et données de mon enfant soient stockées localement sur cet appareil. Aucune donnée n'est envoyée à des serveurs tiers sauf en cas d'utilisation de la voix IA (optionnelle)." },
          { key:"terms", label:"J'ai lu et j'accepte les Conditions d'utilisation et la Politique de confidentialité d'Amotessa SARL-S." },
        ].map(({ key, label }) => (
          <label key={key} style={{ display:"flex", gap:12, alignItems:"flex-start",
            marginBottom:16, cursor:"pointer" }}>
            <input type="checkbox" checked={checked[key]}
              onChange={e => setChecked(prev => ({ ...prev, [key]: e.target.checked }))}
              style={{ marginTop:3, width:18, height:18, cursor:"pointer", accentColor:T.nuit.main }}
            />
            <span style={{ fontSize:12, color:T.neutral.brown, lineHeight:1.6 }}>
              {label}
            </span>
          </label>
        ))}

        {/* Liens légaux */}
        <div style={{ fontSize:11, color:T.neutral.brownMid, marginBottom:20,
          lineHeight:1.6, borderTop:`1px solid ${T.neutral.beige}`, paddingTop:12 }}>
          📧 <a href="mailto:contact@amotessa.lu"
            style={{ color:T.nuit.main }}>contact@amotessa.lu</a>
          {" · "}Amotessa SARL-S, 1 rue Charles Gounod, L-1118 Luxembourg
        </div>

        {/* Bouton */}
        <motion.button
          whileTap={{ scale: allChecked ? 0.96 : 1 }}
          onClick={() => {
            if (!allChecked) return;
            try { localStorage.setItem(CONSENT_KEY, new Date().toISOString()); } catch {}
            onAccept();
          }}
          style={{ width:"100%", padding:"15px", borderRadius:20, border:"none",
            background: allChecked
              ? `linear-gradient(135deg,${T.nuit.main},${T.nuit.dark})`
              : T.neutral.beige,
            color: allChecked ? "#fff" : T.neutral.brownLight,
            fontFamily:FF.title, fontSize:17, minHeight:44,
            cursor: allChecked ? "pointer" : "default",
            boxShadow: allChecked ? SH.lg : "none",
            transition:"all 0.3s" }}>
          {allChecked ? "Continuer →" : "Cochez les cases pour continuer"}
        </motion.button>
      </div>
    </motion.div>
  );
}


const AVATARS = ["🦊","🐻","🐨","🦁","🐸","🦋","🐬","🦄","🐼","🦉","🌟","🌈"];

function ProfileSetup({ onDone }) {
  const [name, setName] = useState("");

  const finish = () => {
    if (!name.trim()) return;
    onDone({ name: name.trim(), avatar: "🦊" }); // avatar choisi après
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ position:"fixed", inset:0, zIndex:150,
        background:"linear-gradient(160deg,#E4FFF8,#C8F4EC,#A8EAD8)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"28px 20px", fontFamily:FF.body,
        overflow:"hidden" }}>

      {/* Blobs vert eau */}
      <motion.div style={{ animation:"blob-pulse 6s ease-in-out infinite" }}
        style={{ position:"absolute", top:"-10%", left:"-15%", width:250, height:250,
          borderRadius:"50%", background:"#1D9E7522", filter:"blur(40px)", pointerEvents:"none" }}/>
      <motion.div style={{ animation:"blob-pulse 8s ease-in-out infinite 2s" }}
        style={{ position:"absolute", bottom:"-8%", right:"-10%", width:200, height:200,
          borderRadius:"50%", background:"#1D9E7530", filter:"blur(32px)", pointerEvents:"none" }}/>

      <motion.div animate={{ y:[0,-10,0] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}
        style={{ marginBottom:16, filter:"drop-shadow(0 8px 20px #1D9E7544)" }}>
        <Doudou size={96} pose="wave"/>
      </motion.div>

      <motion.h2 initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ fontFamily:FF.title, fontSize:24,
          color:T.vert.text, marginBottom:8, textAlign:"center" }}>
        Bonsoir ! Comment t'appelles-tu ?
      </motion.h2>
      <p style={{ fontSize:15, color:"#1D6A58", marginBottom:24, textAlign:"center", lineHeight:1.6 }}>
        Ton doudou gardien aimerait connaître ton prénom 🐻
      </p>

      <input autoFocus value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key==="Enter" && finish()}
        placeholder="Mon prénom…"
        maxLength={20}
        style={{ width:"100%", maxWidth:340, padding:"16px 20px", borderRadius:24,
          border:"2.5px solid #5DCAA5", background:"rgba(255,255,255,0.9)",
          fontSize:19, fontFamily:FF.body, color:T.vert.text,
          outline:"none", textAlign:"center", marginBottom:20,
          boxSizing:"border-box", boxShadow:SH.lg }}
      />

      <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.04 }}
        onClick={finish} disabled={!name.trim()}
        style={{ padding:"16px 48px", border:"none", borderRadius:24,
          background: name.trim() ? "linear-gradient(135deg,#1D9E75,#15876A)" : "#A8D8C8",
          color:"#fff", fontFamily:FF.title,
          fontSize:19, cursor: name.trim() ? "pointer" : "default",
          boxShadow: name.trim() ? "0 8px 24px #1D9E7555" : "none" }}>
        C'est moi ! →
      </motion.button>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════════════
   ÉCRAN DE BIENVENUE
   Entre la configuration du profil et les explications
══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   1. ÉCRAN BIENVENUE — chaleureux, personnel
══════════════════════════════════════════════════════════ */
function WelcomeScreen({ profile, onNext }) {
  const { speak, stop } = useSpeech();
  const isReduced = useReducedMotion();

  useEffect(() => {
    const name = profile?.name || "";
    speak(
      name
        ? `Bonsoir ${name}. Je suis tellement content de te voir. Ta bibliothèque magique t’attend.`
        : `Bonsoir. Je suis tellement content de te voir. Ta bibliothèque magique t’attend.`,
      { rate:0.80, pitch:0.92 }
    );
    return () => stop();
  }, []);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ position:"fixed", inset:0, zIndex:100,
        background:"linear-gradient(160deg,#E4FFF8 0%,#C8F0EA 50%,#A8E8D8 100%)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"28px 20px", fontFamily:FF.body, overflow:"hidden" }}>

      {/* Blobs CSS pur */}
      <div style={{ position:"absolute", top:"-10%", left:"-10%", width:220, height:220,
        borderRadius:"50%", background:"#1D9E7525", filter:"blur(36px)", pointerEvents:"none",
        animation:"blob-pulse 6s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", bottom:"-8%", right:"-8%", width:180, height:180,
        borderRadius:"50%", background:"#1D9E7525", filter:"blur(36px)", pointerEvents:"none",
        animation:"blob-pulse 8s ease-in-out infinite 2s" }}/>

      {/* Doudou animé */}
      <motion.div animate={{ y:[0,-12,0], rotate:[-2,2,-2] }}
        transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}
        style={{ marginBottom:16, filter:"drop-shadow(0 10px 28px #1D9E7555)" }}>
        <Doudou size={110} pose="hug"/>
      </motion.div>

      <motion.h1 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        style={{ fontFamily:FF.title, fontSize:24,
          color:T.vert.text, marginBottom:8, textAlign:"center", lineHeight:1.3 }}>
        {profile?.name ? `Bonsoir ${profile.name} ! 🌙` : "Bonsoir ! 🌙"}
      </motion.h1>

      <motion.p initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
        style={{ fontSize:15, color:"#0A5A48", lineHeight:1.6, textAlign:"center",
          marginBottom:32, fontWeight:600, maxWidth:340 }}>
        Je suis ton doudou gardien.<br/>
        Ta bibliothèque magique t'attend.<br/>
        <span style={{ color:T.vert.main, fontWeight:800 }}>Ce soir, on va l'explorer ensemble.</span>
      </motion.p>

      <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.04 }}
        onClick={() => { stop(); onNext(); }}
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
        style={{ padding:"17px 52px", border:"none", borderRadius:24,
          background:"linear-gradient(135deg,#1D9E75,#15876A)",
          color:"#fff", fontFamily:FF.title,
          fontSize:19, cursor:"pointer", minHeight:44,
          boxShadow:SH.lg }}>
        Allons-y ! →
      </motion.button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   2. PRÉSENTATION — à quoi ça sert + le doudou explique
══════════════════════════════════════════════════════════ */
function PresentationScreen({ profile, onNext }) {
  const { speak, stop } = useSpeech();
  const isReduced = useReducedMotion();
  const [step, setStep] = useState(0);

  const slides = [
    {
      emoji:"📚",
      title:"Ta bibliothèque des pensées",
      text:"Chaque soir, avant de dormir, tu vas avoir un moment juste pour toi. Un espace calme, doux et sécurisé. Sans jeux, sans points. Juste toi et tes pensées.",
      speech:"Chaque soir. Tu vas avoir un moment juste pour toi. Un espace calme. Doux. Et sécurisé. Sans jeux. Sans points. Juste toi. Et tes pensées.",
      dot:T.vert.main, bg:"linear-gradient(145deg,#E4FFF8,#C4F0E4)",
    },
    {
      emoji:"💭",
      title:"Dépose tes mots",
      text:"Tu peux écrire, dessiner ou parler. Tout ce qui tourne dans ta tête peut se poser sur une étagère. Quand les pensées sont posées, on s'endort bien mieux.",
      speech:"Tu peux écrire. Dessiner. Ou parler. Tout ce qui tourne dans ta tête. Peut se poser sur une étagère. Quand les pensées sont posées. On s’endort bien mieux.",
      dot:T.violet.main, bg:"linear-gradient(145deg,#F4EEFF,#E4D4FF)",
    },
    {
      doudou:true,
      title:"Je serai là chaque soir",
      text:"Ton doudou gardien t'accompagne tous les soirs. Il lit tes pensées avec toi, et veille sur ta bibliothèque pendant que tu dors. Tu n'es jamais seul.",
      speech:"Je serai là. Chaque soir. Je lirai tes pensées avec toi. Et je veillerai sur ta bibliothèque. Pendant que tu dors. Tu n’es jamais seul.",
      dot:T.or.main, bg:"linear-gradient(145deg,#FFFCE0,#FFF0A0)",
    },
  ];

  const cur = slides[step];

  useEffect(() => {
    speak(cur.speech, { rate:0.80, pitch:0.92 });
    return () => stop();
  }, [step]);

  const goNext = () => {
    stop();
    if (step < slides.length - 1) setStep(s => s+1);
    else { stop(); onNext(); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ position:"fixed", inset:0, zIndex:100,
        background: cur.bg, transition:"background 0.6s ease",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"24px 20px", fontFamily:FF.body, overflow:"hidden" }}>

      {/* Blobs */}
      <motion.div animate={{ scale:[1,1.1,1], rotate:[0,5,-3,0] }}
        transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
        style={{ position:"absolute", top:"-12%", left:"-12%", width:240, height:240,
          borderRadius:"60% 40% 50% 70%/50% 60% 40% 60%",
          background:cur.dot+"22", filter:"blur(38px)", pointerEvents:"none" }}/>
      <motion.div animate={{ scale:[1,1.08,1] }}
        transition={{ duration:10, repeat:Infinity, ease:"easeInOut", delay:3 }}
        style={{ position:"absolute", bottom:"-8%", right:"-10%", width:200, height:200,
          borderRadius:"50%", background:cur.dot+"28", filter:"blur(32px)", pointerEvents:"none" }}/>

      {/* Indicateurs */}
      <div style={{ display:"flex", gap:8, marginBottom:32, zIndex:1 }}>
        {slides.map((_,i) => (
          <motion.div key={i}
            animate={{ width:i===step?28:10, background:i<=step?cur.dot:cur.dot+"33" }}
            transition={{ duration:0.6, type:"spring", stiffness:300 }}
            style={{ height:10, borderRadius:5 }}/>
        ))}
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity:0, y:36, scale:0.93 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-28, scale:0.95 }}
          transition={{ duration:0.65, ease:[0.34,1.56,0.64,1] }}
          style={{ textAlign:"center", maxWidth:420, width:"100%", zIndex:1 }}>

          {cur.doudou ? (
            <motion.div animate={{ y:[0,-14,0], rotate:[-2,3,-2] }}
              transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
              style={{ marginBottom:16, filter:`drop-shadow(0 10px 28px ${cur.dot}66)` }}>
              <Doudou size={100} pose="sit"/>
            </motion.div>
          ) : (
            <motion.div
              animate={{ y:[0,-14,3,-9,0], scale:[1,1.12,0.96,1.08,1] }}
              transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
              style={{ fontSize:90, marginBottom:16, lineHeight:1.3,
                filter:`drop-shadow(0 12px 30px ${cur.dot}66)` }}>
              {cur.emoji}
            </motion.div>
          )}

          <h2 style={{ fontFamily:FF.title, fontSize:24,
            color:"#1A1810", marginBottom:12, lineHeight:1.3,
            textShadow:`0 2px 12px ${cur.dot}44` }}>
            {cur.title}
          </h2>

          <p style={{ fontSize:15, color:T.ui.textDark, lineHeight:1.6,
            fontWeight:600, marginBottom:32,
            textShadow:"0 1px 6px rgba(255,255,255,0.5)" }}>
            {cur.text}
          </p>

          <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.04, y:-2 }}
            onClick={goNext}
            style={{ width:"100%", maxWidth:380, padding:"17px 0", border:"none", borderRadius:24,
              background:`linear-gradient(135deg,${cur.dot},${cur.dot}CC)`,
              color:"#fff", fontFamily:FF.title,
              fontSize:19, cursor:"pointer", minHeight:44,
              boxShadow:`0 10px 30px ${cur.dot}55` }}>
            {step < slides.length-1 ? "Suivant →" : "Choisir mon compagnon ! 🐻"}
          </motion.button>
        </motion.div>
      </AnimatePresence>

      <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
        onClick={() => { stop(); onNext(); }}
        style={{ marginTop:20, background:"none", border:"none",
          fontSize:13, color:cur.dot+"99", cursor:"pointer", minHeight:44,
          fontFamily:FF.body, fontWeight:600,
          textDecoration:"underline", textDecorationStyle:"dotted" }}>
        Passer
      </motion.button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   3. CHOIX DU COMPAGNON
══════════════════════════════════════════════════════════ */
const AVATAR_NAMES = {
  "🦊":"Renard","🐻":"Ourson","🐨":"Koala","🦁":"Lion",
  "🐸":"Grenouille","🦋":"Papillon","🐬":"Dauphin","🦄":"Licorne",
  "🐼":"Panda","🦉":"Hibou","🌟":"Étoile","🌈":"Arc-en-ciel"
};

function CompanionScreen({ profile, onDone }) {
  const [avatar, setAvatar]     = useState(profile?.avatar || "🦊");
  const [confirmed, setConfirmed] = useState(false);
  const { speak, stop } = useSpeech();

  useEffect(() => {
    const hasPrev = profile?.avatar && profile.avatar !== "🦊";
    const name    = profile?.name || "";
    const msg = hasPrev
      ? `Tu avais choisi ${AVATAR_NAMES[saved.avatar]||saved.avatar}. Tu peux le garder ou en choisir un autre.`
      : name
        ? `${name}, choisis ton compagnon du soir. Celui qui veillera sur toi chaque nuit.`
        : "Choisis ton compagnon du soir. Celui qui veillera sur toi chaque nuit.";
    speak(msg, { rate:0.82, pitch:0.92 });
    return () => stop();
  }, []);

  const handleSelect = (a) => {
    setAvatar(a);
    setConfirmed(false);
    stop();
    speak(AVATAR_NAMES[a]||a, { rate:0.9 });
  };

  const confirm = () => {
    stop();
    setConfirmed(true);
    const updated = { ...saved, ...profile, avatar };
    saveProfile(updated);
    speak(
      `${AVATAR_NAMES[avatar]||avatar} sera ton compagnon. Il veillera sur toi chaque soir.`,
      { rate:0.82, pitch:0.92, onEnd: () => onDone(updated) }
    );
    // Fallback si onEnd ne se déclenche pas
    const fallbackTimer = setTimeout(() => onDone(updated), 3000);
    // Stocker pour cleanup si le composant se démonte
    return () => clearTimeout(fallbackTimer);
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ position:"fixed", inset:0, zIndex:100,
        background:`linear-gradient(160deg,${T.or.bg},${T.or.soft},#FFE060)`,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"24px 20px", fontFamily:FF.body, overflow:"hidden" }}>

      {/* Blobs */}
      <motion.div style={{ animation:"blob-pulse 6s ease-in-out infinite" }}
        style={{ position:"absolute", top:"-10%", left:"-10%", width:220, height:220,
          borderRadius:"50%", background:T.or.main+"22", filter:"blur(36px)", pointerEvents:"none" }}/>
      <motion.div style={{ animation:"blob-pulse 8s ease-in-out infinite 2s" }}
        style={{ position:"absolute", bottom:"-8%", right:"-8%", width:180, height:180,
          borderRadius:"50%", background:T.or.main+"30", filter:"blur(30px)", pointerEvents:"none" }}/>

      {/* Avatar grand — animé, change en temps réel */}
      <motion.div key={avatar}
        initial={{ scale:0.6, opacity:0, rotate:-10 }}
        animate={{ scale:1, opacity:1, rotate:0, y:[0,-12,0] }}
        transition={{ scale:{ duration:0.4, ease:[0.34,1.56,0.64,1] },
          opacity:{ duration:0.3 }, rotate:{ duration:0.4 },
          y:{ duration:2.5, repeat:Infinity, ease:"easeInOut" } }}
        style={{ fontSize:88, marginBottom:8, lineHeight:1.3,
          filter:`drop-shadow(0 8px 24px ${T.or.main}66)` }}>
        {avatar}
      </motion.div>

      {/* Nom animé */}
      <motion.div key={`n-${avatar}`}
        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }}
        style={{ fontFamily:FF.title, fontSize:19, color:T.or.text,
          marginBottom:16, letterSpacing:"0.02em" }}>
        {AVATAR_NAMES[avatar] || avatar}
      </motion.div>

      <h2 style={{ fontFamily:FF.title, fontSize:24,
        color:"#3B2200", marginBottom:8, textAlign:"center" }}>
        {saved?.avatar && saved.avatar !== "🦊" ? "Changer de compagnon ?" : "Choisis ton compagnon !"}
      </h2>
      <p style={{ fontSize:13, color:"#7A5020", marginBottom:16,
        textAlign:"center", lineHeight:1.6 }}>
        Il veillera sur toi chaque soir 🌙
      </p>

      {/* Grille */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8,
        background:"rgba(255,255,255,0.75)", backdropFilter:"blur(8px)",
        borderRadius:24, padding:16, marginBottom:24, maxWidth:380, width:"100%",
        boxShadow:SH.lg }}>
        {AVATARS.map(a => (
          <motion.button key={a} onClick={() => handleSelect(a)}
            whileTap={{ scale:0.85 }} whileHover={{ scale:1.18 }}
            style={{ fontSize:32, borderRadius:16, padding:"8px 4px",
              cursor:"pointer", minHeight:44, position:"relative",
              background: avatar===a ? T.or.main+"28" : "transparent",
              border: avatar===a ? `2.5px solid ${T.or.main}` : "2px solid transparent",
              boxShadow: avatar===a ? `0 3px 12px ${T.or.main}44` : "none",
              transition:"all 0.2s" }}>
            {a}
            {avatar===a && (
              <div style={{ position:"absolute", top:-5, right:-5,
                width:18, height:18, borderRadius:"50%",
                background:T.or.main, color:"#fff", fontSize:10, fontWeight:800,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 2px 6px ${T.or.main}88` }}>
                ✓
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Bouton */}
      <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.04 }}
        onClick={!confirmed ? confirm : undefined}
        style={{ padding:"17px 52px", border:"none", borderRadius:24,
          background: confirmed
            ? `linear-gradient(135deg,${T.vert.main},${T.vert.dark})`
            : `linear-gradient(135deg,${T.or.main},${T.or.warm})`,
          color:"#fff", fontFamily:FF.title, fontSize:19,
          cursor: confirmed ? "default" : "pointer", minHeight:44,
          boxShadow: SH.lg, transition:"background 0.5s" }}>
        {confirmed ? `${avatar} Parfait ! ✓` : "C'est lui ! ✨"}
      </motion.button>
    </motion.div>
  );
}

function Onboarding({ onDone, childName, startStep = 0 }) {
  const isReduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const { speak, stop }       = useSpeech();
  const cur = ONBOARD_STEPS[step];

  useEffect(() => {
    const greeting = step === 0 && childName
      ? `Bonsoir ${childName} ! ${cur.speech}`
      : cur.speech;
    speak(greeting, { rate:0.80, pitch:0.93 });
    return () => stop();
  }, [step]);

  const next = () => {
    stop();
    if (step === ONBOARD_STEPS.length - 1) { setLeaving(true); setTimeout(onDone, 500); }
    else setStep(s => s + 1);
  };
  const skip = () => { stop(); setLeaving(true); setTimeout(onDone, 400); };

  const BG_GRADIENTS = [
    `linear-gradient(145deg,${T.neutral.cream} 0%,${T.neutral.beige} 50%,${T.neutral.sand} 100%)`, /* hibou */
    `linear-gradient(145deg,${T.rose.bg} 0%,#FFD6EA 50%,${T.rose.soft} 100%)`, /* boubou */
    `linear-gradient(145deg,${T.violet.bg} 0%,${T.violet.soft} 50%,#D0BCFF 100%)`, /* cloud */
    `linear-gradient(145deg,${T.mer.bg} 0%,${T.mer.soft} 50%,#A8C8F0 100%)`, /* trash */
    `linear-gradient(145deg,${T.nuit.bg} 0%,${T.nuit.soft} 50%,#A8B8E0 100%)`, /* lettre */
    `linear-gradient(145deg,${T.or.bg} 0%,${T.or.soft} 50%,#FFE060 100%)`, /* bonheur */
  ];
  const FLOATS = [
    ["✨","💛","🤍","💫","🌟","💙"],   /* hibou — neutre */
    ["💗","💖","✨","💝","💓","💕"],   /* boubou — rose */
    ["💜","✨","💫","🌀","💎","🔮"],   /* cloud — violet */
    ["🌊","💙","🐟","🐚","💫","🌈"],   /* trash — bleu mer */
    ["💌","💙","🌙","✨","⭐","💫"],   /* lettre — bleu nuit */
    ["💛","⭐","✨","🌟","💫","🌈"],   /* bonheur — soleil */
  ];
  const FLOAT_POS = [
    {x:"6%",y:"8%",s:1.4,d:0},{x:"88%",y:"6%",s:1.2,d:0.8},
    {x:"4%",y:"78%",s:1.0,d:1.4},{x:"86%",y:"74%",s:1.3,d:0.4},
    {x:"45%",y:"3%",s:1.1,d:1.8},{x:"72%",y:"40%",s:0.9,d:1.1},
  ];
  const bg     = BG_GRADIENTS[step] || BG_GRADIENTS[0];
  const floats = FLOATS[step]       || FLOATS[0];

  return (
    <motion.div animate={{ opacity: leaving ? 0 : 1 }} transition={{ duration:0.5 }}
      style={{
        position:"fixed", inset:0, zIndex:100, background:bg,
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"24px 20px",
        fontFamily:FF.body, overflow:"hidden",
        transition:"background 0.7s ease",
      }}>

      {/* Blobs */}
      <motion.div animate={safe({ scale:[1,1.08,1], rotate:[0,6,-4,0] }, isReduced)}
        transition={safeTrans({ duration:8, repeat:Infinity, ease:"easeInOut" }, isReduced)}
        style={{ position:"absolute", top:"-10%", left:"-15%", width:280, height:280,
          borderRadius:"60% 40% 50% 70% / 50% 60% 40% 60%",
          background:cur.dot+"25", filter:"blur(32px)", pointerEvents:"none" }}/>
      <motion.div animate={safe({ scale:[1,1.12,1], rotate:[0,-8,5,0] }, isReduced)}
        transition={safeTrans({ duration:10, repeat:Infinity, ease:"easeInOut", delay:2 }, isReduced)}
        style={{ position:"absolute", bottom:"-8%", right:"-12%", width:240, height:240,
          borderRadius:"40% 60% 70% 30% / 60% 40% 60% 40%",
          background:cur.dot+"30", filter:"blur(28px)", pointerEvents:"none" }}/>
      <motion.div animate={safe({ scale:[1,1.06,1] }, isReduced)}
        transition={safeTrans({ duration:6, repeat:Infinity, ease:"easeInOut", delay:1 }, isReduced)}
        style={{ position:"absolute", top:"35%", right:"-8%", width:160, height:160,
          borderRadius:"50%", background:cur.dot+"20", filter:"blur(24px)", pointerEvents:"none" }}/>

      {/* Floaters */}
      {FLOAT_POS.map((pos,i) => (
        <motion.div key={`${step}-${i}`}
          style={{ position:"absolute", left:pos.x, top:pos.y,
            fontSize:19*pos.s, pointerEvents:"none",
            filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}
          initial={{ opacity:0, scale:0 }}
          animate={{ y:[0,-12,4,-8,0], opacity:[0.65,1,0.75,1,0.65], scale:pos.s }}
          transition={{ duration:3+i*0.6, repeat:Infinity, ease:"easeInOut", delay:i*0.35 }}>
          {floats[i]}
        </motion.div>
      ))}

      {/* Progress dots */}
      <div style={{ display:"flex", gap:8, marginBottom:24, zIndex:1 }}>
        {ONBOARD_STEPS.map((_,i) => (
          <motion.div key={i}
            animate={{
              width: i===step ? 32 : 10,
              background: i <= step ? cur.dot : cur.dot+"33",
              scale: i===step ? 1 : 0.85,
            }}
            transition={{ duration:0.6, type:"spring", stiffness:300 }}
            style={{ height:10, borderRadius:5,
              boxShadow: i===step ? `0 2px 8px ${cur.dot}88` : "none" }}/>
        ))}
      </div>

      {/* ── Contenu libre SANS cadre — tout flotte dans l'espace ── */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity:0, y:50, scale:0.82 }}
          animate={{ opacity:1, y:0,  scale:1    }}
          exit={{   opacity:0, y:-40, scale:0.92  }}
          transition={{ duration:0.65, ease:[0.34,1.56,0.64,1] }}
          style={{ textAlign:"center", position:"relative", zIndex:1,
            maxWidth:420, width:"100%", padding:"0 12px" }}>

          {/* Anneau lumineux rotatif derrière l'emoji */}
          <motion.div
            animate={{ rotate:[0,360], scale:[1,1.15,1] }}
            transition={{ rotate:{ duration:12, repeat:Infinity, ease:"linear" },
              scale:{ duration:4, repeat:Infinity, ease:"easeInOut" } }}
            style={{ position:"absolute", top:"-10px", left:"50%",
              transform:"translateX(-50%)",
              width:180, height:180, borderRadius:"50%",
              background:`conic-gradient(${cur.dot}55, transparent 30%, ${cur.dot}77 60%, transparent 80%, ${cur.dot}44)`,
              filter:"blur(20px)", pointerEvents:"none", zIndex:0 }}/>

          {/* Particules flottantes — adaptées à chaque étape */}
          {[
            {e:["✨","💛","💜","💫","🌈","💙","💗","✦","💝"][step%9],x:"4%",  y:"2%",  s:1.3, d:0.0},
            {e:["💫","💖","❄️","🐚","💌","⭐","✨","💕","🌀"][step%9],x:"86%", y:"5%",  s:1.1, d:0.6},
            {e:["💎","💗","☁️","🐟","💜","🌙","💛","💝","💙"][step%9],x:"2%",  y:"55%", s:1.0, d:1.3},
            {e:["💙","💝","💨","🌊","✉️","💫","🌈","💖","✨"][step%9],x:"88%", y:"52%", s:1.2, d:0.2},
            {e:["🌈","✦","💙","💫","⭐","💛","💝","☁️","💜"][step%9],x:"48%", y:"-2%", s:0.9, d:1.7},
            {e:["💫","💕","💫","🐚","💌","✨","💫","❄️","💛"][step%9],x:"16%", y:"88%", s:1.1, d:2.2},
            {e:["✨","💜","🌈","🌊","💙","🌟","✦","💗","💫"][step%9],x:"82%", y:"85%", s:1.0, d:0.9},
            {e:["💛","💖","❄️","💙","💝","💫","💜","✨","🌀"][step%9],x:"94%", y:"30%", s:0.8, d:1.5},
            {e:["✦","💙","☁️","💫","✨","💛","💗","🌈","💝"][step%9],x:"0%",  y:"30%", s:0.9, d:2.8},
          ].map((p,i) => (
            <motion.div key={`p${step}${i}`}
              style={{ position:"absolute", left:p.x, top:p.y,
                fontSize:24*p.s, pointerEvents:"none", zIndex:0,
                filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.10))" }}
              initial={{ opacity:0 }}
              animate={{ y:[0,-18,5,-12,0], x:[0,8,-5,4,0],
                rotate:[0,25,-18,12,0], opacity:[0.5,1,0.6,1,0.5], scale:p.s }}
              transition={{ duration:3.5+i*0.5, repeat:Infinity,
                ease:"easeInOut", delay:p.d }}>
              {p.e}
            </motion.div>
          ))}

          {/* Petits confettis colorés */}
          {[0,1,2,3,4,5].map(i => (
            <motion.div key={`c${step}${i}`}
              style={{ position:"absolute",
                left:`${15+i*13}%`, top:`${8+i%3*22}%`,
                width:10+(i%3)*4, height:10+(i%3)*4,
                borderRadius: i%2===0 ? "50%" : "4px",
                background:[
                  `${cur.dot}CC`, "#A8E8D888", "#F8C8DC99",
                  "#FAC77588", `${cur.dot}88`, "#C8FFE888"
                ][i],
                pointerEvents:"none", zIndex:0 }}
              animate={{ y:[0,-28+i*4,-50+i*3,0],
                x:[0,12-i*3,-9+i*2,0],
                rotate:[0,200+i*40,400],
                opacity:[0.2,0.8,0.4,0.2] }}
              transition={{ duration:2.8+i*0.45, repeat:Infinity,
                ease:"easeInOut", delay:i*0.3 }}/>
          ))}

          {/* Emoji — 100px, libre, expressif */}
          <motion.div
            animate={{ y:[0,-20,4,-13,0], rotate:[0,9,-6,4,0],
              scale:[1,1.16,0.94,1.09,1] }}
            transition={{ duration:3.8, repeat:Infinity, ease:"easeInOut" }}
            style={{ fontSize:100, lineHeight:1.3, marginBottom:24,
              filter:`drop-shadow(0 14px 36px ${cur.dot}88) drop-shadow(0 4px 10px rgba(0,0,0,0.12))`,
              display:"block", position:"relative", zIndex:1 }}>
            {cur.emoji}
          </motion.div>

          {/* Badge étagère */}
          {cur.shelf && (
            <motion.div
              initial={{ scale:0, opacity:0, y:16 }}
              animate={{ scale:1, opacity:1, y:0 }}
              transition={{ delay:0.3, type:"spring", stiffness:320 }}
              style={{ display:"inline-flex", alignItems:"center", gap:8,
                background:`linear-gradient(135deg,${cur.dot}44,${cur.dot}66)`,
                backdropFilter:"blur(10px)",
                borderRadius:24, padding:"10px 24px", marginBottom:20,
                border:`2px solid ${cur.dot}88`,
                boxShadow:`0 6px 24px ${cur.dot}44, 0 1px 0 rgba(255,255,255,0.45) inset`,
                position:"relative", zIndex:1 }}>
              <span style={{ fontSize:24 }}>{SHELVES.find(s=>s.id===cur.shelf)?.emoji}</span>
              <span style={{ fontSize:15, fontWeight:600, color:"#fff",
                fontFamily:FF.title,
                textShadow:`0 1px 6px ${cur.dot}` }}>
                {SHELVES.find(s=>s.id===cur.shelf)?.label}
              </span>
            </motion.div>
          )}

          {/* Titre — flottant, sans fond */}
          <motion.h2
            animate={{ y:[0,-3,1,-2,0] }}
            transition={{ duration:4.5, repeat:Infinity, ease:"easeInOut" }}
            style={{ fontFamily:FF.title, fontSize:24,
              color:"#1A2820", marginBottom:16, lineHeight:1.3,
              textShadow:`0 3px 16px ${cur.dot}55, 0 1px 0 rgba(255,255,255,0.7)`,
              position:"relative", zIndex:1 }}>
            {cur.title}
          </motion.h2>

          {/* Description — sans fond, texte direct sur le dégradé */}
          <p style={{ fontSize:15, lineHeight:1.6, marginBottom:32,
            fontWeight:600, color:T.ui.textDark,
            textShadow:"0 1px 8px rgba(255,255,255,0.6)",
            position:"relative", zIndex:1,
            maxWidth:360, textAlign:"center",
            padding:"0 8px",
          }}>
            {cur.text}
          </p>

          {/* Bouton grand et lumineux */}
          <motion.button whileTap={{ scale:0.95 }} whileHover={{ scale:1.05, y:-3 }}
            onClick={next}
            style={{ width:"100%", padding:"18px 0",
              background:`linear-gradient(135deg,${cur.dot} 0%,${cur.dot}CC 100%)`,
              color:"#fff", border:"none", borderRadius:24,
              fontSize:19, fontWeight:700, cursor:"pointer", minHeight:44,
              fontFamily:FF.title, letterSpacing:"0.04em",
              boxShadow:`0 12px 36px ${cur.dot}66, 0 2px 0 rgba(255,255,255,0.4) inset`,
              position:"relative", zIndex:1 }}>
            {step === ONBOARD_STEPS.length - 1 ? "C’est parti ! 🌟" : "Suivant →"}
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Passer */}
      <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:1.8 }}
        onClick={skip}
        style={{ marginTop:24, background:"none", border:"none",
          fontSize:13, color:"rgba(255,255,255,0.6)", cursor:"pointer", minHeight:44,
          fontFamily:FF.body, fontWeight:600, zIndex:1,
          textDecoration:"underline", textDecorationStyle:"dotted",
          letterSpacing:"0.02em" }}>
        Passer l’introduction
      </motion.button>
    </motion.div>
  );
}



/* ══════════════════════════════════════════════════════════
   ESPACE PARENT — styles + composants
══════════════════════════════════════════════════════════ */
const PIN_INPUT_STYLE = {
  width:"100%", padding:"12px 16px", borderRadius:16, border:"1px solid #534AB7",
  background:T.ui.nightBg, color:T.ui.nightText, fontSize:15, outline:"none",
  fontFamily:FF.body, textAlign:"center", letterSpacing:4, boxSizing:"border-box",
};

function SettingsTab({ onClearNight }) {
  const [changingPin, setChangingPin] = useState(false);
  const [pin1, setPin1] = useState(""), [pin2, setPin2] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [apiKey, setApiKey]       = useState(() => {
    try { return localStorage.getItem("bibl_elevenlabs_key") || ""; } catch { return ""; }
  });
  const [openaiKey, setOpenaiKey] = useState(() => {
    try { return localStorage.getItem("bibl_openai_key") || ""; } catch { return ""; }
  });
  const [showKey, setShowKey]   = useState(false);
  const [keyMsg, setKeyMsg]     = useState("");
  const [voiceId, setVoiceId]   = useState(() => {
    try { return localStorage.getItem("bibl_elevenlabs_voice") || ELEVENLABS_VOICE_ID; } catch { return ELEVENLABS_VOICE_ID; }
  });

  const VOICES = [
    { id:"XB0fDUnXU5powFXDhCwa", name:"Charlotte", desc:"Chaleureuse et douce 🤍" },
    { id:"cgSgspJ2msm6clMCkdW9", name:"Jessica",   desc:"Naturelle et claire ✨" },
    { id:"pFZP5JQG7iQjIQuC4Bku", name:"Lily",      desc:"Douce et enfantine 💕" },
    { id:"EXAVITQu4vr4xnSDxMaL", name:"Bella",     desc:"Apaisante et sereine 🌙" },
  ];

  const saveApiKey = () => {
    try { localStorage.setItem("bibl_elevenlabs_key", apiKey.trim()); } catch {}
    try { localStorage.setItem("bibl_elevenlabs_voice", voiceId); } catch {}
    try { localStorage.setItem("bibl_openai_key", openaiKey.trim()); } catch {}
    setKeyMsg("✓ Sauvegardé — relancez l'app pour activer");
    setTimeout(() => setKeyMsg(""), 3000);
  };

  const activeVoice = ELEVENLABS_API_KEY?.trim() || apiKey.trim()
    ? "ElevenLabs" : OPENAI_API_KEY?.trim() || openaiKey.trim()
    ? "OpenAI" : "Navigateur";

  const savePin = () => {
    if (!/^\d{4,6}$/.test(pin1)) { setPinMsg("4 à 6 chiffres uniquement"); return; }
    if (pin1 !== pin2) { setPinMsg("Les codes ne correspondent pas"); return; }
    try { localStorage.setItem(PIN_KEY, pin1); } catch {}
    setPinMsg("✓ Code modifié");
    setPin1(""); setPin2("");
    setTimeout(() => { setPinMsg(""); setChangingPin(false); }, 1500);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* ── LANGUE ── */}
      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>🌍 Langue / Sprooch / Sprache</div>
        <div style={{ display:"flex", gap:8 }}>
          {Object.entries(LANGS).map(([code, l]) => {
            try { const active = (localStorage.getItem("bibl_lang")||"fr") === code; } catch {}
            return (
              <button key={code}
                onClick={() => { try { localStorage.setItem("bibl_lang", code); } catch {} window.location.reload(); }}
                style={{ flex:1, padding:"10px 8px", borderRadius:16, border:`2px solid ${active?T.violet.main:T.ui.border}`,
                  background: active ? T.violet.bg : T.neutral.cream,
                  color: active ? T.violet.text : T.neutral.brown,
                  cursor:"pointer", fontFamily:FF.body, fontSize:13, fontWeight: active ? 700 : 500,
                  minHeight:44 }}>
                {l.flag}<br/><span style={{ fontSize:11 }}>{l.name}</span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:8 }}>
          L'app redémarre pour appliquer la langue
        </div>
      </div>

      {/* ── THÈME COULEUR ── */}
      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>🎨 Couleur de l'app</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            { color:T.vert.main,   label:"Vert eau" },
            { color:T.violet.main, label:"Violet"   },
            { color:T.mer.main,    label:"Bleu mer"  },
            { color:T.rose.main,   label:"Rose"     },
            { color:T.or.main,     label:"Doré"     },
            { color:"#E06060",     label:"Corail"   },
          ].map(({ color, label }) => {
            const saved  = (() => { try { return localStorage.getItem("bibl_accent"); } catch { return null; } })();
            const active = (saved || T.vert.main) === color;
            return (
              <button key={color} title={label}
                onClick={() => { try { localStorage.setItem("bibl_accent", color); } catch {} window.location.reload(); }}
                style={{ width:44, height:44, borderRadius:"50%", border:"none",
                  background:color, cursor:"pointer", minHeight:44,
                  outline: active ? `3px solid ${color}` : "none",
                  outlineOffset: active ? 3 : 0,
                  boxShadow: active ? `0 0 0 2px #fff, 0 4px 12px ${color}88` : SH.sm,
                  transform: active ? "scale(1.15)" : "scale(1)",
                  transition:"all 0.2s" }}/>
            );
          })}
        </div>
        <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:8 }}>
          L'app redémarre pour appliquer la couleur
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:8 }}>🎙️ Voix du doudou</div>

        {/* Statut */}
        <div style={{
          fontSize:11, padding:"8px 12px", borderRadius:8, marginBottom:12,
          background: activeVoice==="ElevenLabs" ? T.vert.bg : activeVoice==="OpenAI" ? "#EEF4FF" : T.or.bg,
          color: activeVoice==="ElevenLabs" ? T.vert.text : activeVoice==="OpenAI" ? T.violet.text : T.or.text,
          fontWeight:600,
        }}>
          {activeVoice==="ElevenLabs" ? "✅ ElevenLabs actif — voix humaine naturelle"
          : activeVoice==="OpenAI"    ? "✅ OpenAI TTS actif — voix nova douce"
          : "⚠️ Voix navigateur (qualité limitée) — ajoutez une clé ci-dessous"}
        </div>

        {/* ElevenLabs */}
        <div style={{ marginBottom:16, padding:"12px", background:T.neutral.cream, borderRadius:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:T.violet.text, marginBottom:8 }}>
            🏆 ElevenLabs — Gratuit 10 000 chars/mois
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
            {VOICES.map(v => (
              <button key={v.id} onClick={() => setVoiceId(v.id)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"8px 10px", borderRadius:8,
                  background: voiceId===v.id ? "#E0D8FF" : "#fff",
                  border: voiceId===v.id ? "1.5px solid #7F77DD" : "1px solid #E2D9CF",
                  cursor:"pointer", minHeight:44, fontFamily:FF.body,
                }}>
                <span style={{ fontSize:11, fontWeight:600, color: voiceId===v.id ? T.violet.text : T.neutral.brown }}>
                  {v.name} — <span style={{ fontWeight:400 }}>{v.desc}</span>
                </span>
                {voiceId===v.id && <span style={{ color:T.violet.main }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input type={showKey?"text":"password"} value={apiKey}
              onChange={e=>setApiKey(e.target.value)} placeholder="sk_..."
              style={{ flex:1, padding:"8px 10px", borderRadius:8, border:"1px solid #D3C9BC",
                fontSize:11, outline:"none", fontFamily:FF.body }}/>
            <button onClick={()=>setShowKey(s=>!s)}
              style={{ padding:"0 10px", borderRadius:8, border:"1px solid #D3C9BC",
                background:"#fff", cursor:"pointer", minHeight:44, fontSize:13 }}>
              {showKey?"🙈":"👁️"}
            </button>
          </div>
          <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:4 }}>elevenlabs.io → My Account → API Keys</div>
        </div>

        {/* OpenAI */}
        <div style={{ marginBottom:12, padding:"12px", background:"#F0F4FF", borderRadius:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:T.violet.text, marginBottom:8 }}>
            🥈 OpenAI TTS — Voix "nova" très naturelle
          </div>
          <input type={showKey?"text":"password"} value={openaiKey}
            onChange={e=>setOpenaiKey(e.target.value)} placeholder="sk-..."
            style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #C8D0F0",
              fontSize:11, outline:"none", fontFamily:FF.body, boxSizing:"border-box" }}/>
          <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:4 }}>platform.openai.com → API Keys • ~0.015$/1000 chars</div>
        </div>

        {keyMsg && <div style={{ fontSize:11, color:T.vert.main, marginBottom:8, fontWeight:600 }}>{keyMsg}</div>}
        <button onClick={saveApiKey}
          style={{ width:"100%", padding:"11px", borderRadius:16, border:"none",
            background: (apiKey.trim()||openaiKey.trim()) ? T.violet.main : T.ui.input,
            color:"#fff", fontSize:13, fontWeight:600,
            cursor: (apiKey.trim()||openaiKey.trim()) ? "pointer" : "default",
            fontFamily:FF.body }}>
          Sauvegarder
        </button>
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>🔑 Code PIN</div>
        {!changingPin ? (
          <button onClick={() => setChangingPin(true)}
            style={{ width:"100%", padding:"11px", borderRadius:16, fontSize:13,
              background:T.neutral.cream, border:"1px solid #E2D9CF", color:T.neutral.brown,
              cursor:"pointer", minHeight:44, fontFamily:FF.body, textAlign:"left" }}>
            Modifier le code secret
          </button>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input type="password" inputMode="numeric" maxLength={6} placeholder="Nouveau code (4-6 chiffres)"
              value={pin1} onChange={e => setPin1(e.target.value.replace(/\D/g,""))} style={{ ...PIN_INPUT_STYLE, background:"#fff", color:T.neutral.brown, border:"1px solid #D3C9BC" }} />
            <input type="password" inputMode="numeric" maxLength={6} placeholder="Confirmer"
              value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g,""))} style={{ ...PIN_INPUT_STYLE, background:"#fff", color:T.neutral.brown, border:"1px solid #D3C9BC" }} />
            {pinMsg && <div style={{ fontSize:13, color: pinMsg.startsWith("✓") ? T.vert.main : T.ui.errorBorder }}>{pinMsg}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setChangingPin(false); setPin1(""); setPin2(""); setPinMsg(""); }}
                style={{ flex:1, padding:"9px", borderRadius:8, border:"1px solid #D3C9BC",
                  background:"transparent", fontSize:13, cursor:"pointer", minHeight:44, fontFamily:FF.body, color:T.neutral.brownMid }}>
                Annuler
              </button>
              <button onClick={savePin}
                style={{ flex:2, padding:"9px", borderRadius:8, border:"none",
                  background:T.neutral.brown, color:"#fff", fontSize:13, fontWeight:600,
                  cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Âge / taille police */}
      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>👧 Profil d'âge</div>
        <div style={{ fontSize:11, color:T.neutral.brownMid, marginBottom:8 }}>
          Adapte la taille des textes selon l'âge de l'enfant
        </div>
        {[["young","🌱 4-7 ans","Textes plus grands, langage simple"],
          ["older","🌿 8-12 ans","Textes standard, plus de détails"]].map(([mode,label,desc]) => {
          const p = loadProfile();
          const active = (p.ageMode||"young") === mode;
          return (
            <button key={mode}
              onClick={() => { const np = {...p, ageMode:mode}; saveProfile(np); window.location.reload(); }}
              style={{ width:"100%", padding:"10px 12px", borderRadius:16, marginBottom:8,
                background: active ? T.violet.bg : T.neutral.cream,
                border: active ? "1.5px solid #7F77DD" : "1px solid #E2D9CF",
                cursor:"pointer", minHeight:44, fontFamily:FF.body,
                display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:600, color: active ? T.violet.text : T.neutral.brown }}>{label}</div>
                <div style={{ fontSize:11, color:T.neutral.brownMid }}>{desc}</div>
              </div>
              {active && <span style={{ color:T.violet.main }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Export */}
      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>📄 Export</div>
        <button onClick={() => {
          const profile = loadProfile();
          try { const raw = JSON.parse(localStorage.getItem("bibl_pensees_v1")||"{}"); } catch {}
          const hist = loadHistory();
          const emojiMap = {boubou:"🩹",cloud:"🌀",trash:"🌊",lettre:"✉️",bonheur:"⭐"};
          const lines = [
            `Bibliothèque des pensées — ${profile.name || "Mon enfant"} ${profile.avatar||""}`,
            `Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
            "",
            "══════ CE SOIR ══════",
            ...Object.entries(raw).flatMap(([shelf, items]) => {
              if (!items?.length) return [];
              return [
                `\n${emojiMap[shelf]||"📝"} ${shelf.toUpperCase()}`,
                ...items.map(it => `  • ${typeof it==="string"?it:it.text||"[dessin]"}`),
              ];
            }),
            "",
            "══════ HISTORIQUE (7 nuits) ══════",
            ...hist.slice(0,7).flatMap(n => [
              `\n📅 ${n.date}`,
              ...Object.entries(n.thoughts||{}).flatMap(([shelf, items]) =>
                (items||[]).map(it => `  [${emojiMap[shelf]||shelf}] ${typeof it==="string"?it:it.text||"[dessin]"}`)
              ),
            ]),
          ];
          const blob = new Blob([lines.join("\n")], { type:"text/plain;charset=utf-8" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url;
          a.download = `pensees-${profile.name||"enfant"}-${new Date().toISOString().slice(0,10)}.txt`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        }}
          style={{ width:"100%", padding:"11px", borderRadius:16, fontSize:13,
            background:T.violet.bg, border:"1px solid #C8BFEE", color:T.violet.text,
            cursor:"pointer", minHeight:44, fontFamily:FF.body, textAlign:"left" }}>
          📥 Télécharger les pensées (.txt)
        </button>

        {/* Export PDF */}
        <button onClick={() => {
          const name = profile?.name || "mon enfant";
          const date = new Date().toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
          const emojiMap = { boubou:"🩹", cloud:"🌀", trash:"🌊", lettre:"✉️", bonheur:"⭐" };

          // Générer HTML pour impression
          const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Pensées de ${name}</title>
<style>
  body { font-family: Georgia, serif; max-width: 600px; margin: 40px auto; color: #2A1810; line-height: 1.8; }
  h1 { color: #1D9E75; font-size: 24px; border-bottom: 2px solid #A8E8D8; padding-bottom: 8px; }
  h2 { color: #7F77DD; font-size: 16px; margin-top: 24px; }
  .entry { background: #F9F9F9; border-left: 3px solid #A8E8D8; padding: 8px 12px; margin: 6px 0; border-radius: 4px; }
  .date { font-size: 12px; color: #9B7A55; }
  footer { margin-top: 40px; font-size: 11px; color: #9B7A55; text-align: center; }
</style>
</head>
<body>
<h1>📚 Bibliothèque des Pensées — ${name}</h1>
<p class="date">Exporté le ${date}</p>
${SHELVES.map(s => {
  const items = thoughts[s.id] || [];
  if (!items.length) return "";
  return `<h2>${s.emoji} ${s.label}</h2>
${items.map(it => `<div class="entry">${typeof it==="string"?it:it.text||"[dessin]"}</div>`).join("")}`;
}).join("")}
<footer>Bibliothèque des Pensées — Amotessa SARL-S — contact@amotessa.lu</footer>
</body></html>`;

          const win = window.open("", "_blank");
          if (win) {
            win.document.write(html);
            win.document.close();
            win.print();
          }
        }}
          style={{ width:"100%", padding:"11px", borderRadius:16, fontSize:13,
            background:T.vert.bg, border:"1px solid #9FE1CB", color:T.vert.text,
            cursor:"pointer", minHeight:44, fontFamily:FF.body, textAlign:"left",
            marginTop:8 }}>
          🖨️ Imprimer / Exporter en PDF
        </button>
        <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:8, lineHeight:1.6 }}>
          Fichier texte à partager avec un professionnel de santé
        </div>
      </div>
      <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>🗑️ Données</div>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)}
            style={{ width:"100%", padding:"11px", borderRadius:16, fontSize:13,
              background:T.ui.error, border:"1px solid #F0997B", color:T.ui.errorText,
              cursor:"pointer", minHeight:44, fontFamily:FF.body, textAlign:"left" }}>
            Effacer toutes les pensées
          </button>
        ) : (
          <div>
            <div style={{ fontSize:13, color:T.ui.errorText, marginBottom:8, lineHeight:1.6 }}>
              Es-tu sûr·e ? Cette action est irréversible.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setConfirmClear(false)}
                style={{ flex:1, padding:"9px", borderRadius:8, border:"1px solid #D3C9BC",
                  background:"transparent", fontSize:13, cursor:"pointer", minHeight:44, fontFamily:FF.body, color:T.neutral.brownMid }}>
                Annuler
              </button>
              <button onClick={onClearNight}
                style={{ flex:2, padding:"9px", borderRadius:8, border:"none",
                  background:T.ui.errorBorder, color:"#fff", fontSize:13, fontWeight:600,
                  cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
                Oui, effacer
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ background:T.mer.bg, borderRadius:16, padding:"14px 16px", border:"1px solid #B5D4F4" }}>
        <div style={{ fontSize:11, color:T.mer.text, lineHeight:1.6 }}>
          <strong>Confidentialité</strong><br/>
          Données stockées uniquement sur cet appareil. Aucun envoi sur internet.
        </div>
      </div>
    </div>
  );
}

function ParentSpace({ thoughts, onClose, onClearNight }) {
  const [phase, setPhase]       = useState("pin");
  const [input, setInput]       = useState("");
  const [error, setError]       = useState(false);
  try { const [pinSet]                = useState(!!localStorage.getItem(PIN_KEY)); } catch {}
  const [newPin, setNewPin]     = useState(""), [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [tab, setTab]           = useState("resume");
  const [replyIdx, setReplyIdx] = useState(null); // index de l'entrée à répondre
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bibl_replies_v1")||"{}"); } catch { return {}; }
  });
  const replyKey = (entry, i) => entry?.id || `${i}`;

  /* ── PIN SHA-256 ── */
  const checkPin = async (next) => {
    const stored = localStorage.getItem(PIN_KEY);
    if (!stored) return;
    // Supporte ancien format (texte clair) et nouveau (hash)
    let ok = false;
    if (stored.length === 64) {
      ok = await verifyPin(next, stored);
    } else {
      ok = next === stored;
      // Migration : on re-hash
      if (ok) { const h = await hashPin(next); try { localStorage.setItem(PIN_KEY, h); } catch {} }
    }
    if (ok) { setPhase("dashboard"); setError(false); }
    else    { setError(true); setInput(""); setTimeout(() => setError(false), 1200); }
  };

  const createPin = async () => {
    if (!/^\d{4,6}$/.test(newPin)) { setPinError("4 à 6 chiffres"); return; }
    if (newPin !== confirmPin) { setPinError("Les codes ne correspondent pas"); return; }
    const h = await hashPin(newPin);
    try { localStorage.setItem(PIN_KEY, h); } catch {}
    setPhase("dashboard");
  };

  /* ── Réponse parent ── */
  const saveReply = (key) => {
    if (!replyText.trim()) return;
    const updated = { ...replies, [key]: { text: replyText.trim(), date: new Date().toISOString() } };
    setReplies(updated);
    try { localStorage.setItem("bibl_replies_v1", JSON.stringify(updated)); } catch {}
    setReplyIdx(null); setReplyText("");
  };

  const allEntries = Object.entries(thoughts)
    .flatMap(([shelf, items]) => items.map(item => ({ shelf, ...item })))
    .sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
  const countByShelf = SHELVES.map(s => ({ ...s, count: thoughts[s.id]?.length||0 }));
  const total = Object.values(thoughts).flat().length;

  if (phase === "pin") return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      role="dialog" aria-modal="true" aria-label="Accord parental" style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(15,12,42,0.93)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:24, fontFamily:FF.body }}>
      <motion.div initial={{ y:30, opacity:0 }} animate={{ y:0, opacity:1 }}
        style={{ background:"#1A1535", borderRadius:24, padding:"32px 28px",
          maxWidth:320, width:"100%", textAlign:"center", border:"1px solid #534AB7" }}>
        <div style={{ marginBottom:8 }}><Doudou size={44} pose="sit" /></div>
        <h2 style={{ fontSize:19, fontWeight:700, color:T.ui.nightText, marginBottom:8 }}>Espace parent</h2>
        <p style={{ fontSize:13, color:T.violet.glow, marginBottom:24, lineHeight:1.6 }}>
          {pinSet ? "Entrez votre code" : "Créez un code secret"}
        </p>
        {!pinSet ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input type="password" inputMode="numeric" maxLength={6} placeholder="Code (4-6 chiffres)"
              value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,""))} style={PIN_INPUT_STYLE} />
            <input type="password" inputMode="numeric" maxLength={6} placeholder="Confirmer"
              value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g,""))}
              onKeyDown={e => e.key==="Enter" && createPin()} style={PIN_INPUT_STYLE} />
            {pinError && <div style={{ fontSize:13, color:T.sys.error }}>{pinError}</div>}
            <button onClick={createPin}
              style={{ width:"100%", padding:"13px 0", borderRadius:16, border:"none",
                background:T.violet.night, color:"#fff", fontSize:15, fontWeight:600,
                cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
              Créer mon code 🔒
            </button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:16 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:14, height:14, borderRadius:"50%", transition:"background 0.15s",
                  background: input.length>i ? T.violet.glow : "#534AB766", border:"1.5px solid #534AB7" }} />
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:8 }}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i) => (
                <button key={i}
                  onClick={() => {
                    if (k === "⌫") { setInput(p => p.slice(0,-1)); return; }
                    if (k === "") return;
                    const next = input + k;
                    if (next.length <= 4) { setInput(next); if (next.length === 4) setTimeout(() => checkPin(next), 150); }
                  }}
                  style={{ padding:"13px 0", borderRadius:16, fontSize:19, fontWeight:700,
                    background: k==="" ? "transparent" : error ? "#4A1A1A" : T.ui.nightBg,
                    border: k==="" ? "none" : `1px solid ${error?T.ui.errorBorder:T.violet.night}`,
                    color: error ? T.sys.error : T.ui.nightText, cursor: k==="" ? "default" : "pointer",
                    fontFamily:FF.body }}>
                  {k}
                </button>
              ))}
            </div>
            {error && <div style={{ fontSize:13, color:T.sys.error, marginBottom:8 }}>Code incorrect</div>}
          </>
        )}
        <button onClick={onClose}
          style={{ marginTop:16, background:"none", border:"none", fontSize:13,
            color:T.violet.night, cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
          Annuler
        </button>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      role="dialog" aria-modal="true" aria-label="Accord parental" style={{ position:"fixed", inset:0, zIndex:200,
        background:`linear-gradient(160deg,${T.neutral.beige},${T.neutral.sand},${T.neutral.tan})`,
        overflowY:"auto", fontFamily:FF.body }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 12px" }}>
        <div>
          <h1 style={{ fontSize:19, fontWeight:700, color:T.neutral.brown, margin:0 }}>🐻 Espace parent</h1>
          <p style={{ fontSize:13, color:T.neutral.brownMid, margin:0 }}>{total} pensée{total>1?"s":""} ce soir</p>
        </div>
        <button onClick={onClose}
          style={{ background:T.neutral.cream, border:"none", borderRadius:"50%",
            width:36, height:36, cursor:"pointer", minHeight:44, fontSize:19,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          ×
        </button>
      </div>
      <div style={{ display:"flex", gap:8, padding:"0 20px 16px" }}>
        {[["resume","📊 Résumé"],["history","📋 Historique"],["stats","📈 7 jours"],["help","❓ Aide", "changelog","📋 Nouveautés"],["settings","⚙️ Réglages"]].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex:1, padding:"8px 0", borderRadius:16, fontSize:13, fontWeight:600,
              background: tab===id ? T.neutral.brown : T.neutral.cream,
              color: tab===id ? T.neutral.cream : T.neutral.brownMid,
              border:"none", cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
            {lbl}
          </button>
        ))}
      </div>
      <div style={{ padding:"0 20px 40px" }}>
        {tab === "resume" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:12 }}>
                Ce soir — {total} pensée{total>1?"s":""}
              </div>
              {countByShelf.map(s => (
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:15, width:22 }}>{s.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.neutral.brown }}>{s.label}</div>
                    <div style={{ height:6, borderRadius:3, marginTop:4, background:T.neutral.cream, overflow:"hidden" }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(s.count/5*100,100)}%` }}
                        transition={{ duration:0.6 }} style={{ height:"100%", borderRadius:3, background:s.dot }} />
                    </div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:s.dot, width:16, textAlign:"right" }}>{s.count}</span>
                </div>
              ))}
            </div>
            {thoughts.bonheur.length > 0 && (
              <div style={{ background:T.or.bg, borderRadius:16, padding:"16px", border:"1px solid #FAC775" }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.or.text, marginBottom:8 }}>⭐ Pensées bonheur ce soir</div>
                {thoughts.bonheur.map((item,i) => (
                  <div key={i} style={{ fontSize:13, color:T.or.text, padding:"11px 0", lineHeight:1.6,
                    borderBottom: i<thoughts.bonheur.length-1 ? "1px solid #FAC77544" : "none" }}>
                    ✦ {typeof item==="string" ? item : item.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "history" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {allEntries.length === 0
              ? <div style={{ textAlign:"center", fontSize:13, color:T.neutral.brownMid, padding:"40px 0" }}>Aucune pensée pour l'instant</div>
              : allEntries.map((entry,i) => {
                  const s = SHELVES.find(sh => sh.id===entry.shelf);
                  return (
                    <div key={i} style={{ background:"#fff", borderRadius:16, padding:"12px 14px",
                      border:`1px solid ${s?.border||T.ui.border}`, display:"flex", alignItems:"flex-start", gap:8 }}>
                      <div style={{ width:32, height:32, borderRadius:8, flexShrink:0,
                        background:s?.bg||T.neutral.cream, border:`1px solid ${s?.border||T.ui.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                        {s?.emoji||"📝"}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        {entry.drawing
                          ? <img src={entry.drawing} alt="dessin" style={{ width:60, height:45, borderRadius:8, objectFit:"cover" }} />
                          : <div style={{ fontSize:13, color:T.neutral.brown, lineHeight:1.6 }}>{entry.text}</div>
                        }
                        <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:4 }}>
                          {s?.label} · {fmtDate(entry.date)}
                        </div>
                        {/* Réponse parent existante */}
                        {replies[entry.id || `${entry.shelf}-${i}`] && (
                          <div style={{
                            marginTop:8, background:T.or.bg,
                            borderRadius:8, padding:"11px 10px",
                            borderLeft:`3px solid #FAC775`,
                            fontSize:13, color:T.or.text, lineHeight:1.6,
                          }}>
                            💛 <em>{replies[entry.id || `${entry.shelf}-${i}`]?.text}</em>
                            <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:4 }}>
                              {fmtDate(replies[entry.id || `${entry.shelf}-${i}`]?.date)}
                            </div>
                          </div>
                        )}
                        {/* Formulaire réponse */}
                        {replyIdx === (entry.id || `${entry.shelf}-${i}`) ? (
                          <div style={{ marginTop:8 }}>
                            <input autoFocus value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => e.key==="Enter" && saveReply(entry.id || `${entry.shelf}-${i}`)}
                              placeholder="Ton petit mot pour ce soir…"
                              maxLength={120}
                              style={{ width:"100%", padding:"11px 10px", borderRadius:8,
                                border:"1.5px solid #FAC775", fontSize:13,
                                fontFamily:FF.body, outline:"none",
                                boxSizing:"border-box", marginBottom:4 }}
                            />
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={() => { setReplyIdx(null); setReplyText(""); }}
                                style={{ flex:1, padding:"11px", borderRadius:8, fontSize:11,
                                  border:"1px solid #D3C9BC", background:"transparent",
                                  cursor:"pointer", minHeight:44, fontFamily:FF.body, color:T.neutral.brownMid }}>
                                Annuler
                              </button>
                              <button onClick={() => saveReply(entry.id || `${entry.shelf}-${i}`)}
                                style={{ flex:2, padding:"11px", borderRadius:8, fontSize:11,
                                  border:"none", background:T.or.main, color:"#fff",
                                  fontWeight:700, cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
                                Envoyer 💛
                              </button>
                            </div>
                          </div>
                        ) : (
                          !entry.drawing && (
                            <button onClick={() => { setReplyIdx(entry.id || `${entry.shelf}-${i}`); setReplyText(""); }}
                              style={{ marginTop:4, background:"none", border:"none",
                                fontSize:11, color:T.or.main, cursor:"pointer", minHeight:44,
                                fontFamily:FF.body, padding:0,
                                textDecoration:"underline" }}>
                              {replies[entry.id || `${entry.shelf}-${i}`] ? "✏️ Modifier mon mot" : "💛 Laisser un mot"}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
        {tab === "help" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { emoji:"🐻", q:"Comment utiliser l'app ?",
                a:"Chaque soir, l'enfant ouvre la bibliothèque et clique sur une étagère. Il peut écrire, parler ou dessiner sa pensée. Terminez toujours par l'étagère ⭐ Bonheur pour finir sur quelque chose de positif." },
              { emoji:"🩹", q:"Quelle étagère pour quoi ?",
                a:"🩹 Douceurs : ce dont le cœur a besoin. 🌀 Pensées : idées qui tourbillonnent. 🌊 Vagues : pensées à laisser partir. ✉️ Lettre : un mot à partager. ⭐ Bonheur : toujours finir par quelque chose de beau." },
              { emoji:"💛", q:"Comment répondre à mon enfant ?",
                a:"Dans Historique, cliquez sur '💛 Laisser un mot' sous une pensée. Votre message apparaîtra encadré en doré sur le post-it de votre enfant dès sa prochaine ouverture." },
              { emoji:"🔒", q:"Les données sont-elles sécurisées ?",
                a:"Toutes les données restent sur l'appareil. Rien n'est envoyé sur internet. Le PIN est chiffré. En mode privé/navigation privée, les pensées ne sont pas sauvegardées." },
              { emoji:"🧑‍⚕️", q:"Quand consulter un professionnel ?",
                a:"Cette app est un outil de bien-être, pas thérapeutique. Si votre enfant exprime régulièrement une grande détresse, consultez un pédopsychologue ou votre médecin traitant." },
              { emoji:"📥", q:"Comment partager avec un professionnel ?",
                a:"Dans Réglages → Export, téléchargez un fichier .txt avec toutes les pensées. Vous pouvez le partager avec un orthophoniste, psychologue ou médecin de famille." },
            ].map((item, i) => (
              <div key={i} style={{ background:"#fff", borderRadius:16, padding:"14px 16px",
                border:"1px solid #E2D9CF" }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:8 }}>
                  {item.emoji} {item.q}
                </div>
                <div style={{ fontSize:13, color:T.ui.textMid, lineHeight:1.6 }}>{item.a}</div>
              </div>
            ))}
            <div style={{ background:T.mer.bg, borderRadius:16, padding:"14px 16px",
              border:"1px solid #B5D4F4", fontSize:11, color:T.mer.text, lineHeight:1.6 }}>
              <strong>Ressources :</strong><br/>
              Association Française de Pédopsychiatrie<br/>
              3114 — Numéro national de prévention du suicide<br/>
              Enfance & Partage : 0 800 05 1234
            </div>
          </div>
        )}
        {tab === "stats" && (() => {
          const hist = loadHistory();
          const last7 = hist.slice(0, 7).reverse();
          const shelfColors = { boubou:T.rose.main, cloud:T.sys.info, trash:T.vert.main, lettre:T.violet.main, bonheur:T.or.main };
          const maxVal = Math.max(...last7.map(n => Object.values(n.thoughts||{}).flat().length), 1);
          return (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:"#fff", borderRadius:16, padding:"16px", border:"1px solid #E2D9CF" }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.neutral.brown, marginBottom:16 }}>
                  📈 Pensées par nuit — 7 derniers jours
                </div>
                {last7.length === 0 ? (
                  <div style={{ fontSize:13, color:T.neutral.brownLight, textAlign:"center", padding:"20px 0" }}>
                    Pas encore d'historique. Revenez demain !
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
                    {last7.map((night, i) => {
                      const total = Object.values(night.thoughts||{}).flat().length;
                      const barH  = Math.max(8, Math.round((total/maxVal)*100));
                      const date  = new Date(night.date+"T12:00:00");
                      const label = date.toLocaleDateString("fr-FR",{weekday:"short"});
                      return (
                        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.ui.wood }}>{total||""}</div>
                          <div style={{ width:"100%", display:"flex", flexDirection:"column-reverse",
                            gap:1, height:90, justifyContent:"flex-start" }}>
                            {SHELVES.map(s => {
                              const cnt = (night.thoughts?.[s.id]||[]).length;
                              if (!cnt) return null;
                              const h = Math.round((cnt/maxVal)*90);
                              return (
                                <div key={s.id} style={{
                                  height:h, background:shelfColors[s.id],
                                  borderRadius:4, opacity:0.85,
                                  minHeight:cnt>0?6:0,
                                }}/>
                              );
                            })}
                          </div>
                          <div style={{ fontSize:11, color:T.neutral.brownMid, textTransform:"capitalize" }}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Légende */}
              <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", border:"1px solid #E2D9CF" }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.neutral.brown, marginBottom:8 }}>Légende</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {SHELVES.map(s => (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:shelfColors[s.id] }}/>
                      <span style={{ fontSize:11, color:T.ui.wood }}>{s.emoji} {s.label.split(" ").slice(0,2).join(" ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        {tab === "settings" && (
          <SettingsTab onClearNight={() => { onClearNight(); onClose(); }} />
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   POSTIT VOLANT — animation arc de cercle vers l'étagère
══════════════════════════════════════════════════════════ */
const SHELF_ICONS = {
  boubou: "🩹", cloud: "🌀", trash: "🌊", lettre: "✉️", bonheur: "⭐",
};

function FlyingPostit({ text, shelfId, color, fromRect, toRect, onDone }) {
  const icon = SHELF_ICONS[shelfId] || "📝";

  /* Calcul de l'arc : point de contrôle de Bézier */
  const fx = fromRect.left + fromRect.width  / 2;
  const fy = fromRect.top  + fromRect.height / 2;
  const tx = toRect.left   + toRect.width    / 2;
  const ty = toRect.top    + toRect.height   / 2;
  /* Contrôle en hauteur : monter au-dessus du milieu */
  const cx = (fx + tx) / 2;
  const cy = Math.min(fy, ty) - Math.abs(tx - fx) * 0.5 - 60;

  /* On génère des keyframes de position en interpolant la Bézier */
  const steps = 18;
  const xs = [], ys = [], rotations = [];
  for (let t = 0; t <= 1; t += 1/steps) {
    const mt = 1 - t;
    xs.push(mt*mt*fx + 2*mt*t*cx + t*t*tx - 24);
    ys.push(mt*mt*fy + 2*mt*t*cy + t*t*ty - 20);
    rotations.push(Math.sin(t * Math.PI) * (shelfId === "trash" ? -540 : shelfId === "lettre" ? 360 : 180));
  }
  xs.push(tx - 24); ys.push(ty - 20); rotations.push(0);

  return (
    <motion.div
      initial={{ x: fx - 24, y: fy - 20, scale:1, opacity:1 }}
      animate={{
        x: xs, y: ys,
        rotate: rotations,
        scale: [1, 1.2, 1.3, 1.1, 0.8, 0.4],
        opacity: [1, 1, 1, 1, 0.7, 0],
      }}
      transition={{ duration: 0.75, ease: "easeInOut" }}
      onAnimationComplete={onDone}
      style={{
        position:"fixed", top:0, left:0, zIndex:1000,
        pointerEvents:"none",
        width:48, height:48,
        display:"flex", alignItems:"center", justifyContent:"center",
        borderRadius:8,
        background: shelfId==="lettre"  ? "#E8D8FF" :
                    shelfId==="bonheur" ? T.or.soft :
                    shelfId==="boubou"  ? T.rose.soft :
                    shelfId==="cloud"   ? T.ui.bluePale : T.vert.soft,
        border:`2px solid ${color.border}`,
        boxShadow:`0 4px 16px ${color.dot}55`,
        fontSize:24,
        filter:`drop-shadow(0 4px 12px ${color.dot}88)`,
      }}>
      {icon}
    </motion.div>
  );
}





/* ── Page offline/erreur ── */


function LegalScreen({ type, onClose }) {
  const content = LEGAL_CONTENT[type];
  const scrollRef = useRef(null);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{
        position:"fixed", inset:0, zIndex:300,
        background:T.sys.overlay,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        fontFamily:FF.body,
        backdropFilter:"blur(4px)",
      }}>
      <motion.div
        initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
        transition={{ type:"spring", stiffness:300, damping:32 }}
        style={{
          background:T.ui.bg,
          borderRadius:"24px 24px 0 0",
          width:"100%", maxWidth:640,
          maxHeight:"88vh",
          display:"flex", flexDirection:"column",
          boxShadow:SH.md,
        }}>

        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 24px 14px",
          borderBottom:"1px solid #EDE4D8",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:24, marginBottom:4 }}>{content.emoji}</div>
            <h2 style={{ fontSize:19, fontWeight:700, color:T.neutral.brown, margin:0 }}>{content.title}</h2>
            <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:4 }}>{content.lastUpdate}</div>
          </div>
          <button onClick={onClose} style={{
            background:T.neutral.cream, border:"none", borderRadius:"50%",
            width:38, height:38, cursor:"pointer", minHeight:44, fontSize:19,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:T.neutral.brownMid, flexShrink:0,
          }} aria-label="Fermer">×</button>
        </div>

        {/* Notice box */}
        {type === "privacy" && (
          <div style={{
            margin:"14px 20px 0",
            background:T.vert.bg, borderRadius:16, padding:"12px 16px",
            border:"1px solid #9FE1CB", flexShrink:0,
          }}>
            <div style={{ fontSize:13, color:T.vert.text, fontWeight:600, marginBottom:4 }}>
              ✅ Résumé en une phrase
            </div>
            <div style={{ fontSize:13, color:T.vert.text, lineHeight:1.6 }}>
              Cette application ne collecte, ne stocke et ne transmet <strong>aucune donnée personnelle</strong>. Tout reste sur votre appareil.
            </div>
          </div>
        )}
        {type === "cgu" && (
          <div style={{
            margin:"14px 20px 0",
            background:T.violet.bg, borderRadius:16, padding:"12px 16px",
            border:"1px solid #C8BFEE", flexShrink:0,
          }}>
            <div style={{ fontSize:13, color:T.violet.text, fontWeight:600, marginBottom:4 }}>
              ⚠️ Point important
            </div>
            <div style={{ fontSize:13, color:T.violet.text, lineHeight:1.6 }}>
              Cette application est un <strong>outil de bien-être</strong>, pas un dispositif médical. En cas de difficultés importantes, consultez un professionnel de santé.
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div ref={scrollRef} style={{
          overflowY:"auto", padding:"16px 20px 40px",
          flex:1,
        }}>
          {content.sections.map((sec, i) => (
            <div key={i} style={{ marginBottom:20 }}>
              <div style={{
                fontSize:13, fontWeight:600, color:T.ui.wood,
                marginBottom:8, display:"flex", alignItems:"center", gap:8,
              }}>
                <span style={{
                  background:T.neutral.cream, borderRadius:8,
                  padding:"11px 8px", fontSize:11, color:T.neutral.brownMid,
                  fontWeight:700, flexShrink:0,
                }}>
                  {i+1}
                </span>
                {sec.title.replace(/^\d+\.\s*/, "")}
              </div>
              <div style={{
                fontSize:13.5, color:T.ui.textMid, lineHeight:1.6,
                background:T.ui.bg, borderRadius:8, padding:"10px 14px",
                border:"1px solid #EDE4D8",
              }}>
                {sec.content}
              </div>
            </div>
          ))}

          {/* Legal footer */}
          <div style={{
            background:T.neutral.cream, borderRadius:16, padding:"14px 16px",
            border:"1px solid #E2D4C4", marginTop:8,
          }}>
            <div style={{ fontSize:11, color:T.neutral.brownMid, lineHeight:1.6 }}>
              <strong>Version :</strong> 1.0 — Juin 2025<br/>
              <strong>Éditeur :</strong> Amotessa SARL-S<br/>
              <strong>Contact :</strong> <a href="mailto:contact@amotessa.lu" style={{color:"inherit",textDecoration:"none"}}>contact@amotessa.lu</a><br/>
              <strong>Hébergement :</strong> Application mobile locale — aucun serveur externe
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function BibliothequeDesPensees() {
  const [isOpen, setIsOpen]           = useState(false);
  const [isClosing, setIsClosing]     = useState(false);
  const [activeShelf, setActiveShelf] = useState(null);
  const [thoughts, setThoughts]       = useState(loadThoughts);
  const [sleepMode, setSleepMode]     = useState(false);
  const [toast, setToast]             = useState("");
  const [celebrate, setCelebrate]     = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showConsent, setShowConsent]         = useState(() => {
    try { return !localStorage.getItem(CONSENT_KEY); } catch { return true; }
  });
  const [showOnboard, setShowOnboard]         = useState(false);
  const [showWelcome, setShowWelcome]         = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showCompanion, setShowCompanion]     = useState(false);
  const [showParent, setShowParent]           = useState(false);
  const [showPrivacy, setShowPrivacy]         = useState(false);
  const [showCGU, setShowCGU]                 = useState(false);
  const [profile, setProfile]                 = useState(loadProfile);
  const [showProfileSetup, setShowProfileSetup] = useState(() => !loadProfile().name);
  const toastTimer   = useRef(null);
  const celebTimer   = useRef(null);
  const bookcaseRef  = useRef(null);
  const { creak, slam, paperRustle, windBlow, wave, letterSound, joyBell, lullaby } = useSound();
  const { speak, stop, isLoading: voiceLoading } = useSpeech();
  const [manualNight, setManualNight] = useState(() => {
    try { return localStorage.getItem("bibl_manual_night") === "1"; } catch { return false; }
  });
  const autoNight = useNightMode();
  const isNight   = manualNight || autoNight;
  const toggleNight = () => {
    const next = !manualNight;
    setManualNight(next);
    try { localStorage.setItem("bibl_manual_night", next?"1":"0"); } catch {}
  };
  const isReduced  = useReducedMotion();
  const { lang, setLang, t } = useLang();
  const isOnline = useOnline();

  // Thème couleur personnalisable
  const [accentColor, setAccentColor] = useState(() => {
    try { return localStorage.getItem("bibl_accent") || T.vert.main; } catch { return T.vert.main; }
  });
  const setTheme = (color) => {
    setAccentColor(color);
    try { localStorage.setItem("bibl_accent", color); } catch {}
  };


  /* ── Détection offline ── */
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  // Notifications du soir
  useEffect(() => {
    if (profile?.name && !showProfileSetup && !showWelcome) {
      requestNotifPermission().then(granted => {
        if (granted) scheduleEveningNotif(profile.name);
      });
    }
  }, [profile?.name, showProfileSetup]);

  // Sauvegarde auto sur fermeture de page
  useEffect(() => {
    const handler = () => {
      try { localStorage.setItem("bibl_thoughts_v1", JSON.stringify(thoughts)); } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [thoughts]);

  const total        = useMemo(() => Object.values(thoughts).flat().length, [thoughts]);
  const filledShelves = useMemo(() => Object.values(thoughts).filter(a => a.length > 0).length, [thoughts]);

  useEffect(() => { saveThoughts(thoughts); }, [thoughts]);

  /* ── Enregistrement Service Worker PWA ── */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => console.log("SW enregistré:", reg.scope))
        .catch(err => console.warn("SW erreur:", err));
    }
  }, []);

  useEffect(() => {
    if (filledShelves === 5 && isOpen) {
      clearTimeout(celebTimer.current);
      celebTimer.current = setTimeout(() => {
        setCelebrate(true);
        // Voix de célébration enrichie
        speak("Félicitations ! Tu as rempli toutes tes étagères ce soir ! C'est magnifique. Ton doudou est très fier de toi.", { rate:0.80, pitch:0.92 });
        // Vibration de célébration
        try { navigator.vibrate?.([100,50,100,50,200,50,200]); } catch {}
        setTimeout(() => setCelebrate(false), 5000);
      }, 300);
    }
  }, [filledShelves, isOpen]);

  const showSaveIndicator = () => {
    // Petit flash vert en haut — sauvegarde confirmée
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:8px;left:50%;transform:translateX(-50%);
      background:#1D9E75;color:#fff;padding:6px 16px;border-radius:20px;
      font-family:Nunito,sans-serif;font-size:12px;font-weight:700;
      z-index:9999;opacity:1;transition:opacity 0.5s;pointer-events:none;`;
    el.textContent = '✓ Sauvegardé';
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),500); }, 1200);
  };

  const announce = (msg) => {
    const el = document.getElementById('bibl-announcer');
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
  };

  const showToast = (msg) => {
    announce(msg);
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  };

  const handleOpen = () => {
    creak(); setIsOpen(true);
    showToast(`La bibliothèque est ouverte ✨`);
  };
  const handleClose = () => {
    setIsClosing(true);
    setActiveShelf(null);
    setTimeout(() => {
      slam(); stop();
      setIsOpen(false);
      setIsClosing(false);
      showToast("Bibliothèque fermée 📚");
    }, 150);
  };
  const handleShelfClick = useCallback((id) => {
    const wasActive = activeShelf === id;
    setActiveShelf(prev => prev === id ? null : id);
    if (id === "trash")        wave();
    else if (id === "bonheur") joyBell();
    else if (id === "boubou")  paperRustle();
    else if (id === "cloud")   windBlow();
    else if (id === "lettre")  letterSound();
    if (!wasActive) {
      const labels = {
        boubou: "Tes douceurs à soigner. Tu peux poser ici ce dont ton cœur a besoin ce soir.",
        cloud:  "Tes pensées du moment. Le vent va les emmener se promener doucement.",
        trash:  "Ce que tu confies aux vagues. Elles vont l'emporter vers de beaux horizons.",
        lettre: "Ta petite lettre du soir. Ton mot s'envolera vers la lune cette nuit.",
        bonheur:"Ce que tu gardes dans ton cœur. Quelque chose de beau pour t'accompagner vers les rêves.",
      };
      speak(labels[id] || "", { rate:0.78, pitch:0.95 });
    } else { stop(); }
  }, [activeShelf, stop, speak]);
  const handleAdd = useCallback((shelfId, payload) => {
    const base  = typeof payload === "string" ? { text:payload, date:new Date().toISOString() } : payload;
    const entry = { ...base, id: base.id || `${shelfId}_${Date.now()}_${Math.random().toString(36).slice(2,7)}` };
    const isFirstEver = Object.values(thoughts).flat().length === 0;
    setThoughts(prev => ({ ...prev, [shelfId]: [...prev[shelfId], entry] }));
    if (isFirstEver) {
      // Son de bienvenue spécial pour la toute première pensée
      joyBell();
      setTimeout(() => {
        if (shelfId === "trash")       wave();
        else if (shelfId === "boubou") paperRustle();
        else if (shelfId === "cloud")  windBlow();
        else if (shelfId === "lettre") letterSound();
      }, 800);
    } else if (shelfId === "trash")   wave();
    else if (shelfId === "bonheur") joyBell();
    else if (shelfId === "boubou")  paperRustle();
    else if (shelfId === "cloud")   windBlow();
    else if (shelfId === "lettre")  letterSound();
    // Vibration douce (mobile)
    try { navigator.vibrate?.([30, 20, 30]); } catch {}
    showToast(
      shelfId==="bonheur" ? "⭐ Gardé dans ton cœur !" :
      shelfId==="boubou"  ? "🩹 Bien pris en soin !" :
      shelfId==="cloud"   ? "🌀 Confié au vent !" :
      shelfId==="trash"   ? "🌊 Parti sur les vagues !" :
      shelfId==="lettre"  ? "✉️ Envolé vers la lune !" : "✨ Rangé !"
    );
  }, []);

  const exportToPDF = () => {
    const name = profile?.name || "Mon enfant";
    const date = new Date().toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    
    let content = `BIBLIOTHÈQUE DES PENSÉES\n`;
    content += `${name} — ${date}\n`;
    content += `${"═".repeat(40)}\n\n`;
    
    SHELVES.forEach(shelf => {
      const items = thoughts[shelf.id] || [];
      if (!items.length) return;
      content += `${shelf.emoji} ${shelf.label.toUpperCase()}\n`;
      content += `${"─".repeat(30)}\n`;
      items.forEach((t, i) => {
        const d = new Date(t.date).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
        content += `${i+1}. [${d}] ${t.drawing ? "🎨 Dessin" : t.text}\n`;
      });
      content += "\n";
    });
    
    content += `${"═".repeat(40)}\n`;
    content += `Total : ${Object.values(thoughts).flat().length} pensées cette nuit\n`;
    content += `Généré par Bibliothèque des Pensées — Amotessa SARL-S\n`;
    
    // Créer un blob et télécharger
    const blob = new Blob([content], { type:"text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `Pensees-${name}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleRemove = (shelfId, idx) => {
    setThoughts(prev => {
      const arr = [...prev[shelfId]]; arr.splice(idx,1);
      return { ...prev, [shelfId]:arr };
    });
  };
  const handleClear = () => { setThoughts(EMPTY); showToast("Nouvelle nuit, nouvelle page 🌙"); };
  const handleSleep = () => {
    saveNightToHistory(thoughts); // sauvegarde dans l'historique multi-nuits
    lullaby();
    setTimeout(() => { slam(); setSleepMode(true); }, 3600);
  };


  /* ══════════════════════════════════════════════════════
     ORDRE DES ÉCRANS
     0. ConsentScreen    → accord parental (1 seule fois)
     1. ProfileSetup     → prénom
     2. WelcomeScreen    → bienvenue
     3. PresentationScreen → à quoi ça sert
     4. CompanionScreen  → choix compagnon
     5. Onboarding       → 6 étagères
     6. Bibliothèque
     ══════════════════════════════════════════════════════ */
  // Scroll en haut à chaque changement d'écran
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [showConsent, showProfileSetup, showWelcome, showPresentation, showCompanion, showOnboard]);

  // Bannière offline toujours visible
  const offlineBanner = <OfflineBanner />;

  // Page offline — seulement si vraiment hors ligne sans cache SW
  // (le SW permet de continuer offline avec le cache)

  if (showConsent) return (
    <ConsentScreen onAccept={() => setShowConsent(false)} />
  );

  /* ORDRE DES ECRANS
     2. WelcomeScreen    - bienvenue
     3. PresentationScreen - a quoi ca sert
     4. CompanionScreen  - choix du compagnon
     5. Onboarding       - presentation des 6 etageres
     6. Bibliotheque     - app principale */
  if (showProfileSetup) return (
    <ProfileSetup onDone={p => {
      setProfile(p);
      saveProfile(p);
      setShowProfileSetup(false);
      try { if (!localStorage.getItem(ONBOARD_KEY)) setShowWelcome(true); } catch {}
    }} />
  );

  if (showWelcome) return (
    <WelcomeScreen
      profile={profile}
      onNext={() => { setShowWelcome(false); setShowPresentation(true); }}
    />
  );

  if (showPresentation) return (
    <PresentationScreen
      profile={profile}
      onNext={() => { setShowPresentation(false); setShowCompanion(true); }}
    />
  );

  if (showCompanion) return (
    <CompanionScreen
      profile={profile}
      onDone={p => {
        setProfile(p);
        setShowCompanion(false);
        setShowOnboard(true);
      }}
    />
  );

  if (showOnboard) return (
    <Onboarding
      childName={profile?.name || ""}
      onDone={() => {
        try { localStorage.setItem(ONBOARD_KEY, "1");
          trackEvent('onboarding_complete'); } catch(e) { console.warn("ONBOARD_KEY:", e); }
        setShowOnboard(false);
      }}
    />
  );

  if (sleepMode) return (
    <SleepScreen
      bonheur={thoughts.bonheur}
      profile={profile}
      onReopen={() => setSleepMode(false)}
      onClearNight={() => { handleClear(); setSleepMode(false); }}
    />
  );


  return (
    <>
      {/* Indicateur chargement voix */}

      {/* Bannière hors-ligne */}
      {!isOnline && (
        <motion.div initial={{ y:-40 }} animate={{ y:0 }}
          style={{ position:"fixed", top:0, left:0, right:0, zIndex:999,
            background:T.nuit.main, color:"#fff", textAlign:"center",
            padding:"10px 16px", fontSize:13, fontFamily:FF.body, fontWeight:600,
            boxShadow:SH.md }}>
          📵 Mode hors-ligne — tes pensées sont sauvegardées localement
        </motion.div>
      )}

      <OfflineBanner />
      {/* Zone aria-live pour annonces screen reader */}
      <div role="status" aria-live="polite" aria-atomic="true"
        style={{ position:"absolute", width:1, height:1, overflow:"hidden",
          clip:"rect(0,0,0,0)", whiteSpace:"nowrap" }}
        id="bibl-announcer"/>
      <AnimatePresence>{voiceLoading && <VoiceLoading />}</AnimatePresence>
      <AnimatePresence>
        {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      </AnimatePresence>
      {/* Bandeau hors-ligne */}
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{ y:-40 }} animate={{ y:0 }} exit={{ y:-40 }}
            style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999,
              background:T.ui.textDark, color:T.or.light, textAlign:"center",
              padding:"8px 16px", fontSize:12, fontWeight:700,
              fontFamily:FF.body }}>
            📵 Mode hors-ligne — tes pensées sont sauvegardées localement
          </motion.div>
        )}
      </AnimatePresence>
      {/* Avertissement mode privé */}
      {!STORAGE_OK && (
        <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:400,
          background:"#F4886C", color:"#fff", padding:"10px 16px",
          fontSize:13, fontWeight:600, textAlign:"center", fontFamily:FF.body }}>
          ⚠️ Mode privé détecté — tes pensées ne seront pas sauvegardées
        </div>
      )}

      {showPrivacy && <LegalScreen type="privacy" onClose={() => setShowPrivacy(false)} />}
      {showCGU     && <LegalScreen type="cgu"     onClose={() => setShowCGU(false)} />}
      {showParent && (
        <ParentSpace thoughts={thoughts} onClose={() => setShowParent(false)}
          onClearNight={() => { handleClear(); setShowParent(false); }} />
      )}
      <div className="bibl-root" style={{ minHeight:"100dvh",
        background: isNight
          ? `linear-gradient(160deg,${T.nuit.dark} 0%,#2A2050 40%,${T.nuit.dark} 100%)`
          : "linear-gradient(160deg,#F5E8CF,#EAD5B0,#DEC89A)",
        fontFamily:FF.body, paddingBottom:60,
        position:"relative", overflow:"hidden",
        transition:"background 2s ease" }}>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet"/>
        <style>{`

          button:focus-visible, a:focus-visible, input:focus-visible {
            outline: 3px solid #7F77DD;
            outline-offset: 2px;
            border-radius: 4px;
          }
          


          /* Focus visible pour navigation clavier */
          button:focus-visible,
          input:focus-visible,
          [tabindex]:focus-visible {
            outline: 3px solid #7F77DD !important;
            outline-offset: 3px !important;
            border-radius: 8px !important;
          }
          /* Masquer outline pour souris (garder pour clavier) */
          button:focus:not(:focus-visible),
          input:focus:not(:focus-visible) {
            outline: none;
          }
          /* Transitions fluides mode jour/nuit */
          #root, #root * {
            transition-property: background-color, color, border-color, box-shadow;
            transition-duration: 0.8s;
            transition-timing-function: ease;
          }
          /* Exception : animations et transforms ne doivent pas transitionner */
          #root .no-transition,
          #root svg *,
          #root canvas {
            transition: none !important;
          }


          /* Focus visible pour navigation clavier */
          .bibl-root button:focus-visible,
          .bibl-root input:focus-visible,
          .bibl-root [tabIndex]:focus-visible {
            outline: 3px solid #7F77DD;
            outline-offset: 2px;
            border-radius: 4px;
          }
          /* Supprimer l'outline par défaut — on utilise :focus-visible */
          .bibl-root button:focus:not(:focus-visible),
          .bibl-root input:focus:not(:focus-visible) {
            outline: none;
          }
          /* Transition douce mode jour ↔ nuit */
          .bibl-root, .bibl-root * {
            transition-property: background-color, color, border-color, box-shadow;
            transition-duration: 1.2s;
            transition-timing-function: ease;
          }
          /* Exception : animations Framer Motion ne doivent pas être affectées */
          .bibl-root [data-framer-component-type] {
            transition: none;
          }
          

          /* Focus visible pour navigation clavier */
          :focus-visible {
            outline: 3px solid #7F77DD !important;
            outline-offset: 2px !important;
            border-radius: 4px;
          }
          button:focus-visible, a:focus-visible {
            outline: 3px solid #7F77DD !important;
            outline-offset: 3px !important;
          }
          /* Supprimer focus sur clic souris (garde clavier) */
          :focus:not(:focus-visible) { outline: none; }
          /* Transition fluide jour↔nuit */
          .bibl-root, .bibl-root * {
            transition-property: background-color, color, border-color, box-shadow;
            transition-duration: 0.4s;
            transition-timing-function: ease;
          }
          /* Sauf les animations — elles ont leur propre timing */
          .bibl-root [class*="motion"] {
            transition-property: none;
          }
          @keyframes blob-pulse {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50%       { transform: scale(1.08) rotate(4deg); }
          }
          @keyframes float-y {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-10px); }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(-1deg); }
            50%       { transform: translateY(-14px) rotate(1deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
          @keyframes shimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes glow-pulse {
            0%,100% { box-shadow: 0 4px 20px rgba(140,100,40,0.4), 0 0 0 0 rgba(196,160,50,0); }
            50%      { box-shadow: 0 4px 20px rgba(140,100,40,0.5), 0 0 0 8px rgba(196,160,50,0); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          * { box-sizing: border-box; }
        `}</style>

        {(() => {
          const FLOATERS = [
            { x:"5%",  top:"8%",  s:0.9, d:0,   type:"star"  },
            { x:"80%", top:"5%",  s:0.7, d:0.5, type:"cloud" },
            { x:"15%", top:"35%", s:0.6, d:1.2, type:"star"  },
            { x:"70%", top:"30%", s:0.8, d:0.8, type:"moon"  },
            { x:"90%", top:"55%", s:0.5, d:1.8, type:"star"  },
            { x:"8%",  top:"65%", s:0.7, d:2.2, type:"cloud" },
          ];
          return FLOATERS.map((f,i) => (
            <motion.div key={i} style={{ position:"absolute", left:f.x, top:f.top,
              transform:`scale(${f.s})`, pointerEvents:"none", zIndex:0 }}
              animate={{ y:[0,-14,4,-8,0], x:[0,4,-3,2,0] }}
              transition={{ duration:4+f.d*1.2, repeat:Infinity, ease:"easeInOut", delay:f.d }}>
              <Floater type={f.type} d={f.d} />
            </motion.div>
          ));
        })()}

        <div style={{ textAlign:"center", padding:"20px 16px 4px", position:"relative", zIndex:1 }}>
          <h1 style={{
            fontFamily:FF.title,
            fontSize:"clamp(1.5rem,5vw,2.4rem)",
            color: isNight ? T.vert.pale : T.ui.greenDeep, marginBottom:4,
            letterSpacing:"0.02em",
            textShadow: isNight
              ? "0 0 24px rgba(168,232,216,0.4)"
              : "0 3px 12px rgba(100,180,160,0.2)",
            transition:"color 2s ease",
          }}>
            📚 Bibliothèque des pensées
          </h1>
        </div>

        <div style={{ minHeight:28, textAlign:"center", padding:"0 16px 6px", position:"relative", zIndex:1 }}>
          <AnimatePresence mode="wait">
            {toast && (
              <motion.div role="status" aria-live="polite" key={toast} initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ display:"inline-block", background:"#fff8", borderRadius:24, padding:"11px 16px",
                  fontSize:13, color:T.neutral.brown, border:"1px solid rgba(59,46,34,0.15)" }}>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {celebrate && (
            <motion.div initial={{ opacity:0, y:-16, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }}
              style={{ maxWidth:520, margin:"0 auto 8px", padding:"0 12px", position:"relative", zIndex:2 }}>
              <div style={{ background:T.or.bg, border:"2px solid #FAC775", borderRadius:16,
                padding:"14px 18px", textAlign:"center" }}>
                <div style={{ fontSize:24, marginBottom:4 }}>🌟✨🌟</div>
                <div style={{ fontSize:15, fontWeight:600, color:T.or.text }}>La bibliothèque est bien remplie ce soir !</div>
                <div style={{ fontSize:13, color:T.or.text, marginTop:4 }}>Toutes tes pensées ont trouvé leur place. Bonne nuit 🌙</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {total > 0 && !isOpen && (
          <div style={{ maxWidth:520, margin:"0 auto 10px", padding:"0 12px", position:"relative", zIndex:1 }}>
            <div style={{
              background: isNight ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.65)",
              borderRadius:16, padding:"10px 16px",
              border: isNight ? "1px solid rgba(255,255,255,0.2)" : "0.5px solid rgba(59,46,34,0.12)",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8,
              backdropFilter:"blur(8px)",
            }}>
              <span style={{ fontSize:13, fontWeight:600, color: isNight ? T.ui.nightText : T.ui.wood }}>
                📚 {total} pensée{total>1?"s":""} sur {filledShelves}/5 étagères
              </span>
              <button onClick={handleClear}
                style={{ background:"none", border:"none", fontSize:11,
                  color: isNight ? T.violet.glow : T.neutral.brownMid,
                  cursor:"pointer", minHeight:44, fontFamily:FF.body, padding:0 }}>
                Effacer cette nuit ×
              </button>
            </div>
          </div>
        )}

        <div style={{ maxWidth:"min(560px, 100%)", margin:"0 auto", padding:"0 clamp(8px,3vw,16px)", position:"relative", zIndex:1, boxSizing:"border-box" }}>

    
      {/* Bannière hors-ligne */}
      {!isOnline && (
        <motion.div initial={{ y:-40 }} animate={{ y:0 }}
          style={{ position:"fixed", top:0, left:0, right:0, zIndex:999,
            background:T.nuit.main, color:"#fff", textAlign:"center",
            padding:"10px", fontSize:13, fontFamily:FF.body, fontWeight:600 }}>
          📵 Mode hors-ligne — tes pensées sont sauvegardées localement
        </motion.div>
      )}
      {/* ── Présentation quand fermée ── */}
          <AnimatePresence mode="wait">
            {!isOpen && (
              <motion.div key="intro"
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-10 }} transition={{ duration:0.4 }}
                style={{ textAlign:"center", padding:"11px 0 20px", position:"relative" }}>

                {/* Cercles décoratifs flottants vert eau / rose / bleu */}
                {[
                  {w:180,h:180,x:"-8%",y:"10%",   c:T.vert.pale, blur:40, d:0},
                  {w:140,h:140,x:"75%",y:"5%",    c:T.ui.pinkSoft, blur:35, d:1.5},
                  {w:120,h:120,x:"15%",y:"60%",   c:"#C8D8FF", blur:30, d:0.8},
                  {w:100,h:100,x:"72%",y:"55%",   c:T.vert.pale, blur:28, d:2.2},
                  {w: 80,h: 80,x:"45%",y:"-5%",   c:"#FFD8A8", blur:24, d:1.1},
                ].map((b,i) => (
                  <motion.div key={i}
                    animate={{ scale:[1,1.1+i*0.02,1], x:[0,8,-6,4,0], y:[0,-10,4,-6,0] }}
                    transition={{ duration:5+i*1.2, repeat:Infinity, ease:"easeInOut", delay:b.d }}
                    style={{
                      position:"absolute", left:b.x, top:b.y,
                      width:b.w, height:b.h, borderRadius:"50%",
                      background:b.c, filter:`blur(${b.blur}px)`,
                      opacity:0.55, pointerEvents:"none", zIndex:0,
                    }}/>
                ))}

                {/* Petits éléments qui virevoltent */}
                {[
                  {emoji:"💫", x:"8%",  y:"8%",  s:1.3, d:0,   rot:true},
                  {emoji:"✨", x:"85%", y:"12%", s:1.1, d:0.7, rot:false},
                  {emoji:"💎", x:"5%",  y:"70%", s:1.0, d:1.4, rot:true},
                  {emoji:"🌊", x:"80%", y:"65%", s:1.2, d:0.3, rot:false},
                  {emoji:"⭐", x:"50%", y:"2%",  s:0.9, d:1.8, rot:true},
                  {emoji:"💙", x:"22%", y:"80%", s:1.1, d:2.4, rot:true},
                  {emoji:"🌈", x:"88%", y:"40%", s:1.0, d:1.0, rot:false},
                ].map((e,i) => (
                  <motion.div key={i}
                    style={{ position:"absolute", left:e.x, top:e.y,
                      fontSize:24*e.s, pointerEvents:"none", zIndex:1,
                      filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.1))" }}
                    animate={{
                      y:[0,-16,5,-10,0],
                      x:[0,6,-4,3,0],
                      rotate: e.rot ? [0,20,-15,10,-5,0] : [0,-10,8,-4,0],
                      scale:[1, 1.1+i*0.02, 0.95, 1.05, 1],
                    }}
                    transition={{ duration:4+e.d*0.8, repeat:Infinity, ease:"easeInOut", delay:e.d }}>
                    {e.emoji}
                  </motion.div>
                ))}

                {/* Hibou flottant librement — sans aucun cadre */}
                <div style={{ position:"relative", zIndex:2, marginBottom:4 }}>
                  <motion.div
                    animate={{
                      y:[0,-14,3,-9,0],
                      rotate:[-2,2,-1,3,-2],
                      scale:[1,1.04,0.98,1.03,1],
                    }}
                    transition={{ duration:4, repeat:Infinity, ease:"easeInOut" }}
                    style={{ display:"inline-block" }}>
                    <Doudou size={96} pose="sit" style={{ filter:"drop-shadow(0 8px 24px rgba(168,232,216,0.4))" }} />
                  </motion.div>
                </div>

                {/* Titre flottant */}
                <motion.div
                  animate={{ y:[0,-3,1,-2,0] }}
                  transition={{ duration:5, repeat:Infinity, ease:"easeInOut", delay:0.5 }}
                  style={{ position:"relative", zIndex:2 }}>
                  <div style={{
                    fontFamily:FF.title,
                    fontSize:"clamp(1.4rem,5vw,2.2rem)",
                    color: isNight ? T.ui.nightText : T.ui.greenDeep,
                    marginBottom:8, letterSpacing:"0.02em",
                    textShadow: isNight
                      ? "0 0 20px rgba(168,232,216,0.4)"
                      : "0 3px 12px rgba(100,180,160,0.25)",
                  }}>
                    {profile?.name ? `Bonsoir, ${profile.name} ! 🌙` : "Bonsoir ! Je t'attendais 🌙"}
                  </div>
                  <div style={{
                    fontSize:15, fontWeight:600, lineHeight:1.6,
                    color: isNight ? T.vert.pale : "#3A8A78",
                    marginBottom:20,
                  }}>
                    Ta bibliothèque magique t'attend.<br/>
                    <span style={{ color: isNight ? T.ui.pinkSoft : T.ui.roseAlt, fontWeight:700 }}>
                      Dépose tes pensées
                    </span>
                    {" "}et dors le cœur léger ✨
                  </div>
                </motion.div>


              {/* ── Stats enfant de la semaine ── */}
              {(() => {
                const hist = loadHistory();
                const last7 = hist.slice(-7);
                const totalThisWeek = last7.reduce((s,n)=>s+(Object.values(n.thoughts||{}).flat().length),0);
                const daysActive = last7.filter(n=>Object.values(n.thoughts||{}).flat().length>0).length;
                if (totalThisWeek === 0) return null;
                return (
                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    style={{ background:"rgba(255,255,255,0.7)", backdropFilter:"blur(8px)",
                      borderRadius:16, padding:"12px 16px", marginBottom:8,
                      border:`1px solid ${T.or.light}`, maxWidth:340, width:"100%",
                      textAlign:"center", zIndex:2 }}>
                    <div style={{ fontFamily:FF.title, fontSize:15, color:T.or.text, marginBottom:4 }}>
                      ✨ Cette semaine
                    </div>
                    <div style={{ fontSize:13, color:T.neutral.brownMid, lineHeight:1.6 }}>
                      {totalThisWeek} pensée{totalThisWeek>1?"s":""} déposée{totalThisWeek>1?"s":""}
                      {daysActive > 1 ? ` en ${daysActive} soirs` : " ce soir"} 🌙
                    </div>
                  </motion.div>
                );
              })()}

              {/* Étagères preview — pilules flottantes colorées */}
              <div style={{
                display:"flex", justifyContent:"center",
                gap:8, flexWrap:"wrap", marginBottom:8,
                position:"relative", zIndex:2,
              }}>
                {SHELVES.map((s, si) => (
                  <motion.div key={s.id}
                    initial={{ opacity:0, y:20, scale:0.8 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    transition={{ delay:0.15+si*0.08, type:"spring", stiffness:300 }}
                    whileHover={{ scale:1.1, y:-4 }}
                    style={{
                      background: isNight ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg,${s.bg},${s.border}44)`,
                      backdropFilter:"blur(8px)",
                      border:`1.5px solid ${s.dot}55`,
                      borderRadius:16, padding:"10px 12px 8px",
                      display:"flex", flexDirection:"column",
                      alignItems:"center", gap:4, minWidth:60,
                      boxShadow:`0 4px 16px ${s.dot}28`,
                      cursor:"default",
                    }}>
                    <span style={{ fontSize:24 }}>{s.emoji}</span>
                    <span style={{ fontSize:11.5, fontWeight:600,
                      color: isNight ? s.dot : s.text,
                      textAlign:"center", lineHeight:1.3 }}>
                      {s.id==="boubou" ? "Mes\ndouceurs" : s.id==="cloud" ? "Mes\npensées" :
                       s.id==="trash"  ? "Les\nvagues"  : s.id==="lettre" ? "Ma\nlettre" : "Bonheur"}
                    </span>
                    {thoughts[s.id]?.length > 0 && (
                      <motion.span
                        initial={{ scale:0 }} animate={{ scale:1 }}
                        transition={{ type:"spring", stiffness:400 }}
                        style={{
                          fontSize:11, background:s.dot, color:"#fff",
                          borderRadius:8, padding:"1px 7px", fontWeight:800,
                          boxShadow:`0 2px 6px ${s.dot}55`,
                        }}>
                        {thoughts[s.id].length}
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
            )}
          </AnimatePresence>

          <div ref={bookcaseRef}>
            <BookcaseSVG isOpen={isOpen} thoughts={thoughts}
              onShelfClick={isOpen ? handleShelfClick : () => {}} activeShelf={activeShelf} />
          </div>

          <div style={{ textAlign:"center", marginTop:16, display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
            {!isOpen ? (
              <motion.button whileTap={{ scale:0.96 }} onClick={handleOpen}
                whileHover={{ scale:1.04 }}
                style={{ background:"linear-gradient(135deg,#8B6030 0%,#C4903A 50%,#8B6030 100%)",
                  backgroundSize:"200% 100%",
                  color:T.neutral.cream, border:"none", borderRadius:24,
                  padding:"14px 40px", fontSize:15, fontWeight:600, cursor:"pointer", minHeight:44,
                  fontFamily:FF.body, display:"inline-flex", alignItems:"center", gap:8,
                  boxShadow:"0 4px 20px rgba(140,100,40,0.4), 0 0 0 0 rgba(196,160,50,0.4)",
                  animation:"shimmer 3s ease infinite, glow-pulse 2s ease-in-out infinite",
                  letterSpacing:"0.02em",
                }}>
                <span style={{ fontSize:19 }}>🔑</span>
                Ouvrir la bibliothèque
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale:0.96 }} onClick={handleClose}
                animate={{ opacity: isClosing ? 0.5 : 1 }}
                whileHover={{ scale:1.03 }}
                style={{ background:"#fff", color:"#5A3C1E", border:"2.5px solid #C4A882", borderRadius:24,
                  padding:"11px 28px", fontSize:15, fontWeight:600, cursor:"pointer", minHeight:44,
                  fontFamily:FF.body, display:"inline-flex", alignItems:"center", gap:8,
                  boxShadow:SH.sm }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 5 L8 11 L14 5" stroke="#5A3C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isClosing ? "Fermeture…" : "Refermer les portes"}
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {isOpen && activeShelf && (
              <ShelfPanel key={activeShelf}
                shelf={SHELVES.find(s => s.id===activeShelf)}
                thoughts={thoughts[activeShelf]}
                onAdd={payload => handleAdd(activeShelf, payload)}
                onRemove={idx => handleRemove(activeShelf, idx)}
                speak={speak}
                isNight={isNight}
                bookcaseRef={bookcaseRef} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isOpen && total > 0 && (
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ textAlign:"center", marginTop:20 }}>
                <button onClick={handleSleep}
                  style={{ background:"#0B0922", color:T.ui.nightText, border:"none", borderRadius:24,
                    padding:"14px 36px", fontSize:15, fontWeight:600, cursor:"pointer", minHeight:44,
                    fontFamily:FF.body, display:"inline-flex", alignItems:"center", gap:8 }}>
                  🌙 Fermer et aller dormir
                </button>
                <div style={{ fontSize:11, color:T.neutral.brownMid, marginTop:8 }}>
                  {total} pensée{total>1?"s":""} rangée{total>1?"s":""}
                  {thoughts.bonheur.length > 0 && ` · ${thoughts.bonheur.length} ⭐ pour la nuit`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ textAlign:"center", marginTop:24, paddingBottom:8,
            display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            <button onClick={() => { setShowOnboard(true); }}
              style={{ background:"none", border:"none", fontSize:13, color:T.neutral.brownMid,
                cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
              🐻 Revoir l'introduction
            </button>
            <button onClick={() => setShowProfileSetup(true)}
              style={{ background:"none", border:"none", fontSize:13, color:T.neutral.brownMid,
                cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
              {profile.avatar} Changer mon compagnon
            </button>
            <button onClick={() => setIsManualNight(n => !n)}
              style={{ background:"none", border:"none", fontSize:13,
                color:T.neutral.brownMid, cursor:"pointer",
                fontFamily:FF.body, minHeight:44 }}
              aria-label="Basculer mode nuit">
              {isNight ? "☀️ Mode jour" : "🌙 Mode nuit"}
            </button>
            <button onClick={() => setShowParent(true)}
              style={{ background:"none", border:"none", fontSize:13, color:T.neutral.brownMid,
                cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
              👨‍👩‍👧 Espace parent
            </button>
            <button onClick={() => {
                if (window.confirm("Recommencer depuis le début ?\nToutes les données seront effacées.")) {
                  try { localStorage.clear(); } catch(e) { console.warn("localStorage.clear:", e); }
                  setProfile({ name:"", avatar:"🦊" });
                  setThoughts(EMPTY);
                  setShowProfileSetup(true);
                  setShowWelcome(false);
                  setShowPresentation(false);
                  setShowCompanion(false);
                  setShowOnboard(false);
                }
              }}
              style={{ background:"none", border:"none", fontSize:13, color:T.neutral.brownMid,
                cursor:"pointer", minHeight:44, fontFamily:FF.body }}>
🔄 Recommencer depuis le début
            </button>
            <button onClick={toggleNight}
              style={{ background:"none", border:"none", fontSize:13,
                color:T.neutral.brownMid, cursor:"pointer",
                fontFamily:FF.body, minHeight:44 }}>
              {isNight ? "☀️ Mode jour" : "🌙 Mode nuit"}
            </button>
          </div>
          <div style={{ textAlign:"center", paddingBottom:32,
            display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            <button onClick={() => setShowChangelog && setShowChangelog(true)}
              style={{ background:"none", border:"none", fontSize:11,
                color:T.neutral.brownLight, cursor:"pointer", minHeight:44,
                fontFamily:FF.body }}>
              v{APP_VERSION} — Nouveautés
            </button>
            <button onClick={() => setShowPrivacy(true)}
              style={{ background:"none", border:"none", fontSize:11, color:T.ui.woodMid,
                cursor:"pointer", minHeight:44, fontFamily:FF.body, textDecoration:"underline" }}>
              Politique de confidentialité
            </button>
            <span style={{ fontSize:11, color:T.ui.borderSoft }}>·</span>
            <button onClick={() => setShowChangelog(true)}
              style={{ background:"none", border:"none", fontSize:11,
                color:T.neutral.brownMid, cursor:"pointer", minHeight:44,
                fontFamily:FF.body, textDecoration:"underline" }}>
              📋 Nouveautés v1.3
            </button>
            <button onClick={() => setShowCGU(true)}
              style={{ background:"none", border:"none", fontSize:11, color:T.ui.woodMid,
                cursor:"pointer", minHeight:44, fontFamily:FF.body, textDecoration:"underline" }}>
              Conditions d'utilisation
            </button>
            <span style={{ fontSize:11, color:T.ui.borderSoft, fontFamily:FF.body }}>
              · v1.0.0
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
