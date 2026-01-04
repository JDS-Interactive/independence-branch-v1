// Budget Sandbox V1
// Deterministic, client-side, educational model

const REVENUE = 4.9; // Trillions (rounded, illustrative)

const sectors = [
  { key: "defense", label: "Defense", base: 0.85 },
  { key: "social", label: "Social Security", base: 1.3 },
  { key: "health", label: "Medicare / Medicaid", base: 1.4 },
  { key: "interest", label: "Interest on Debt", base: 0.7 },
  { key: "education", label: "Education & Workforce", base: 0.15 },
  { key: "infrastructure", label: "Infrastructure", base: 0.2 },
  { key: "science", label: "Science & Innovation", base: 0.15 },
  { key: "veterans", label: "Veterans", base: 0.3 },
  { key: "safety", label: "Public Safety & Justice", base: 0.2 }
];

const state = {};
sectors.forEach(s => state[s.key] = s.base);

const slidersEl = document.getElementById("sliders");

sectors.forEach(s => {
  const div = document.createElement("div");
  div.innerHTML = `
    <label>
      <b>${s.label}</b>: $<span id="${s.key}-val">${s.base.toFixed(2)}</span> T
      <input type="range" min="0" max="${(s.base * 2).toFixed(2)}"
        step="0.01" value="${s.base}"
        data-key="${s.key}">
    </label>
  `;
  slidersEl.appendChild(div);
});

document.querySelectorAll("input[type=range]").forEach(input => {
  input.addEventListener("input", e => {
    const k = e.target.dataset.key;
    state[k] = parseFloat(e.target.value);
    document.getElementById(`${k}-val`).textContent = state[k].toFixed(2);
    update();
  });
});

function update() {
  const spending = Object.values(state).reduce((a,b)=>a+b,0);
  const deficit = spending - REVENUE;

  document.getElementById("totalSpending").textContent = spending.toFixed(2);
  document.getElementById("totalRevenue").textContent = REVENUE.toFixed(2);
  document.getElementById("deficit").textContent = deficit.toFixed(2);

  // Interest pressure visualization (simple)
  const pressure = Math.min(Math.max(deficit / 2, 0), 1);
  document.getElementById("interestBar").style.width = `${pressure * 100}%`;

  // Reflection text
  let msg = "";
  if (deficit < 0) {
    msg = "This budget runs a surplus. You reduced long-term debt pressure but may have limited investments.";
  } else if (deficit < 0.5) {
    msg = "This budget runs a small deficit. Tradeoffs are moderate and relatively stable.";
  } else {
    msg = "This budget runs a large deficit. Rising interest costs may crowd out future priorities.";
  }
  document.getElementById("reflectionText").textContent = msg;
}

update();
