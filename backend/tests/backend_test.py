"""
MonthlyGrocery backend regression tests — iteration 4 (OTP + 3-role rewrite).

Twilio Verify is mocked at the boundary: we do NOT call send-otp/verify-otp against
real Twilio (trial account, costs SMS). Instead we seed users directly into MongoDB
and mint JWT tokens with the backend's JWT_SECRET, then use Authorization: Bearer.
Rate-limit behaviour of /send-otp is exercised by pre-populating otp_attempts so the
429 path fires before Twilio is invoked.
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
SUPER_MOBILE = os.environ.get("SUPER_ADMIN_MOBILE", "+919833833498")

_mongo = MongoClient(MONGO_URL)
db = _mongo[DB_NAME]


def _mint_token(user_id: str, mobile: str, role: str, status: str = "approved") -> str:
    return pyjwt.encode({
        "sub": user_id, "mobile": mobile, "role": role, "status": status,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }, JWT_SECRET, algorithm="HS256")


def _sess_for(user_id: str, mobile: str, role: str, status: str = "approved"):
    tok = _mint_token(user_id, mobile, role, status)
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}"})
    s.cookies.set("access_token", tok)
    return s


def _mk_user(role: str, status: str = "approved", name: str = "TestUser") -> dict:
    tail = str(int(time.time() * 1000) % 100000000).zfill(8)
    mobile = "+9199" + tail
    doc = {
        "mobile": mobile, "name": f"TEST_{name}", "role": role, "status": status,
        "address": "", "city": "", "pincode": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = db.users.insert_one(doc)
    time.sleep(0.01)
    return {"id": str(res.inserted_id), "mobile": mobile, "role": role, "status": status}


@pytest.fixture(scope="module")
def consumer():
    u = _mk_user("consumer", "approved", "Consumer")
    yield u
    db.users.delete_one({"_id": ObjectId(u["id"])})
    db.carts.delete_many({"user_id": u["id"]})
    db.orders.delete_many({"consumer_id": u["id"]})


@pytest.fixture(scope="module")
def admin_approved():
    u = _mk_user("admin", "approved", "AdminApproved")
    yield u
    db.users.delete_one({"_id": ObjectId(u["id"])})


@pytest.fixture(scope="module")
def admin_pending():
    u = _mk_user("admin", "pending", "AdminPending")
    yield u
    db.users.delete_one({"_id": ObjectId(u["id"])})


@pytest.fixture(scope="module")
def super_admin():
    sa = db.users.find_one({"mobile": SUPER_MOBILE})
    assert sa is not None, "Super admin not seeded!"
    return {"id": str(sa["_id"]), "mobile": sa["mobile"], "role": "super_admin", "status": "approved"}


@pytest.fixture
def cs(consumer):
    return _sess_for(consumer["id"], consumer["mobile"], "consumer", "approved")


@pytest.fixture
def aps(admin_pending):
    return _sess_for(admin_pending["id"], admin_pending["mobile"], "admin", "pending")


@pytest.fixture
def aas(admin_approved):
    return _sess_for(admin_approved["id"], admin_approved["mobile"], "admin", "approved")


@pytest.fixture
def sas(super_admin):
    return _sess_for(super_admin["id"], super_admin["mobile"], "super_admin", "approved")


# ---------- Health ----------
def test_health_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200


# ---------- Auth OTP ----------
class TestAuthOtp:
    def test_send_otp_rate_limit(self):
        mobile = "+919000012345"
        db.otp_attempts.delete_many({"mobile": mobile})
        now = datetime.now(timezone.utc).isoformat()
        for _ in range(3):
            db.otp_attempts.insert_one({"mobile": mobile, "requested_role": "consumer", "created_at": now})
        r = requests.post(f"{API}/auth/send-otp", json={"mobile": "9000012345", "role": "consumer"}, timeout=15)
        db.otp_attempts.delete_many({"mobile": mobile})
        assert r.status_code == 429, f"expected 429 got {r.status_code} {r.text}"
        assert "many" in r.json().get("detail", "").lower()

    def test_send_otp_invalid_role(self):
        r = requests.post(f"{API}/auth/send-otp", json={"mobile": "9000000001", "role": "hacker"}, timeout=15)
        assert r.status_code == 400
        assert "role" in r.json()["detail"].lower()

    def test_verify_otp_missing_code(self):
        r = requests.post(f"{API}/auth/verify-otp", json={"mobile": "9000000002", "code": ""}, timeout=15)
        assert r.status_code == 400

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_consumer_shape(self, cs, consumer):
        r = cs.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()["user"]
        assert u["role"] == "consumer"
        assert u["mobile"] == consumer["mobile"]
        assert "email" not in u
        for k in ("id", "mobile", "name", "role", "status", "address", "city", "pincode"):
            assert k in u

    def test_me_super_admin(self, sas):
        r = sas.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["role"] == "super_admin"
        assert u["mobile"] == SUPER_MOBILE
        assert u["status"] == "approved"

    def test_logout(self, cs):
        r = cs.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200


# ---------- Role guards ----------
class TestRoleGuards:
    def test_consumer_forbidden_products_mine_get(self, cs):
        assert cs.get(f"{API}/products/mine", timeout=15).status_code == 403

    def test_consumer_forbidden_products_mine_post(self, cs):
        assert cs.post(f"{API}/products/mine", json={"name": "X"}, timeout=15).status_code == 403

    def test_consumer_forbidden_ai(self, cs):
        assert cs.post(f"{API}/ai/product-description", json={"product_name": "x"}, timeout=30).status_code == 403

    def test_consumer_forbidden_admin(self, cs):
        assert cs.get(f"{API}/admin/admins", timeout=15).status_code == 403

    def test_pending_admin_forbidden_write(self, aps):
        r = aps.post(f"{API}/products/mine", json={"name": "X", "mrp": 100, "price": 80}, timeout=15)
        assert r.status_code == 403

    def test_pending_admin_forbidden_list_mine(self, aps):
        # /products/mine requires approved admin
        assert aps.get(f"{API}/products/mine", timeout=15).status_code == 403

    def test_approved_admin_ok(self, aas):
        assert aas.get(f"{API}/products/mine", timeout=15).status_code == 200

    def test_super_admin_ok(self, sas):
        assert sas.get(f"{API}/products/mine", timeout=15).status_code == 200
        assert sas.get(f"{API}/admin/admins", timeout=15).status_code == 200


# ---------- SKU model ----------
class TestSkuModel:
    def test_create_sku_new_fields(self, aas):
        payload = {
            "name": "TEST_Regression Basmati 5kg",
            "brand": "TestBrand", "company": "TestCo",
            "primary_category": "Atta & Rice", "secondary_category": "Basmati Rice",
            "place": "Punjab", "quantity_value": 5, "quantity_unit": "kg", "unit": "5kg",
            "mrp": 1000, "price": 800,
            "images": ["https://i/a.jpg", "https://i/b.jpg"],
            "video_url": "https://youtu.be/xyz",
            "search_keywords": ["testkw1", "टेस्ट"], "available": True,
        }
        r = aas.post(f"{API}/products/mine", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        p = r.json()["product"]
        pid = p["id"]
        try:
            assert p["discount_percent"] == 20
            assert p["you_save"] == 200
            for k in ("primary_category", "secondary_category", "brand", "company", "place",
                      "quantity_value", "quantity_unit", "images", "video_url", "search_keywords"):
                assert k in p
            assert p["images"] == payload["images"]
            assert p["search_keywords"] == payload["search_keywords"]
        finally:
            aas.delete(f"{API}/products/mine/{pid}", timeout=15)


# ---------- Catalog tree ----------
class TestCatalogTree:
    def test_tree_hierarchy(self):
        r = requests.get(f"{API}/products/tree", timeout=15)
        assert r.status_code == 200
        cats = r.json()["categories"]
        names = {c["name"] for c in cats}
        expected = {"Atta & Rice", "Pulses & Grains", "Cooking Essentials", "Dairy Staples",
                    "Snacks", "Beverages", "Household", "Personal Care", "Instant Food"}
        assert expected.issubset(names), f"missing: {expected - names}"
        total_subs = sum(len(c["subs"]) for c in cats)
        assert total_subs >= 15, f"got only {total_subs} secondary categories"


# ---------- Search ----------
class TestSearch:
    def _q(self, q):
        r = requests.get(f"{API}/products/all", params={"q": q}, timeout=15)
        assert r.status_code == 200
        return r.json()["products"]

    def test_soap(self):
        assert len(self._q("soap")) >= 3

    def test_atta(self):
        assert len(self._q("atta")) >= 2

    def test_tel_hinglish(self):
        assert len(self._q("tel")) >= 3

    def test_devanagari(self):
        assert len(self._q("आटा")) >= 2

    def test_chai(self):
        assert len(self._q("chai")) >= 1

    def test_category_filter(self):
        r = requests.get(f"{API}/products/all",
                         params={"category": "Personal Care", "secondary": "Soap"}, timeout=15)
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) >= 1
        for p in prods:
            assert p["primary_category"] == "Personal Care"
            assert p["secondary_category"] == "Soap"


# ---------- Cart ----------
class TestCart:
    def test_cart_shape(self, cs):
        cs.post(f"{API}/cart/clear", timeout=15)
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        pid = prods[0]["id"]
        r = cs.post(f"{API}/cart/add", json={"product_id": pid, "quantity": 2}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("items", "mrp_total", "subtotal", "savings", "savings_percent",
                  "delivery_fee", "platform_fee", "min_order"):
            assert k in d, f"missing {k}"
        assert d["min_order"] == 2500.0
        assert d["delivery_fee"] == 0
        assert d["platform_fee"] == 0
        it = d["items"][0]
        assert "line_mrp" in it and "line_savings" in it
        cs.post(f"{API}/cart/clear", timeout=15)


# ---------- Checkout ----------
class TestCheckout:
    def test_below_min_order_blocked(self, cs):
        cs.post(f"{API}/cart/clear", timeout=15)
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        cheap = min(prods, key=lambda p: p["price"])
        cs.post(f"{API}/cart/add", json={"product_id": cheap["id"], "quantity": 1}, timeout=15)
        co = {"address": "A", "city": "B", "pincode": "560001", "landmark": "Near park",
              "phone": "9999900000", "delivery_slot": "Today", "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 400
        assert "2500" in r.json()["detail"]

    def test_above_min_order_success(self, cs):
        cs.post(f"{API}/cart/clear", timeout=15)
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        exp = max(prods, key=lambda p: p["price"])
        qty = int(3000 // exp["price"]) + 1
        cs.post(f"{API}/cart/add", json={"product_id": exp["id"], "quantity": qty}, timeout=15)
        co = {"address": "A", "city": "B", "pincode": "560001", "landmark": "Near park",
              "phone": "9999900000", "delivery_slot": "Today", "payment_method": "COD"}
        r = cs.post(f"{API}/orders/checkout", json=co, timeout=20)
        assert r.status_code == 200, r.text
        o = r.json()["order"]
        assert o["status"] == "placed"
        assert o["delivery_otp"] and len(o["delivery_otp"]) == 4
        for k in ("mrp_total", "savings", "savings_percent"):
            assert k in o
        assert o["delivery_fee"] == 0
        assert o["platform_fee"] == 0


# ---------- Super admin approvals ----------
class TestSuperAdminApprovals:
    def test_list_admins(self, sas):
        r = sas.get(f"{API}/admin/admins", timeout=15)
        assert r.status_code == 200
        roles = {a["role"] for a in r.json()["admins"]}
        assert "super_admin" in roles

    def test_approve_admin(self, sas, admin_pending):
        r = sas.post(f"{API}/admin/admins/{admin_pending['id']}/status",
                     json={"status": "approved"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "approved"
        db.users.update_one({"_id": ObjectId(admin_pending["id"])}, {"$set": {"status": "pending"}})

    def test_cannot_modify_super_admin(self, sas, super_admin):
        r = sas.post(f"{API}/admin/admins/{super_admin['id']}/status",
                     json={"status": "suspended"}, timeout=15)
        assert r.status_code == 400
        assert "super" in r.json()["detail"].lower()

    def test_invalid_status(self, sas, admin_pending):
        r = sas.post(f"{API}/admin/admins/{admin_pending['id']}/status",
                     json={"status": "foo"}, timeout=15)
        assert r.status_code == 400


# ---------- Upload ----------
class TestUpload:
    def test_image_upload(self, aas):
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
               b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01"
               b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
        # Send without Content-Type: application/json (requests handles multipart)
        r = aas.post(f"{API}/upload/image", files={"file": ("t.png", png, "image/png")}, timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["url"].startswith("/api/uploads/") and j["url"].endswith(".png")
        assert j["mime"] == "image/png"


# ---------- Twilio admin endpoints (iteration 5) ----------
class TestTwilioAdmin:
    def test_twilio_status_super_admin_ok(self, sas):
        r = sas.get(f"{API}/admin/twilio/status", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("configured", "masked_account_sid", "masked_service_sid",
                  "otps_last_24h", "otps_all_time", "provider", "channel"):
            assert k in d, f"missing {k}"
        assert d["configured"] is True
        # Env has TWILIO_ACCOUNT_SID starting with AC... — masked SID should not equal full SID
        full_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
        assert d["masked_account_sid"] != full_sid
        assert d["masked_account_sid"].startswith(full_sid[:6])
        assert "…" in d["masked_account_sid"] or "***" in d["masked_account_sid"]
        assert isinstance(d["otps_last_24h"], int)
        assert isinstance(d["otps_all_time"], int)
        assert d["otps_all_time"] >= d["otps_last_24h"]
        assert d["provider"] == "Twilio Verify API"
        assert d["channel"] == "SMS"

    def test_twilio_status_admin_forbidden(self, aas):
        r = aas.get(f"{API}/admin/twilio/status", timeout=15)
        assert r.status_code == 403

    def test_twilio_status_consumer_forbidden(self, cs):
        r = cs.get(f"{API}/admin/twilio/status", timeout=15)
        assert r.status_code == 403

    def test_twilio_status_unauthenticated(self):
        r = requests.get(f"{API}/admin/twilio/status", timeout=15)
        assert r.status_code == 401

    def test_twilio_logs_super_admin_ok(self, sas):
        # Seed a known OTP attempt
        marker_mobile = "+919000098765"
        db.otp_attempts.delete_many({"mobile": marker_mobile})
        db.otp_attempts.insert_one({
            "mobile": marker_mobile, "requested_role": "consumer",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = sas.get(f"{API}/admin/twilio/logs", timeout=15)
            assert r.status_code == 200, r.text
            logs = r.json()["logs"]
            assert isinstance(logs, list)
            if logs:
                entry = logs[0]
                for k in ("mobile", "requested_role", "created_at"):
                    assert k in entry
            mobiles = {l["mobile"] for l in logs}
            assert marker_mobile in mobiles, "seeded otp_attempt did not appear in twilio/logs"
        finally:
            db.otp_attempts.delete_many({"mobile": marker_mobile})

    def test_twilio_logs_admin_forbidden(self, aas):
        assert aas.get(f"{API}/admin/twilio/logs", timeout=15).status_code == 403

    def test_twilio_logs_consumer_forbidden(self, cs):
        assert cs.get(f"{API}/admin/twilio/logs", timeout=15).status_code == 403

    def test_send_otp_increments_counter(self, sas):
        """Simulate send-otp writing to otp_attempts (avoid burning real SMS) and verify
        the /admin/twilio/status counter reflects it. Direct DB insert mirrors what
        send_otp_route does after the Twilio call."""
        before = sas.get(f"{API}/admin/twilio/status", timeout=15).json()
        marker = "+919000011122"
        db.otp_attempts.delete_many({"mobile": marker})
        db.otp_attempts.insert_one({
            "mobile": marker, "requested_role": "consumer",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            after = sas.get(f"{API}/admin/twilio/status", timeout=15).json()
            assert after["otps_all_time"] == before["otps_all_time"] + 1
            assert after["otps_last_24h"] == before["otps_last_24h"] + 1
        finally:
            db.otp_attempts.delete_many({"mobile": marker})


# ---------- Admin stats & recent orders access matrix ----------
class TestAdminStatsAccess:
    STATS_KEYS = ("pending_admins", "approved_admins", "total_products",
                  "total_consumers", "total_orders", "total_revenue")

    def test_stats_super_admin(self, sas):
        r = sas.get(f"{API}/admin/stats", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in self.STATS_KEYS:
            assert k in d, f"missing {k}"
            assert isinstance(d[k], (int, float))

    def test_stats_admin_ok(self, aas):
        r = aas.get(f"{API}/admin/stats", timeout=15)
        assert r.status_code == 200
        for k in self.STATS_KEYS:
            assert k in r.json()

    def test_stats_consumer_forbidden(self, cs):
        assert cs.get(f"{API}/admin/stats", timeout=15).status_code == 403

    def test_recent_orders_super_admin(self, sas):
        r = sas.get(f"{API}/admin/orders/recent", timeout=15)
        assert r.status_code == 200
        assert "orders" in r.json()
        assert isinstance(r.json()["orders"], list)

    def test_recent_orders_admin_ok(self, aas):
        r = aas.get(f"{API}/admin/orders/recent", timeout=15)
        assert r.status_code == 200

    def test_recent_orders_consumer_forbidden(self, cs):
        assert cs.get(f"{API}/admin/orders/recent", timeout=15).status_code == 403

    def test_admins_super_admin_only(self, sas, aas, cs):
        assert sas.get(f"{API}/admin/admins", timeout=15).status_code == 200
        assert aas.get(f"{API}/admin/admins", timeout=15).status_code == 403
        assert cs.get(f"{API}/admin/admins", timeout=15).status_code == 403


# ---------- Consumer product & cart endpoints (regression) ----------
class TestConsumerEndpointsRegression:
    def test_products_tree_public(self):
        r = requests.get(f"{API}/products/tree", timeout=15)
        assert r.status_code == 200
        assert "categories" in r.json()

    def test_products_all_public(self):
        r = requests.get(f"{API}/products/all", timeout=15)
        assert r.status_code == 200
        assert "products" in r.json()
        assert len(r.json()["products"]) > 0

    def test_cart_add_and_update(self, cs):
        cs.post(f"{API}/cart/clear", timeout=15)
        prods = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        pid = prods[0]["id"]
        r = cs.post(f"{API}/cart/add", json={"product_id": pid, "quantity": 1}, timeout=15)
        assert r.status_code == 200
        assert any(it["product_id"] == pid for it in r.json()["items"])
        r = cs.post(f"{API}/cart/update", json={"product_id": pid, "quantity": 3}, timeout=15)
        assert r.status_code == 200
        item = next(it for it in r.json()["items"] if it["product_id"] == pid)
        assert item["quantity"] == 3
        cs.post(f"{API}/cart/clear", timeout=15)
