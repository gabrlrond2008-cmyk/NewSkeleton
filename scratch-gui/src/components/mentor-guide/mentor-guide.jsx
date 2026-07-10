import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import styles from './mentor-guide.css';

const messages = defineMessages({
    analyzing: {
        id: 'gui.mentorGuide.analyzing',
        defaultMessage: 'Analyzing...',
        description: 'Tooltip when mentor is analyzing'
    },
    clickToView: {
        id: 'gui.mentorGuide.clickToView',
        defaultMessage: 'Click to view guide',
        description: 'Tooltip when mentor has a message'
    },
    reanalyze: {
        id: 'gui.mentorGuide.reanalyze',
        defaultMessage: 'Re-analyze',
        description: 'Button to re-analyze blocks'
    },
    reanalyzeTitle: {
        id: 'gui.mentorGuide.reanalyzeTitle',
        defaultMessage: 'Re-analyze current blocks',
        description: 'Tooltip for re-analyze button'
    }
});

var MentorGuide = function (props) {
    var {intl, message, onReanalyze} = props;
    var [visible, setVisible] = useState(false);
    var [bubbleOpen, setBubbleOpen] = useState(false);
    var [closing, setClosing] = useState(false);
    var [pos, setPos] = useState(null);
    var dragging = useRef(false);
    var wasDragged = useRef(false);
    var dragOffset = useRef({x: 0, y: 0});
    var posRef = useRef(null);
    var rafId = useRef(null);
    var prevMsgRef = useRef(undefined);
    var containerRef = useRef(null);

    useEffect(function () {
        if (message !== undefined && message !== prevMsgRef.current) {
            setVisible(true);
            if (message && message.length > 0) {
                setBubbleOpen(true);
                setClosing(false);
            }
        }
        prevMsgRef.current = message;
    }, [message]);

    function handleFaceClick() {
        if (wasDragged.current) return;
        if (!message || message.length === 0) return;
        if (bubbleOpen) {
            setClosing(true);
            setTimeout(function () {
                setBubbleOpen(false);
                setClosing(false);
            }, 280);
        } else {
            setBubbleOpen(true);
            setClosing(false);
        }
    }

    function applyPosition(el, x, y) {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.bottom = 'auto';
        el.style.right = 'auto';
    }

    function startDrag(e) {
        dragging.current = true;
        wasDragged.current = false;
        var el = containerRef.current;
        if (!el) return;
        var rect = el.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    function onDrag(e) {
        if (!dragging.current) return;
        wasDragged.current = true;
        if (rafId.current) return;
        rafId.current = requestAnimationFrame(function () {
            rafId.current = null;
            var el = containerRef.current;
            if (!el) return;
            var parent = el.parentElement;
            if (!parent) return;
            var pRect = parent.getBoundingClientRect();
            var nx = e.clientX - pRect.left - dragOffset.current.x;
            var ny = e.clientY - pRect.top - dragOffset.current.y;
            applyPosition(el, nx, ny);
            posRef.current = {x: nx, y: ny};
        });
    }

    function stopDrag() {
        dragging.current = false;
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        if (wasDragged.current && posRef.current) {
            setPos(posRef.current);
        }
    }

    if (!visible) return null;

    var containerStyle = pos ? {
        left: pos.x + 'px',
        top: pos.y + 'px'
    } : {};

    var isAnalyzing = message === '';
    var hasMessage = message && message.length > 0;

    var bubbleClass = styles.bubble + ' ' + (
        closing ? styles.bubbleOut : styles.bubbleIn
    );

    return (
        <div className={styles.container} style={containerStyle} ref={containerRef}>
            <div
                className={styles.face + (isAnalyzing ? ' ' + styles.analyzing : '')}
                onMouseDown={startDrag}
                onClick={handleFaceClick}
                role="button"
                tabIndex="0"
                title={isAnalyzing ? intl.formatMessage(messages.analyzing) : (hasMessage ? intl.formatMessage(messages.clickToView) : '')}
            >
                <span className={styles.emoji}>🤖</span>
                {isAnalyzing && <span className={styles.pulse} />}
            </div>
            {bubbleOpen && hasMessage && (
                <div className={bubbleClass}>
                    <div className={styles.message}>{message}</div>
                    <button className={styles.reanalyzeBtn} onClick={onReanalyze} type="button" title={intl.formatMessage(messages.reanalyzeTitle)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 4v6h6M23 20v-6h-6"/>
                            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                        </svg>
{intl.formatMessage(messages.reanalyze)}
                    </button>
                </div>
            )}
        </div>
    );
};

MentorGuide.propTypes = {
    intl: intlShape,
    message: PropTypes.string,
    onReanalyze: PropTypes.func
};

export default injectIntl(MentorGuide);
