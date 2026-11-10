"""Pruebas de las optimizaciones Green IT del backend (Inspección 04)."""
import gzip

import pytest


def _create_orders(context, order_data, total):
    client, headers = context["client"], context["operator"]
    for index in range(total):
        response = client.post("/api/v1/pedidos", json={**order_data, "codigo_pedido": f"PED-{index:03d}"}, headers=headers)
        assert response.status_code == 201, response.text


def test_pagination_returns_blocks_of_twelve(context, order_data):
    _create_orders(context, order_data, 15)
    client, headers = context["client"], context["operator"]
    first = client.get("/api/v1/pedidos?page=1", headers=headers).json()
    assert (first["total"], first["page"], first["limit"], first["pages"]) == (15, 1, 12, 2)
    assert len(first["items"]) == 12
    second = client.get("/api/v1/pedidos?page=2", headers=headers).json()
    assert [item["codigo_pedido"] for item in second["items"]] == ["PED-012", "PED-013", "PED-014"]
    codes = {item["codigo_pedido"] for item in first["items"]} | {item["codigo_pedido"] for item in second["items"]}
    assert len(codes) == 15


def test_list_without_page_keeps_previous_contract(context, order_data):
    _create_orders(context, order_data, 2)
    response = context["client"].get("/api/v1/pedidos", headers=context["operator"])
    assert isinstance(response.json(), list) and len(response.json()) == 2


@pytest.mark.parametrize("query", ["page=0", "limit=0", "limit=51"])
def test_pagination_rejects_invalid_parameters(context, query):
    response = context["client"].get(f"/api/v1/vehiculos?{query}", headers=context["operator"])
    assert response.status_code == 422


@pytest.mark.parametrize("resource", ["vehiculos", "conductores", "clientes", "pedidos"])
def test_every_list_supports_pagination(context, resource):
    body = context["client"].get(f"/api/v1/{resource}?page=1&limit=5", headers=context["operator"]).json()
    assert set(body) == {"items", "total", "page", "limit", "pages"}
    assert body["limit"] == 5


def test_projection_matches_output_schema(context, order_data):
    _create_orders(context, order_data, 1)
    item = context["client"].get("/api/v1/pedidos?page=1", headers=context["operator"]).json()["items"][0]
    assert {"pedido_id", "codigo_pedido", "estado", "creado_en", "actualizado_en"} <= set(item)


def test_etag_returns_304_when_content_is_unchanged(context, vehicle_data):
    client, headers = context["client"], context["operator"]
    client.post("/api/v1/vehiculos", json=vehicle_data, headers=headers)
    first = client.get("/api/v1/vehiculos", headers=headers)
    etag = first.headers["etag"]
    assert first.headers["cache-control"] == "private, no-cache"
    cached = client.get("/api/v1/vehiculos", headers={**headers, "If-None-Match": etag})
    assert cached.status_code == 304 and cached.content == b""
    client.post("/api/v1/vehiculos", json={**vehicle_data, "placa": "XYZ-999"}, headers=headers)
    changed = client.get("/api/v1/vehiculos", headers={**headers, "If-None-Match": etag})
    assert changed.status_code == 200 and changed.headers["etag"] != etag


def test_errors_are_not_cached(context):
    response = context["client"].get("/api/v1/vehiculos")
    assert response.status_code == 401
    assert "etag" not in response.headers


def test_large_json_responses_are_compressed(context, order_data):
    _create_orders(context, order_data, 12)
    client, headers = context["client"], context["operator"]
    response = client.get("/api/v1/pedidos", headers={**headers, "Accept-Encoding": "gzip"})
    assert response.headers["content-encoding"] == "gzip"
    raw = client.get("/api/v1/pedidos", headers={**headers, "Accept-Encoding": "identity"})
    assert "content-encoding" not in raw.headers
    assert len(gzip.compress(raw.content)) < len(raw.content)
