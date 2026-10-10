import {
    serializeConversation,
    deserializeConversation
} from '../../../src/lib/ai-flynt-data';

describe('ai-flynt-data snapshot round-trip', () => {
    test('serialize keeps snapshotXml and reverted', () => {
        const msgs = [{
            role: 'assistant',
            content: '{"explanation":"hi","scripts":[]}',
            displayContent: 'hi',
            id: 1,
            hasBlocks: true,
            snapshotXml: '<xml><block type="event_whenflagclicked" id="a"/></xml>',
            reverted: false
        }];
        return serializeConversation(msgs).then(result => {
            expect(result.conversation[0].snapshotXml).toBe(
                '<xml><block type="event_whenflagclicked" id="a"/></xml>'
            );
            expect(result.conversation[0].reverted).toBeUndefined();
            expect(result.media).toEqual([]);
        });
    });

    test('deserialize restores snapshotXml and reverted', () => {
        const serialized = [{
            role: 'assistant',
            content: '{"explanation":"hi","scripts":[]}',
            displayContent: 'hi',
            id: 0,
            snapshotXml: '<xml><block type="motion_movesteps" id="b"/></xml>',
            reverted: true
        }];
        const rebuilt = deserializeConversation(serialized, {});
        expect(rebuilt.messages[0].snapshotXml).toBe(
            '<xml><block type="motion_movesteps" id="b"/></xml>'
        );
        expect(rebuilt.messages[0].reverted).toBe(true);
        expect(rebuilt.messages[0].typing).toBe(false);
    });
});
