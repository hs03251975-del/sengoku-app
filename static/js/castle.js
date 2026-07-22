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
