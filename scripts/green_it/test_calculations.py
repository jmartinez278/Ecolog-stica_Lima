import unittest
from check_budgets import failures
from swdm import emisiones, bytes_por_sesion

class Calculations(unittest.TestCase):
    def test_units_and_negative_data(self):
        gb, kwh, grams = emisiones(1_000_000_000)
        self.assertEqual(gb, 1)
        self.assertAlmostEqual(kwh, .300)
        self.assertAlmostEqual(grams, 148.2)
        with self.assertRaises(ValueError): emisiones(-1)

    def test_uses_paired_session_instead_of_independent_medians(self):
        self.assertEqual(bytes_por_sesion({'flujo_autenticado': {'session_bytes': 123}}), 123)

    def test_gate_rejects_missing_or_out_of_budget_results(self):
        row = {'score': 95, 'fcp_ms': 900, 'lcp_ms': 1000, 'tbt_ms': 1, 'cls': 0, 'bytes': 10000}
        data = {f'lighthouse_{mode}': {'median': dict(row), 'runs': [row]*3} for mode in ('mobile', 'desktop')}
        data['flujo_autenticado'] = {'runs': [{}, {}, {}], 'session_bytes': 10000, 'timespan_tbt_ms': 0, 'timespan_cls': 0}
        self.assertEqual(failures(data), [])
        data['lighthouse_mobile']['median']['fcp_ms'] = 1001
        self.assertTrue(any('fcp_ms' in error for error in failures(data)))
        self.assertTrue(failures({}))

if __name__ == '__main__': unittest.main()
