import {
    flyInFromToolbox,
    assembleBlocksInOrder,
    orderChainPreBlocks,
    fadeOutChains,
    buildOpcodeCategoryMap,
    easeOutCubic,
    easeInCubic,
    lerp,
    animateFlight,
    leftEdgePoint,
    computeExitPoint
} from '../../../src/lib/ai-block-animator';

function makeBlock(type, absX, absY) {
    const calls = [];
    const b = {
        type,
        tx: 0,
        ty: 0,
        translateCalls: calls,
        ownedBy: null,
        inputChildren: [],
        nextBlock: null,
        isShadow: () => false,
        isDisposed: () => false,
        getSvgRoot: () => b.root,
        getParent: () => b.parent || null,
        getNextBlock: () => b.nextBlock,
        getRelativeToSurfaceXY: () => ({x: absX, y: absY}),
        translate: (x, y) => {
            b.tx = x;
            b.ty = y;
            calls.push([x, y]);
        }
    };
    b.root = {getBoundingClientRect: () => ({left: absX, top: absY}), style: {}};
    Object.defineProperty(b, 'inputList', {
        get: () => b.inputChildren
    });
    return b;
}

function xmlNode(html) {
    const doc = new DOMParser().parseFromString(html, 'text/xml');
    return doc.firstChild;
}

describe('ai-block-animator pure easing helpers', () => {
    test('lerp interpolates the endpoints and the midpoint', () => {
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
        expect(lerp(0, 10, 0.5)).toBe(5);
    });

    test('easeOutCubic maps 0->0 and 1->1 and is monotonic', () => {
        expect(easeOutCubic(0)).toBe(0);
        expect(easeOutCubic(1)).toBe(1);
        let prev = -1;
        for (let i = 0; i <= 10; i++) {
            const v = easeOutCubic(i / 10);
            expect(v).toBeGreaterThanOrEqual(prev);
            prev = v;
        }
    });
});

describe('buildOpcodeCategoryMap scans the toolbox categories', () => {
    test('maps top-level and nested block opcodes to their category id', () => {
        const motion = xmlNode('<block type="motion_movesteps"/>');
        const nested = xmlNode(
            '<block type="looks_say"><shadow type="text"/></block>'
        );
        const toolbox = {
            categoryMenu_: {
                categories_: [
                    {id_: 'motion', getContents: () => [motion]},
                    {id_: 'looks', getContents: () => [nested]}
                ]
            }
        };
        const map = buildOpcodeCategoryMap(toolbox);
        expect(map.motion_movesteps).toBe('motion');
        expect(map.looks_say).toBe('looks');
        expect(map.text).toBe('looks');
    });

    test('ignores custom (string content) categories and empty toolboxes', () => {
        const custom = {id_: 'music', getContents: () => 'custom'};
        const map = buildOpcodeCategoryMap({categoryMenu_: {categories_: [custom]}});
        expect(Object.keys(map)).toHaveLength(0);
        expect(buildOpcodeCategoryMap(null)).toEqual({});
        expect(buildOpcodeCategoryMap({})).toEqual({});
    });
});

describe('leftEdgePoint', () => {
    test('returns a point to the left of the block based on scale', () => {
        const block = {
            getSvgRoot: () => ({
                getBoundingClientRect: () => ({left: 500, top: 120})
            })
        };
        const pt = leftEdgePoint(block, 1);
        expect(pt.x).toBe(500 - 380);
        expect(pt.y).toBe(120);
    });
});

describe('flyInFromToolbox guards', () => {
    test('resolves immediately when reduced-motion is set', async () => {
        document.body.classList.add('reduced-motion');
        const workspace = {getFlyout: () => null};
        await expect(flyInFromToolbox(workspace, ['a'])).resolves.toBeUndefined();
        document.body.classList.remove('reduced-motion');
    });

    test('resolves immediately when there are no top block ids or no workspace', async () => {
        await expect(flyInFromToolbox(null, ['a'])).resolves.toBeUndefined();
        await expect(flyInFromToolbox({}, [])).resolves.toBeUndefined();
        await expect(flyInFromToolbox({}, null)).resolves.toBeUndefined();
    });

    test('skips missing blocks without throwing and resolves', async () => {
        const workspace = {
            getBlockById: () => null,
            scale: 1,
            getFlyout: () => null,
            toolbox_: null
        };
        await expect(flyInFromToolbox(workspace, ['missing'], {browseMs: 0, flightMs: 0}))
            .resolves.toBeUndefined();
    });
});

