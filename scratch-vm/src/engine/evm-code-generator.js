const log = require('../util/log');

class EVMCodeGenerator {
    constructor () {
        this._generators = {};
        this._helpersGenerated = new Set();
    }

    register (opcode, generatorFn) {
        if (typeof generatorFn !== 'function') {
            log.warn(`EVM: Generator for ${opcode} is not a function`);
            return;
        }
        this._generators[opcode] = generatorFn;
    }

    registerAll (generatorMap) {
        Object.keys(generatorMap).forEach(opcode => {
            this.register(opcode, generatorMap[opcode]);
        });
    }

    unregister (opcode) {
        delete this._generators[opcode];
    }

    generate (blocks, deviceId) {
        let code = `// Generated for ${deviceId || 'unknown device'}\n`;

        blocks.forEach(block => {
            const gen = this._generators[block.opcode];
            if (gen) {
                try {
                    code += gen(block, this) + '\n';
                } catch (e) {
                    log.error(`EVM: Error generating code for ${block.opcode}: ${e.message}`);
                    code += `// Error generating ${block.opcode}: ${e.message}\n`;
                }
            } else {
                code += `// No generator for ${block.opcode}\n`;
            }
        });

        return code;
    }

    valueToCode (block, argName, order) {
        if (block.inputs && block.inputs[argName]) {
            return this.generate(block.inputs[argName], null);
        }
        if (block.fields && block.fields[argName]) {
            return block.fields[argName].value;
        }
        return block.mutation && block.mutation[argName] || '0';
    }

    /**
     * Wrap a code block with a header guard (ensures a helper function is included once).
     */
    ensureHelper (helperName, helperCode) {
        if (this._helpersGenerated.has(helperName)) return '';
        this._helpersGenerated.add(helperName);
        return helperCode + '\n';
    }

    reset () {
        this._generators = {};
        this._helpersGenerated.clear();
    }
}

module.exports = EVMCodeGenerator;
