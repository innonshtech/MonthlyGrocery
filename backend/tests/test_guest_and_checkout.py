"""
Iteration 7 — Guest browsing + checkout landmark/pincode validation tests.

Covers:
- POST /api/cart/hydrate (public, unauth) accepts items + returns hydrated cart w/ pricing
- POST /api/cart/merge (auth required) merges guest cart into user cart additively
- GET /api/products/all works without a city param (Pan India)
- POST /api/orders/checkout rejects missing address / landmark / bad pincode
- Order persists `landmark` and GET /orders/{id} returns it
"""
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

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://zopin-preview.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]

_mongo = MongoClient(MONGO_URL)
db = _mongo[DB_NAME]


def _mint(user_id, mobile, role="consumer", status="approved"):
    return pyjwt.encode({
        "sub": user_id, "mobile": mobile, "role": role, "status": status,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }, JWT_SECRET, algorithm="HS256")


@pytest.fixture(scope="module")
def consumer():
    tail = str(int(time.time() * 1000) % 100000000).zfill(8)
    mobile = "+9199" + tail
    doc = {"mobile": mobile, "name": "TEST_GuestConsumer", "role": "consumer",
           "status": "approved", "address": "", "city": "", "pincode": "",
           "created_at": datetime.now(timezone.utc).isoformat()}
    res = db.users.insert_one(doc)
    uid = str(res.inserted_id)
    yield {"id": uid, "mobile": mobile}
    db.users.delete_one({"_id": ObjectId(uid)})
    db.carts.delete_many({"user_id": uid})
    db.orders.delete_many({"consumer_id": uid})


@pytest.fixture
def cs(consumer):
    s = requests.Session()
    tok = _mint(consumer["id"], consumer["mobile"])
    s.headers.update({"Authorization": f"Bearer {tok}"})
    s.cookies.set("access_token", tok)
    return s


@pytest.fixture(scope="module")
def sample_products():
    r = requests.get(f"{API}/products/all", timeout=15)
    assert r.status_code == 200
    prods = r.json()["products"]
    assert len(prods) >= 1
    return prods


# ---------- Guest browsing / Pan India ----------
class TestGuestCatalog:
    def test_products_all_no_city_param(self):
        r = requests.get(f"{API}/products/all", timeout=15)
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) > 0
        # No auth needed, no city required
        for p in prods[:3]:
            assert "wholesaler_price" not in p
            assert "id" in p and "name" in p and "price" in p


