import esKnowledge from './ai-knowledge-es';
import enKnowledge from './ai-knowledge-en';

var locales = {
    es: esKnowledge,
    en: enKnowledge
};

export function getKnowledge(locale) {
    var lang = locale ? locale.split('-')[0] : 'es';
    return locales[lang] || esKnowledge;
}

export default getKnowledge(
    typeof navigator !== 'undefined' ? navigator.language : 'es'
);
