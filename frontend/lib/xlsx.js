// Excel (.xlsx) fayl yaratish — kutubxonasiz, faqat zip (fflate) ishlatiladi.
import { zipSync, strToU8 } from 'fflate';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Excel qabul qilmaydigan boshqaruv belgilarini olib tashlash
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

function colName(i) {
  let s = '';
  i += 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

// Excel sana raqami (1900 tizimi), mahalliy vaqt bo'yicha
function excelDate(d) {
  const t = new Date(d);
  return (t.getTime() - t.getTimezoneOffset() * 60000) / 86400000 + 25569;
}

// Uslub indekslari (styles.xml dagi cellXfs tartibi bilan mos)
const S = { text: 0, header: 1, qty: 2, money: 3, datetime: 4, date: 5, boldText: 6, boldMoney: 7, boldQty: 8, title: 9 };

const STYLE_FOR = { text: S.text, num: S.qty, money: S.money, date: S.date, datetime: S.datetime };

function cellXml(ref, value, type, styleOverride) {
  const style = styleOverride !== undefined ? styleOverride : STYLE_FOR[type] ?? S.text;
  if (value === null || value === undefined || value === '') return `<c r="${ref}" s="${style}"/>`;
  if (type === 'num' || type === 'money') {
    const n = Number(value);
    if (!isFinite(n)) return `<c r="${ref}" s="${style}"/>`;
    return `<c r="${ref}" s="${style}"><v>${n}</v></c>`;
  }
  if (type === 'date' || type === 'datetime') {
    return `<c r="${ref}" s="${style}"><v>${excelDate(value)}</v></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml(sheet) {
  const cols = sheet.columns || [];
  const colsXml = cols.length
    ? `<cols>${cols
        .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width || 16}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';

  const rows = [];
  let r = 1;

  // Sarlavha (ixtiyoriy)
  if (sheet.title) {
    rows.push(`<row r="${r}" ht="22" customHeight="1">${cellXml(`A${r}`, sheet.title, 'text', S.title)}</row>`);
    r += 1;
    if (sheet.subtitle) {
      rows.push(`<row r="${r}">${cellXml(`A${r}`, sheet.subtitle, 'text', S.text)}</row>`);
      r += 1;
    }
    rows.push(`<row r="${r}"/>`);
    r += 1;
  }

  const headerRow = r;
  rows.push(
    `<row r="${r}" ht="26" customHeight="1">${cols
      .map((c, i) => cellXml(`${colName(i)}${r}`, c.header, 'text', S.header))
      .join('')}</row>`
  );
  r += 1;

  for (const row of sheet.rows || []) {
    const cells = cols
      .map((c, i) => {
        const bold = row.__bold;
        let style;
        if (bold) style = c.type === 'money' ? S.boldMoney : c.type === 'num' ? S.boldQty : S.boldText;
        return cellXml(`${colName(i)}${r}`, Array.isArray(row) ? row[i] : row.cells[i], c.type || 'text', style);
      })
      .join('');
    rows.push(`<row r="${r}">${cells}</row>`);
    r += 1;
  }

  const lastCol = colName(Math.max(cols.length - 1, 0));
  const freeze = `<sheetViews><sheetView workbookViewId="0"${sheet.rtl ? ' rightToLeft="1"' : ''}><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`;
  const filter = cols.length ? `<autoFilter ref="A${headerRow}:${lastCol}${Math.max(r - 1, headerRow)}"/>` : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freeze}${colsXml}<sheetData>${rows.join('')}</sheetData>${filter}<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="4">
<numFmt numFmtId="164" formatCode="#,##0.###"/>
<numFmt numFmtId="165" formatCode="#,##0"/>
<numFmt numFmtId="166" formatCode="dd.mm.yyyy\\ hh:mm"/>
<numFmt numFmtId="167" formatCode="dd.mm.yyyy"/>
</numFmts>
<fonts count="4">
<font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF1F4FD8"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F4FD8"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D5DD"/></left><right style="thin"><color rgb="FFD0D5DD"/></right><top style="thin"><color rgb="FFD0D5DD"/></top><bottom style="thin"><color rgb="FFD0D5DD"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="165" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const safeName = (s, i) =>
  (String(s || `List${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `List${i + 1}`);

/**
 * sheets: [{ name, title?, subtitle?, columns: [{header, width, type}], rows: [[..]] }]
 * Qaytaradi: Uint8Array (.xlsx fayl mazmuni)
 */
export function buildXlsx(sheets) {
  const list = sheets.filter(Boolean);
  const files = {};

  files['[Content_Types].xml'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${list
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join('')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  files['_rels/.rels'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  files['xl/workbook.xml'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${list
      .map((s, i) => `<sheet name="${esc(safeName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets>
</workbook>`
  );

  files['xl/_rels/workbook.xml.rels'] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${list
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
  )
  .join('')}
<Relationship Id="rId${list.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  files['xl/styles.xml'] = strToU8(STYLES_XML);
  list.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s));
  });

  return zipSync(files, { level: 6 });
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