# ---------- Cart hydrate (public) ----------
class TestGuestCartHydrate:
    def test_hydrate_empty(self):
        r = requests.post(f"{API}/cart/hydrate", json={"items": [], "city": ""}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["items"] == []
        assert d["subtotal"] == 0
        assert d["min_order"] == 2500.0

    def test_hydrate_with_items(self, sample_products):
        p = sample_products[0]
        r = requests.post(f"{API}/cart/hydrate",
                          json={"items": [{"product_id": p["id"], "quantity": 3}], "city": ""},
                          timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert len(d["items"]) == 1
        it = d["items"][0]
        assert it["product_id"] == p["id"]
        assert it["quantity"] == 3
        assert it["name"] == p["name"]
        assert "mrp" in it and "price" in it and "line_total" in it
        assert abs(it["line_total"] - it["price"] * 3) < 0.01
        assert abs(d["subtotal"] - it["line_total"]) < 0.01

    def test_hydrate_ignores_invalid_product(self):
        r = requests.post(f"{API}/cart/hydrate",
                          json={"items": [{"product_id": "not-an-oid", "quantity": 2}]},
                          timeout=15)
        assert r.status_code == 200
        assert r.json()["items"] == []

    def test_hydrate_unauth_no_401(self):
        # Explicit: no auth header — must NOT be 401
        r = requests.post(f"{API}/cart/hydrate", json={"items": []}, timeout=15)
        assert r.status_code == 200


# ---------- Cart merge (auth) ----------
class TestGuestCartMerge:
    def test_merge_requires_auth(self, sample_products):
        p = sample_products[0]
        r = requests.post(f"{API}/cart/merge",
                          json={"items": [{"product_id": p["id"], "quantity": 1}]},
                          timeout=15)
        assert r.status_code == 401

    def test_merge_additive(self, cs, sample_products, consumer):
        cs.post(f"{API}/cart/clear", timeout=15)
        p = sample_products[0]
        # Seed user cart with qty=2
        cs.post(f"{API}/cart/add", json={"product_id": p["id"], "quantity": 2}, timeout=15)
        # Guest cart brings qty=3 for same product -> should become 5
        r = cs.post(f"{API}/cart/merge",
                    json={"items": [{"product_id": p["id"], "quantity": 3}]}, timeout=15)
        assert r.status_code == 200, r.text
        it = next(x for x in r.json()["items"] if x["product_id"] == p["id"])
        assert it["quantity"] == 5

        # Verify persistence via GET /cart
        r2 = cs.get(f"{API}/cart/", timeout=15)
        assert r2.status_code == 200
        it2 = next(x for x in r2.json()["items"] if x["product_id"] == p["id"])
        assert it2["quantity"] == 5

        cs.post(f"{API}/cart/clear", timeout=15)

    def test_merge_new_item(self, cs, sample_products):
        cs.post(f"{API}/cart/clear", timeout=15)
        if len(sample_products) < 2:
            pytest.skip("need >= 2 products")
        p1, p2 = sample_products[0], sample_products[1]
        cs.post(f"{API}/cart/add", json={"product_id": p1["id"], "quantity": 1}, timeout=15)
        r = cs.post(f"{API}/cart/merge",
                    json={"items": [{"product_id": p2["id"], "quantity": 4}]}, timeout=15)
        assert r.status_code == 200
        ids = {x["product_id"]: x["quantity"] for x in r.json()["items"]}
        assert ids.get(p1["id"]) == 1
        assert ids.get(p2["id"]) == 4
        cs.post(f"{API}/cart/clear", timeout=15)


# ---------- Checkout validations ----------
class TestCheckoutValidation:
    def _seed_min_cart(self, cs, sample_products):
        cs.post(f"{API}/cart/clear", timeout=15)
        exp = max(sample_products, key=lambda p: p["price"])
        qty = int(6000 // exp["price"]) + 1
        cs.post(f"{API}/cart/add", json={"product_id": exp["id"], "quantity": qty}, timeout=15)
        return exp, qty

    def test_missing_address(self, cs, sample_products):
        self._seed_min_cart(cs, sample_products)
        co = {"address": "   ", "city": "Mumbai", "pincode": "400001", "landmark": "X",
              "phone": "9999900000", "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 400
        assert "address" in r.json()["detail"].lower()

    def test_missing_landmark(self, cs, sample_products):
        self._seed_min_cart(cs, sample_products)
        co = {"address": "Flat 12", "city": "Mumbai", "pincode": "400001", "landmark": "",
              "phone": "9999900000", "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 400
        assert "landmark" in r.json()["detail"].lower()

    def test_bad_pincode(self, cs, sample_products):
        self._seed_min_cart(cs, sample_products)
        co = {"address": "Flat 12", "city": "Mumbai", "pincode": "12345", "landmark": "Near park",
              "phone": "9999900000", "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 400
        assert "pin" in r.json()["detail"].lower() or "6-digit" in r.json()["detail"].lower()

    def test_pincode_with_non_digits_stripped(self, cs, sample_products):
        # pincode "40 0001" -> strips to "400001" (6 digits)
        self._seed_min_cart(cs, sample_products)
        co = {"address": "Flat 12", "city": "Mumbai", "pincode": "40 00-01",
              "landmark": "Near park", "phone": "9999900000", "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["order"]["pincode"] == "400001"
        assert r.json()["order"]["landmark"] == "Near park"

    def test_landmark_persisted_and_returned(self, cs, sample_products):
        self._seed_min_cart(cs, sample_products)
        co = {"address": "Flat 12, 5th flr", "city": "Mumbai", "pincode": "400001",
              "landmark": "Opposite Metro Station", "phone": "9999900001",
              "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()["order"]
        assert order["landmark"] == "Opposite Metro Station"
        assert order["pincode"] == "400001"

        # Fetch via GET /orders/{id}
        r2 = cs.get(f"{API}/orders/{order['id']}", timeout=15)
        assert r2.status_code == 200
        o2 = r2.json()["order"]
        assert o2["landmark"] == "Opposite Metro Station"
        assert o2["address"] == "Flat 12, 5th flr"
