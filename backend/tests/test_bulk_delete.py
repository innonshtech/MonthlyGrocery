"""
Iteration 9 — Backend tests for POST /api/products/mine/bulk-delete
Covers: auth guard, id-list delete, wipe-all with 'DELETE ALL' confirm string,
missing/wrong confirm, invalid ObjectId, empty payload, audit_logs entries.

Reuses fixtures from backend_test.py (aas / aps / cs / sas / db).
"""
import os
import time
import requests
import pytest
from datetime import datetime, timezone
from bson import ObjectId

from tests.backend_test import (  # noqa: F401 — shared fixtures
    API, db, aas, aps, cs, sas,
    consumer, admin_approved, admin_pending, super_admin,
    _sess_for, _mk_user,
)


def _seed_products(session, n=3, prefix="TEST_bulk_"):
    """Create n products via API and return list of ids."""
    ids = []
    for i in range(n):
        r = session.post(f"{API}/products/mine", json={
            "name": f"{prefix}{int(time.time()*1000)}_{i}",
            "primary_category": "Atta & Rice",
            "secondary_category": "Basmati Rice",
            "mrp": 200, "price": 150,
        }, timeout=15)
        assert r.status_code == 200, r.text
        ids.append(r.json()["product"]["id"])
    return ids


class TestBulkDeleteAuth:
    def test_unauth_returns_401(self):
        r = requests.post(f"{API}/products/mine/bulk-delete", json={"ids": ["x"]}, timeout=15)
        assert r.status_code == 401, r.text

    def test_consumer_forbidden(self, cs):
        r = cs.post(f"{API}/products/mine/bulk-delete", json={"ids": ["x"]}, timeout=15)
        assert r.status_code == 403

    def test_pending_admin_forbidden(self, aps):
        r = aps.post(f"{API}/products/mine/bulk-delete", json={"ids": ["x"]}, timeout=15)
        assert r.status_code == 403


class TestBulkDeleteIds:
    def test_delete_selected_only(self, aas):
        ids = _seed_products(aas, n=3)
        target = ids[:2]  # delete first two
        keep = ids[2]
        r = aas.post(f"{API}/products/mine/bulk-delete", json={"ids": target}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert d["deleted"] == 2
        assert d.get("mode") == "ids"

        # Verify persistence via GET /products/mine
        r2 = aas.get(f"{API}/products/mine", timeout=15)
        remaining_ids = {p["id"] for p in r2.json()["products"]}
        assert target[0] not in remaining_ids
        assert target[1] not in remaining_ids
        assert keep in remaining_ids

        # Cleanup
        aas.delete(f"{API}/products/mine/{keep}", timeout=15)

    def test_invalid_object_id_returns_400(self, aas):
        r = aas.post(f"{API}/products/mine/bulk-delete", json={"ids": ["not-an-oid"]}, timeout=15)
        assert r.status_code == 400
        assert "invalid" in r.json()["detail"].lower()

    def test_empty_ids_no_all_returns_400(self, aas):
        r = aas.post(f"{API}/products/mine/bulk-delete", json={"ids": [], "all": False}, timeout=15)
        assert r.status_code == 400

    def test_audit_log_written_for_ids(self, aas, admin_approved):
        ids = _seed_products(aas, n=1)
        before = db.audit_log.count_documents({"action": "sku.bulk_delete", "actor_id": admin_approved["id"]})
        r = aas.post(f"{API}/products/mine/bulk-delete", json={"ids": ids}, timeout=15)
        assert r.status_code == 200
        after = db.audit_log.count_documents({"action": "sku.bulk_delete", "actor_id": admin_approved["id"]})
        assert after == before + 1


class TestBulkDeleteAll:
    """Wipe-all needs isolated seeded catalog. We snapshot & restore around the test."""

    def _snapshot(self):
        return list(db.products.find({}))

    def _restore(self, snap):
        db.products.delete_many({})
        if snap:
            db.products.insert_many(snap)

    def test_wipe_all_requires_confirm(self, aas):
        r = aas.post(f"{API}/products/mine/bulk-delete", json={"all": True}, timeout=15)
        assert r.status_code == 400
        assert "DELETE ALL" in r.json()["detail"]

    def test_wipe_all_wrong_confirm(self, aas):
        r = aas.post(f"{API}/products/mine/bulk-delete",
                     json={"all": True, "confirm": "delete everything"}, timeout=15)
        assert r.status_code == 400

    def test_wipe_all_ok(self, aas, admin_approved):
        snap = self._snapshot()
        try:
            r = aas.post(f"{API}/products/mine/bulk-delete",
                         json={"all": True, "confirm": "DELETE ALL"}, timeout=20)
            assert r.status_code == 200, r.text
            d = r.json()
            assert d["success"] is True
            assert d["mode"] == "all"
            assert d["deleted"] >= 0

            # verify catalog empty via GET
            r2 = aas.get(f"{API}/products/mine", timeout=15)
            assert r2.status_code == 200
            assert r2.json()["products"] == []

            # audit
            log = db.audit_log.find_one(
                {"action": "sku.bulk_delete_all", "actor_id": admin_approved["id"]},
                sort=[("_id", -1)],
            )
            assert log is not None
        finally:
            self._restore(snap)

    def test_wipe_all_case_insensitive_confirm(self, aas):
        snap = self._snapshot()
        try:
            r = aas.post(f"{API}/products/mine/bulk-delete",
                         json={"all": True, "confirm": "delete all"}, timeout=20)
            assert r.status_code == 200, r.text
            assert r.json()["mode"] == "all"
        finally:
            self._restore(snap)
