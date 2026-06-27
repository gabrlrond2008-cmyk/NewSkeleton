var ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (ch) { return ESCAPE_MAP[ch] || ch; });
}

function parseInline(text) {
    // Order matters: code first, then bold, then italic
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    return text;
}

var TABLE_ROW = /^\|(.+)\|$/;
var LIST_ITEM = /^[-*]\s+(.+)/;

function parseTableRow(line) {
    var cells = [];
    var parts = line.split('|');
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p !== '' || i > 0) {
            cells.push(p);
        }
    }
    return cells;
}

function isSepRow(cells) {
    if (cells.length === 0) return false;
    for (var i = 0; i < cells.length; i++) {
        if (!/^-+[: -]*$/.test(cells[i])) return false;
    }
    return true;
}

function renderCell(text) {
    return parseInline(escapeHtml(text));
}

function buildTable(headers, rows) {
    var h = '<table><thead><tr>';
    for (var i = 0; i < headers.length; i++) {
        h += '<th>' + renderCell(headers[i]) + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (var r = 0; r < rows.length; r++) {
        h += '<tr>';
        for (var c = 0; c < headers.length; c++) {
            h += '<td>' + (c < rows[r].length ? renderCell(rows[r][c]) : '') + '</td>';
        }
        h += '</tr>';
    }
    h += '</tbody></table>';
    return h;
}

function markdownToHtml(text) {
    if (!text) return '';

    var lines = text.split('\n');
    var html = '';
    var inTable = false;
    var tableH = null;
    var tableRows = [];
    var inList = false;

    for (var i = 0; i < lines.length; i++) {
        var raw = lines[i];
        var line = raw.trim();

        // Empty line
        if (!line) {
            if (inTable) {
                html += buildTable(tableH, tableRows);
                tableH = null; tableRows = []; inTable = false;
            }
            if (inList) {
                inList = false;
            }
            continue;
        }

        // Table row
        var tm = TABLE_ROW.exec(line);
        if (tm) {
            var cells = parseTableRow(line);
            if (!inTable) {
                tableH = cells; tableRows = []; inTable = true;
            } else if (isSepRow(cells)) {
                // separator, skip
            } else {
                tableRows.push(cells);
            }
            continue;
        }
        if (inTable) {
            html += buildTable(tableH, tableRows);
            tableH = null; tableRows = []; inTable = false;
        }

        // List item
        var lm = LIST_ITEM.exec(line);
        if (lm) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += '<li>' + renderCell(lm[1]) + '</li>';
            continue;
        }
        if (inList) {
            html += '</ul>';
            inList = false;
        }

        // Regular paragraph
        html += '<p>' + renderCell(line) + '</p>';
    }

    if (inTable && tableH) html += buildTable(tableH, tableRows);
    if (inList) html += '</ul>';

    return html;
}

export {markdownToHtml};
