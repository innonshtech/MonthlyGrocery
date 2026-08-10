"""
Iteration 12 — Backend tests for the SKU-visibility bugfix.

Covers:
- GET /api/products/all (no city, city filter) surfaces legacy-priced SKUs and empty city_prices SKUs
- Explicit hide (available=False) hides from /all
- Explicit per-city is_live=False hides only from that city
- Excel import: blank is_live/available defaults True; explicit 'no' still False
- GET /api/products/mine/visibility (auth guards + diagnostic counts)
- POST /api/products/mine/publish-all (auth guards + behaviour + audit log)
"""
import io
import time
import requests
import pytest
from datetime import datetime, timezone
from bson import ObjectId
from openpyxl import Workbook

from tests.backend_test import (  # noqa: F401
    API, db, aas, aps, cs, sas,
    consumer, admin_approved, admin_pending, super_admin,
    _sess_for, _mk_user,
)


# ---------- helpers ----------

def _shop_id():
    s = db.shops.find_one({})
    assert s
    return str(s["_id"])


def _insert_product(**overrides):
    """Direct-DB insert so we can force weird states the API would reject."""
    doc = {
        "name": f"TEST_vis_{int(time.time()*1000000)}",
        "primary_category": "Atta & Rice",
        "secondary_category": "",
        "brand": "", "company": "",
        "shop_id": _shop_id(),
        "shop_name": "MonthlyGrocery",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mrp": 0, "price": 0, "wholesaler_price": 0,
        "city_prices": {},
        "available": True, "stock": 10, "gst": 5, "is_veg": True,
        "unit": "1 Kg", "images": [], "image_url": "",
    }
    doc.update(overrides)
    r = db.products.insert_one(doc)
    return str(r.inserted_id)


@pytest.fixture
def cleanup_test_products():
    created = []
    yield created
    if created:
        db.products.delete_many({"_id": {"$in": [ObjectId(i) for i in created]}})


# ---------- Consumer visibility ----------

class TestConsumerVisibility:
    def test_legacy_price_empty_city_prices_shows_pan_india(self, cleanup_test_products):
        pid = _insert_product(name=f"TEST_vis_legacy_{int(time.time()*1000)}",
                              mrp=200, price=150, city_prices={})
        cleanup_test_products.append(pid)
        r = requests.get(f"{API}/products/all", timeout=15)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()["products"]]
        assert pid in ids
        prod = next(p for p in r.json()["products"] if p["id"] == pid)
        assert prod["price"] == 150

    def test_only_mumbai_city_prices_shown_pan_india_via_fallback(self, cleanup_test_products):
        pid = _insert_product(
            name=f"TEST_vis_mum_{int(time.time()*1000)}",
            mrp=0, price=0,
            city_prices={"Mumbai": {"mrp": 300, "wholesaler_price": 200, "price": 250, "is_live": True}},
        )
        cleanup_test_products.append(pid)
        r = requests.get(f"{API}/products/all", timeout=15)
        assert r.status_code == 200
        prod = next((p for p in r.json()["products"] if p["id"] == pid), None)
        assert prod is not None, "Pan India should include SKU with Mumbai-only city_prices"
        assert prod["price"] == 250

    def test_city_filter_pune_includes_legacy_and_hides_paused(self, cleanup_test_products):
        # Legacy-priced (no city_prices) should show for Pune request
        p_legacy = _insert_product(name=f"TEST_vis_leg2_{int(time.time()*1000)}",
                                   mrp=100, price=80, city_prices={})
        # Pune paused explicitly → must be hidden for city=Pune
        p_paused = _insert_product(
            name=f"TEST_vis_pausepune_{int(time.time()*1000)}",
            mrp=0, price=0,
            city_prices={"Pune": {"mrp": 100, "wholesaler_price": 70, "price": 90, "is_live": False}},
        )
        cleanup_test_products.extend([p_legacy, p_paused])
        r = requests.get(f"{API}/products/all", params={"city": "Pune"}, timeout=15)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()["products"]]
        assert p_legacy in ids
        assert p_paused not in ids

    def test_available_false_hides_everywhere(self, aas, cleanup_test_products):
        pid = _insert_product(name=f"TEST_vis_unavail_{int(time.time()*1000)}",
                              mrp=100, price=80, available=True)
        cleanup_test_products.append(pid)
        # Sanity: visible now
        r1 = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        assert pid in [p["id"] for p in r1]
        # Flip available=false via admin PUT
        r = aas.put(f"{API}/products/mine/{pid}", json={
            "name": "TEST_vis_unavail_flipped", "mrp": 100, "price": 80, "available": False,
            "primary_category": "Atta & Rice",
        }, timeout=15)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        assert pid not in [p["id"] for p in r2]
        # Flip back
        r = aas.put(f"{API}/products/mine/{pid}", json={
            "name": "TEST_vis_unavail_flipped", "mrp": 100, "price": 80, "available": True,
            "primary_category": "Atta & Rice",
        }, timeout=15)
        assert r.status_code == 200
        r3 = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        assert pid in [p["id"] for p in r3]

    def test_mumbai_paused_hidden_only_in_mumbai(self, cleanup_test_products):
        pid = _insert_product(
            name=f"TEST_vis_mumpause_{int(time.time()*1000)}",
            mrp=0, price=0,
            city_prices={"Mumbai": {"mrp": 150, "wholesaler_price": 90, "price": 100, "is_live": False}},
        )
        cleanup_test_products.append(pid)
        # City=Mumbai must exclude
        r1 = requests.get(f"{API}/products/all", params={"city": "Mumbai"}, timeout=15).json()["products"]
        assert pid not in [p["id"] for p in r1]
        # No city (Pan India) should still show (fallback searches for other live city; there isn't one,
        # so legacy will be used which is 0 — spec says it should still show since available!=False)
        r2 = requests.get(f"{API}/products/all", timeout=15).json()["products"]
        assert pid in [p["id"] for p in r2]


