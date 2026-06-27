const CATEGORY_ORDER = [
    'motion', 'looks', 'sound', 'events', 'control', 'sensing', 'operators',
    'variables', 'lists', 'myBlocks'
];

const CATEGORY_META = {
    motion:     {label: 'Motion',     color: '#4C97FF'},
    looks:      {label: 'Looks',      color: '#9966FF'},
    sound:      {label: 'Sound',      color: '#CF63CF'},
    events:     {label: 'Events',     color: '#FFBF00'},
    control:    {label: 'Control',    color: '#FFAB19'},
    sensing:    {label: 'Sensing',    color: '#5CB1D6'},
    operators:  {label: 'Operators',  color: '#59C059'},
    variables:  {label: 'Variables',  color: '#FF8C1A'},
    lists:      {label: 'Lists',      color: '#FF661A'},
    myBlocks:   {label: 'My Blocks',  color: '#FF6680'}
};

function stripPlaceholders(msg) {
    if (!msg) return '';
    return msg.replace(/%\d+/g, '').replace(/%\{BKY_\w+\}/g, '').replace(/\s+/g, ' ').trim();
}

function blockTypeToMsgKey(type) {
    return type.toUpperCase().replace(/-/g, '_');
}

function getBlockName(type, ScratchBlocks) {
    if (!ScratchBlocks) return type;
    const msgKey = blockTypeToMsgKey(type);
    const msg = ScratchBlocks.Msg[msgKey];
    if (msg) return stripPlaceholders(msg);
    return type;
}

function extractBlockTypesFromXML(xml) {
    const types = [];
    const regex = /<block[^>]*\stype="([^"]+)"/g;
    let m;
    while ((m = regex.exec(xml)) !== null) {
        if (!types.includes(m[1])) types.push(m[1]);
    }
    return types;
}

function getVariableBlocks(workspace) {
    if (!workspace) return [];
    const results = [];
    const varMap = workspace.getVariableMap();
    if (!varMap) return results;

    const variables = varMap.getVariablesOfType('');
    for (const v of variables) {
        results.push({
            type: 'data_variable',
            name: v.name,
            id: v.getId(),
            category: 'variables',
            color: CATEGORY_META.variables.color,
            categoryLabel: 'Variables',
            blockType: 'variable'
        });
    }

    const lists = varMap.getVariablesOfType('list');
    for (const v of lists) {
        results.push({
            type: 'data_listcontents',
            name: v.name,
            id: v.getId(),
            category: 'lists',
            color: CATEGORY_META.lists.color,
            categoryLabel: 'Lists',
            blockType: 'list'
        });
    }

    return results;
}

function getProcedureBlocks(workspace, ScratchBlocks) {
    if (!workspace || !ScratchBlocks) return [];
    const results = [];
    try {
        const mutations = ScratchBlocks.Procedures.allProcedureMutations(workspace);
        if (!mutations) return results;

        for (const mut of mutations) {
            const name = mut.getAttribute('proccode') || 'unnamed';
            const id = mut.getAttribute('id') || '';
            results.push({
                type: 'procedures_call',
                name: name,
                id: id,
                category: 'myBlocks',
                color: CATEGORY_META.myBlocks.color,
                categoryLabel: 'My Blocks',
                blockType: 'procedure',
                mutationXml: new XMLSerializer().serializeToString(mut)
            });
        }
    } catch (e) {
        // Procedures API not available
    }
    return results;
}

function categorizeType(type) {
    const prefix = type.split('_')[0];
    const map = {
        motion: 'motion',
        looks: 'looks',
        sound: 'sound',
        event: 'events',
        control: 'control',
        sensing: 'sensing',
        operator: 'operators',
        data: 'variables',
        procedures: 'myBlocks',
        argument: 'myBlocks'
    };
    return map[prefix] || 'other';
}

