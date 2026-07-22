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

async function showBattleDetail(id) {

  const res =
    await fetch(`/battle/${id}`);

  const b =
    await res.json();

  const groupRes =
    await fetch(`/battle/${id}/detail`);

  const rows =
    await groupRes.json();

  const groups = {};

  rows.forEach(r => {

    if (!groups[r.group_name]) {
      groups[r.group_name] = [];
    }

    if (r.person_id) {
      groups[r.group_name].push({
        id: r.person_id,
        name: r.name
      });
    }

  });

  const groupHtml =
  Object.entries(groups)
    .map(([groupName, persons]) => `

      <h3>${groupName}</h3>

      ${persons.length
        ? persons.map(p => `
            <div>

              <span
                class="link-like"
                onclick="
                  closeBattleDetail();
                  showDetail(${p.id});
                ">
                ${p.name}
              </span>

            </div>
          `).join("")
        : "登録武将なし"}

    `).join("");

  document.getElementById(
    "battleContent"
  ).innerHTML = `

    <h2>${b.name}</h2>

    <table>

      <tr>
        <td><b>よみ</b></td>
        <td>${b.yomi || "-"}</td>
      </tr>

      <tr>
        <td><b>年月</b></td>
        <td>${b.battle_date || "-"}</td>
      </tr>

      <tr>
        <td><b>旧国名</b></td>
        <td>${b.province || "-"}</td>
      </tr>

      <tr>
        <td><b>場所</b></td>
        <td>${b.location || "-"}</td>
      </tr>

    </table>

    <h3>説明</h3>

    <p>
      ${(b.description || "-")
         .replace(/\n/g,"<br>")}
    </p>

    <h3>参加勢力</h3>

    ${groupHtml}

    <button
      class="btn"
      onclick="closeBattleDetail()">

      閉じる

    </button>

  `;

  document.getElementById(
    "battleModal"
  ).style.display = "flex";

}

function closeBattleDetail() {

  document.getElementById(
    "battleModal"
  ).style.display = "none";

}

async function editBattle(id) {

  const res =
    await fetch(`/battle/${id}`);

  const b =
    await res.json();

  document.getElementById(
    "battleId"
  ).value = b.id;

  document.getElementById(
    "battleName"
  ).value = b.name || "";

  document.getElementById(
    "battleYomi"
  ).value = b.yomi || "";

  document.getElementById(
    "battleDate"
  ).value = b.battle_date || "";

  document.getElementById(
    "battleProvince"
  ).value = b.province || "";

  document.getElementById(
    "battleLocation"
  ).value = b.location || "";

  document.getElementById(
    "battleDescription"
  ).value = b.description || "";

  const groupRes =
    await fetch(`/battle/${id}/groups`);

  battleGroups =
    await groupRes.json();

  for (const g of battleGroups) {

    const personRes =
      await fetch(
        `/battle_group/${g.id}/persons`
      );

    const persons =
      await personRes.json();

    g.members =
      persons.map(
        p => p.person_id
      );
  }

  renderBattleGroups();
}

async function deleteBattle(id) {

  if (!confirm("削除していい？")) {
    return;
  }

  const res =
    await fetch(`/battle/${id}`, {
      method: "DELETE"
    });

  if (!res.ok) {

    alert("削除失敗");
    return;

  }

  alert("削除OK");

  searchBattles();

}

async function saveBattle() {
 
  const id =
    document.getElementById("battleId").value;

  const data = {
    name:
      document.getElementById("battleName").value,

    yomi:
      document.getElementById("battleYomi").value,

    battle_date:
      document.getElementById("battleDate").value,

    province:
      document.getElementById("battleProvince").value,

    location:
      document.getElementById("battleLocation").value,

    description:
      document.getElementById("battleDescription").value,

    groups: battleGroups.filter(
      g => g.group_name.trim()
    )

  };

  if (!data.name) {
    alert("合戦名必須");
    return;
  }

  const method =
    id ? "PUT" : "POST";

  const url =
    id ? `/battle/${id}` : "/battle";

  const res = await fetch(url, {

    method,

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(data)

  });

  if (!res.ok) {
    alert("保存失敗");
    return;
  }

  showSaveMessage("合戦保存完了");

  document.getElementById("battleId").value = "";
  document.getElementById("battleName").value = "";
  document.getElementById("battleYomi").value = "";
  document.getElementById("battleDate").value = "";
  document.getElementById("battleProvince").value = "";
  document.getElementById("battleLocation").value = "";
  document.getElementById("battleDescription").value = "";

  battleGroups = [];
  renderBattleGroups();

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
