import psycopg2
import psycopg2.extras
import os
import json
import csv
from io import StringIO

from typing import Optional, List

from fastapi import (
    FastAPI,
    HTTPException,
    Body,
    Request,
    Form,
    UploadFile,
    File
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

PASSWORD = os.getenv("APP_PASSWORD")

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

@app.get("/login", response_class=HTMLResponse)
def login_page():
    return """
    <html>
    <body>

    <h2>戦国人物データベース</h2>

    <form action="/login" method="post">

        <input
            type="password"
            name="password"
            placeholder="パスワードを入力">
            
        <button type="submit">
            ログイン
        </button>
    </form>

    </body>
    </html>
    """

@app.post("/login")
def login(password: str = Form(...)):

    if PASSWORD and password.strip() == PASSWORD.strip():
        response = RedirectResponse("/", status_code=302)
        response.set_cookie("auth", "ok")
        return response

    return HTMLResponse("<h3>パスワードが違います</h3>")
# -----------------------------
# index.html を返す（API_BASE 置換）
# -----------------------------
@app.get("/", response_class=HTMLResponse)
def root(request: Request):

    if request.cookies.get("auth") != "ok":
        return RedirectResponse("/login")

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
        database="postgres",
        user="postgres.aypqupjunrzamrodcaan",
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
    spouse_id: Optional[int] = None
    sibling_order: Optional[int] = None
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
    aliases: Optional[list] = []

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
        
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
        INSERT INTO persons (
            name, yomi, birth, death,
            childhood_name, imina, tsusho, hogou,
            origin, category, affiliation, castle,
            rank, office,
            history, description, source,
            memo1, memo2, memo3, memo4, memo5,
            memo6, memo7, memo8, memo9, memo10,
            father_id, mother_id, spouse_id, sibling_order, siblings
        ) VALUES (
            %(name)s, %(yomi)s, %(birth)s, %(death)s,
            %(childhood_name)s, %(imina)s, %(tsusho)s, %(hogou)s,
            %(origin)s, %(category)s, %(affiliation)s, %(castle)s,
            %(rank)s, %(office)s,
            %(history)s, %(description)s, %(source)s,
            %(memo1)s, %(memo2)s, %(memo3)s, %(memo4)s, %(memo5)s,
            %(memo6)s, %(memo7)s, %(memo8)s, %(memo9)s, %(memo10)s,
            %(father_id)s, %(mother_id)s, %(spouse_id)s, %(sibling_order)s, %(siblings)s
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
            "spouse_id": person.spouse_id,
            "sibling_order": person.sibling_order,
            "siblings": person.siblings
        })

        cur.execute("SELECT currval(pg_get_serial_sequence('persons','id'))")
        person_id = cur.fetchone()["currval"]

        for a in person.aliases or []:

            cur.execute("""
                INSERT INTO person_aliases
                (
                   person_id,
                   alias_name,
                   alias_type
                )
                VALUES (%s,%s,%s)
            """, (
                person_id,
                a.get("alias_name"),
                a.get("alias_type")
            ))

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
            father_id=%s, mother_id=%s, spouse_id=%s, sibling_order=%s, siblings=%s
        WHERE id=%s
    """, (
        person.name, person.yomi, person.birth, person.death,
        person.childhood_name, person.imina, person.tsusho, person.hogou,
        person.origin, person.category, person.affiliation, person.castle,
        person.rank, person.office,
        person.history, person.description, json.dumps(person.source),

        person.memo1, person.memo2, person.memo3, person.memo4, person.memo5, person.memo6, 
        person.memo7, person.memo8, person.memo9, person.memo10,

        person.father_id, person.mother_id, person.spouse_id, person.sibling_order, person.siblings,
        person_id
    ))

    cur.execute("""
        DELETE FROM person_aliases
        WHERE person_id = %s
    """, (person_id,))

    for a in person.aliases or []:

    cur.execute("""
        INSERT INTO person_aliases
        (
            person_id,
            alias_name,
            alias_type
        )
        VALUES (%s,%s,%s)
    """, (
        person_id,
        a.get("alias_name"),
        a.get("alias_type")
    ))


    conn.commit()
    conn.close()
    return {"status": "ok"}

@app.get("/person/{person_id}/children")
def get_children(person_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT id, name FROM persons
        WHERE father_id = %s OR mother_id = %s
        ORDER BY sibling_order NULLS LAST, birth ASC
    """, (person_id, person_id))

    children = cur.fetchall()
    conn.close()

    return children

