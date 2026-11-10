"""Run Compose with protected settings in memory, without a plaintext secrets file."""
import os
import subprocess
import sys
from pathlib import Path

from local_staging_settings import load_settings, settings_directory


def compose_arguments(arguments: list[str]) -> list[str]:
    """Rebuild allowed operations from constants; never forward arbitrary flags."""
    operations = {
        ("ps",): ["ps"],
        ("config", "--quiet"): ["config", "--quiet"],
        ("up", "-d"): ["up", "-d"],
        ("up", "-d", "--build"): ["up", "-d", "--build"],
        ("up", "-d", "--build", "--wait"): ["up", "-d", "--build", "--wait"],
        ("up", "-d", "gateway"): ["up", "-d", "gateway"],
        ("build",): ["build"],
        ("stop",): ["stop"],
        ("start",): ["start"],
        ("down",): ["down"],
        ("logs", "--tail", "50"): ["logs", "--tail", "50"],
    }
    if tuple(arguments) in operations:
        return operations[tuple(arguments)]
    if arguments and arguments[0] == "cp":
        authority = settings_directory() / "localhost-root.crt"
        if arguments == ["cp", "gateway:/data/caddy/pki/authorities/local/root.crt", str(authority)]:
            return ["cp", "gateway:/data/caddy/pki/authorities/local/root.crt", str(authority)]
    raise ValueError("Operación no permitida. Consultar la guía de staging; config exige --quiet.")


def main() -> int:
    repository = Path(__file__).resolve().parents[1]
    arguments = compose_arguments(sys.argv[1:] or ["ps"])
    environment = {**os.environ, **load_settings()}
    command = ["docker", "compose", "--env-file", str(repository / ".env.staging.example"),
               "-p", "ecologistica-staging-local", "-f", str(repository / "docker-compose.staging.yml"),
               *arguments]
    return subprocess.run(command, cwd=repository, env=environment, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
