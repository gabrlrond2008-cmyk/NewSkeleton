import React from 'react';

import {FIST_LOGO_BOOT} from '../../lib/fist-logo-boot';

const Splash = () => (
    <div
        className="splash-overlay"
        style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff'
        }}
    >
        <div
            className="stage-box"
            dangerouslySetInnerHTML={{__html: FIST_LOGO_BOOT}}
        />
    </div>
);

export default Splash;
