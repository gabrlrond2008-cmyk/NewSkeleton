import {buildUserContent, base64Data} from '../../../src/lib/ai-multimodal';

describe('buildUserContent', () => {
    test('plain text with no attachments is a string content', () => {
        const res = buildUserContent('openai', 'hola', []);
        expect(res.content).toBe('hola');
        expect(res.parts).toBeNull();
    });

    test('plain text with undefined attachments is a string content', () => {
        const res = buildUserContent('gemini', 'hola', undefined);
        expect(res.content).toBe('hola');
        expect(res.parts).toBeNull();
    });

    test('openai images become image_url parts', () => {
        const res = buildUserContent('openai', 'describe esto', [
            {kind: 'image', mimeType: 'image/png', dataURL: 'data:image/png;base64,AAAA'}
        ]);
        expect(res.content).toHaveLength(2);
        expect(res.content[0]).toEqual({type: 'text', text: 'describe esto'});
        expect(res.content[1]).toEqual({
            type: 'image_url',
            image_url: {url: 'data:image/png;base64,AAAA'}
        });
        expect(res.parts).toBeNull();
    });

    test('openai audio becomes input_audio with the format from the mime', () => {
        const res = buildUserContent('openai', 'escucha', [
            {kind: 'audio', mimeType: 'audio/wav', dataURL: 'data:audio/wav;base64,QQ=='}
        ]);
        expect(res.content[1]).toEqual({
            type: 'input_audio',
            input_audio: {data: 'QQ==', format: 'wav'}
        });
    });

    test('gemini images, video and audio become inline_data parts', () => {
        const res = buildUserContent('gemini', 'analizá el video', [
            {kind: 'image', mimeType: 'image/png', dataURL: 'data:image/png;base64,AAA'},
            {kind: 'video', mimeType: 'video/mp4', dataURL: 'data:video/mp4;base64,BBB'},
            {kind: 'audio', mimeType: 'audio/mpeg', dataURL: 'data:audio/mpeg;base64,CCC'}
        ]);
        expect(res.parts).toHaveLength(4);
        expect(res.parts[0]).toEqual({text: 'analizá el video'});
        expect(res.parts[1]).toEqual({inline_data: {mime_type: 'image/png', data: 'AAA'}});
        expect(res.parts[2]).toEqual({inline_data: {mime_type: 'video/mp4', data: 'BBB'}});
        expect(res.parts[3]).toEqual({inline_data: {mime_type: 'audio/mpeg', data: 'CCC'}});
        expect(res.content).toBe('analizá el video');
    });

    test('gemini defaults missing mimeType to image/png and strips the data: prefix', () => {
        const res = buildUserContent('gemini', 'foto', [
            {kind: 'image', dataURL: 'data:image/jpeg;base64,XYZ'}
        ]);
        expect(res.parts[1].inline_data.mime_type).toBe('image/jpeg');
        expect(res.parts[1].inline_data.data).toBe('XYZ');
    });

    test('malformed attachments without dataURL are skipped', () => {
        const res = buildUserContent('openai', 'x', [{kind: 'image', mimeType: 'image/png'}]);
        expect(res.content).toEqual([{type: 'text', text: 'x'}]);
    });
});

describe('base64Data', () => {
    test('strips the data: prefix', () => {
        expect(base64Data('data:image/png;base64,AB')).toBe('AB');
    });
    test('returns the input unchanged when there is no comma', () => {
        expect(base64Data('AB')).toBe('AB');
    });
});