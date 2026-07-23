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


