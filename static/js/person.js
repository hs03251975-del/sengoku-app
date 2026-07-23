const API_BASE = "";

let aliasData = [];

/* 検索 */
async function searchPersons() {
  const q = document.getElementById("search").value.trim();

  const res =
    await fetch(`/search?q=${encodeURIComponent(q)}`);

  let list = await res.json();

  list.sort((a, b) =>
      (a.yomi || "").localeCompare(
          b.yomi || "",
          "ja"
      )
  );
  
  renderResults(list);

  document.getElementById("results").scrollIntoView({
      behavior: "smooth",
      block: "start"
  });
  
}

// ✅ オートコンプリート
function setupAutocomplete(inputId, boxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);

  input.addEventListener("input", () => {

    const keyword = input.value.trim();

    if (!keyword) {
      box.style.display = "none";
      return;
    }

    const matches = allPersonsCache.filter(
      p => p.name && p.name.includes(keyword)
    );

    if (matches.length === 0) {
      box.style.display = "none";
      return;
    }

    box.innerHTML = matches.map(p => `
      <div class="autocomplete-item"
           onclick="selectPerson('${inputId}','${boxId}','${p.name}')">
        ${p.name}
        （${p.birth || "?"}-${p.death || "?"}／${p.affiliation || "所属不明"}）
      </div>
    `).join("");

    box.style.display = "block";
  });
}

async function updateFamilyInfo() {

  const currentId =
    document.getElementById("personId").value;

  if (!currentId) {

    document.getElementById("childrenList").innerHTML = "-";
    document.getElementById("siblingsList").innerHTML = "-";

    return;
  }

  // 子供
  const childRes =
    await fetch(`/person/${currentId}/children`);

  const children =
    await childRes.json();

  document.getElementById("childrenList").innerHTML =
    children.length
      ? children.map(c => c.name).join("、")
      : "-";

  // 兄弟姉妹
  const siblingRes =
    await fetch(`/person/${currentId}/siblings`);

  const siblings =
    await siblingRes.json();

  document.getElementById("siblingsList").innerHTML =
    siblings.length
      ? siblings.map(s => s.name).join("、")
      : "-";
}

function selectPerson(inputId, boxId, name) {
  document.getElementById(inputId).value = name;
  document.getElementById(boxId).style.display = "none";

  updateFamilyInfo();
}

/* 描画 */
function renderResults(list) {
  const box = document.getElementById("results");
  box.innerHTML = "";

  list.forEach(p => {
    
    let years = "";

    if (p.birth || p.death) {
        years = `${p.birth || "？"}～${p.death || "？"}`;
    }

    const div = document.createElement("div");
    div.className = "card";

    div.onclick = () => showDetail(p.id);

    div.innerHTML = `
    <div style="display:flex; align-items:center;">

      <div style="flex:1;">
        <b>${p.name}</b>

        <span style="color:#666;">
          （${p.yomi || ""}）
        </span>

        <span style="margin-left:20px;">
          ${years}
        </span>
      </div>

      <button class="list-btn"
          onclick="event.stopPropagation(); showDetail(${p.id})">
          詳細
      </button>

      <button class="list-btn"
          onclick="event.stopPropagation(); editPerson(${p.id})">
          編集
      </button>

      <button class="list-btn"
          onclick="event.stopPropagation(); deletePerson(${p.id})">
          削除
      </button>

    </div>
    `;
    box.appendChild(div);
  });
}

