"""Índices compuestos para listados ordenados y paginados (Green IT, Inspección 04).

Cada índice coincide con el ORDER BY del listado correspondiente, de modo que
PostgreSQL puede leer una página de 12 registros sin ordenar la tabla completa.
No modifica ni elimina datos.
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_green_list_indexes"
down_revision = "0002_clients_email_unique"
branch_labels = None
depends_on = None

INDEXES = [
    ("idx_vehiculos_listado", "vehiculos", ["creado_en", "vehiculo_id"]),
    ("idx_conductores_listado", "conductores", ["creado_en", "conductor_id"]),
    ("idx_clientes_listado", "clientes", ["nombre", "cliente_id"]),
    ("idx_pedidos_listado", "pedidos", ["creado_en", "pedido_id"]),
    ("idx_pedidos_estado_listado", "pedidos", ["estado", "creado_en", "pedido_id"]),
]


def _existing(table: str) -> set[str]:
    return {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}


def upgrade() -> None:
    for name, table, columns in INDEXES:
        if name not in _existing(table):
            op.create_index(name, table, columns)


def downgrade() -> None:
    for name, table, _ in reversed(INDEXES):
        if name in _existing(table):
            op.drop_index(name, table_name=table)
