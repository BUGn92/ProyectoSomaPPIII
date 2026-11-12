#!/usr/bin/env python3
"""
Exportador de documentos Markdown con diagramas Mermaid a HTML y PDF (vía Google Chrome Headless).
Uso:
    python3 backend/scripts/export_pdf.py
o para un archivo específico:
    python3 backend/scripts/export_pdf.py "Documentos/ERS SOMA.md"
"""

import os
import sys
import json
import subprocess

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @page {{
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
  }}
  body {{
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1e293b;
    max-width: 960px;
    margin: 0 auto;
    padding: 20px;
    background: #ffffff;
  }}
  h1 {{
    font-size: 20pt;
    color: #0f172a;
    border-bottom: 2px solid #1e40af;
    padding-bottom: 6px;
    margin-top: 28px;
    page-break-after: avoid;
  }}
  h2 {{
    font-size: 14.5pt;
    color: #1e3a8a;
    margin-top: 22px;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    page-break-after: avoid;
  }}
  h3 {{
    font-size: 12pt;
    color: #1e293b;
    margin-top: 16px;
    page-break-after: avoid;
  }}
  h4 {{
    font-size: 10.5pt;
    color: #334155;
    margin-top: 12px;
    page-break-after: avoid;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
    page-break-inside: auto;
  }}
  tr {{
    page-break-inside: avoid;
    page-break-after: auto;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 7px 10px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 600;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}
  code {{
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    background-color: #f1f5f9;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9pt;
    color: #0f172a;
  }}
  pre {{
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    font-size: 9pt;
  }}
  .mermaid-container {{
    text-align: center;
    margin: 14px 0;
    padding: 10px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    break-inside: avoid;
    page-break-inside: avoid;
  }}
  .mermaid svg {{
    max-width: 100% !important;
    max-height: 195mm !important;
    width: auto !important;
    height: auto !important;
  }}
  img {{
    display: block;
    max-width: 100%;
    max-height: 155mm;
    width: auto;
    height: auto;
    margin: 14px auto;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  blockquote {{
    margin: 12px 0;
    padding: 10px 14px;
    background-color: #f8fafc;
    border-left: 4px solid #2563eb;
    border-radius: 4px;
    color: #334155;
  }}
  hr {{
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 24px 0;
  }}
  a {{
    color: #1d4ed8;
    text-decoration: none;
  }}
</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
<div id="content">Renderizando documento y diagramas...</div>
<script>
  const mdSource = {md_json};

  const renderer = new marked.Renderer();
  const defaultCodeRenderer = renderer.code.bind(renderer);

  renderer.code = function(code, infostring, escaped) {{
    let text = code;
    let lang = infostring;
    if (typeof code === 'object' && code !== null) {{
      text = code.text || '';
      lang = code.lang || '';
    }}
    if ((lang || '').trim().toLowerCase() === 'mermaid') {{
      const escapedMermaid = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return '<div class="mermaid-container"><pre class="mermaid">' + escapedMermaid + '</pre></div>';
    }}
    return defaultCodeRenderer(code, infostring, escaped);
  }};

  marked.setOptions({{ renderer: renderer, gfm: true, breaks: false }});
  document.getElementById('content').innerHTML = marked.parse(mdSource);

  mermaid.initialize({{
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {{
      primaryColor: '#eff6ff',
      primaryTextColor: '#0f172a',
      primaryBorderColor: '#2563eb',
      lineColor: '#334155',
      secondaryColor: '#f8fafc',
      tertiaryColor: '#f1f5f9',
      fontFamily: 'Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
      fontSize: '13.5px'
    }},
    flowchart: {{
      useMaxWidth: true,
      htmlLabels: true,
      nodeSpacing: 28,
      rankSpacing: 46,
      padding: 12
    }},
    class: {{
      useMaxWidth: true
    }},
    er: {{
      useMaxWidth: true,
      layoutDirection: 'TB',
      minEntityWidth: 90,
      minEntityHeight: 60,
      entityPadding: 10,
      fontSize: 13
    }},
    sequence: {{
      useMaxWidth: true,
      actorMargin: 16,
      width: 110,
      height: 44,
      boxMargin: 6,
      messageMargin: 22,
      mirrorActors: false
    }}
  }});

  mermaid.run({{ querySelector: '.mermaid' }}).then(() => {{
    document.body.setAttribute('data-mermaid-ready', 'true');
  }}).catch((err) => {{
    console.error('Mermaid error:', err);
    document.body.setAttribute('data-mermaid-error', String(err));
  }});
</script>
</body>
</html>
"""


def export_markdown_to_pdf(md_path: str):
    abs_md = os.path.abspath(md_path)
    if not os.path.isfile(abs_md):
        print(f"Archivo no encontrado: {abs_md}")
        return

    base_no_ext = os.path.splitext(abs_md)[0]
    html_path = base_no_ext + ".html"
    pdf_path = base_no_ext + ".pdf"
    title = os.path.basename(base_no_ext)

    with open(abs_md, "r", encoding="utf-8") as f:
        md_text = f.read()

    html_content = HTML_TEMPLATE.format(
        title=title,
        md_json=json.dumps(md_text),
    )

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"-> HTML con Mermaid generado: {html_path}")

    chrome_bin = "/usr/bin/google-chrome"
    if os.path.exists(chrome_bin):
        file_url = "file://" + html_path
        cmd = [
            chrome_bin,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--no-pdf-header-footer",
            "--virtual-time-budget=12000",
            f"--print-to-pdf={pdf_path}",
            file_url,
        ]
        subprocess.run(cmd, check=True)
        print(f"-> PDF generado con éxito: {pdf_path}")
    else:
        print("-> No se encontró google-chrome; puedes abrir el archivo .html en tu navegador y presionar Ctrl+P -> Guardar como PDF.")


def main():
    targets = sys.argv[1:]
    if not targets:
        default_files = [
            os.path.join(ROOT_DIR, "Documentos", "ERS SOMA.md"),
            os.path.join(ROOT_DIR, "Documentos", "MejorasAFuturo.md"),
            os.path.join(ROOT_DIR, "Documentos", "manual_de_usuario.md"),
        ]
        targets = [p for p in default_files if os.path.isfile(p)]

    for t in targets:
        export_markdown_to_pdf(t)


if __name__ == "__main__":
    main()