export function buildSearchIndex(workspace, ScratchBlocks, toolboxXML) {
    const idx = {blocks: [], variables: [], procedures: []};
    const seen = new Set();

    if (toolboxXML) {
        const types = extractBlockTypesFromXML(toolboxXML);
        for (const type of types) {
            if (seen.has(type)) continue;
            seen.add(type);
            const cat = categorizeType(type);
            // Skip dynamic blocks (data_, procedures_) — handled below
            if (cat === 'variables' || cat === 'myBlocks') continue;
            idx.blocks.push({
                type: type,
                name: getBlockName(type, ScratchBlocks),
                category: cat,
                color: (CATEGORY_META[cat] || {}).color || '#575E75',
                categoryLabel: (CATEGORY_META[cat] || {}).label || cat,
                blockType: 'static'
            });
        }
    }

    idx.variables = getVariableBlocks(workspace);
    idx.procedures = getProcedureBlocks(workspace, ScratchBlocks);

    return idx;
}

export function searchBlocks(index, query, limit) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = [];

    const pushResult = (item, catOrder) => {
        const name = (item.name || '').toLowerCase();
        const type = item.type.toLowerCase();
        const score = name.startsWith(q) ? 0 : type.startsWith(q) ? 1 :
            name.includes(q) ? 2 : type.includes(q) ? 3 : -1;
        if (score >= 0) {
            results.push({...item, _score: score, _catOrder: catOrder});
        }
    };

    for (const block of index.blocks) {
        pushResult(block, CATEGORY_ORDER.indexOf(block.category));
    }
    for (const v of index.variables) {
        pushResult(v, CATEGORY_ORDER.indexOf(v.category));
    }
    for (const p of index.procedures) {
        pushResult(p, CATEGORY_ORDER.indexOf(p.category));
    }

    results.sort((a, b) => {
        if (a._score !== b._score) return a._score - b._score;
        if (a._catOrder !== b._catOrder) return a._catOrder - b._catOrder;
        return (a.name || '').localeCompare(b.name || '');
    });

    return results.slice(0, limit || 50);
}

export function buildSearchToolboxXML(results) {
    if (!results || results.length === 0) return null;
    const blockElements = results
        .filter(r => r.blockType === 'static')
        .map(r => `<block type="${r.type}"/>`)
        .join('');
    if (!blockElements) return null;
    return `<xml style="display: none"><category name="Results" id="searchResults" colour="#4C97FF" secondaryColour="#3373CC">${blockElements}</category></xml>`;
}

export function buildSingleCategoryXML(fullXML, categoryId) {
    if (!fullXML || !categoryId) return null;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullXML, 'text/xml');
        const category = doc.querySelector(`category[id="${categoryId}"]`);
        if (!category) return null;
        return `<xml style="display: none">${category.outerHTML}</xml>`;
    } catch (e) {
        return null;
    }
}

export function parseCategoryListFromXML(xmlString) {
    if (!xmlString) return [];
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');
        return Array.from(doc.querySelectorAll('category')).map(cat => ({
            id: cat.getAttribute('id'),
            name: cat.getAttribute('name'),
            colour: cat.getAttribute('colour') || '#4C97FF'
        }));
    } catch (e) {
        return [];
    }
}

export function createBlockOnWorkspace(workspace, ScratchBlocks, item) {
    if (!workspace || !ScratchBlocks) return null;
    try {
        let block;
        if (item.blockType === 'variable' || item.blockType === 'list') {
            const blockType = item.blockType === 'variable' ? 'data_variable' : 'data_listcontents';
            const xmlStr = `<xml><block type="${blockType}"><field name="VARIABLE">${item.name}</field></block></xml>`;
            const dom = ScratchBlocks.Xml.textToDom(xmlStr);
            block = ScratchBlocks.Xml.domToBlock(dom.firstChild, workspace);
        } else if (item.blockType === 'procedure') {
            const xmlStr = `<xml><block type="procedures_call">${item.mutationXml || ''}</block></xml>`;
            const dom = ScratchBlocks.Xml.textToDom(xmlStr);
            block = ScratchBlocks.Xml.domToBlock(dom.firstChild, workspace);
        } else {
            block = workspace.newBlock(item.type);
        }

        if (block) {
            block.initSvg();
            const metrics = workspace.getMetrics();
            const midX = metrics.viewWidth / 2;
            const midY = metrics.viewHeight / 2;
            const scroll = workspace.getScroll();
            const hw = block.getHeightWidth();
            const hwObj = hw || {width: 100, height: 50};
            block.moveBy(
                midX - scroll.x - hwObj.width / 2,
                midY - scroll.y - 30
            );
            return block;
        }
    } catch (e) {
        // Block may need context that doesn't exist
    }
    return null;
}
