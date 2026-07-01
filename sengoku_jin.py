import psycopg2
import psycopg2.extras
import os
import json
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

DB_PATH = "sengoku.db"


# -----------------------------
# FastAPI アプリ
# -----------------------------
app = FastAPI()

@app.get("/debug")
def debug():
    return {"version": "latest"}

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
    with open("static/index.html", "r", encoding="utf-8") as f:
        html = f.read()
    return html


# -----------------------------
# DB 接続
# -----------------------------
def get_db():
    return psycopg2.connect(
        host="aws-1-ap-northeast-1.pooler.supabase.com",
        port=6543,
        dbname="postgres",
        user="postgres",
        password="xUFWRwobHcWiu7It",
        sslmode="require"
    )



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
    memo6: Optional[str] = None
    memo7: Optional[str] = None
    memo8: Optional[str] = None
    memo9: Optional[str] = None
    memo10: Optional[str] = None


# -----------------------------
# 空文字 → None に変換
# -----------------------------
def normalize_person(person: Person):
    if isinstance(person.source, str):
        if person.source.strip() == "":
            person.source = []
        else:
            person.source = [s.strip() for s in person.source.split(",") if s.strip()]

    if not person.source:
        person.source = []

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
    if person.father_id == "":
        person.father_id = None
    if person.mother_id == "":
        person.mother_id = None
    if hasattr(person, "history") and person.history == "":
        person.history = None



# -----------------------------
# CRUD API
# -----------------------------
@app.get("/persons")
def list_persons():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
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
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM persons WHERE id=%s", (person_id,))
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
    try:
        normalize_person(person)

        import os
        print("DATABASE_URL =", os.environ.get("DATABASE_URL"))

        import psycopg2

        print("TRY CONNECT")

        conn = psycopg2.connect(
            "postgresql://postgres.aypqupjunrzamrodcaan:tvy2fze3@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
        )

        print("CONNECTED OK")
        cur = conn.cursor()

        cur.execute("""
        INSERT INTO persons (
            name, yomi, birth, death,
            childhood_name, imina, tsusho, hogou,
            origin, category, affiliation, castle,
            rank, office,
            history, description, source,
            memo1, memo2, memo3, memo4, memo5,
            memo6, memo7, memo8, memo9, memo10,
            father_id, mother_id, siblings
        ) VALUES (
            %(name)s, %(yomi)s, %(birth)s, %(death)s,
            %(childhood_name)s, %(imina)s, %(tsusho)s, %(hogou)s,
            %(origin)s, %(category)s, %(affiliation)s, %(castle)s,
            %(rank)s, %(office)s,
            %(history)s, %(description)s, %(source)s,
            %(memo1)s, %(memo2)s, %(memo3)s, %(memo4)s, %(memo5)s,
            %(memo6)s, %(memo7)s, %(memo8)s, %(memo9)s, %(memo10)s,
            %(father_id)s, %(mother_id)s, %(siblings)s
        )
        """, {
            "name": person.name,
            "yomi": person.yomi,
            "birth": person.birth,
            "death": person.death,
            "childhood_name": person.childhood_name,
            "imina": person.imina,
            "tsusho": person.tsusho,
            "hogou": person.hogou,
            "origin": person.origin,
            "category": person.category,
            "affiliation": person.affiliation,
            "castle": person.castle,
            "rank": person.rank,
            "office": person.office,
            "history": person.history,
            "description": person.description,
            "source": json.dumps(person.source),
            "memo1": person.memo1,
            "memo2": person.memo2,
            "memo3": person.memo3,
            "memo4": person.memo4,
            "memo5": person.memo5,
            "memo6": person.memo6,
            "memo7": person.memo7,
            "memo8": person.memo8,
            "memo9": person.memo9,
            "memo10": person.memo10,
            "father_id": person.father_id,
            "mother_id": person.mother_id,
            "siblings": person.siblings
        })

        conn.commit()
        conn.close()

        return {"status": "ok"}

    except Exception as e:
        print("❌ ERROR:", e)   # ← これ重要
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/person/{person_id}")
def update_person(person_id: int, person: Person = Body(...)):
    normalize_person(person)

    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        UPDATE persons SET
            name=%s, yomi=%s, birth=%s, death=%s,
            childhood_name=%s, imina=%s, tsusho=%s, hogou=%s,
            origin=%s, category=%s, affiliation=%s, castle=%s,
            rank=%s, office=%s,
            history=%s, description=%s, source=%s,
            memo1=%s, memo2=%s, memo3=%s, memo4=%s, memo5=%s, memo6=%s, 
            memo7=%s, memo8=%s, memo9=%s, memo10=%s,
            father_id=%s, mother_id=%s, siblings=%s
        WHERE id=%s
    """, (
        person.name, person.yomi, person.birth, person.death,
        person.childhood_name, person.imina, person.tsusho, person.hogou,
        person.origin, person.category, person.affiliation, person.castle,
        person.rank, person.office,
        person.history, person.description, json.dumps(person.source),

        person.memo1, person.memo2, person.memo3, person.memo4, person.memo5, person.memo6, 
        person.memo7, person.memo8, person.memo9, person.memo10,

        person.father_id, person.mother_id, person.siblings,
        person_id
    ))


    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.delete("/person/{person_id}")
def delete_person(person_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("DELETE FROM persons WHERE id=%s", (person_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


# -----------------------------
# 名前検索 API
# -----------------------------
@app.get("/search")
def search_persons(q: str):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM persons WHERE name LIKE %s", (f"%{q}%",))
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



