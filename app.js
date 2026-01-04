// app.js
const IB_VERSION = "1.0";
const QUESTIONNAIRE_ID = "Civic Foundations";

const QUESTIONS = [
  {
    id: 1,
    text: "The federal government should play an active role in solving major national problems, even if that means expanding its authority."
  },
  {
    id: 2,
    text: "Protecting individual liberty should take precedence over collective outcomes, even when collective solutions might be more efficient."
  },
  {
    id: 3,
    text: "Free markets generally produce better outcomes than government regulation, even in essential sectors."
  },
  {
    id: 4,
    text: "A strong social safety net is necessary to ensure basic dignity and stability for all citizens."
  },
  {
    id: 5,
    text: "A shared national identity, culture, and civic values are essential for a healthy democracy."
  },
  {
    id: 6,
    text: "Outcomes in society should primarily reflect merit and effort, not enforced equality."
  },
  {
    id: 7,
    text: "Free speech should be protected even when it is offensive, unpopular, or destabilizing."
  },
  {
    id: 8,
    text: "America’s core institutions need reform, but not radical dismantling."
  },
  {
    id: 9,
    text: "Experts and institutions should guide policy decisions more than public opinion."
  },
  {
    id: 10,
    text: "Citizens should have structured, ongoing ways to express their views beyond elections."
  }
];

function nowIso(){
  return new Date().toISOString();
}

function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

function avg(arr){
  const s = arr.reduce((a,b)=>a+b,0);
  return arr.length ? s / arr.length : 0;
}

function classify(answers) {
  // Simple, transparent, deterministic mapping (V1).
  // NOTE: We intentionally avoid party labels.

  const govtRole     = answers[0]; // Q1
  const liberty      = answers[1]; // Q2
  const markets      = answers[2]; // Q3
  const safetyNet    = answers[3]; // Q4
  const identity     = answers[4]; // Q5
  const merit        = answers[5]; // Q6
  const freeSpeech   = answers[6]; // Q7
  const institutions = answers[7]; // Q8
  const expertise    = answers[8]; // Q9
  const citizenVoice = answers[9]; // Q10

  // Helpers
  const isHigh = (x) => x >= 8;
  const isMedHigh = (x) => x >= 7;
  const isCenter = (x) => x >= 4 && x <= 6;

  // Derived signals
  const institutional  = (institutions + expertise) / 2; // 1–10
  const participatory  = citizenVoice;                   // 1–10
  const communitarian  = identity;                       // 1–10
  const safetySupport  = safetyNet;                      // 1–10
  const marketLean     = markets;                        // 1–10
  const speechLean     = freeSpeech;                     // 1–10
  const meritLean      = merit;                          // 1–10
  const libertyLean    = liberty;                        // 1–10
  const govtLean       = govtRole;                       // 1–10

  // Aggregate “balance” indicator (how many answers are 4–6)
  const centerCount = answers.filter(isCenter).length;

  // Orientation candidates (simple scoring)
  const candidates = [
    {
      key: "Civic Institutional Hybrid",
      score: (isHigh(institutional) ? 2 : 0) + (isHigh(participatory) ? 2 : 0) + (isMedHigh(communitarian) ? 1 : 0),
      meaning: "You value strong institutions and reform, while also strongly supporting structured citizen input beyond elections. You tend to prefer transparency and accountability over ideological alignment."
    },
    {
      key: "Institutional Steward",
      score: (isHigh(institutional) ? 3 : 0) + (!isHigh(participatory) ? 1 : 0) + (isMedHigh(expertise) ? 1 : 0),
      meaning: "You prioritize stability and reform within existing institutions. You tend to prefer measured change and credible governance structures over disruptive approaches."
    },
    {
      key: "Civic Participation Advocate",
      score: (isHigh(participatory) ? 3 : 0) + (!isHigh(institutional) ? 1 : 0) + (isMedHigh(govtLean) ? 1 : 0),
      meaning: "You strongly support ongoing citizen input. You may be skeptical of institutions when they feel unresponsive, and you favor mechanisms that increase transparency and feedback."
    },
    {
      key: "Civic Cohesion Builder",
      score: (isHigh(communitarian) ? 2 : 0) + (isHigh(safetySupport) ? 2 : 0) + (isMedHigh(institutional) ? 1 : 0),
      meaning: "You emphasize both shared civic identity and practical support systems that promote national stability. You tend to value unity, responsibility, and constructive reform."
    },
    {
      key: "Civic Balance Profile",
      score: (centerCount >= 6 ? 3 : 0) + (isCenter(institutional) ? 1 : 0) + (isCenter(participatory) ? 1 : 0),
      meaning: "Your responses suggest a balanced approach to civic tradeoffs, with context-dependent views across institutions, liberty, and collective needs."
    }
  ];

  // Pick the highest score; tie-breaker favors “Balance Profile” if lots of center answers
  candidates.sort((a, b) => b.score - a.score);
  let orientation = candidates[0].key;
  let meaning = candidates[0].meaning;

  // Optional suffix for cohesion emphasis
  if (orientation === "Civic Institutional Hybrid" && isHigh(communitarian)) {
    orientation = "Civic Institutional Hybrid (Cohesion Emphasis)";
    meaning = "You balance institutional reform and citizen voice, with a strong emphasis on national cohesion and shared civic values.";
  }

  // Tendencies (expanded to include “center/balanced” insights)
  const tendencies = [];

  if (isHigh(participatory)) tendencies.push("Strong preference for structured citizen input beyond elections.");
  if (isHigh(institutional)) tendencies.push("High value on institutional stability and reform over disruption.");
  if (isHigh(communitarian)) tendencies.push("Strong emphasis on shared civic identity and national cohesion.");
  if (isHigh(safetySupport)) tendencies.push("Strong support for a safety net to ensure dignity and stability.");

  if (isMedHigh(marketLean)) tendencies.push("Tends to favor market mechanisms, with regulation as a guardrail rather than a default.");
  if (isMedHigh(libertyLean)) tendencies.push("Tends to prioritize individual liberty when tradeoffs arise.");
  if (isMedHigh(speechLean)) tendencies.push("Leans toward broad free speech protections even when content is unpopular.");
  if (isMedHigh(meritLean)) tendencies.push("Leans toward merit and effort as key drivers of outcomes.");

  // “Balanced/conditional” tendencies
  if (centerCount >= 6) tendencies.push("Frequently chooses middle values, suggesting conditional or context-dependent views.");
  if (isCenter(expertise)) tendencies.push("Balances expert guidance with public input rather than strongly favoring one.");
  if (isCenter(libertyLean)) tendencies.push("Weighs individual liberty against collective outcomes case-by-case.");

  // Tension pairs (1–2 insights)
  const tensions = [];
  // Institutional vs participatory
  if (Math.abs(institutional - participatory) >= 3) {
    tensions.push(
      institutional > participatory
        ? "Leans toward institutional stability over direct citizen input."
        : "Leans toward direct citizen input over institutional gatekeeping."
    );
  } else {
    tensions.push("Balances institutional stability with strong citizen input.");
  }

  // Market vs safety net
  if (Math.abs(marketLean - safetySupport) >= 3) {
    tensions.push(
      marketLean > safetySupport
        ? "Leans toward market solutions more than expanding safety-net protections."
        : "Leans toward safety-net protections more than market-first approaches."
    );
  } else {
    tensions.push("Balances market mechanisms with safety-net protections.");
  }

  // Ensure at least 4 tendencies for UX
  while (tendencies.length < 4) {
    if (avg(answers) >= 6 && tendencies.length < 4) tendencies.push("Generally supports pragmatic solutions over rigid ideology.");
    if (avg(answers) < 6 && tendencies.length < 4) tendencies.push("Tends to weigh tradeoffs carefully and avoid absolutist positions.");
    if (tendencies.length < 4) tendencies.push("Values civic health and accountability as long-term priorities.");
  }

  return {
    orientation,
    meaning,
    tendencies: tendencies.slice(0, 6),
    // Optional: show 2 tension insights (can be displayed as “You tend to…”)
    tensions: tensions.slice(0, 2),
    signals: {
      govtLean, libertyLean, marketLean, safetySupport,
      communitarian, meritLean, speechLean, institutional, participatory,
      centerCount
    }
  };
}

