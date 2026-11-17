import json
import tempfile
import unittest
from pathlib import Path

import sus_score as s


class SusScoreTest(unittest.TestCase):
    def test_best_and_worst_possible_answers(self):
        self.assertEqual(s.sus([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), 100.0)
        self.assertEqual(s.sus([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]), 0.0)

    def test_neutral_answers_score_fifty(self):
        self.assertEqual(s.sus([3] * 10), 50.0)

    def test_brooke_reference_example(self):
        # impares: 4-1,4-1,5-1,4-1,4-1 = 16; pares: 5-2,5-1,5-2,5-1,5-2 = 17; (16+17) x 2,5 = 82,5
        self.assertEqual(s.sus([4, 2, 4, 1, 5, 2, 4, 1, 4, 2]), 82.5)

    def test_rejects_out_of_range_or_incomplete(self):
        for items in ([3] * 9, [0] + [3] * 9, [6] + [3] * 9):
            with self.assertRaises(ValueError):
                s.sus(items)

    def test_grade_boundaries(self):
        self.assertEqual(s.grade(80.3)[0], 'A')
        self.assertEqual(s.grade(74)[0], 'B')
        self.assertEqual(s.grade(68)[0], 'C')
        self.assertEqual(s.grade(67.5)[0], 'D')
        self.assertEqual(s.grade(50)[0], 'F')

    def test_backup_code_and_json_are_merged_by_participant(self):
        with tempfile.TemporaryDirectory() as folder:
            data = Path(folder, 'r.json')
            data.write_text(json.dumps([{'participante': 'P1', 'rol': 'Operador logístico', 'experiencia': 'Media',
                                         'tareas': {f't{i}': 'si' for i in range(1, 6)}, 'items': [3] * 10}]),
                            encoding='utf-8')
            codes = Path(folder, 'c.txt')
            codes.write_text('SUS1|P1|Operador logístico|Media|SSSAN|5151515151|100|ok\n'
                             'SUS1|P2|Supervisor de operaciones|Alta|SSSSS|4241424142|80|\n', encoding='utf-8')
            rows = s.load([str(data), str(codes)])
            self.assertEqual(len(rows), 2)
            text = s.report(rows)
            self.assertIn('n = 2', text)
            self.assertIn('SUS promedio = 90.0', text)
            self.assertIn('| T5 | 1 | 0 | 1 | 50 % |', text)


if __name__ == '__main__':
    unittest.main()
