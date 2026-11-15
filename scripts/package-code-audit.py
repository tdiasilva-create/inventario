"""Package committed public source for independent audit. No working-tree/private data.

Usage: python scripts/package-code-audit.py ABSOLUTE_OUTPUT_ZIP
Requires Git, Python 3 and a clean tree. Does not deploy or access production.
"""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

if len(sys.argv) != 2:
    raise SystemExit("Informe o caminho absoluto de um ZIP novo.")
target = Path(sys.argv[1])
if not target.is_absolute() or target.suffix.lower() != ".zip" or target.exists():
    raise SystemExit("O destino deve ser absoluto, .zip e ainda não existir.")
if git("status", "--porcelain").strip():
    raise SystemExit("Commitar/revisar todas as mudanças antes de empacotar.")
subprocess.run(["node", "scripts/check-repository.mjs"], cwd=ROOT, check=True)
commit = git("rev-parse", "HEAD").decode().strip()
branch = git("branch", "--show-current").decode().strip()
source = zipfile.ZipFile(io.BytesIO(git("archive", "--format=zip", "HEAD")))
forbidden = re.compile(r"(^|/)(private-data|backups|exports-reais|node_modules|\.git|\.wrangler|revisoes|entregas|pedidos|dist|build)(/|$)|(^|/)\.env(?!\.example$)|(^|/)\.dev\.vars(?!\.example$)|\.(exe|msi|dll|apk|keystore|jks|zip|sqlite3?|db|pem|pfx|p12|key|har|trace|log)$", re.I)
secret_patterns = [re.compile(p) for p in [
    rb"-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----",
    rb"GOCSPX-[A-Za-z0-9_-]{20,}", rb"1//[A-Za-z0-9_-]{50,}",
    rb"(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})",
    rb"eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}",
]]
payload = {}
excluded = []
for entry in source.infolist():
    if entry.is_dir():
        continue
    name = entry.filename
    # Some older screenshots were tracked before .gitignore was expanded.
    # Never export authenticated captures or operational logs in the audit ZIP.
    if name.startswith("docs/05-qualidade/evidencias/"):
        excluded.append(name)
        continue
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or forbidden.search(name) or (entry.external_attr >> 16) & 0o170000 == 0o120000:
        raise SystemExit("Entrada não permitida: " + name)
    data = source.read(entry)
    if any(pattern.search(data) for pattern in secret_patterns):
        raise SystemExit("Possível segredo; revisar sem imprimir conteúdo: " + name)
    payload["FONTES/" + name] = data

audit = "FONTES/docs/08-auditoria/2026-11-15/"
payload["00_PEDIDO_AO_CLAUDE.txt"] = payload[audit + "00_PEDIDO_AO_CLAUDE.txt"]
payload["LEIA_PRIMEIRO.txt"] = (
    "AUDITORIA INDEPENDENTE SEMED — 15/11/2026\n\n"
    "Envie este ZIP inteiro ao Claude junto com 00_PEDIDO_AO_CLAUDE.txt.\n"
    "Comece pelo pedido; FONTES/ contém o código versionado e seus documentos.\n"
    "O pacote é de auditoria, não autorização de implantação.\n"
    "Commit: " + commit + "\nBranch: " + branch + "\n\n"
    "Use a matriz, o roteiro e o modelo de devolutiva em:\n"
    "FONTES/docs/08-auditoria/2026-11-15/\n"
    "Estado atual: FONTES/docs/07-operacao/13_ESTADO_ATUAL_D122.md\n"
    "Documentos antigos permanecem com suas datas; decisões mais recentes prevalecem.\n"
    "Sem banco real, fotos operacionais, credenciais, cookies, chaves de assinatura,\n"
    "APK/EXE, node_modules, .git ou dependências binárias privadas do agente.\n"
    "Inclui assets e referências visuais versionados, e fixtures sintéticas.\n"
    "Capturas/logs antigos de docs/05-qualidade/evidencias foram omitidos,\n"
    "mesmo quando constavam do Git. Omissões listadas em PACOTE.json.\n"
    "MANIFESTO_SHA256.txt cobre todos os arquivos exceto ele mesmo.\n"
    "O código vem dos bytes do commit, com finais de linha do Git.\n"
).encode("utf-8")
metadata = {"format": 1, "date": "2026-11-15", "timezone": "America/Fortaleza",
            "repository": "https://github.com/tdiasilva-create/inventario", "branch": branch,
            "commit": commit, "gitTree": git("rev-parse", "HEAD^{tree}").decode().strip(),
            "sourceFiles": sum(name.startswith("FONTES/") for name in payload),
            "excludedTrackedPaths": excluded,
            "scope": "Committed source and documentation, excluding historical operational evidence; no production export or new deployment",
            "sourceOfProductionVersions": "Prior release reports, not a fresh production query",
            "secretsCheck": "Path rules and known signatures plus preparation review; not exhaustive DLP"}
payload["PACOTE.json"] = (json.dumps(metadata, ensure_ascii=False, indent=2) + "\n").encode()
manifest = "".join(hashlib.sha256(data).hexdigest() + "  " + name + "\n" for name, data in sorted(payload.items()))
payload["MANIFESTO_SHA256.txt"] = manifest.encode()
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for name, data in sorted(payload.items()):
        entry = zipfile.ZipInfo(name, (2026, 11, 15, 12, 0, 0))
        entry.external_attr = 0o100644 << 16
        entry.compress_type = zipfile.ZIP_DEFLATED
        output.writestr(entry, data)
with zipfile.ZipFile(target) as output:
    if output.testzip() is not None or set(output.namelist()) != set(payload):
        raise SystemExit("ZIP inválido após escrita.")
    for name, data in payload.items():
        if output.read(name) != data:
            raise SystemExit("Conteúdo divergente: " + name)
digest = hashlib.sha256(target.read_bytes()).hexdigest()
target.with_suffix(".sha256.txt").write_text(digest + "  " + target.name + "\n", encoding="utf-8")
print(json.dumps({"zip": str(target), "sha256": digest, "bytes": target.stat().st_size,
                  "files": len(payload), "sourceFiles": metadata["sourceFiles"], "commit": commit}, ensure_ascii=False))