function makeCanonicalPayload({ answers, analysis }){
  // Canonical payload for V1 consistency checking.
  // IMPORTANT: If you change this schema, bump version.
  return {
    schema: "IB_V1_RESULT",
    version: IB_VERSION,
    questionnaire: QUESTIONNAIRE_ID,
    timestamp: nowIso(),
    answers: answers.slice(0, 10).map(n => clamp(Number(n), 1, 10)),
    analysis: {
      orientation: analysis.orientation,
      meaning: analysis.meaning,
      tendencies: analysis.tendencies
    }
  };
}

async function sha256Hex(text){
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return [...bytes].map(b => b.toString(16).padStart(2,"0")).join("");
}

function el(id){ return document.getElementById(id); }

const state = {
  started: false,
  idx: 0,
  answers: Array(10).fill(null),
  payload: null
};

function renderQuestion(){
  const q = QUESTIONS[state.idx];
  el("progress").textContent = `Question ${state.idx+1} of ${QUESTIONS.length}`;

  const wrap = el("qWrap");
  wrap.innerHTML = "";

  const title = document.createElement("div");
  title.className = "qTitle";
  title.textContent = q.text;
  wrap.appendChild(title);

  const scale = document.createElement("div");
  scale.className = "scale";

  for (let i=1;i<=10;i++){
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(i);
    if (state.answers[state.idx] === i) b.classList.add("sel");
    b.addEventListener("click", ()=>{
      state.answers[state.idx] = i;
      renderQuestion();
      updateNav();
    });
    scale.appendChild(b);
  }
  wrap.appendChild(scale);

  const hint = document.createElement("div");
  hint.className = "muted";
  hint.textContent = "Tip: 5 means mixed/conditional. Your answers are private unless you choose to export/share.";
  wrap.appendChild(hint);
}

