import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import styles from './flowchart.css';

var initialized = false;

var Flowchart = function ({code}) {
    var [state, setState] = useState({status: 'idle', svg: null, error: null});

    useEffect(function () {
        var cancelled = false;
        if (!code) {
            setState({status: 'error', svg: null, error: 'empty'});
            return undefined;
        }
        setState({status: 'rendering', svg: null, error: null});
        Promise.resolve(import('../../lib/vendor/mermaid.min.js')).then(function (mod) {
            var mermaid = mod && (mod.default || mod.mermaid || mod);
            if (!mermaid || !mermaid.render) {
                throw new Error('mermaid no se pudo cargar');
            }
            if (!initialized) {
                initialized = true;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    securityLevel: 'strict',
                    flowchart: {curve: 'basis', useMaxWidth: true}
                });
            }
            return mermaid.render('flynt-flow-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), code);
        }).then(function (res) {
            if (cancelled) return;
            setState({status: 'done', svg: res && res.svg, error: null});
        }).catch(function (err) {
            if (cancelled) return;
            setState({status: 'error', svg: null, error: String((err && err.message) || err)});
        });
        return function () {
            cancelled = true;
        };
    }, [code]);

    if (state.status === 'rendering') {
        return (
            <div className={styles.container}>
                <span className={styles.spinner} />
                <span>Dibujando diagrama…</span>
            </div>
        );
    }

    if (state.status === 'error') {
        return (
            <div className={styles.container}>
                {state.error !== 'empty' ? <div className={styles.error}>No se pudo dibujar el flujograma.</div> : null}
                <details className={styles.rawToggle}>
                    <summary>Ver descripción</summary>
                    <pre className={styles.raw}>{code}</pre>
                </details>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.diagram} dangerouslySetInnerHTML={{__html: state.svg}} />
            <details className={styles.rawToggle}>
                <summary>Ver descripción</summary>
                <pre className={styles.raw}>{code}</pre>
            </details>
        </div>
    );
};

Flowchart.propTypes = {
    code: PropTypes.string
};

export default Flowchart;