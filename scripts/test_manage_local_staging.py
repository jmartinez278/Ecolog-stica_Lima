"""Ensure callers cannot override the protected Compose project or command."""
import unittest
from pathlib import Path
from unittest.mock import patch

from manage_local_staging import compose_arguments


class ComposeArgumentTests(unittest.TestCase):
    def test_documented_operations(self):
        for operation in [['ps'], ['config', '--quiet'], ['up', '-d', '--build', '--wait'], ['down']]:
            with self.subTest(operation=operation):
                self.assertEqual(compose_arguments(operation), operation)

    def test_rejects_project_override_secret_dump_arbitrary_exec_and_volume_deletion(self):
        for operation in [['--file', 'other.yml', 'up'], ['config'], ['config', '--quiet', '--environment'], ['run', 'backend', 'sh'], ['down', '--volumes'], ['up', '-d', '--env-file', 'other.env']]:
            with self.subTest(operation=operation), self.assertRaises(ValueError):
                compose_arguments(operation)

    def test_certificate_copy_has_fixed_source_and_destination(self):
        with patch('manage_local_staging.settings_directory', return_value=Path('local-settings')):
            operation = ['cp', 'gateway:/data/caddy/pki/authorities/local/root.crt', str(Path('local-settings/localhost-root.crt'))]
            self.assertEqual(compose_arguments(operation), operation)
            with self.assertRaises(ValueError):
                compose_arguments(['cp', '/arbitrary', 'outside'])


if __name__ == '__main__':
    unittest.main()
