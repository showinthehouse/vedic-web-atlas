#!/usr/bin/env python3
"""Install the ephemeris files intentionally omitted from PyJHora PyPI wheels.

PyJHora documents that releases from 3.6.6 onward omit ``jhora/data/ephe``
because of package size. This build-time helper copies only that directory
from the matching, immutable upstream tag into the installed package.
"""

from __future__ import annotations

import io
import os
import tarfile
import urllib.request
from pathlib import Path

import jhora


PYJHORA_TAG = os.environ.get("PYJHORA_TAG", "V4.8.7")
ARCHIVE_URL = f"https://codeload.github.com/naturalstupid/PyJHora/tar.gz/refs/tags/{PYJHORA_TAG}"
SOURCE_MARKER = ("src", "jhora", "data", "ephe")


def existing_ephe_files(target: Path) -> list[Path]:
    return [path for path in target.glob("*") if path.is_file()]


def main() -> None:
    configured_target = os.environ.get("PYJHORA_EPHE_TARGET")
    target = Path(configured_target).resolve() if configured_target else Path(jhora.__file__).resolve().parent / "data" / "ephe"
    if existing_ephe_files(target):
        print(f"PyJHora ephemeris already available: {target}")
        return

    print(f"Downloading PyJHora {PYJHORA_TAG} ephemeris data from {ARCHIVE_URL}")
    with urllib.request.urlopen(ARCHIVE_URL, timeout=60) as response:
        archive = response.read()

    copied = 0
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
        for member in tar.getmembers():
            parts = Path(member.name).parts
            try:
                marker_index = next(index for index in range(len(parts)) if parts[index : index + 4] == SOURCE_MARKER)
            except StopIteration:
                continue
            relative = Path(*parts[marker_index + len(SOURCE_MARKER) :])
            if not relative.parts or not member.isfile() or relative.is_absolute() or ".." in relative.parts:
                continue
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            source = tar.extractfile(member)
            if source is None:
                continue
            with source, destination.open("wb") as output:
                output.write(source.read())
            copied += 1

    if copied == 0 or not existing_ephe_files(target):
        raise RuntimeError("No PyJHora ephemeris files were copied from the pinned upstream tag.")
    print(f"Installed {copied} PyJHora ephemeris files into {target}")


if __name__ == "__main__":
    main()