describe('orderChainPreBlocks pre-order traversal', () => {
    test('walks value inputs before next blocks and recurses into sub-stacks', () => {
        const a = makeBlock('event_a', 0, 0);
        const val = makeBlock('operator_b', 0, 40);
        const c = makeBlock('stack_c', 0, 80);
        const d = makeBlock('stack_d', 0, 160);
        const e = makeBlock('stack_e', 0, 240);

        a.inputChildren = [{connection: {targetBlock: () => val}}];
        a.nextBlock = c;
        c.inputChildren = [{connection: {targetBlock: () => d}}];
        d.nextBlock = e;

        const order = orderChainPreBlocks(a);
        expect(order.map(x => x.type)).toEqual(['event_a', 'operator_b', 'stack_c', 'stack_d', 'stack_e']);
    });

    test('skips shadow blocks', () => {
        const a = makeBlock('a', 0, 0);
        const shadow = makeBlock('text', 0, 40);
        shadow.isShadow = () => true;
        a.inputChildren = [{connection: {targetBlock: () => shadow}}];
        expect(orderChainPreBlocks(a).map(x => x.type)).toEqual(['a']);
    });
});

describe('assembleBlocksInOrder per-block assembly', () => {
    test('resolves immediately for missing workspace, ids or reduced-motion', async () => {
        document.body.classList.add('reduced-motion');
        const ws = {getFlyout: () => null};
        await expect(assembleBlocksInOrder(ws, ['a'])).resolves.toBeUndefined();
        document.body.classList.remove('reduced-motion');
        await expect(assembleBlocksInOrder(null, ['a'])).resolves.toBeUndefined();
        await expect(assembleBlocksInOrder({}, [])).resolves.toBeUndefined();
        await expect(assembleBlocksInOrder({}, null)).resolves.toBeUndefined();
    });

    test('hides all first, then reveals each block to its final position in order', async () => {
        const a = makeBlock('a', 100, 200);
        const b = makeBlock('b', 100, 300);
        b.parent = a;
        a.nextBlock = b;

        const byId = {'A': a, 'B': b};
        const workspace = {
            scale: 1,
            getFlyout: () => null,
            toolbox_: null,
            getBlockById: (id) => byId[id],
            getMainWorkspace: () => null
        };

        await expect(assembleBlocksInOrder(workspace, ['A', 'B'], {browseMs: 0, flightMs: 0, pauseMs: 0}))
            .resolves.toBeUndefined();

        // Each block revealed after its flight.
        expect(a.root.style.opacity).toBe(1);
        expect(b.root.style.opacity).toBe(1);

        // Top block lands at its absolute position; nested lands at its
        // relative-to-parent offset; and 'a' is animated before 'b'.
        expect(a.tx).toBe(100);
        expect(a.ty).toBe(200);
        expect(b.tx).toBe(0);
        expect(b.ty).toBe(100);
        expect(b.translateCalls.length).toBeGreaterThan(0);
    });
});

describe('easeInCubic exit helper', () => {
    test('maps 0->0 and 1->1 and is monotonic', () => {
        expect(easeInCubic(0)).toBe(0);
        expect(easeInCubic(1)).toBe(1);
        expect(easeInCubic(0.5)).toBeCloseTo(0.125);
        let prev = -1;
        for (let i = 0; i <= 10; i++) {
            const v = easeInCubic(i / 10);
            expect(v).toBeGreaterThanOrEqual(prev);
            prev = v;
        }
    });
});

describe('computeExitPoint pure exit math', () => {
    test('top-level blocks travel left by the distance travelled', () => {
        const snap = {absX: 200, absY: 150, parentRel: null};
        expect(computeExitPoint(snap, 0, 320)).toEqual({x: 200, y: 150});
        expect(computeExitPoint(snap, 1, 320)).toEqual({x: -120, y: 150});
        expect(computeExitPoint(snap, 0.5, 100)).toEqual({x: 150, y: 150});
    });

    test('nested snaps return their parent-relative offset shifted left', () => {
        const snap = {absX: 0, absY: 0, parentRel: {x: 40, y: 12}};
        expect(computeExitPoint(snap, 1, 320)).toEqual({x: -280, y: 12});
        expect(computeExitPoint(snap, 0, 320)).toEqual({x: 40, y: 12});
    });
});

describe('fadeOutChains', () => {
    function disposed() { return false; }

    function fakeChain(root) {
        return {
            isDisposed: disposed,
            dispose: () => { root.disposed = true; },
            getDescendants: () => [{isShadow: () => false, getSvgRoot: () => root.svg}],
            getSvgRoot: () => root.svg
        };
    }

    test('resolves without throwing when nothing matches', async () => {
        const ws = {getBlockById: () => null, getFlyout: () => null};
        await expect(fadeOutChains(ws, ['missing'])).resolves.toBeUndefined();
    });

    test('disposes the chain immediately without requestAnimationFrame', async () => {
        const root = {svg: {style: {}}, disposed: false};
        const block = fakeChain(root);
        const ws = {getBlockById: (id) => (id === 'b1' ? block : null)};
        await fadeOutChains(ws, ['b1']);
        expect(root.disposed).toBe(true);
    });

    test('resolves and disposes immediately with reduced-motion', async () => {
        document.body.classList.add('reduced-motion');
        const root = {svg: {style: {}}, disposed: false};
        const block = fakeChain(root);
        const ws = {getBlockById: (id) => (id === 'b1' ? block : null)};
        await fadeOutChains(ws, ['b1']);
        expect(root.disposed).toBe(true);
        document.body.classList.remove('reduced-motion');
    });
});