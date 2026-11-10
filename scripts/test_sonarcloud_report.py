"""Verify revision matching and credential-free analysis evidence."""
import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from export_sonarcloud_report import export_report, read_api


class SonarCloudEvidenceTests(unittest.TestCase):
    def test_exports_matching_revision_without_serializing_credentials(self):
        def response(endpoint, parameters):
            if endpoint.endswith('project_analyses/search'):
                return {'analyses': [{'revision': 'older', 'key': 'old'}, {'revision': 'expected', 'key': 'analysis'}]}
            if endpoint.endswith('project_status'):
                self.assertEqual(parameters, {'analysisId': 'analysis'})
                return {'projectStatus': {'status': 'OK'}}
            if endpoint.endswith('issues/search'):
                return {'paging': {'total': 0}, 'issues': []}
            return {'component': {'measures': []}}

        with tempfile.TemporaryDirectory() as temporary, contextlib.chdir(temporary):
            with patch.dict(os.environ, {'GITHUB_SHA': 'expected', 'SONAR_TOKEN': 'test-only-token'}):
                with patch('export_sonarcloud_report.read_api', side_effect=response), contextlib.redirect_stdout(io.StringIO()):
                    export_report()
            content = Path('sonarcloud-report.json').read_text(encoding='utf-8')
            self.assertNotIn('test-only-token', content)
            self.assertEqual(json.loads(content)['analysis']['revision'], 'expected')

    def test_refuses_to_present_an_old_analysis_as_current(self):
        with patch.dict(os.environ, {'GITHUB_SHA': 'new'}):
            with patch('export_sonarcloud_report.read_api', return_value={'analyses': [{'revision': 'old'}]}):
                with self.assertRaises(RuntimeError):
                    export_report()

    def test_api_uses_tls_and_header_authentication_not_a_token_in_the_url(self):
        stream = io.BytesIO(b'{"ok":true}')
        with patch.dict(os.environ, {'SONAR_TOKEN': 'test-only-token'}):
            with patch('export_sonarcloud_report.urlopen', return_value=stream) as opening:
                self.assertEqual(read_api('/api/example', {'project': 'a/b'}), {'ok': True})
        request = opening.call_args.args[0]
        self.assertTrue(request.full_url.startswith('https://sonarcloud.io/'))
        self.assertNotIn('test-only-token', request.full_url)
        self.assertEqual(request.get_header('Authorization'), 'Bearer test-only-token')


if __name__ == '__main__':
    unittest.main()
