import requests
import sqlite3
import json
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

DB_PATH = "sengoku.db"



# -----------------------------
# ngrok の URL を取得
# -----------------------------
def get_ngrok_url():
    try:
        data = requests.get("http://127.0.0.1:4040/api/tunnels").json()
        for tunnel in data["tunnels"]:
            if tunnel["proto"] == "https":
                return tunnel["public_url"]
    except:
        return None


# -----------------------------
# FastAPI アプリ
# -----------------------------
app = FastAPI()

# CORS（スマホアクセス用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# static フォルダ公開
app.mount("/static", StaticFiles(directory="static"), name="static")


# -----------------------------
# index.html を返す（API_BASE 置換）
# -----------------------------
@app.get("/", response_class=HTMLResponse)
def root():
    ngrok_url = get_ngrok_url() or "http://localhost:8000"

    with open("static/index.html", "r", encoding="utf-8") as f:
        html = f.read()

    html = html.replace("API_BASE_PLACEHOLDER", ngrok_url)
    return html


# -----------------------------
# DB 接続
# -----------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# -----------------------------
# Pydantic モデル（index.html に完全対応）
# -----------------------------
class Person(BaseModel):
    id: Optional[int] = None
    name: str
    yomi: Optional[str] = None
    birth: Optional[str] = None
    death: Optional[str] = None
    childhood_name: Optional[str] = None
    imina: Optional[str] = None      # ★追加
    tsusho: Optional[str] = None     # ★追加
    hogou: Optional[str] = None      # ★追加
    origin: Optional[str] = None
    category: Optional[str] = None   # ★追加
    affiliation: Optional[str] = None  # 所属
    castle: Optional[str] = None       # 居城
    rank: Optional[str] = None
    office: Optional[str] = None
    history: Optional[str] = None
    description: Optional[str] = None
    source: List[str] = Field(default_factory=list)
    father_id: Optional[int] = None
    mother_id: Optional[int] = None
    siblings: Optional[str] = None
    memo1: Optional[str] = None
    memo2: Optional[str] = None
    memo3: Optional[str] = None
    memo4: Optional[str] = None
    memo5: Optional[str] = None


# -----------------------------
# 空文字 → None に変換
# -----------------------------
def normalize_person(person: Person):
    if person.yomi == "":
        person.yomi = None
    if person.birth == "":
        person.birth = None
    if person.death == "":
        person.death = None
    if person.origin == "":
        person.origin = None
    if person.rank == "":
        person.rank = None
    if person.office == "":
        person.office = None
    if hasattr(person, "description") and person.description == "":
        person.description = None



# -----------------------------
# CRUD API
# -----------------------------
@app.get("/persons")
def list_persons():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM persons")
    rows = cur.fetchall()
    conn.close()

    result = []
    for row in rows:
        d = dict(row)
        if d.get("source"):
            try:
                d["source"] = json.loads(d["source"])
            except:
                d["source"] = []
        else:
            d["source"] = []
        result.append(d)

    return result


@app.get("/person/{person_id}")
def get_person(person_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM persons WHERE id=?", (person_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Person not found")

    d = dict(row)
    if d.get("source"):
        try:
            d["source"] = json.loads(d["source"])
        except:
            d["source"] = []
    else:
        d["source"] = []

    return d


@app.post("/person")
def create_person(person: Person = Body(...)):
    normalize_person(person)

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO persons (
            name, yomi, birth, death,
            childhood_name, imina, tsusho, hogou,
            origin, category, affiliation, castle,
            rank, office,
            history, description, source,
            memo1, memo2, memo3, memo4, memo5,
            father_id, mother_id, siblings
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        person.name, person.yomi, person.birth, person.death,
        person.childhood_name, person.imina, person.tsusho, person.hogou,
        person.origin, person.category, person.affiliation, person.castle,
        person.rank, person.office,
        person.history, person.description, json.dumps(person.source),

        person.memo1, person.memo2, person.memo3, person.memo4, person.memo5,
        person.father_id, person.mother_id, person.siblings
    ))

    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.put("/person/{person_id}")
def update_person(person_id: int, person: Person = Body(...)):
    normalize_person(person)

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE persons SET
            name=?, yomi=?, birth=?, death=?,
            childhood_name=?, imina=?, tsusho=?, hogou=?,
            origin=?, category=?, affiliation=?, castle=?,
            rank=?, office=?,
            history=?, description=?, source=?,
            memo1=?, memo2=?, memo3=?, memo4=?, memo5=?,
            father_id=?, mother_id=?, siblings=?
        WHERE id=?
    """, (
        person.name, person.yomi, person.birth, person.death,
        person.childhood_name, person.imina, person.tsusho, person.hogou,
        person.origin, person.category, person.affiliation, person.castle,
        person.rank, person.office,
        person.history, person.description, json.dumps(person.source),

        person.memo1, person.memo2, person.memo3, person.memo4, person.memo5,

        person.father_id, person.mother_id, person.siblings,
        person_id
    ))


    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.delete("/person/{person_id}")
def delete_person(person_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM persons WHERE id=?", (person_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


# -----------------------------
# 名前検索 API
# -----------------------------
@app.get("/search")
def search_persons(q: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM persons WHERE name LIKE ?", (f"%{q}%",))
    rows = cur.fetchall()
    conn.close()

    result = []
    for row in rows:
        d = dict(row)
        if d.get("source"):
            try:
                d["source"] = json.loads(d["source"])
            except:
                d["source"] = []
        else:
            d["source"] = []
        result.append(d)

    return result