@app.get("/person/{person_id}/siblings")
def get_siblings(person_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("SELECT father_id, mother_id FROM persons WHERE id=%s", (person_id,))
    row = cur.fetchone()

    if not row:
        return []

    father_id = row["father_id"]
    mother_id = row["mother_id"]

    cur.execute("""
        SELECT id, name FROM persons
        WHERE (father_id = %s OR mother_id = %s)
        AND id != %s
        ORDER BY sibling_order NULLS LAST, birth ASC
    """, (father_id, mother_id, person_id))

    siblings = cur.fetchall()
    conn.close()

    return siblings

@app.delete("/person/{person_id}")
def delete_person(person_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("DELETE FROM persons WHERE id=%s", (person_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


# -----------------------------
# CSVバックアップ
# -----------------------------
@app.get("/export")
def export_csv():

    conn = get_db()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("SELECT * FROM persons")

    rows = cur.fetchall()

    conn.close()

    output = StringIO()

    if rows:

        writer = csv.DictWriter(
            output,
            fieldnames=rows[0].keys()
        )

        writer.writeheader()

        for row in rows:
            writer.writerow(dict(row))

    return Response(
        content="\ufeff" + output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition":
            "attachment; filename=sengoku_persons.csv"
        }
    )

# -----------------------------
# JSONバックアップ
# -----------------------------
@app.get("/export_json")
def export_json():

    conn = get_db()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("SELECT * FROM persons")

    rows = cur.fetchall()

    conn.close()

    data = []

    for row in rows:
        item = dict(row)

        if item.get("source"):
            try:
                item["source"] = json.loads(item["source"])
            except:
                pass

        data.append(item)

    return Response(
        content=json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
            default=str
        ),
        media_type="application/json",
        headers={
            "Content-Disposition":
            "attachment; filename=sengoku_persons.json"
        }
    )

# -----------------------------
# JSON復元
# -----------------------------
@app.post("/import_json")
async def import_json(file: UploadFile = File(...)):

    content = await file.read()

    data = json.loads(
        content.decode("utf-8")
    )

    conn = get_db()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    for person in data:

        cur.execute("""
            INSERT INTO persons (
                id,
                name,
                yomi,
                birth,
                death,
                childhood_name,
                imina,
                tsusho,
                hogou,
                origin,
                category,
                affiliation,
                castle,
                rank,
                office,
                history,
                description,
                source,
                father_id,
                mother_id,
                spouse_id,
                sibling_order,
                siblings,
                memo1,
                memo2,
                memo3,
                memo4,
                memo5,
                memo6,
                memo7,
                memo8,
                memo9,
                memo10
            )
            VALUES (
                %(id)s,
                %(name)s,
                %(yomi)s,
                %(birth)s,
                %(death)s,
                %(childhood_name)s,
                %(imina)s,
                %(tsusho)s,
                %(hogou)s,
                %(origin)s,
                %(category)s,
                %(affiliation)s,
                %(castle)s,
                %(rank)s,
                %(office)s,
                %(history)s,
                %(description)s,
                %(source)s,
                %(father_id)s,
                %(mother_id)s,
                %(spouse_id)s,
                %(sibling_order)s,
                %(siblings)s,
                %(memo1)s,
                %(memo2)s,
                %(memo3)s,
                %(memo4)s,
                %(memo5)s,
                %(memo6)s,
                %(memo7)s,
                %(memo8)s,
                %(memo9)s,
                %(memo10)s
            )
            ON CONFLICT (id)
            DO UPDATE SET
                name=EXCLUDED.name
        """, {
            **person,
            "source": json.dumps(
                person.get("source", [])
            )
        })

    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "count": len(data)
    }

# -----------------------------
# 別名取得
# -----------------------------
@app.get("/person/{person_id}/aliases")
def get_aliases(person_id: int):

    conn = get_db()

    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            id,
            alias_name,
            alias_type,
            memo
        FROM person_aliases
        WHERE person_id = %s
        ORDER BY id
    """, (person_id,))

    rows = cur.fetchall()

    conn.close()

    return rows

# -----------------------------
# 名前検索 API
# -----------------------------
@app.get("/search")
def search_persons(q: str):

    keyword = f"%{q}%"

    conn = get_db()
    cur = conn.cursor(
        cursor_factory=psycopg2.extras.RealDictCursor
    )

    cur.execute("""
        SELECT
            id,
            name,
            yomi,
            birth,
            death,
            childhood_name,
            imina,
            tsusho,
            hogou,
            category,
            affiliation,
            castle,
            origin,
            description
        FROM persons
        WHERE
            name ILIKE %s
            OR yomi ILIKE %s
            OR childhood_name ILIKE %s
            OR imina ILIKE %s
            OR tsusho ILIKE %s
            OR hogou ILIKE %s
        ORDER BY name
        LIMIT 100
    """, (
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword
    ))

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows

