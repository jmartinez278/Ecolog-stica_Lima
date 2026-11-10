from app.models import User
from sqlalchemy import select
import pytest


@pytest.mark.parametrize('query', ['page=-1', 'page=1.5', 'page=abc', 'limit=-1', 'limit=1.5', 'limit=abc'])
def test_invalid_page_values(context, query):
    assert context['client'].get('/api/v1/pedidos?' + query, headers=context['operator']).status_code == 422


def test_filtered_pages_empty_and_beyond_last(context, order_data):
    client, headers = context['client'], context['operator']
    created = client.post('/api/v1/pedidos', json=order_data, headers=headers).json()
    client.patch(f"/api/v1/pedidos/{created['pedido_id']}/cancelar", headers=headers)
    empty = client.get('/api/v1/pedidos?page=1&estado=PENDIENTE', headers=headers).json()
    assert empty == {'items': [], 'total': 0, 'page': 1, 'limit': 12, 'pages': 0}
    cancelled = client.get('/api/v1/pedidos?page=1&estado=CANCELADO', headers=headers).json()
    assert cancelled['total'] == 1 and cancelled['items'][0]['estado'] == 'CANCELADO'
    beyond = client.get('/api/v1/pedidos?page=99&limit=1', headers=headers).json()
    assert beyond['items'] == [] and beyond['total'] == 1 and beyond['pages'] == 1


def test_conditional_request_still_checks_current_authorization(context):
    client, headers = context['client'], context['operator']
    first = client.get('/api/v1/vehiculos?page=1', headers=headers)
    etag = first.headers['etag']
    unauthorized = client.get('/api/v1/vehiculos?page=1', headers={'If-None-Match': etag})
    assert unauthorized.status_code == 401
    assert unauthorized.headers['cache-control'] == 'no-store'
    with context['factory']() as db:
        user = db.scalar(select(User).where(User.email == 'op@example.test'))
        user.roles.clear()
        db.commit()
    forbidden = client.get('/api/v1/vehiculos?page=1', headers={**headers, 'If-None-Match': etag})
    assert forbidden.status_code == 403 and 'etag' not in forbidden.headers
    assert forbidden.headers['cache-control'] == 'no-store'


def test_cache_varies_by_session_and_encoding_and_revalidates_updates(context, vehicle_data):
    client, headers = context['client'], context['operator']
    created = client.post('/api/v1/vehiculos', json=vehicle_data, headers=headers)
    assert created.headers['cache-control'] == 'no-store'
    url = '/api/v1/vehiculos?page=1'
    first = client.get(url, headers={**headers, 'Accept-Encoding': 'gzip'})
    assert 'authorization' in first.headers['vary'].lower()
    cached = client.get(url, headers={**headers, 'If-None-Match': '"other", ' + first.headers['etag']})
    assert cached.status_code == 304 and not cached.content
    client.patch(f"/api/v1/vehiculos/{created.json()['vehiculo_id']}/desactivar", headers=headers)
    changed = client.get(url, headers={**headers, 'If-None-Match': first.headers['etag']})
    assert changed.status_code == 200 and changed.json()['items'][0]['estado'] == 'INACTIVO'


def test_login_token_is_never_stored(context):
    response = context['client'].post('/api/v1/auth/login', json={'email': 'op@example.test', 'password': 'secure-password'})
    assert response.status_code == 200 and response.headers['cache-control'] == 'no-store'
