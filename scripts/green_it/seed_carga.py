"""Carga de datos de prueba para la auditoría Green IT (Inspección 04).

Genera un volumen fijo y reproducible (semilla 2026) alineado con RNF-004:
50 vehículos, 60 conductores, 200 clientes y 1 000 pedidos. Se usa la misma
carga para medir el estado ANTES y DESPUÉS. Solo para entornos locales.

Uso, desde src/backend:  python ../../scripts/green_it/seed_carga.py
"""
import random
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))

from sqlalchemy import func, select  # noqa: E402

from app.db.session import SessionLocal  # noqa: E402
from app.models import Client, Driver, Order, Vehicle  # noqa: E402

VEHICULOS, CONDUCTORES, CLIENTES, PEDIDOS = 50, 60, 200, 1000
DISTRITOS = ["Miraflores", "San Isidro", "Surco", "La Molina", "San Borja", "Lince", "Jesús María", "Barranco",
             "Pueblo Libre", "Magdalena", "Breña", "Rímac", "Los Olivos", "San Miguel", "Chorrillos"]
MARCAS = [("Hyundai", "HD78"), ("Isuzu", "NPR"), ("JAC", "N56"), ("Foton", "Aumark"), ("Toyota", "Hiace")]
NOMBRES = ["Luis", "Ana", "Carlos", "María", "Jorge", "Rosa", "Pedro", "Lucía", "José", "Carmen"]
APELLIDOS = ["Quispe", "Flores", "Ramos", "Torres", "Huamán", "Rojas", "Mendoza", "Castillo", "Vargas", "Chávez"]


def main() -> None:
    rng = random.Random(2026)
    base = datetime(2026, 11, 2, 8, 0, tzinfo=timezone.utc)
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Order)) >= PEDIDOS:
            print("La carga ya existe; no se duplica.")
            return
        for i in range(VEHICULOS):
            marca, modelo = MARCAS[i % len(MARCAS)]
            db.add(Vehicle(placa=f"GRN-{i:03d}", marca=marca, modelo=modelo,
                           capacidad_kg=Decimal(rng.choice([1500, 2500, 3500, 5000])),
                           capacidad_m3=Decimal(rng.choice([8, 12, 18, 25])),
                           consumo_km_l=Decimal("8.5"), factor_emision_kg_co2_km=Decimal("0.310000"),
                           estado=rng.choice(["DISPONIBLE", "DISPONIBLE", "EN_RUTA", "MANTENIMIENTO"])))
        for i in range(CONDUCTORES):
            db.add(Driver(nombres=rng.choice(NOMBRES), apellidos=f"{rng.choice(APELLIDOS)} {rng.choice(APELLIDOS)}",
                          numero_licencia=f"Q{40000000 + i}", categoria_licencia=rng.choice(["A-IIb", "A-IIIa", "A-IIIb"]),
                          telefono=f"9{rng.randint(10000000, 99999999)}", experiencia_anios=rng.randint(1, 25)))
        clientes = []
        for i in range(CLIENTES):
            distrito = rng.choice(DISTRITOS)
            c = Client(nombre=f"Bodega {distrito} {i:03d}", telefono=f"01{rng.randint(4000000, 7999999)}",
                       email=f"cliente{i:03d}@carga.example.test",
                       preferencia_entrega="Entrega por la mañana, coordinar con encargado de almacén.",
                       restriccion_acceso=f"Calle angosta en {distrito}; solo vehículos menores a 5 toneladas.")
            db.add(c)
            clientes.append(c)
        db.flush()
        for i in range(PEDIDOS):
            inicio = base + timedelta(hours=rng.randint(0, 24 * 14))
            distrito = rng.choice(DISTRITOS)
            db.add(Order(cliente_id=rng.choice(clientes).cliente_id, codigo_pedido=f"PED-GRN-{i:05d}",
                         direccion_entrega=f"Av. Principal {rng.randint(100, 3999)}, {distrito}, Lima",
                         referencia_entrega="Frente al parque, portón verde.",
                         latitud=Decimal(f"{-12.2 + rng.random() * 0.3:.6f}"),
                         longitud=Decimal(f"{-77.1 + rng.random() * 0.2:.6f}"),
                         peso_kg=Decimal(f"{rng.uniform(5, 800):.2f}"), volumen_m3=Decimal(f"{rng.uniform(0.05, 4):.3f}"),
                         ventana_inicio=inicio, ventana_fin=inicio + timedelta(hours=rng.choice([2, 3, 4])),
                         prioridad=rng.choice(["ALTA", "MEDIA", "MEDIA", "BAJA"]),
                         tipo_producto=rng.choice(["Abarrotes", "Bebidas", "Limpieza", "Refrigerados"])))
        db.commit()
    print(f"Carga creada: {VEHICULOS} vehículos, {CONDUCTORES} conductores, {CLIENTES} clientes, {PEDIDOS} pedidos.")


if __name__ == "__main__":
    main()