/* 詳細 */
async function showDetail(id) {

  const res = await fetch(`/person/${id}`);
  const p = await res.json();

  const battleRes =
    await fetch(`/person/${id}/battles`);

  const battles =
    await battleRes.json();

  const battleHtml =
    battles.length
      ? battles.map(b => `
          <div>

            ${b.battle_date || ""}

            <span
              class="link-like"
              onclick="showBattleDetail(${b.id})">

              ${b.name}

            </span>

            （${b.group_name}）

          </div>
        `).join("")
      : "-";

  // 子供取得
  const childrenRes =
    await fetch(`/person/${id}/children`);

  const children =
    await childrenRes.json();

  // 兄弟姉妹取得
  const sibRes =
    await fetch(`/person/${id}/siblings`);

  const siblings =
    await sibRes.json();

  // ★別名取得
  const aliasRes =
    await fetch(`/person/${id}/aliases`);

  const aliases =
    await aliasRes.json();

  const aliasOrder = {

    "幼名": 1,
    "諱": 2,
    "通称": 3,
    "法号": 4,
    "官途名": 5,
    "受領名": 6,
    "官位": 7,
    "改名前": 8,
    "改名後": 9,
    "異称": 10,
    "その他": 11

};

aliases.sort((a, b) =>
  (aliasOrder[a.alias_type] || 999) -
  (aliasOrder[b.alias_type] || 999)
);

  const aliasesHtml =
    aliases
      .map(a =>
        `
        <tr>
          <td style="
            width:80px;
            padding:4px 10px 4px 0;
            font-weight:bold;
          ">
            ${a.alias_type || "分類なし"}
          </td>
          <td>
            ${a.alias_name}
          </td>
        </tr>
        `
      )
      .join("");

  const aliasesTable =
    aliasesHtml
      ? `
        <table>
          ${aliasesHtml}
        </table>
        `
      : "-";

  let fatherName = "-";
  let motherName = "-";
  let spouseName = "-";

  if (p.spouse_id) {
    const spouseRes = await fetch(`/person/${p.spouse_id}`);
    const spouse = await spouseRes.json();
    spouseName = spouse.name;
  }

  
  
  if (p.father_id) {
    const fatherRes = await fetch(`/person/${p.father_id}`);
    const father = await fatherRes.json();
    fatherName = father.name;
  }

  if (p.mother_id) {
    const motherRes = await fetch(`/person/${p.mother_id}`);
    const mother = await motherRes.json();
    motherName = mother.name;
  }

  let grandfatherName = "-";
  let grandmotherName = "-";

  if (p.father_id) {
    const fatherRes = await fetch(`/person/${p.father_id}`);
    const father = await fatherRes.json();

    if (father.father_id) {
      const gfRes = await fetch(`/person/${father.father_id}`);
      const grandfather = await gfRes.json();
      grandfatherName = grandfather.name;
    }

    if (father.mother_id) {
      const gmRes = await fetch(`/person/${father.mother_id}`);
      const grandmother = await gmRes.json();
      grandmotherName = grandmother.name;
    }
  }

  let treeHtml = `<div class="family-tree">`;

  if (grandfatherName !== "-") {
    treeHtml += `
      <div class="tree-card">${grandfatherName}</div>
      <div class="tree-arrow">↓</div>
    `;
  }

  if (fatherName !== "-") {
    treeHtml += `
      <div class="tree-card">
        <span class="link-like"
          onclick="showDetail(${p.father_id})">
          ${fatherName}
        </span>
      </div>

      <div class="tree-arrow">↓</div>
    `;
  }

  // 本人＋兄弟姉妹
  treeHtml += `<div class="tree-siblings">`;

  siblings.forEach(s => {
    treeHtml += `
      <div class="tree-card">
        <span class="link-like"
          onclick="showDetail(${s.id})">
          ${s.name}
        </span>
      </div>
    `;
  });

  treeHtml += `
    <div class="tree-card tree-center">
      ${p.name}
    </div>
  `;

  treeHtml += `</div>`;

  if (children.length > 0) {

    treeHtml += `
      <div class="tree-arrow">↓</div>
      <div class="tree-children">
    `;

    children.forEach(c => {
      treeHtml += `
        <div class="tree-card">
          <span class="link-like"
            onclick="showDetail(${c.id})">
            ${c.name}
          </span>
        </div>
      `;
    });

    treeHtml += `</div>`;
  }

  treeHtml += `</div>`;

  const childrenHtml = children.length
    ? children.map(c =>
        `<span class="link-like" onclick="showDetail(${c.id})">${c.name}</span>`
      ).join(", ")
    : "-";

  const siblingsHtml = siblings.length
    ? siblings.map((s, i) =>
        `${i + 1}. <span class="link-like"
            onclick="showDetail(${s.id})">
            ${s.name}
         </span>`
      ).join("<br>")
    : "-";

  document.getElementById("detailContent").innerHTML = `
    <h2>${p.name}</h2>
    <p style="color:#666;">${p.yomi || ""}</p>

    <hr>

    <h3>名前・別名</h3>

    ${aliasesTable}

    <h3>基本情報</h3>

    <table style="border-collapse:collapse;">

    <tr>
      <td width="80"><b>生年</b></td>
      <td>${p.birth || "-"}</td>
    </tr>

    <tr>
      <td><b>没年</b></td>
      <td>${p.death || "-"}</td>
    </tr>

    <tr>
      <td><b>分類</b></td>
      <td>${p.category || "-"}</td>
    </tr>

    <tr>
      <td><b>所属</b></td>
      <td>${p.affiliation || "-"}</td>
    </tr>

    <tr>
      <td><b>居城</b></td>
      <td>
      ${p.castle_id
        ? `<span class="link-like"
             onclick="event.stopPropagation(); showCastleDetail(${p.castle_id})">
             ${p.castle}
          </span>`
        : (p.castle || "-")
      }
      </td>
    </tr>

    </table>

    <h3>参加合戦</h3>

    ${battleHtml}

    <h3>戦歴メモ</h3>

    <p>
    ${(p.history || "-").replace(/\n/g, "<br>")}
    </p>
    
    <h3>説明</h3>
    <p>${(p.description || "").replace(/\n/g, "<br>")}</p>

    
    <h3>家族関係</h3>

    <table style="border-collapse:collapse;">

    <tr>
      <td style="width:80px;"><b>祖父</b></td>
      <td>${grandfatherName}</td>
    </tr>

    <tr>
      <td><b>祖母</b></td>
      <td>${grandmotherName}</td>
    </tr>

    <tr>
      <td><b>父</b></td>
      <td>
        ${p.father_id
          ? `<span class="link-like"
               onclick="showDetail(${p.father_id})">
               ${fatherName}
             </span>`
          : "-"
        }
      </td>
    </tr>

    <tr>
      <td><b>母</b></td>
      <td>
        ${p.mother_id
          ? `<span class="link-like"
               onclick="showDetail(${p.mother_id})">
               ${motherName}
             </span>`
          : "-"
        }
      </td>
    </tr>

    <tr>
      <td><b>配偶者</b></td>
      <td>
        ${p.spouse_id
          ? `<span class="link-like"
               onclick="showDetail(${p.spouse_id})">
               ${spouseName}
             </span>`
          : "-"
        }
      </td>
    </tr>

    <tr>
      <td><b>子供</b></td>
      <td>${childrenHtml}</td>
    </tr>

    <tr>
      <td><b>兄弟姉妹</b></td>
      <td>${siblingsHtml}</td>
    </tr>

    </table>

    <h3>家系図</h3>

    <div class="info-box">
      ${treeHtml}
    </div>

    <button class="btn" onclick="closeDetail()">閉じる</button>
  `;

  document.getElementById("detailModal").style.display = "flex";
}

