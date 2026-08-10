"""Iteration 8 tests — Banner CRUD + MIN_ORDER change (5000 -> 2500) + perf sanity."""
import os
import time
import jwt as pyjwt
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()).rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
SUPER_MOBILE = os.environ.get("SUPER_ADMIN_MOBILE", "+919833833498")

_mongo = MongoClient(MONGO_URL)
db = _mongo[DB_NAME]


def _mint(uid, mobile, role, status="approved"):
    return pyjwt.encode({
        "sub": uid, "mobile": mobile, "role": role, "status": status,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }, JWT_SECRET, algorithm="HS256")


def _sess(uid, mobile, role, status="approved"):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {_mint(uid, mobile, role, status)}"})
    s.cookies.set("access_token", _mint(uid, mobile, role, status))
    return s


def _mk_user(role, status="approved", name="TestBan"):
    tail = str(int(time.time() * 1000) % 100000000).zfill(8)
    mobile = "+9198" + tail
    doc = {"mobile": mobile, "name": f"TEST_{name}", "role": role, "status": status,
           "address": "", "city": "", "pincode": "",
           "created_at": datetime.now(timezone.utc).isoformat()}
    r = db.users.insert_one(doc)
    time.sleep(0.005)
    return {"id": str(r.inserted_id), "mobile": mobile}


@pytest.fixture(scope="module")
def super_sess():
    sa = db.users.find_one({"mobile": SUPER_MOBILE})
    assert sa, "super admin not seeded"
    return _sess(str(sa["_id"]), sa["mobile"], "super_admin")


@pytest.fixture(scope="module")
def admin_sess():
    u = _mk_user("admin", "approved", "AdmB")
    yield _sess(u["id"], u["mobile"], "admin")
    db.users.delete_one({"_id": ObjectId(u["id"])})


@pytest.fixture(scope="module")
def consumer_sess():
    u = _mk_user("consumer", "approved", "ConB")
    yield _sess(u["id"], u["mobile"], "consumer"), u
    db.users.delete_one({"_id": ObjectId(u["id"])})
    db.carts.delete_many({"user_id": u["id"]})
    db.orders.delete_many({"consumer_id": u["id"]})


@pytest.fixture(autouse=True)
def _clean_test_banners():
    # cleanup TEST_* banners before & after
    db.banners.delete_many({"title": {"$regex": "^TEST_"}})
    yield
    db.banners.delete_many({"title": {"$regex": "^TEST_"}})


