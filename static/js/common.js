let allPersonsCache = [];
let allCastlesCache = [];

async function loadAllPersons() {
  const res = await fetch("/persons");
  allPersonsCache = await res.json();
}

async function loadAllCastles() {
  const res = await fetch("/castles");
  allCastlesCache = await res.json();
}

function showMainTab(tabId) {

  document.getElementById("adminTab")
    .style.display = "none";

  document.getElementById("personTab")
    .style.display = "none";

  document.getElementById("castleTab")
    .style.display = "none";

  document.getElementById("battleTab")
    .style.display = "none";

  document.getElementById(tabId)
    .style.display = "block";
}

function showSaveMessage(text = "保存しました") {

  const box =
    document.getElementById("saveMessage");

  box.textContent = text;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 2000);
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