function closeDetail() {
  document.getElementById("detailModal").style.display = "none";
}

// ✅ ★ここに追加！！！！
async function editPerson(id) {
  const res = await fetch(`/person/${id}`);
  const p = await res.json();

  const aliasRes =
    await fetch(`/person/${id}/aliases`);

  aliasData =
    await aliasRes.json();

  renderAliasList();

  localStorage.setItem(
    "recentEdit",
    JSON.stringify({
      id: p.id,
      name: p.name
    })
  );

  showRecentEdit();

  
  // 父の名前表示
  if (p.father_id) {
    const fatherRes = await fetch(`/person/${p.father_id}`);
    const father = await fatherRes.json();
    document.getElementById("father_name").value = father.name;
  } else {
    document.getElementById("father_name").value = "";
  }

  // 母の名前表示
  if (p.mother_id) {
    const motherRes = await fetch(`/person/${p.mother_id}`);
    const mother = await motherRes.json();
    document.getElementById("mother_name").value = mother.name;
  } else {
    document.getElementById("mother_name").value = "";
  }

  document.getElementById("personId").value = p.id;
  document.getElementById("name").value = p.name || "";
  document.getElementById("yomi").value = p.yomi || "";
  document.getElementById("birth").value = p.birth || "";
  document.getElementById("death").value = p.death || "";
  document.getElementById("origin").value = p.origin || "";
  document.getElementById("category").value = p.category || "";
  document.getElementById("affiliation").value = p.affiliation || "";
  document.getElementById("castle").value = p.castle || "";
  document.getElementById("castle_id").value = p.castle_id || "";
  document.getElementById("history").value = p.history || "";
  document.getElementById("description").value = p.description || "";
  document.getElementById("source").value = (p.source || []).join(", ");
  document.getElementById("sibling_order").value =
  p.sibling_order || "";
  document.getElementById("memo1").value = p.memo1 || "";
  document.getElementById("memo2").value = p.memo2 || "";
  document.getElementById("memo3").value = p.memo3 || "";
  document.getElementById("memo4").value = p.memo4 || "";
  document.getElementById("memo5").value = p.memo5 || "";
  document.getElementById("memo6").value = p.memo6 || "";
  document.getElementById("memo7").value = p.memo7 || "";
  document.getElementById("memo8").value = p.memo8 || "";
  document.getElementById("memo9").value = p.memo9 || "";
  document.getElementById("memo10").value = p.memo10 || "";

  updateFamilyInfo();

  document.getElementById("name").scrollIntoView({
      behavior: "smooth",
      block: "center"
  });

  document.getElementById("name").focus();
  }

