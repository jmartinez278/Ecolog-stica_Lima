from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Column, ForeignKey, Index, Integer, SmallInteger, Numeric, String, Table, Text, DateTime, JSON, text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator, Uuid
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AwareDateTime(TypeDecorator):
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None and dialect.name == "sqlite":
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def process_result_value(self, value, dialect):
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


user_roles = Table(
    "usuario_roles",
    Base.metadata,
    Column("usuario_id", Uuid(as_uuid=True), ForeignKey("usuarios.usuario_id"), primary_key=True),
    Column("rol_id", SmallInteger().with_variant(Integer, "sqlite"), ForeignKey("roles.rol_id"), primary_key=True),
    Column("asignado_en", DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP")),
)


class Role(Base):
    __tablename__ = "roles"
    rol_id: Mapped[int] = mapped_column(SmallInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255))


class User(Base):
    __tablename__ = "usuarios"
    usuario_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVO", server_default=text("'ACTIVO'"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    roles: Mapped[list[Role]] = relationship(secondary=user_roles, lazy="selectin")
    __table_args__ = (CheckConstraint("estado IN ('ACTIVO','INACTIVO','BLOQUEADO')"), Index("idx_usuarios_estado", "estado"))


class Vehicle(Base):
    __tablename__ = "vehiculos"
    vehiculo_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    placa: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    marca: Mapped[str] = mapped_column(String(80), nullable=False)
    modelo: Mapped[str] = mapped_column(String(80), nullable=False)
    capacidad_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    capacidad_m3: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    consumo_km_l: Mapped[Decimal | None] = mapped_column(Numeric(10, 4))
    factor_emision_kg_co2_km: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="DISPONIBLE", server_default=text("'DISPONIBLE'"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        CheckConstraint("capacidad_kg > 0"), CheckConstraint("capacidad_m3 > 0"),
        CheckConstraint("consumo_km_l IS NULL OR consumo_km_l > 0"),
        CheckConstraint("factor_emision_kg_co2_km IS NULL OR factor_emision_kg_co2_km >= 0"),
        CheckConstraint("estado IN ('DISPONIBLE','EN_RUTA','MANTENIMIENTO','INACTIVO')"),
        Index("idx_vehiculos_estado", "estado"),
        Index("idx_vehiculos_listado", "creado_en", "vehiculo_id"),
    )


class Driver(Base):
    __tablename__ = "conductores"
    conductor_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    nombres: Mapped[str] = mapped_column(String(120), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(120), nullable=False)
    numero_licencia: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    categoria_licencia: Mapped[str] = mapped_column(String(20), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30))
    experiencia_anios: Mapped[int | None] = mapped_column(SmallInteger)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="DISPONIBLE", server_default=text("'DISPONIBLE'"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        CheckConstraint("experiencia_anios IS NULL OR experiencia_anios >= 0"),
        CheckConstraint("estado IN ('DISPONIBLE','ASIGNADO','DESCANSO','INACTIVO')"),
        Index("idx_conductores_estado", "estado"),
        Index("idx_conductores_listado", "creado_en", "conductor_id"),
    )


class Client(Base):
    __tablename__ = "clientes"
    cliente_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    nombre: Mapped[str] = mapped_column(String(180), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255))
    preferencia_entrega: Mapped[str | None] = mapped_column(Text)
    restriccion_acceso: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVO", server_default=text("'ACTIVO'"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        CheckConstraint("estado IN ('ACTIVO','INACTIVO')"),
        Index("idx_clientes_estado", "estado"),
        Index("idx_clientes_listado", "nombre", "cliente_id"),
        Index("uq_clientes_email_normalized", func.lower(email), unique=True),
    )


class Order(Base):
    __tablename__ = "pedidos"
    pedido_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    cliente_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("clientes.cliente_id"), nullable=False)
    codigo_pedido: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    direccion_entrega: Mapped[str] = mapped_column(String(255), nullable=False)
    referencia_entrega: Mapped[str | None] = mapped_column(String(255))
    latitud: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    longitud: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    peso_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    volumen_m3: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    ventana_inicio: Mapped[datetime] = mapped_column(AwareDateTime(), nullable=False)
    ventana_fin: Mapped[datetime] = mapped_column(AwareDateTime(), nullable=False)
    prioridad: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIA", server_default=text("'MEDIA'"))
    tipo_producto: Mapped[str | None] = mapped_column(String(80))
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDIENTE", server_default=text("'PENDIENTE'"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        CheckConstraint("latitud BETWEEN -90 AND 90"), CheckConstraint("longitud BETWEEN -180 AND 180"),
        CheckConstraint("peso_kg > 0"), CheckConstraint("volumen_m3 > 0"),
        CheckConstraint("ventana_inicio < ventana_fin"),
        CheckConstraint("prioridad IN ('ALTA','MEDIA','BAJA')"),
        CheckConstraint("estado IN ('PENDIENTE','PLANIFICADO','EN_RUTA','ENTREGADO','CANCELADO','NO_ASIGNADO')"),
        Index("idx_pedidos_cliente", "cliente_id"), Index("idx_pedidos_estado", "estado"),
        Index("idx_pedidos_prioridad", "prioridad"), Index("idx_pedidos_ventana", "ventana_inicio", "ventana_fin"),
        Index("idx_pedidos_coordenadas", "latitud", "longitud"),
        Index("idx_pedidos_listado", "creado_en", "pedido_id"),
        Index("idx_pedidos_estado_listado", "estado", "creado_en", "pedido_id"),
    )


class Audit(Base):
    __tablename__ = "auditoria"
    auditoria_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    usuario_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("usuarios.usuario_id"))
    entidad: Mapped[str] = mapped_column(String(80), nullable=False)
    entidad_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True))
    accion: Mapped[str] = mapped_column(String(50), nullable=False)
    resultado: Mapped[str] = mapped_column(String(20), nullable=False)
    detalle: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    fecha_evento: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, server_default=text("CURRENT_TIMESTAMP"))
    __table_args__ = (
        CheckConstraint("resultado IN ('EXITOSO','FALLIDO')"),
        Index("idx_auditoria_usuario", "usuario_id"),
        Index("idx_auditoria_entidad", "entidad", "entidad_id"),
        Index("idx_auditoria_fecha", "fecha_evento"),
    )