function updateNav(){
  el("btnPrev").disabled = state.idx === 0;
  const onLast = state.idx === QUESTIONS.length - 1;
  el("btnNext").textContent = onLast ? "Finish Questionnaire" : "Next";

  // Require answer before moving on (keeps data clean)
  el("btnNext").disabled = state.answers[state.idx] == null;
}

function show(id){
  el(id).classList.remove("hidden");
}
function hide(id){
  el(id).classList.add("hidden");
}

function start(){
  state.started = true;
  state.idx = 0;
  state.answers = Array(10).fill(null);
  hide("results");
  show("quiz");
  renderQuestion();
  updateNav();
  // Scroll into view
  el("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
}

function computeAndShowResults(){
  const answers = state.answers.map(n=>Number(n));
  const analysis = classify(answers);
  const payload = makeCanonicalPayload({ answers, analysis });
  state.payload = payload;

  // Render
  el("orientation").textContent = payload.analysis.orientation;
  el("meaning").textContent = payload.analysis.meaning;
  el("tendencies").innerHTML = payload.analysis.tendencies.map(t=>`<li>${t}</li>`).join("");
  el("ver").textContent = `${payload.version} (${payload.questionnaire})`;
  el("ts").textContent = payload.timestamp;

  hide("quiz");
  show("results");
  el("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function exportVaultImage(){
  const payload = state.payload;
  if (!payload) return;

  // Add deterministic checksum for extra consistency checking
  const canonicalJson = JSON.stringify(payload);
  const checksum = await sha256Hex(canonicalJson);

  const vaultPayload = {
    ...payload,
    checksum_sha256: checksum
  };

  const title = vaultPayload.analysis.orientation;
  const blob = await window.IBPngMeta.makeVaultPngWithPayload({ title, payloadObj: vaultPayload });

  const url = URL.createObjectURL(blob);
  const name = `IB_V1_PrivateResult_${checksum.slice(0,10)}.png`;

  const item = document.createElement("div");
  item.className = "dlItem";
  item.innerHTML = `
    <div>
      <div><b>Private Result Image</b></div>
      <div class="muted">Contains encoded data for consistency verification. (Metadata may be stripped by social platforms.)</div>
    </div>
    <a class="btn primary" download="${name}" href="${url}">Download PNG</a>
  `;
  el("downloadArea").prepend(item);
}

async function generateShareCard(){
  // For V1, share card is a normal PNG without embedded answers.
  // (We can enhance later—keeping V1 conservative.)
  const payload = state.payload;
  if (!payload) return;

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "rgba(154,255,199,0.14)";
  ctx.fillRect(50,50,1100,120);
  ctx.strokeStyle = "rgba(154,255,199,0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(50,50,1100,120);

  ctx.fillStyle = "#eaf0ff";
  ctx.font = "bold 46px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Civic Orientation Summary", 80, 112);

  ctx.fillStyle = "#9fb0d0";
  ctx.font = "22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Consistent with Independence Branch scoring logic • Unverified origin", 80, 152);

  ctx.fillStyle = "#eaf0ff";
  ctx.font = "bold 52px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(payload.analysis.orientation, 80, 260);

  ctx.fillStyle = "#9fb0d0";
  ctx.font = "24px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  wrapText(ctx, payload.analysis.meaning, 80, 310, 1040, 32);

  ctx.fillStyle = "#9fb0d0";
  ctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(`V${payload.version} • ${payload.questionnaire} • ${payload.timestamp}`, 80, 610);

  const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
  const url = URL.createObjectURL(blob);
  const name = `IB_V1_ShareCard_${Date.now()}.png`;

  const item = document.createElement("div");
  item.className = "dlItem";
  item.innerHTML = `
    <div>
      <div><b>Share Card (Optional)</b></div>
      <div class="muted">A summary image for public posting. Does not embed answers.</div>
    </div>
    <a class="btn primary" download="${name}" href="${url}">Download PNG</a>
  `;
  el("downloadArea").prepend(item);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text).split(" ");
  let line = "";
  for (let i=0;i<words.length;i++){
    const test = line + words[i] + " ";
    const w = ctx.measureText(test).width;
    if (w > maxWidth && i > 0){
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

function restart(){
  hide("results");
  hide("quiz");
  el("downloadArea").innerHTML = "";
  state.payload = null;
  state.started = false;
  el("btnStart").scrollIntoView({ behavior:"smooth", block:"center" });
}

function wire(){
  el("btnStart").addEventListener("click", start);

  el("btnPrev").addEventListener("click", ()=>{
    state.idx = Math.max(0, state.idx - 1);
    renderQuestion();
    updateNav();
  });

  el("btnNext").addEventListener("click", ()=>{
    if (state.answers[state.idx] == null) return;

    const onLast = state.idx === QUESTIONS.length - 1;
    if (onLast){
      computeAndShowResults();
      return;
    }
    state.idx = Math.min(QUESTIONS.length - 1, state.idx + 1);
    renderQuestion();
    updateNav();
  });

  el("btnExportVault").addEventListener("click", exportVaultImage);
  el("btnShareCard").addEventListener("click", generateShareCard);
  el("btnRestart").addEventListener("click", restart);
}

wire();
