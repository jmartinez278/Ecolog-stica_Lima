"""Cálculo de energía y emisiones con el Sustainable Web Design Model v4 (SWDM v4).

Constantes publicadas en https://sustainablewebdesign.org/estimating-digital-emissions/ (v4, 2024):
intensidad operativa 0.055 (centro de datos) + 0.059 (redes) + 0.080 (dispositivos) kWh/GB;
intensidad incorporada 0.012 + 0.013 + 0.081 kWh/GB; intensidad de red eléctrica global 494 gCO2e/kWh.
GB decimal (10^9 bytes), como en el modelo. Sin hosting verde verificado: factor 0.

Uso: python scripts/green_it/swdm.py <metricas-antes.json> <metricas-despues.json> [sesiones_por_año]
"""
import json
import sys

OPERATIVA = {"centro_datos": 0.055, "redes": 0.059, "dispositivos": 0.080}
INCORPORADA = {"centro_datos": 0.012, "redes": 0.013, "dispositivos": 0.081}
KWH_POR_GB = sum(OPERATIVA.values()) + sum(INCORPORADA.values())  # 0.300
G_CO2E_POR_KWH = 494
SESIONES_POR_ANIO = 60_000  # supuesto declarado en el informe


def bytes_por_sesion(metricas: dict) -> int:
    """Carga de la página de acceso + recorrido autenticado por los cuatro listados."""
    return round(metricas["lighthouse_desktop"]["median"]["bytes"]) + metricas["flujo_autenticado"]["timespan_bytes"]


def emisiones(bytes_: float) -> tuple[float, float, float]:
    gb = bytes_ / 1e9
    kwh = gb * KWH_POR_GB
    return gb, kwh, kwh * G_CO2E_POR_KWH


def main() -> None:
    antes, despues = (json.load(open(path, encoding="utf-8")) for path in sys.argv[1:3])
    sesiones = int(sys.argv[3]) if len(sys.argv) > 3 else SESIONES_POR_ANIO
    filas = []
    for nombre, datos in (("ANTES", antes), ("DESPUÉS", despues)):
        b = bytes_por_sesion(datos)
        gb, kwh, g = emisiones(b)
        filas.append((nombre, b, gb, kwh, g, kwh * sesiones, g * sesiones / 1000))
    print(f"SWDM v4: {KWH_POR_GB:.3f} kWh/GB × {G_CO2E_POR_KWH} gCO2e/kWh; {sesiones:,} sesiones/año\n")
    print("| Escenario | Bytes/sesión | GB/sesión | kWh/sesión | g CO2e/sesión | kWh/año | kg CO2e/año |")
    print("|---|---:|---:|---:|---:|---:|---:|")
    for f in filas:
        print(f"| {f[0]} | {f[1]:,} | {f[2]:.6f} | {f[3]:.7f} | {f[4]:.4f} | {f[5]:.3f} | {f[6]:.3f} |")
    a, d = filas
    print(f"\nReducción por sesión: {a[4] - d[4]:.4f} g CO2e ({(1 - d[4] / a[4]) * 100:.1f} %)")
    print(f"Ahorro anual: {a[5] - d[5]:.3f} kWh y {a[6] - d[6]:.3f} kg CO2e")


if __name__ == "__main__":
    main()
