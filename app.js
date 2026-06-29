const STORAGE_KEY = "fifa-2026-visual-bracket-v2";

const countries = [
  ["ARG", "Argentina", "ar"], ["AUS", "Australia", "au"], ["AUT", "Austria", "at"], ["BEL", "Belgium", "be"],
  ["BIH", "Bosnia and Herzegovina", "ba"], ["BRA", "Brazil", "br"], ["CAN", "Canada", "ca"], ["CPV", "Cape Verde", "cv"],
  ["COL", "Colombia", "co"], ["CIV", "Ivory Coast", "ci"], ["COD", "DR Congo", "cd"], ["CRO", "Croatia", "hr"],
  ["CUW", "Curacao", "cw"], ["CZE", "Czechia", "cz"], ["ECU", "Ecuador", "ec"], ["EGY", "Egypt", "eg"],
  ["ENG", "England", "gb-eng"], ["FRA", "France", "fr"], ["GER", "Germany", "de"], ["GHA", "Ghana", "gh"],
  ["HAI", "Haiti", "ht"], ["IRN", "Iran", "ir"], ["IRQ", "Iraq", "iq"], ["JPN", "Japan", "jp"],
  ["JOR", "Jordan", "jo"], ["KOR", "Korea Republic", "kr"], ["MAR", "Morocco", "ma"], ["MEX", "Mexico", "mx"],
  ["NED", "Netherlands", "nl"], ["NZL", "New Zealand", "nz"], ["NOR", "Norway", "no"], ["PAN", "Panama", "pa"],
  ["PAR", "Paraguay", "py"], ["POR", "Portugal", "pt"], ["QAT", "Qatar", "qa"], ["KSA", "Saudi Arabia", "sa"],
  ["SCO", "Scotland", "gb-sct"], ["SEN", "Senegal", "sn"], ["RSA", "South Africa", "za"], ["ESP", "Spain", "es"],
  ["SUI", "Switzerland", "ch"], ["SWE", "Sweden", "se"], ["TUN", "Tunisia", "tn"], ["TUR", "Turkey", "tr"],
  ["URU", "Uruguay", "uy"], ["USA", "United States", "us"], ["UZB", "Uzbekistan", "uz"], ["ALG", "Algeria", "dz"]
].map(([code, name, flagCode]) => ({ code, name, flagCode }));

const defaultGroupCodes = [
  ["MEX", "RSA", "KOR", "CZE"],
  ["CAN", "BIH", "QAT", "SUI"],
  ["BRA", "MAR", "HAI", "SCO"],
  ["USA", "PAR", "AUS", "TUR"],
  ["GER", "CUW", "CIV", "ECU"],
  ["NED", "JPN", "SWE", "TUN"],
  ["BEL", "EGY", "IRN", "NZL"],
  ["ESP", "CPV", "KSA", "URU"],
  ["FRA", "SEN", "IRQ", "NOR"],
  ["ARG", "ALG", "AUT", "JOR"],
  ["POR", "COD", "UZB", "COL"],
  ["ENG", "CRO", "GHA", "PAN"]
];

const groupColors = ["#4ed285", "#ef5f8f", "#d38a27", "#6575ff", "#9338e2", "#bddb45", "#f06292", "#45d4b6", "#b968f2", "#62c4e8", "#e36d31", "#77d1ff"];
const roundCounts = [16, 8, 4, 2, 1];
const lockedRoundOf32 = [
  { label: "M74", teams: ["GER", "PAR"] },
  { label: "M77", teams: ["FRA", "SWE"] },
  { label: "M73", teams: ["RSA", "CAN"] },
  { label: "M75", teams: ["NED", "MAR"] },
  { label: "M83", teams: ["POR", "CRO"] },
  { label: "M84", teams: ["ESP", "AUT"] },
  { label: "M81", teams: ["USA", "BIH"] },
  { label: "M82", teams: ["BEL", "SEN"] },
  { label: "M76", teams: ["BRA", "JPN"] },
  { label: "M78", teams: ["CIV", "NOR"] },
  { label: "M79", teams: ["MEX", "ECU"] },
  { label: "M80", teams: ["ENG", "COD"] },
  { label: "M86", teams: ["ARG", "CPV"] },
  { label: "M88", teams: ["AUS", "EGY"] },
  { label: "M85", teams: ["SUI", "ALG"] },
  { label: "M87", teams: ["COL", "GHA"] }
];
const roundLabels = [
  lockedRoundOf32.map((match) => match.label),
  ["M89", "M90", "M93", "M94", "M91", "M92", "M95", "M96"],
  ["M97", "M98", "M99", "M100"],
  ["SF1", "SF2"],
  ["FINAL"]
];

let state = loadState();
ensureLockedRoundOf32();

