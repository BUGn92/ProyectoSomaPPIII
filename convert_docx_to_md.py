import sys
import os
import docx

def docx_to_markdown(docx_path, md_path):
    print(f"Converting {docx_path} to {md_path}...")
    doc = docx.Document(docx_path)
    md_content = []
    
    # Track lists to avoid weird spacing
    in_list = False
    
    for element in doc.element.body:
        if element.tag.endswith('p'):
            p = docx.text.paragraph.Paragraph(element, doc)
            text = p.text.strip()
            
            # Check style
            style_name = p.style.name.lower()
            
            if not text:
                if not in_list:
                    md_content.append("")
                continue
                
            # Formatting heading
            if 'heading 1' in style_name:
                in_list = False
                md_content.append(f"\n# {text}\n")
            elif 'heading 2' in style_name:
                in_list = False
                md_content.append(f"\n## {text}\n")
            elif 'heading 3' in style_name:
                in_list = False
                md_content.append(f"\n### {text}\n")
            elif 'heading 4' in style_name:
                in_list = False
                md_content.append(f"\n#### {text}\n")
            elif 'heading 5' in style_name:
                in_list = False
                md_content.append(f"\n##### {text}\n")
            elif 'heading 6' in style_name:
                in_list = False
                md_content.append(f"\n###### {text}\n")
            elif 'list bullet' in style_name:
                in_list = True
                md_content.append(f"- {text}")
            elif 'list number' in style_name or 'list' in style_name:
                in_list = True
                md_content.append(f"1. {text}")
            else:
                in_list = False
                # Reconstruct paragraph text with bold/italic formatting
                runs_text = []
                for run in p.runs:
                    r_text = run.text
                    if not r_text:
                        continue
                    # Handle basic formatting
                    if run.bold and run.italic:
                        runs_text.append(f"***{r_text}***")
                    elif run.bold:
                        runs_text.append(f"**{r_text}**")
                    elif run.italic:
                        runs_text.append(f"*{r_text}*")
                    else:
                        runs_text.append(r_text)
                
                # Check if it looks like a list anyway
                p_text_formatted = "".join(runs_text).strip()
                if p_text_formatted.startswith("- ") or p_text_formatted.startswith("* "):
                    md_content.append(p_text_formatted)
                else:
                    md_content.append(p_text_formatted + "\n")
                
        elif element.tag.endswith('tbl'):
            in_list = False
            tbl = docx.table.Table(element, doc)
            md_table = []
            headers = []
            
            # We want to process rows
            for i, row in enumerate(tbl.rows):
                row_cells = []
                for cell in row.cells:
                    # Combine paragraphs in cell
                    cell_text = " ".join([p.text.strip() for p in cell.paragraphs]).replace("\n", " ").strip()
                    row_cells.append(cell_text)
                
                if i == 0:
                    headers = row_cells
                    md_table.append("\n| " + " | ".join(headers) + " |")
                    md_table.append("| " + " | ".join(["---"] * len(headers)) + " |")
                else:
                    # Pad or truncate cells to match header length
                    if not headers:
                        headers = [""] * len(row_cells)
                        md_table.append("\n| " + " | ".join(headers) + " |")
                        md_table.append("| " + " | ".join(["---"] * len(headers)) + " |")
                    while len(row_cells) < len(headers):
                        row_cells.append("")
                    row_cells = row_cells[:len(headers)]
                    md_table.append("| " + " | ".join(row_cells) + " |")
            
            md_table.append("\n")
            md_content.append("\n".join(md_table))
            
    # Write to output file
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(md_content))
    print(f"Successfully converted to {md_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: convert_docx_to_md.py <input.docx> <output.md>")
        sys.exit(1)
    docx_to_markdown(sys.argv[1], sys.argv[2])