# ---------- Public banner endpoint ----------
class TestBannersPublic:
    def test_active_public_no_auth(self):
        r = requests.get(f"{API}/banners/active", timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "banners" in j and isinstance(j["banners"], list)


# ---------- Auth guards ----------
class TestBannersAuth:
    def test_admin_list_forbidden_consumer(self, consumer_sess):
        s, _ = consumer_sess
        assert s.get(f"{API}/admin/banners", timeout=15).status_code == 403

    def test_admin_list_forbidden_admin(self, admin_sess):
        assert admin_sess.get(f"{API}/admin/banners", timeout=15).status_code == 403

    def test_admin_list_unauth(self):
        assert requests.get(f"{API}/admin/banners", timeout=15).status_code == 401

    def test_admin_create_forbidden_admin(self, admin_sess):
        r = admin_sess.post(f"{API}/admin/banners", json={"title": "TEST_X"}, timeout=15)
        assert r.status_code == 403

    def test_admin_update_forbidden_admin(self, admin_sess):
        r = admin_sess.put(f"{API}/admin/banners/{ObjectId()}", json={"title": "TEST_X"}, timeout=15)
        assert r.status_code == 403

    def test_admin_delete_forbidden_consumer(self, consumer_sess):
        s, _ = consumer_sess
        assert s.delete(f"{API}/admin/banners/{ObjectId()}", timeout=15).status_code == 403

    def test_admin_reorder_forbidden_unauth(self):
        assert requests.post(f"{API}/admin/banners/reorder", json={"ids": []}, timeout=15).status_code == 401


# ---------- CRUD ----------
class TestBannersCRUD:
    def test_create_appears_in_active(self, super_sess):
        payload = {"title": "TEST_Diwali Sale", "subtitle": "40% off",
                   "gradient": "from-green-500 to-emerald-600", "order": 1,
                   "enabled": True, "tag": "SALE", "icon": "🪔"}
        r = super_sess.post(f"{API}/admin/banners", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        b = r.json()["banner"]
        assert b["title"] == "TEST_Diwali Sale"
        bid = b["id"]

        # public endpoint
        pub = requests.get(f"{API}/banners/active", timeout=15).json()["banners"]
        titles = [x["title"] for x in pub]
        assert "TEST_Diwali Sale" in titles

    def test_update_persists(self, super_sess):
        payload = {"title": "TEST_Orig", "subtitle": "", "gradient": "g", "enabled": True, "order": 5}
        cr = super_sess.post(f"{API}/admin/banners", json=payload, timeout=15).json()["banner"]
        upd = {**payload, "title": "TEST_Updated"}
        r = super_sess.put(f"{API}/admin/banners/{cr['id']}", json=upd, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["banner"]["title"] == "TEST_Updated"

    def test_delete_removes(self, super_sess):
        cr = super_sess.post(f"{API}/admin/banners",
                             json={"title": "TEST_Del", "enabled": True}, timeout=15).json()["banner"]
        r = super_sess.delete(f"{API}/admin/banners/{cr['id']}", timeout=15)
        assert r.status_code == 200
        assert r.json().get("success") is True
        pub = requests.get(f"{API}/banners/active", timeout=15).json()["banners"]
        assert cr["id"] not in [b["id"] for b in pub]

    def test_reorder(self, super_sess):
        b1 = super_sess.post(f"{API}/admin/banners", json={"title": "TEST_A", "order": 1, "enabled": True}, timeout=15).json()["banner"]
        b2 = super_sess.post(f"{API}/admin/banners", json={"title": "TEST_B", "order": 2, "enabled": True}, timeout=15).json()["banner"]
        # reverse
        r = super_sess.post(f"{API}/admin/banners/reorder", json={"ids": [b2["id"], b1["id"]]}, timeout=15)
        assert r.status_code == 200
        listed = super_sess.get(f"{API}/admin/banners", timeout=15).json()["banners"]
        by_id = {b["id"]: b for b in listed}
        assert by_id[b2["id"]]["order"] == 1
        assert by_id[b1["id"]]["order"] == 2


# ---------- Scheduling & toggle ----------
class TestBannerScheduling:
    def _titles_active(self):
        return [b["title"] for b in requests.get(f"{API}/banners/active", timeout=15).json()["banners"]]

    def test_future_start_hidden(self, super_sess):
        future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        cr = super_sess.post(f"{API}/admin/banners",
                             json={"title": "TEST_Future", "enabled": True, "start_at": future}, timeout=15).json()["banner"]
        assert "TEST_Future" not in self._titles_active()

    def test_past_end_hidden(self, super_sess):
        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        super_sess.post(f"{API}/admin/banners",
                        json={"title": "TEST_Past", "enabled": True, "end_at": past}, timeout=15)
        assert "TEST_Past" not in self._titles_active()

    def test_future_end_visible(self, super_sess):
        future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        super_sess.post(f"{API}/admin/banners",
                        json={"title": "TEST_Fend", "enabled": True, "end_at": future}, timeout=15)
        assert "TEST_Fend" in self._titles_active()

    def test_toggle_disabled_hidden(self, super_sess):
        cr = super_sess.post(f"{API}/admin/banners",
                             json={"title": "TEST_Off", "enabled": False}, timeout=15).json()["banner"]
        assert "TEST_Off" not in self._titles_active()
        # toggle on
        super_sess.put(f"{API}/admin/banners/{cr['id']}",
                       json={"title": "TEST_Off", "enabled": True}, timeout=15)
        assert "TEST_Off" in self._titles_active()


# ---------- MIN_ORDER = 2500 ----------
class TestMinOrder2500:
    def test_hydrate_min_order(self):
        r = requests.post(f"{API}/cart/hydrate", json={"items": []}, timeout=15)
        assert r.status_code == 200
        assert r.json()["min_order"] == 2500.0

    def test_checkout_below_min(self, consumer_sess):
        s, u = consumer_sess
        s.post(f"{API}/cart/clear", timeout=15)
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        cheap = min(prods, key=lambda p: p["price"])
        s.post(f"{API}/cart/add", json={"product_id": cheap["id"], "quantity": 1}, timeout=15)
        co = {"address": "A", "city": "B", "pincode": "560001", "landmark": "L",
              "phone": "9999900000", "delivery_slot": "Today", "payment_method": "COD"}
        r = s.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 400
        assert "2500" in r.json()["detail"]
        assert "5000" not in r.json()["detail"]

    def test_checkout_above_min_success(self, consumer_sess):
        s, u = consumer_sess
        s.post(f"{API}/cart/clear", timeout=15)
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        exp = max(prods, key=lambda p: p["price"])
        qty = int(2600 // exp["price"]) + 1
        s.post(f"{API}/cart/add", json={"product_id": exp["id"], "quantity": qty}, timeout=15)
        co = {"address": "A", "city": "B", "pincode": "560001", "landmark": "L",
              "phone": "9999900000", "delivery_slot": "Today", "payment_method": "COD"}
        r = s.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["order"]["status"] == "placed"


# ---------- Perf sanity ----------
class TestPerf:
    def test_products_all_projection(self):
        """Spec says response should NOT contain description/video_url/images heavy fields."""
        r = requests.get(f"{API}/products/all", timeout=15)
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) > 0
        p0 = prods[0]
        # These heavy fields should be absent or empty
        for k in ("description", "video_url", "images", "search_keywords"):
            if k in p0:
                v = p0[k]
                assert v in ("", [], None), f"Heavy field '{k}' has non-empty value in list endpoint: {v!r}"

    def test_hydrate_speed_5_items(self):
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"][:5]
        payload = {"items": [{"product_id": p["id"], "quantity": 2} for p in prods]}
        # warm-up
        requests.post(f"{API}/cart/hydrate", json=payload, timeout=15)
        start = time.time()
        r = requests.post(f"{API}/cart/hydrate", json=payload, timeout=15)
        elapsed_ms = (time.time() - start) * 1000
        assert r.status_code == 200
        assert len(r.json()["items"]) == 5
        # loose bound for network jitter; spec says <200ms internally, we allow 1500ms E2E
        assert elapsed_ms < 1500, f"hydrate took {elapsed_ms:.0f}ms"