/* 保存 */
async function savePerson() {

  await loadAllPersons();

  const id = document.getElementById("personId").value;  // ★これ追加

  const source = document.getElementById("source").value
    ? document.getElementById("source").value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  const fatherName = document.getElementById("father_name").value.trim();
  const motherName = document.getElementById("mother_name").value.trim();
  const spouseName = document.getElementById("spouse_name").value.trim();
  

  let father_id = null;
  let mother_id = null;
  let spouse_id = null;

  // 父を検索
  const fatherPerson = allPersonsCache.find(
    p => p.name === fatherName
  );

  if (fatherPerson) {
    father_id = fatherPerson.id;
  }

  // 母を検索
  const motherPerson = allPersonsCache.find(
    p => p.name === motherName
  );

  if (motherPerson) {
    mother_id = motherPerson.id;
  }

  // 配偶者を検索
  const spousePerson = allPersonsCache.find(
    p => p.name === spouseName
  );

  if (spousePerson) {
    spouse_id = spousePerson.id;
  }

  const data = {
    name: document.getElementById("name").value,
    yomi: document.getElementById("yomi").value,
    birth: document.getElementById("birth").value,
    death: document.getElementById("death").value,
    origin: document.getElementById("origin").value,
    category: document.getElementById("category").value,
    affiliation: document.getElementById("affiliation").value,
    castle: document.getElementById("castle").value,
    castle_id:document.getElementById("castle_id").value || null,
    history: document.getElementById("history").value || null,
    description: document.getElementById("description").value,
    source: source,

    // ✅ ここが修正ポイント
    father_id: father_id,
    mother_id: mother_id,
    spouse_id: spouse_id,
    sibling_order:
      document.getElementById("sibling_order").value || null,
    siblings: null,

    memo1: document.getElementById("memo1").value,
    memo2: document.getElementById("memo2").value,
    memo3: document.getElementById("memo3").value,
    memo4: document.getElementById("memo4").value,
    memo5: document.getElementById("memo5").value,
    memo6: document.getElementById("memo6").value,
    memo7: document.getElementById("memo7").value,
    memo8: document.getElementById("memo8").value,
    memo9: document.getElementById("memo9").value,
    memo10: document.getElementById("memo10").value,
    
    aliases: aliasData

  };

  if (!data.name) {
    alert("名前必須");
    return;
  }

  // ✅ ★ここが③（重要）
  const method = id ? "PUT" : "POST";
  const url = id ? `/person/${id}` : `/person`;

  const res = await fetch(url, {
    method: method,                          // ←ここも変更
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    alert("保存失敗");
    return;
  }

  showSaveMessage();

  document.getElementById("personId").value = "";

  clearForm();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  document.getElementById("name").focus();

}

function clearForm() {
  document.getElementById("personId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("yomi").value = "";
  document.getElementById("birth").value = "";
  document.getElementById("death").value = "";
  document.getElementById("origin").value = "";
  document.getElementById("category").value = "";
  document.getElementById("affiliation").value = "";
  document.getElementById("castle").value = "";
  document.getElementById("castle_id").value = "";
  document.getElementById("description").value = "";
  document.getElementById("source").value = "";
  document.getElementById("father_name").value = "";
  document.getElementById("mother_name").value = "";
  document.getElementById("spouse_name").value = "";
  document.getElementById("childrenList").innerHTML = "-";
　document.getElementById("siblingsList").innerHTML = "-";
  document.getElementById("sibling_order").value = "";
  document.getElementById("memo1").value = "";
  document.getElementById("memo2").value = "";
  document.getElementById("memo3").value = "";
  document.getElementById("memo4").value = "";
  document.getElementById("memo5").value = "";
  document.getElementById("memo6").value = "";
  document.getElementById("memo7").value = "";
  document.getElementById("memo8").value = "";
  document.getElementById("memo9").value = "";
  document.getElementById("memo10").value = "";
  aliasData = [];

  renderAliasList();

  document.getElementById("alias_name").value = "";
  document.getElementById("alias_type").selectedIndex = 0;
}

async function deletePerson(id) {
  if (!confirm("削除していい？")) return;

  const res = await fetch(`/person/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    alert("削除失敗");
    return;
  }

  alert("削除OK");

  searchPersons();  // 一覧更新
}

async function importJson() {

  const file =
    document.getElementById("jsonFile")
      .files[0];

  if (!file) {
    alert("JSONを選択してください");
    return;
  }

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const res = await fetch(
    "/import_json",
    {
      method: "POST",
      body: formData
    }
  );

  if (!res.ok) {
    alert("復元失敗");
    return;
  }

  const result =
    await res.json();

  alert(
    `${result.count}件復元しました`
  );

  searchPersons();
}

let aliasData = [];

function addAlias() {

  const name =
    document.getElementById("alias_name")
      .value.trim();

  const type =
    document.getElementById("alias_type")
      .value;

  if (!name) {
    alert("別名を入力してください");
    return;
  }

  aliasData.push({
    alias_name: name,
    alias_type: type
  });

  renderAliasList();

  document.getElementById("alias_name")
    .value = "";
}


  
function renderAliasList() {

  const box =
    document.getElementById("aliasList");

  if (aliasData.length === 0) {
    box.innerHTML = "-";
    return;
  }

  box.innerHTML =
    aliasData.map((a, i) => `
      <div>
        ${a.alias_type}：
        ${a.alias_name}

        <button
          type="button"
          onclick="removeAlias(${i})">
          削除
        </button>

      </div>
    `).join("");
}

function removeAlias(index) {

  aliasData.splice(index, 1);

  renderAliasList();
}

// ✅ ★ここに追加！！
function toggleMemo() {
  const box = document.getElementById("memoSection");

  if (box.style.display === "none") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

Promise.all([
  loadAllPersons(),
  loadAllCastles()
]).then(() => {

  document.getElementById("memoSection")
    .style.display = "none";

  setupAutocomplete(
    "father_name",
    "father_suggest"
  );

  setupAutocomplete(
    "mother_name",
    "mother_suggest"
  );

  setupAutocomplete(
    "spouse_name",
    "spouse_suggest"
  );

  setupCastleAutocomplete();

  showRecentEdit();

  showMainTab("personTab");
});

function toggleAdmin() {

  const box =
    document.getElementById("adminMenu");

  if (box.style.display === "none") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function showRecentEdit() {

  const item =
    localStorage.getItem("recentEdit");

  if (!item) return;

  const p = JSON.parse(item);

  document.getElementById(
    "recentEditBox"
  ).innerHTML =
    `最近編集：
     <span class="link-like"
       onclick="editPerson(${p.id})">
       ${p.name}
     </span>`;
}

