"""QA local de PDFs de prueba ya generados; no produce informes de inversión."""
from pathlib import Path
import hashlib
import json
import unicodedata
import re
from PIL import Image
import pypdfium2 as pdfium

root = Path(__file__).resolve().parent.parent
folder = root / "output/cierre-alfa/fundamentales"
names = ["INFORME_PRUEBA_IBERDROLA", "PRUEBA_IBERDROLA_10", "PRUEBA_IBERDROLA_all", "PRUEBA_TSK_all"]
seen, report = {}, []
for name in names:
    doc = pdfium.PdfDocument(folder / f"{name}.pdf")
    for number in range(len(doc)):
        page = doc[number]
        bitmap = page.render(scale=1.3).to_pil()
        digest = hashlib.sha256(bitmap.tobytes()).hexdigest()
        file = folder / f"qa-{name}-{number + 1}.png"
        previous_digest = None
        if file.exists():
            with Image.open(file) as previous:
                previous_digest = hashlib.sha256(previous.tobytes()).hexdigest()
        bitmap.save(file)
        text = page.get_textpage().get_text_range()
        normalized = " ".join("".join(c for c in unicodedata.normalize("NFD", text.upper()) if not unicodedata.combining(c)).split())
        required = []
        if "CIERRE" in normalized and "MONEDA DECLARADA" in normalized:
            if "BENEFICIO BRUTO" in normalized:
                required = ["INGRESOS", "EBITDA", "BENEFICIO NETO", "MARGEN NETO"]
            elif "PASIVOS" in normalized:
                required = ["ACTIVOS", "PATRIMONIO", "CAJA", "DEUDA NETA", "DEUDA TOTAL"]
            elif "CAPEX" in normalized:
                required = ["FLUJO OPERATIVO", "FCF", "DIVIDENDOS"]
        header_start = normalized.find("CIERRE MONEDA")
        header = re.split(r"\b\d{1,2} (?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEPT|OCT|NOV|DIC) \d{4}\b", normalized[header_start:], maxsplit=1)[0] if header_start >= 0 else normalized
        missing = [label for label in required if label not in header]
        record = {"pdf": name, "page": number + 1, "png": str(file.relative_to(root)),
                  "missingHeaders": missing,
                  "unchangedSincePreviousRender": digest == previous_digest,
                  "sameAs": seen.get(digest), "characters": len(text), "empty": not text.strip()}
        seen.setdefault(digest, {"pdf": name, "page": number + 1})
        report.append(record)
    doc.close()
(folder / "qa-paginas.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"pages": len(report), "unique": len(seen), "empty": [r for r in report if r["empty"]],
                  "missingHeaders": [r for r in report if r["missingHeaders"]],
                  "review": [{"pdf": r["pdf"], "page": r["page"], "unchanged": r["unchangedSincePreviousRender"]} for r in report if not r["sameAs"]]}, ensure_ascii=False))
if any(r["empty"] or r["missingHeaders"] for r in report):
    raise SystemExit(1)
