"""Controles de CD: identidad del commit, fallos remotos y artefactos publicados."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import threading
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch

import cd

SHA = 'a' * 40
OTHER = 'b' * 40
BACKEND = 'https://ecolog-api.onrender.com'


def good_run(**changes):
    return {'id': 1, 'head_sha': SHA, 'head_branch': 'main', 'event': 'push',
            'head_repository': {'full_name': cd.REPOSITORY},
            'status': 'completed', 'conclusion': 'success', **changes}


def get_runs(changes=None, current=SHA):
    def get(path):
        if path.startswith('/git/ref'):
            return {'object': {'sha': current}}
        workflow = next(name for name in cd.WORKFLOWS if name in path)
        return {'workflow_runs': (changes or {}).get(workflow, [good_run()])}
    return get


class ReleaseGateTests(unittest.TestCase):
    def test_all_four_controls_are_required_for_exact_commit(self):
        self.assertEqual(set(cd.approved_runs(SHA, get_runs())), set(cd.WORKFLOWS))
        for name in cd.WORKFLOWS:
            with self.subTest(workflow=name):
                self.assertIsNone(cd.approved_runs(SHA, get_runs({name: []})))

    def test_fail_pending_cancelled_skipped_wrong_commit_branch_event_and_fork_block(self):
        for changes in [
            {'conclusion': 'failure'}, {'conclusion': 'cancelled'}, {'conclusion': 'skipped'},
            {'status': 'in_progress', 'conclusion': None}, {'head_sha': OTHER},
            {'head_branch': 'sprint-4'}, {'event': 'pull_request'},
            {'head_repository': {'full_name': 'other/fork'}},
        ]:
            with self.subTest(changes=changes):
                self.assertIsNone(cd.approved_runs(SHA, get_runs({'codeql.yml': [good_run(**changes)]})))

    def test_a_new_failed_run_overrules_an_old_success_and_stale_main_is_rejected(self):
        self.assertIsNone(cd.approved_runs(SHA, get_runs({'ci.yml': [good_run(), good_run(id=2, conclusion='failure')]})))
        self.assertIsNone(cd.approved_runs(SHA, get_runs(current=OTHER)))

    def test_only_successful_production_deployment_suppresses_duplicate_release(self):
        for state, expected in [('success', True), ('failure', False), ('in_progress', False)]:
            def get(path):
                return [{'state': state}] if '/statuses?' in path else [{'id': 3}]
            self.assertEqual(cd.already_released(SHA, get), expected)


class RenderTests(unittest.TestCase):
    def setUp(self):
        patcher = patch('cd.output')
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_render_requires_exact_commit_and_live_status(self):
        get = Mock(return_value={'status': 'live', 'commit': {'id': SHA}})
        cd.wait_render('srv-test', 'dep-test', SHA, get)
        for result in [
            {'status': 'live', 'commit': {'id': OTHER}},
            {'status': 'live'}, {'status': 'build_failed'}, {'status': 'pre_deploy_failed'},
        ]:
            with self.subTest(result=result), self.assertRaises(RuntimeError):
                cd.wait_render('srv-test', 'dep-test', SHA, Mock(return_value=result))

    def test_pending_build_is_polled_but_cannot_wait_forever(self):
        get = Mock(side_effect=[{'status': 'build_in_progress'}, {'status': 'live', 'commit': {'id': SHA}}])
        with patch('cd.time.sleep') as sleep:
            cd.wait_render('srv-test', 'dep-test', SHA, get)
            sleep.assert_called_once_with(10)
        with self.assertRaises(RuntimeError):
            cd.wait_render('srv-test', 'dep-test', SHA, get, timeout=0)

    def test_render_checks_service_before_post_and_requests_the_approved_sha(self):
        service = {'type': 'web_service', 'branch': 'main', 'autoDeploy': 'no',
                   'repo': 'https://github.com/' + cd.REPOSITORY + '.git',
                   'serviceDetails': {'url': BACKEND}}
        env = {'RENDER_SERVICE_ID': 'srv-test', 'RENDER_API_KEY': 'test-only',
               'TARGET_SHA': SHA, 'BACKEND_URL': BACKEND}
        with patch.dict(os.environ, env), patch('cd.api', side_effect=[service, {'id': 'dep-test'}]) as api, \
                patch('cd.wait_render') as wait, patch('cd.health') as health:
            cd.render()
            self.assertEqual(api.call_args_list[1].args[2], {'commitId': SHA})
            wait.assert_called_once()
            health.assert_called_once_with(BACKEND)
        for changes in [{'autoDeploy': 'yes'}, {'branch': 'sprint-4'}, {'repo': 'https://github.com/other/repo'},
                        {'serviceDetails': {'url': 'https://other.onrender.com'}}]:
            with self.subTest(changes=changes), patch.dict(os.environ, env), \
                    patch('cd.api', return_value={**service, **changes}) as api, self.assertRaises(RuntimeError):
                cd.render()
            self.assertEqual(api.call_count, 1)


class VercelTests(unittest.TestCase):
    def setUp(self):
        patcher = patch('cd.output')
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_backend_origin_cannot_inject_credentials_paths_or_non_https_destinations(self):
        self.assertEqual(cd.origin(BACKEND + '/'), BACKEND)
        for value in ['http://example.com', 'https://user:password@example.com', BACKEND + '/api',
                      BACKEND + '?key=secret', BACKEND + '#fragment', BACKEND + '\n', 'https://example.com:8000']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                cd.origin(value)

    def test_package_preserves_ci_bytes_and_proxy_precedes_spa_fallback(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            dist = root / 'dist'
            (dist / 'assets').mkdir(parents=True)
            (dist / 'index.html').write_bytes(b'<div id="root">Bienvenido</div>')
            (dist / 'assets' / 'main-abc.js').write_bytes(b'console.log("build aprobado")')
            env = {'BACKEND_URL': BACKEND, 'VERCEL_PROJECT_ID': 'prj_test', 'VERCEL_ORG_ID': 'team_test'}
            with patch.dict(os.environ, env):
                cd.package(dist, root / 'release')
            output = root / 'release' / '.vercel' / 'output'
            for source in dist.rglob('*'):
                if source.is_file():
                    self.assertEqual(source.read_bytes(), (output / 'static' / source.relative_to(dist)).read_bytes())
            self.assertTrue((root / 'release' / 'src' / 'frontend').is_dir())
            config = json.loads((output / 'config.json').read_text())
            self.assertEqual(config['version'], 3)
            self.assertEqual(config['routes'][0]['dest'], BACKEND + '/api/$1')
            self.assertEqual(config['routes'][1]['dest'], BACKEND + '/health')
            self.assertEqual(config['routes'][-1]['dest'], '/index.html')
            self.assertNotIn('test-only', (output / 'config.json').read_text())

    def test_incomplete_or_hidden_artifact_is_rejected(self):
        with TemporaryDirectory() as directory, patch.dict(os.environ, {'BACKEND_URL': BACKEND, 'VERCEL_PROJECT_ID':'prj_test', 'VERCEL_ORG_ID':'team_test'}):
            root = Path(directory)
            with self.assertRaises(ValueError):
                cd.package(root, root / 'out')
            (root / 'index.html').touch()
            (root / '.env').touch()
            with self.assertRaises(ValueError):
                cd.package(root, root / 'out')

    def test_smoke_checks_html_database_and_real_api_401_instead_of_spa_html(self):
        responses = [(200, b'<div id="root">Bienvenido</div>', {}),
                     (200, b'{"status":"ok"}', {}), (401, b'{"detail":"Sin sesion"}', {})]
        with patch('cd.request', side_effect=responses) as request:
            cd.smoke('https://ecolog-deployment.vercel.app')
            self.assertIn('/api/v1/vehiculos?', request.call_args.args[0])
        with patch('cd.request', side_effect=[*responses[:2], (200, responses[0][1], {})]), self.assertRaises(RuntimeError):
            cd.smoke('https://ecolog-deployment.vercel.app')
        with self.assertRaises(ValueError):
            cd.smoke('https://ecolog-deployment.vercel.app.evil.test')

    def test_validate_cli_output_before_using_it_in_workflow(self):
        with TemporaryDirectory() as directory:
            file = Path(directory) / 'url.txt'
            file.write_text('https://ecolog-deployment.vercel.app\n')
            self.assertEqual(cd.deployment_url(file), 'https://ecolog-deployment.vercel.app')
            for data in [{'url':'https://ecolog-deployment.vercel.app'}, {'status':'ok','deployment':{'url':'ecolog-deployment.vercel.app'}}]:
                file.write_text(json.dumps(data))
                self.assertEqual(cd.deployment_url(file), 'https://ecolog-deployment.vercel.app')
            file.write_text('https://evil.test/\nurl=override')
            with self.assertRaises(ValueError):
                cd.deployment_url(file)

    def test_protected_smoke_uses_vercel_auth_without_an_extra_bypass_secret(self):
        responses = [(200, b'<div id="root">Bienvenido</div>', {}),
                     (200, b'{"status":"ok"}', {}), (401, b'{"detail":"Sin sesion"}', {})]
        with patch('cd.vercel_request', side_effect=responses) as get, patch('cd.request') as raw:
            cd.smoke('https://ecolog-deployment.vercel.app', via_cli=True)
            self.assertEqual(get.call_count, 3)
            raw.assert_not_called()

    def test_vercel_curl_preserves_status_body_and_hides_cli_error_output(self):
        def complete(command, **kwargs):
            Path(command[command.index('--output') + 1]).write_bytes(b'{"status":"ok"}')
            self.assertNotIn('--token', command)
            self.assertNotIn('--cwd', command)
            self.assertEqual(kwargs['cwd'], '/tmp/release')
            return subprocess.CompletedProcess(command, 0, '200', '')
        with patch.dict(os.environ, {'VERCEL_RELEASE_WORKSPACE':'/tmp/release'}), patch('cd.subprocess.run', side_effect=complete):
            status, body, _ = cd.vercel_request('https://ecolog-deployment.vercel.app/health')
            self.assertEqual((status, body), (200, b'{"status":"ok"}'))
        with patch.dict(os.environ, {'VERCEL_RELEASE_WORKSPACE':'/tmp/release'}), \
                patch('cd.subprocess.run', return_value=subprocess.CompletedProcess([], 1, '', 'dummy-secret')), self.assertRaises(RuntimeError) as raised:
            cd.vercel_request('https://ecolog-deployment.vercel.app/health')
        self.assertNotIn('dummy-secret', str(raised.exception))


class TransportAndGateTests(unittest.TestCase):
    def test_transport_blocks_redirects_and_does_not_disclose_error_bodies(self):
        hits = []
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                hits.append(self.path)
                if self.path == '/redirect':
                    self.send_response(302)
                    self.send_header('Location', '/sink')
                    self.end_headers()
                elif self.path == '/unauthorized':
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(b'{"detail":"Sin sesion"}')
                else:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(b'dummy-secret-that-must-not-appear')
            def do_POST(self):
                self.send_response(201)
                self.end_headers()
                self.wfile.write(b'{"id":"test"}')
            def log_message(self, *args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = 'http://127.0.0.1:' + str(server.server_port)
        try:
            self.assertEqual(cd.api(base, 'test-only', {'commitId': SHA}), {'id': 'test'})
            self.assertEqual(cd.request(base + '/unauthorized')[0], 401)
            for endpoint in ['/redirect', '/error', '/unauthorized']:
                with self.subTest(endpoint=endpoint), self.assertRaises(RuntimeError) as raised:
                    cd.request(base + endpoint, token='test-only')
                self.assertNotIn('dummy-secret', str(raised.exception))
            self.assertNotIn('/sink', hits)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_gate_outputs_only_approved_metadata_and_guard_fails_closed(self):
        with TemporaryDirectory() as directory:
            output = Path(directory) / 'outputs'
            env = {'GITHUB_REPOSITORY': cd.REPOSITORY, 'TARGET_SHA': SHA,
                   'GH_TOKEN': 'test-only', 'GITHUB_OUTPUT': str(output)}
            with patch.dict(os.environ, env), patch('cd.api'), \
                    patch('cd.approved_runs', return_value={name: 10 for name in cd.WORKFLOWS}), \
                    patch('cd.already_released', return_value=False):
                cd.gate()
            self.assertIn('revision=' + SHA, output.read_text())
            self.assertNotIn('test-only', output.read_text())
            with patch.dict(os.environ, env), patch('cd.approved_runs', return_value=None):
                cd.gate()
                with self.assertRaises(RuntimeError):
                    cd.gate(required=True)
            with patch.dict(os.environ, env), patch('cd.approved_runs', return_value={'ci.yml': 10}), \
                    patch('cd.already_released', return_value=True):
                cd.gate()
            self.assertTrue(output.read_text().endswith('deploy=false\n'))

    def test_invalid_commit_repository_and_health_are_rejected(self):
        with self.assertRaises(ValueError):
            cd.sha('main')
        with patch.dict(os.environ, {'GITHUB_REPOSITORY': 'other/repo'}), self.assertRaises(ValueError):
            cd.gate()
        for status, body in [(200, b'{"status":"down"}'), (401, b'{"detail":"Sin acceso"}')]:
            with patch('cd.request', return_value=(status, body, {})), self.assertRaises(RuntimeError):
                cd.health(BACKEND)


if __name__ == '__main__':
    unittest.main()
