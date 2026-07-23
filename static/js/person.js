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