# ---------- Excel import defaults ----------

class TestExcelImportDefaults:
    def _build_xlsx(self, rows):
        wb = Workbook()
        ws = wb.active
        header = ["product_name", "city", "mrp", "purchase_price", "selling_price", "is_live",
                  "primary_category", "available"]
        ws.append(header)
        for r in rows:
            ws.append([r.get(h, "") for h in header])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf

    def test_blank_defaults_visible(self, aas, cleanup_test_products):
        name = f"TEST_ximp_blank_{int(time.time()*1000)}"
        buf = self._build_xlsx([{
            "product_name": name, "city": "Mumbai", "mrp": 100,
            "purchase_price": 60, "selling_price": 80,
            "is_live": "", "available": "",
            "primary_category": "Atta & Rice",
        }])
        r = aas.post(f"{API}/products/import-excel",
                     files={"file": ("test.xlsx", buf.getvalue(),
                                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                     timeout=30)
        assert r.status_code == 200, r.text
        doc = db.products.find_one({"name": name})
        assert doc is not None
        cleanup_test_products.append(str(doc["_id"]))
        assert doc.get("available") is True
        assert doc["city_prices"]["Mumbai"]["is_live"] is True

    def test_explicit_no_still_hidden(self, aas, cleanup_test_products):
        name = f"TEST_ximp_no_{int(time.time()*1000)}"
        buf = self._build_xlsx([{
            "product_name": name, "city": "Pune", "mrp": 100,
            "purchase_price": 60, "selling_price": 80,
            "is_live": "no", "available": "yes",
            "primary_category": "Atta & Rice",
        }])
        r = aas.post(f"{API}/products/import-excel",
                     files={"file": ("t.xlsx", buf.getvalue(),
                                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                     timeout=30)
        assert r.status_code == 200, r.text
        doc = db.products.find_one({"name": name})
        assert doc is not None
        cleanup_test_products.append(str(doc["_id"]))
        assert doc["city_prices"]["Pune"]["is_live"] is False


# ---------- Visibility diagnostic endpoint ----------

class TestVisibilityEndpoint:
    def test_unauth_401(self):
        r = requests.get(f"{API}/products/mine/visibility", timeout=15)
        assert r.status_code == 401

    def test_consumer_403(self, cs):
        r = cs.get(f"{API}/products/mine/visibility", timeout=15)
        assert r.status_code == 403

    def test_pending_admin_403(self, aps):
        r = aps.get(f"{API}/products/mine/visibility", timeout=15)
        assert r.status_code == 403

    def test_diag_shape_and_counts(self, aas, cleanup_test_products):
        pid = _insert_product(name=f"TEST_diag_{int(time.time()*1000)}",
                              mrp=0, price=0, available=False)
        cleanup_test_products.append(pid)
        r = aas.get(f"{API}/products/mine/visibility", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert set(d.keys()) >= {"total", "visible_to_consumers", "hidden"}
        assert set(d["hidden"].keys()) == {"explicitly_unavailable", "no_price_set", "all_cities_paused"}
        assert d["hidden"]["explicitly_unavailable"] >= 1


# ---------- Publish-all endpoint ----------

class TestPublishAll:
    def test_unauth_401(self):
        r = requests.post(f"{API}/products/mine/publish-all", timeout=15)
        assert r.status_code == 401

    def test_consumer_403(self, cs):
        r = cs.post(f"{API}/products/mine/publish-all", timeout=15)
        assert r.status_code == 403

    def test_pending_admin_403(self, aps):
        r = aps.post(f"{API}/products/mine/publish-all", timeout=15)
        assert r.status_code == 403

    def test_publish_all_flips_unavailable_and_unpauses_and_backfills(self, aas, admin_approved,
                                                                     cleanup_test_products):
        # Seed 3 different problematic SKUs
        p1 = _insert_product(name=f"TEST_pa_unavail_{int(time.time()*1000)}",
                             available=False, mrp=100, price=80)
        p2 = _insert_product(
            name=f"TEST_pa_paused_{int(time.time()*1000)}",
            available=True, mrp=0, price=0,
            city_prices={"Mumbai": {"mrp": 200, "wholesaler_price": 100, "price": 150, "is_live": False}},
        )
        p3 = _insert_product(
            name=f"TEST_pa_nolegacy_{int(time.time()*1000)}",
            available=True, mrp=0, price=0,
            city_prices={"Pune": {"mrp": 100, "wholesaler_price": 60, "price": 90, "is_live": True}},
        )
        cleanup_test_products.extend([p1, p2, p3])

        r = aas.post(f"{API}/products/mine/publish-all", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert d["made_available"] >= 1
        assert d["unpaused_cities"] >= 1
        assert d["backfilled_prices"] >= 1

        # Verify persistence
        p1_doc = db.products.find_one({"_id": ObjectId(p1)})
        assert p1_doc["available"] is True
        p2_doc = db.products.find_one({"_id": ObjectId(p2)})
        assert p2_doc["city_prices"]["Mumbai"]["is_live"] is True
        assert float(p2_doc.get("price", 0)) > 0  # backfilled
        p3_doc = db.products.find_one({"_id": ObjectId(p3)})
        assert float(p3_doc.get("price", 0)) == 90  # backfilled from Pune

        # audit
        log = db.audit_log.find_one(
            {"action": "sku.publish_all", "actor_id": admin_approved["id"]},
            sort=[("_id", -1)],
        )
        assert log is not None