function createDefaultState() {
  return {
    groups: defaultGroupCodes.map((codes, index) => ({
      id: String.fromCharCode(65 + index),
      color: groupColors[index],
      teams: codes
    })),
    bracket: roundCounts.map((count) => Array.from({ length: count }, () => ({ teams: ["", ""], winner: "" }))),
    third: { teams: ["", ""], winner: "" }
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.groups?.length === 12 && saved?.bracket?.length === 5 && saved?.third) return saved;
  } catch {
    return createDefaultState();
  }
  return createDefaultState();
}

function ensureLockedRoundOf32() {
  lockedRoundOf32.forEach((lockedMatch, index) => {
    state.bracket[0][index].teams = [...lockedMatch.teams];
    if (!state.bracket[0][index].teams.includes(state.bracket[0][index].winner)) {
      state.bracket[0][index].winner = "";
    }
  });
  propagate();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  flash("saveBtn", "Saved");
}

function flash(id, label) {
  const button = document.querySelector(`#${id}`);
  const original = button.textContent;
  button.textContent = label;
  setTimeout(() => {
    button.textContent = original;
  }, 850);
}

function country(code) {
  return countries.find((item) => item.code === code) || { code: "", name: "Empty", flagCode: "" };
}

function flagImg(code, className = "flag-img") {
  const team = country(code);
  if (!team.flagCode) return `<span class="${className} flag-empty"></span>`;
  return `<img class="${className}" src="https://flagcdn.com/w80/${team.flagCode}.png" alt="${escapeHtml(team.name)} flag" loading="lazy" />`;
}

function seedBracket() {
  state.bracket = roundCounts.map((count, roundIndex) =>
    Array.from({ length: count }, (_, matchIndex) => {
      if (roundIndex !== 0) return { teams: ["", ""], winner: "" };
      return {
        teams: [...lockedRoundOf32[matchIndex].teams],
        winner: ""
      };
    })
  );
  state.third = { teams: ["", ""], winner: "" };
  propagate();
  render();
}

function propagate() {
  for (let round = 1; round < state.bracket.length; round += 1) {
    state.bracket[round].forEach((match, index) => {
      match.teams = [
        state.bracket[round - 1][index * 2]?.winner || "",
        state.bracket[round - 1][index * 2 + 1]?.winner || ""
      ];
      if (!match.teams.includes(match.winner)) match.winner = "";
    });
  }

  state.third.teams = [
    loserOf(state.bracket[3][0]),
    loserOf(state.bracket[3][1])
  ];
  if (!state.third.teams.includes(state.third.winner)) state.third.winner = "";
}

function loserOf(match) {
  if (!match?.winner) return "";
  return match.teams.find((code) => code && code !== match.winner) || "";
}

function chooseWinner(round, index, code) {
  if (!code) return;
  const match = round === "third" ? state.third : state.bracket[round][index];
  if (!match.teams.includes(code)) return;
  match.winner = code;
  propagate();
  render();
}

function render() {
  renderGroups();
  renderEditor();
  renderBracket();
  renderChampion();
  requestAnimationFrame(drawConnectors);
}

function renderGroups() {
  const left = document.querySelector("#leftGroups");
  const right = document.querySelector("#rightGroups");
  left.innerHTML = "";
  right.innerHTML = "";
  state.groups.forEach((group, index) => {
    const card = document.createElement("article");
    card.className = "group-card";
    card.style.setProperty("--group-color", group.color);
    card.innerHTML = `
      <div class="group-icons">
        ${group.teams.map((code) => `<span class="flag-tile" title="${escapeHtml(country(code).name)}">${flagImg(code)}</span>`).join("")}
      </div>
      <div class="group-label">Group ${group.id}</div>
    `;
    (index < 6 ? left : right).appendChild(card);
  });
}

function renderEditor() {
  const editor = document.querySelector("#groupEditor");
  editor.innerHTML = "";
  state.groups.forEach((group, groupIndex) => {
    const card = document.createElement("article");
    card.className = "editor-card";
    card.style.setProperty("--group-color", group.color);
    card.innerHTML = `<h3>Group ${group.id}</h3>`;
    group.teams.forEach((code, teamIndex) => {
      const row = document.createElement("label");
      row.className = "team-picker";
      row.innerHTML = `
        <span class="flag-tile">${flagImg(code)}</span>
        <select aria-label="Group ${group.id} team ${teamIndex + 1}">
          ${countries.map((item) => `<option value="${item.code}"${item.code === code ? " selected" : ""}>${item.code} - ${item.name}</option>`).join("")}
        </select>
      `;
      row.querySelector("select").addEventListener("change", (event) => {
        state.groups[groupIndex].teams[teamIndex] = event.target.value;
        render();
      });
      card.appendChild(row);
    });
    editor.appendChild(card);
  });
}

function renderBracket() {
  const slots = [
    ["#leftR32", 0, 0, 8], ["#rightR32", 0, 8, 16],
    ["#leftR16", 1, 0, 4], ["#rightR16", 1, 4, 8],
    ["#leftQF", 2, 0, 2], ["#rightQF", 2, 2, 4],
    ["#leftSF", 3, 0, 1], ["#rightSF", 3, 1, 2]
  ];
  slots.forEach(([selector, round, start, end]) => {
    const container = document.querySelector(selector);
    container.innerHTML = "";
    for (let i = start; i < end; i += 1) {
      container.appendChild(matchElement(state.bracket[round][i], round, i));
    }
  });
  document.querySelector("#finalMatch").replaceChildren(matchElement(state.bracket[4][0], 4, 0));
  document.querySelector("#thirdMatch").replaceChildren(matchElement(state.third, "third", 0, "3P"));
}

