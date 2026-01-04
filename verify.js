// verify.js
const IB_VERSION = "1.0";
const QUESTIONNAIRE_ID = "Civic Foundations";

// Mirror classify + canonical schema checks (must match app.js)
function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

function avg(arr){
  const s = arr.reduce((a,b)=>a+b,0);
  return arr.length ? s / arr.length : 0;
}

function arraysEqual(a, b){
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i=0;i<a.length;i++){
    if (String(a[i]) !== String(b[i])) return false;
  }
  return true;
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

  // Tension pairs (1–2 insights) — computed for symmetry, but not embedded in canonical payload
  const tensions = [];

  if (Math.abs(institutional - participatory) >= 3) {
    tensions.push(
      institutional > participatory
        ? "Leans toward institutional stability over direct citizen input."
        : "Leans toward direct citizen input over institutional gatekeeping."
    );
  } else {
    tensions.push("Balances institutional stability with strong citizen input.");
  }

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
    tensions: tensions.slice(0, 2),
    signals: {
      govtLean, libertyLean, marketLean, safetySupport,
      communitarian, meritLean, speechLean, institutional, participatory,
      centerCount
    }
  };
}

async function sha256Hex(text){
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return [...bytes].map(b => b.toString(16).padStart(2,"0")).join("");
}

function normalizePayload(p){
  // Basic schema validation
  if (!p || p.schema !== "IB_V1_RESULT") return { ok:false, reason:"Missing or invalid schema." };
  if (p.version !== IB_VERSION) return { ok:false, reason:`Unsupported version: ${p.version}` };
  if (p.questionnaire !== QUESTIONNAIRE_ID) return { ok:false, reason:`Unexpected questionnaire: ${p.questionnaire}` };
  if (!Array.isArray(p.answers) || p.answers.length !== 10) return { ok:false, reason:"Answers must be an array of length 10." };

  const answers = p.answers.map(n => clamp(Number(n), 1, 10));

  if (!p.analysis || !p.analysis.orientation || !p.analysis.meaning) {
    return { ok:false, reason:"Missing analysis block." };
  }
  if (!Array.isArray(p.analysis.tendencies)) {
    return { ok:false, reason:"Missing analysis.tendencies array." };
  }
  return { ok:true, answers };
}

function outStatus(kind, title, bodyHtml){
  const cls = kind === "ok" ? "ok" : kind === "bad" ? "bad" : "warn";
  return `
    <div class="status ${cls}">
      <div style="font-weight:900; font-size:18px; margin-bottom:6px;">${title}</div>
      <div class="muted">${bodyHtml}</div>
    </div>
  `;
}

async function verifyFile(file){
  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);

  const payload = window.IBPngMeta.readPayloadFromPngBytes(bytes);
  if (!payload) {
    return outStatus("bad", "❌ Invalid or Unverifiable", "No embedded Independence Branch V1 payload was found in this PNG.");
  }

  const norm = normalizePayload(payload);
  if (!norm.ok) {
    return outStatus("bad", "❌ Invalid or Altered", `Payload schema check failed: <b>${escapeHtml(norm.reason)}</b>`);
  }

  // Recompute analysis deterministically from answers
  const recomputed = classify(norm.answers);

  const sameOrientation = payload.analysis.orientation === recomputed.orientation;
  const sameMeaning = payload.analysis.meaning === recomputed.meaning;

  // Compare tendencies (tightens verification and stays symmetric with app.js)
  const expectedTendencies = recomputed.tendencies.slice(0, 6);
  const payloadTendencies = payload.analysis.tendencies.slice(0, 6);
  const sameTendencies = arraysEqual(payloadTendencies, expectedTendencies);

  // Check checksum if present
  let checksumOk = true;
  let checksumMsg = "";
  if (payload.checksum_sha256) {
    const cloned = { ...payload };
    delete cloned.checksum_sha256;
    const canonical = JSON.stringify(cloned);
    const hx = await sha256Hex(canonical);
    checksumOk = (hx === payload.checksum_sha256);
    checksumMsg = checksumOk
      ? `Checksum: ✅ matches (${payload.checksum_sha256.slice(0,12)}…)`
      : `Checksum: ❌ mismatch (expected ${hx.slice(0,12)}…, got ${String(payload.checksum_sha256).slice(0,12)}…)`;
  } else {
    checksumMsg = "Checksum: (not present)";
  }

  if (sameOrientation && sameMeaning && sameTendencies && checksumOk) {
    return outStatus(
      "ok",
      "✅ Valid (Consistent)",
      `
      This result matches the official V1 scoring logic and appears unaltered.<br><br>
      <b>Orientation:</b> ${escapeHtml(payload.analysis.orientation)}<br>
      <b>Questionnaire:</b> ${escapeHtml(payload.questionnaire)} (v${escapeHtml(payload.version)})<br>
      <b>Timestamp:</b> ${escapeHtml(payload.timestamp)}<br>
      <b>${checksumMsg}</b><br><br>
      <span class="muted">Note: Verification confirms internal consistency only. It does not verify identity, citizenship, or intent.</span>
      `
    );
  }

  const details = [];
  if (!sameOrientation) details.push("Orientation mismatch");
  if (!sameMeaning) details.push("Meaning mismatch");
  if (!sameTendencies) details.push("Tendencies mismatch");
  if (!checksumOk) details.push("Checksum mismatch");

  return outStatus(
    "bad",
    "❌ Invalid or Altered",
    `
    This payload does not match official V1 scoring output for the embedded answers.<br>
    <b>Detected:</b> ${escapeHtml(details.join(", "))}<br><br>
    <b>${checksumMsg}</b><br><br>
    It may have been altered, corrupted, or fabricated.
    `
  );
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

document.getElementById("btnVerify").addEventListener("click", async ()=>{
  const input = document.getElementById("file");
  const out = document.getElementById("out");
  out.innerHTML = "";

  const file = input.files && input.files[0];
  if (!file) {
    out.innerHTML = outStatus("warn", "⚠️ No file selected", "Please choose a PNG exported by the Independence Branch V1 site.");
    return;
  }

  try {
    out.innerHTML = await verifyFile(file);
  } catch (e) {
    out.innerHTML = outStatus("bad", "❌ Error verifying", escapeHtml(e.message || String(e)));
  }
});
