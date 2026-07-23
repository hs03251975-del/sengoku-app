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




