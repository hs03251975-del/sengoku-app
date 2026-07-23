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



