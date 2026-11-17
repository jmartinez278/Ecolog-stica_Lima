import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path

import check_npm_audit as audit

ADVISORY = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf'
REPORT = {'vulnerabilities': {
    'picomatch': {'severity': 'high', 'via': [{'source': 1, 'url': ADVISORY}]},
    'vite': {'severity': 'high', 'via': ['picomatch', 'tinyglobby']},
    'tinyglobby': {'severity': 'high', 'via': ['picomatch']},
    'lodash': {'severity': 'moderate', 'via': [{'source': 2, 'url': 'https://github.com/advisories/GHSA-x'}]},
}}
EXCEPTIONS = {'GHSA-fc5q-39xc-vjpf': {'reason': 'Sin parche; solo build.', 'review_by': '2026-12-15'}}


class CheckNpmAuditTest(unittest.TestCase):
    def test_resolves_transitive_chain_to_root_advisory(self):
        self.assertEqual(audit.root_advisories('vite', REPORT['vulnerabilities']), {'GHSA-fc5q-39xc-vjpf'})

    def test_accepts_only_registered_and_current_exceptions(self):
        blocking, accepted = audit.evaluate(REPORT, EXCEPTIONS, dt.date(2026, 11, 17))
        self.assertEqual(blocking, [])
        self.assertEqual([name for name, _ in accepted], ['picomatch', 'tinyglobby', 'vite'])

    def test_expired_exception_blocks_again(self):
        blocking, _ = audit.evaluate(REPORT, EXCEPTIONS, dt.date(2026, 12, 16))
        self.assertEqual(len(blocking), 3)

    def test_exception_without_reason_is_ignored(self):
        blocking, _ = audit.evaluate(REPORT, {'GHSA-fc5q-39xc-vjpf': {'reason': ' ', 'review_by': '2027-01-01'}},
                                     dt.date(2026, 11, 17))
        self.assertEqual(len(blocking), 3)

    def test_unknown_high_advisory_blocks(self):
        report = {'vulnerabilities': {'x': {'severity': 'critical', 'via': [{'url': 'https://github.com/advisories/GHSA-new'}]}}}
        blocking, _ = audit.evaluate(report, EXCEPTIONS, dt.date(2026, 11, 17))
        self.assertEqual(blocking, [('x', ['GHSA-new'])])

    def test_main_returns_exit_codes(self):
        with tempfile.TemporaryDirectory() as folder:
            report, exceptions = Path(folder, 'r.json'), Path(folder, 'e.json')
            report.write_text(json.dumps(REPORT), encoding='utf-8')
            exceptions.write_text(json.dumps(EXCEPTIONS), encoding='utf-8')
            self.assertEqual(audit.main([str(report), '--exceptions', str(exceptions), '--today', '2026-11-17']), 0)
            self.assertEqual(audit.main([str(report), '--exceptions', str(exceptions), '--today', '2027-01-01']), 1)


if __name__ == '__main__':
    unittest.main()