function matchElement(match, round, index, forcedCode) {
  const wrap = document.createElement("article");
  wrap.className = "match";
  wrap.dataset.round = round;
  wrap.dataset.index = index;
  const code = forcedCode || roundLabels[round][index];
  wrap.innerHTML = `<div class="match-code">${code}</div>`;

  match.teams.forEach((teamCode, sideIndex) => {
    wrap.appendChild(teamButton(teamCode, match.winner === teamCode, () => chooseWinner(round, index, teamCode)));
  });

  return wrap;
}

function drawConnectors() {
  const svg = document.querySelector("#connectorLayer");
  const board = document.querySelector(".board");
  if (!svg || !board) return;

  const boardRect = board.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
  svg.innerHTML = "";

  const links = [
    ...Array.from({ length: 8 }, (_, index) => [0, index, 1, Math.floor(index / 2), "left"]),
    ...Array.from({ length: 4 }, (_, index) => [1, index, 2, Math.floor(index / 2), "left"]),
    ...Array.from({ length: 2 }, (_, index) => [2, index, 3, 0, "left"]),
    [3, 0, 4, 0, "left"],
    ...Array.from({ length: 8 }, (_, index) => [0, index + 8, 1, Math.floor(index / 2) + 4, "right"]),
    ...Array.from({ length: 4 }, (_, index) => [1, index + 4, 2, Math.floor(index / 2) + 2, "right"]),
    ...Array.from({ length: 2 }, (_, index) => [2, index + 2, 3, 1, "right"]),
    [3, 1, 4, 0, "right"]
  ];

  links.forEach(([fromRound, fromIndex, toRound, toIndex, side]) => {
    const from = document.querySelector(`.match[data-round="${fromRound}"][data-index="${fromIndex}"]`);
    const to = document.querySelector(`.match[data-round="${toRound}"][data-index="${toIndex}"]`);
    if (!from || !to) return;
    const active = state.bracket[fromRound]?.[fromIndex]?.winner;
    svg.appendChild(connectorPath(from, to, side, boardRect, Boolean(active)));
  });
}

function connectorPath(from, to, side, boardRect, active) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const fromPoint = side === "left"
    ? { x: fromRect.right - boardRect.left, y: fromRect.top + fromRect.height / 2 - boardRect.top }
    : { x: fromRect.left - boardRect.left, y: fromRect.top + fromRect.height / 2 - boardRect.top };
  const toPoint = side === "left"
    ? { x: toRect.left - boardRect.left, y: toRect.top + toRect.height / 2 - boardRect.top }
    : { x: toRect.right - boardRect.left, y: toRect.top + toRect.height / 2 - boardRect.top };
  const midX = fromPoint.x + (toPoint.x - fromPoint.x) / 2;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", `connector-path ${active ? "" : "pending"}`.trim());
  path.setAttribute("d", `M ${fromPoint.x} ${fromPoint.y} H ${midX} V ${toPoint.y} H ${toPoint.x}`);
  return path;
}

function teamButton(code, isWinner, onClick) {
  const team = country(code);
  const button = document.createElement("button");
  button.className = `team-slot ${code ? "" : "empty"} ${isWinner ? "winner" : ""}`;
  button.type = "button";
  button.disabled = !code;
  button.title = code ? team.name : "Awaiting winner";
  button.innerHTML = `<span class="slot-flag">${flagImg(code, "slot-flag-img")}</span><span class="slot-name">${code || "TBD"}</span>`;
  button.addEventListener("click", onClick);
  return button;
}

function renderChampion() {
  const champion = country(state.bracket[4][0].winner);
  document.querySelector("#championText").innerHTML = state.bracket[4][0].winner
    ? `Champion: ${flagImg(champion.code, "champion-flag")} ${escapeHtml(champion.name)}`
    : "Champion: TBD";
}

function clearWinners() {
  state.bracket.forEach((round) => round.forEach((match) => {
    match.winner = "";
  }));
  state.third.winner = "";
  propagate();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector("#seedBtn").addEventListener("click", seedBracket);
document.querySelector("#saveBtn").addEventListener("click", saveState);
document.querySelector("#clearBtn").addEventListener("click", clearWinners);
document.querySelector("#resetBtn").addEventListener("click", () => {
  state = createDefaultState();
  localStorage.removeItem(STORAGE_KEY);
  seedBracket();
});

window.addEventListener("resize", drawConnectors);

if (!state.bracket[0].some((match) => match.teams.some(Boolean))) {
  seedBracket();
} else {
  ensureLockedRoundOf32();
  render();
}
