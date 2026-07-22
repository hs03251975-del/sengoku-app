let battleGroups = [];

async function searchBattles() {

  const keyword =
    document.getElementById("battleSearch")
      .value.trim();

  const res =
    await fetch("/battles");

  let battles =
    await res.json();

  if (keyword) {

    battles = battles.filter(b =>
      b.name &&
      b.name.includes(keyword)
    );

  }

  document.getElementById(
    "battleResults"
  ).innerHTML =
    battles.map(b => `

      <div class="card">

        <div style="display:flex;align-items:center;">

          <div style="flex:1;">
            <b>${b.name}</b>
            （${b.battle_date || "-"}）
          </div>

          <button
            class="list-btn"
            onclick="showBattleDetail(${b.id})">
            詳細
          </button>

          <button
            class="list-btn"
            onclick="editBattle(${b.id})">
            編集
          </button>

          <button
            class="list-btn"
            onclick="deleteBattle(${b.id})">
            削除
          </button>

        </div>

      </div>

    `).join("");

  document.getElementById(
    "battleResults"
  ).style.display = battles.length
    ? "block"
    : "none";
}

function addBattleGroup() {

  battleGroups.push({
    group_name: "",
    members: []
  });

  renderBattleGroups();

}

function renderBattleGroups() {

  const box =
    document.getElementById("battleGroups");

  box.innerHTML =
    battleGroups.map((g, i) => {

      const memberNames =
        (g.members || [])
          .map(id => {

            const p =
              allPersonsCache.find(
                x => String(x.id) === String(id)
              );

            return p ? p.name : "不明";
          })
          .join("、");

      return `

        <div class="card">

          <label>勢力名</label>

          <input
            value="${g.group_name || ""}"
            onchange="
              battleGroups[${i}].group_name=this.value
            ">

          <div class="info-box">
            ${memberNames || "登録武将なし"}
          </div>

          <select id="memberSelect${i}">
            <option value="">武将選択</option>

            ${allPersonsCache.map(p => `
              <option value="${p.id}">
                ${p.name}
              </option>
            `).join("")}

          </select>

          <button
            type="button"
            onclick="addGroupMember(${i})">

            追加

          </button>
        </div>

      `;

    }).join("");

}

function addGroupMember(groupIndex) {

  const personId =
    document.getElementById(
      `memberSelect${groupIndex}`
    ).value;

  if (!personId) return;

  if (!battleGroups[groupIndex].members) {
    battleGroups[groupIndex].members = [];
  }

  battleGroups[groupIndex].members.push(
    Number(personId)
  );

  renderBattleGroups();
}
