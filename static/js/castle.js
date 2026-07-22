// 城一覧取得
async function loadCastleList() {

  const res =
    await fetch("/castles");

  const castles =
    await res.json();

  document.getElementById(
    "castleResults"
  ).innerHTML = castles.map(c => `

    <div class="card">

      <div style="display:flex;align-items:center;">

        <div style="flex:1;">

          <b>${c.name}</b>

          （${c.province || "-"}）

        </div>

        <button
          class="list-btn"
          onclick="showCastleDetail(${c.id})">

          詳細

        </button>

        <button
          class="list-btn"
          onclick="editCastle(${c.id})">

          編集

        </button>

        <button
          class="list-btn"
          onclick="deleteCastle(${c.id})">

          削除

        </button>

      </div>

    </div>

  `).join("");
}

// 城検索
async function searchCastles() {

  const keyword =
    document.getElementById("castleSearch")
      .value.trim();

  const res =
    await fetch("/castles");

  let castles =
    await res.json();

  if (keyword) {

    castles = castles.filter(c =>
      c.name &&
      c.name.includes(keyword)
    );

  }

  document.getElementById(
    "castleResults"
  ).innerHTML = castles.map(c => `

    <div class="card">

      <div style="display:flex;align-items:center;">

        <div style="flex:1;">

          <b>${c.name}</b>

          （${c.province || "-"}）

        </div>

        <button
          class="list-btn"
          onclick="showCastleDetail(${c.id})">

          詳細

        </button>

        <button
          class="list-btn"
          onclick="editCastle(${c.id})">

          編集

        </button>

        <button
          class="list-btn"
          onclick="deleteCastle(${c.id})">

          削除

        </button>

      </div>

    </div>

  `).join("");
}

async function showCastleDetail(castleId) {

  const res =
    await fetch(`/castle/${castleId}`);

  const castle =
    await res.json();

  document.getElementById(
    "castleContent"
  ).innerHTML = `

    <h2>${castle.name}</h2>

    <table>

      <tr>
        <td><b>よみ</b></td>
        <td>${castle.yomi || "-"}</td>
      </tr>

      <tr>
        <td><b>旧国名</b></td>
        <td>${castle.province || "-"}</td>
      </tr>

      <tr>
        <td><b>所在地</b></td>
        <td>${castle.location || "-"}</td>
      </tr>

    </table>

    <h3>説明</h3>

    <p>
      ${(castle.description || "-")
        .replace(/\n/g,"<br>")}
    </p>

    <button
      class="btn"
      onclick="closeCastleDetail()">
      閉じる
    </button>
  `;

  document.getElementById(
    "castleModal"
  ).style.display = "flex";
}

function closeCastleDetail() {

  document.getElementById(
    "castleModal"
  ).style.display = "none";

}

async function editCastle(id) {

  const res =
    await fetch(`/castle/${id}`);

  const c =
    await res.json();

  document.getElementById(
    "castleId"
  ).value = c.id;

  document.getElementById(
    "castleName"
  ).value = c.name || "";

  document.getElementById(
    "castleYomi"
  ).value = c.yomi || "";

  document.getElementById(
    "castleProvince"
  ).value = c.province || "";

  document.getElementById(
    "castleLocation"
  ).value = c.location || "";

  document.getElementById(
    "castleDescription"
  ).value = c.description || "";

}

async function saveCastle() {

  const id =
    document.getElementById(
      "castleId"
    ).value;

  const data = {

    name:
      document.getElementById("castleName").value,

    yomi:
      document.getElementById("castleYomi").value,

    province:
      document.getElementById("castleProvince").value,

    location:
      document.getElementById("castleLocation").value,

    description:
      document.getElementById("castleDescription").value

  };

  if (!data.name) {

    alert("城名必須");
    return;

  }

  const method =
    id ? "PUT" : "POST";

  const url =
    id ? `/castle/${id}` : "/castle";

  const res =
    await fetch(url, {

      method: method,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)

    });

  if (!res.ok) {

    alert("保存失敗");
    return;

  }

  alert("保存OK");

  document.getElementById("castleId").value = "";

  document.getElementById("castleName").value = "";

  document.getElementById("castleYomi").value = "";

  document.getElementById("castleProvince").value = "";

  document.getElementById("castleLocation").value = "";

  document.getElementById("castleDescription").value = "";

}

async function deleteCastle(id) {

  if (!confirm("削除していい？")) {
    return;
  }

  const res =
    await fetch(`/castle/${id}`, {
      method: "DELETE"
    });

  if (!res.ok) {

    alert("削除失敗");
    return;

  }

  alert("削除OK");

  searchCastles();

}

function setupCastleAutocomplete() {

  const input =
    document.getElementById("castle");

  const box =
    document.getElementById("castle_suggest");

  input.addEventListener("input", () => {

    const keyword =
      input.value.trim();

    if (!keyword) {
      box.style.display = "none";
      return;
    }

    const matches =
      allCastlesCache.filter(
        c =>
          c.name &&
          c.name.includes(keyword)
      );

    if (matches.length === 0) {
      box.style.display = "none";
      return;
    }

   box.innerHTML =
     matches.map(c => `
       <div
         class="autocomplete-item"
         onclick="selectCastle(${c.id}, '${c.name}')">

         ${c.name}
         （${c.province || "旧国名不明"}）

       </div>
     `).join("");

    box.style.display = "block";
  });
}

function selectCastle(id, name) {

  document.getElementById("castle").value =
    name;

  document.getElementById("castle_id").value =
    id;

  document.getElementById(
    "castle_suggest"
  ).style.display = "none";
}
