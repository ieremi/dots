// ==UserScript==
// @name         YouTube AB Loop
// @namespace    https://github.com/ieremi/dots
// @version      1.9
// @description  YouTube A-B loop
// @match        https://www.youtube.com/watch*
// @updateURL    https://raw.githubusercontent.com/ieremi/dots/master/Userscript/ab-loop.user.js
// @downloadURL  https://raw.githubusercontent.com/ieremi/dots/master/Userscript/ab-loop.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function getVideo() {
        return document.querySelector('video');
    }

    function getRange() {
        const hashParams = new URLSearchParams(location.hash.slice(1));
        const queryParams = new URLSearchParams(location.search);

        const t = parseInt(queryParams.get('t'), 10);

        const ss = hashParams.has('ss')
            ? Number(hashParams.get('ss'))
            : Number.isFinite(t)
                ? t
                : 0;

        const a = Number.isFinite(ss) ? ss : 0;

        const to = hashParams.has('to')
            ? Number(hashParams.get('to'))
            : a + 4;

        const b = Number.isFinite(to) ? to : a + 4;

        return { a, b };
    }

    let { a, b } = getRange();
    let enabled = true;

    function updateUrl() {
        const url = new URL(location.href);
        const params = new URLSearchParams(url.hash.slice(1));

        if (enabled) {
            params.set('ss', a);
            params.set('to', b);
        } else {
            params.delete('ss');
            params.delete('to');
        }

        const hash = params.toString();
        url.hash = hash ? `#${hash}` : '';

        history.replaceState(null, '', url);
    }

    function show() {
        if (enabled) {
            console.log(`[AB LOOP] A=${a} B=${b}`);
        } else {
            console.log('[AB LOOP] OFF');
        }
    }

    function seekA() {
        const video = getVideo();

        if (video) {
            video.currentTime = a;
        }
    }

    function moveLoop(seconds) {
        a = Math.max(0, a + seconds);
        b += seconds;

        seekA();
        updateUrl();
        show();
    }

    function setLoop(seconds) {
        const video = getVideo();

        if (!video) return;

        enabled = true;
        a = video.currentTime;
        b = a + seconds;

        seekA();
        updateUrl();
        show();
    }

    function toggleLoop() {
        enabled = !enabled;

        if (enabled) {
            seekA();
        }

        updateUrl();
        show();
    }

    function isTyping(element) {
        return (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element?.isContentEditable
        );
    }

    function unbindLoop() {
        enabled = false;
        updateUrl();
        show();
    }

    setInterval(() => {
        if (!enabled) return;

        const video = getVideo();

        if (!video) return;

        if (video.currentTime >= b) {
            video.currentTime = a;
        }
    }, 50);

    document.addEventListener('keydown', (event) => {
        if (isTyping(event.target)) return;

        const keys = [
            'a', 'A',
            'b', 'B',
            'c', 'C',
            'g', 'G',
            'r', 'R',
            's',
            'l',
            '2', '4'
        ];

        if (!keys.includes(event.key)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
            case 'a':
                a = Math.max(0, a - 1);
                seekA();
                updateUrl();
                break;

            case 'A':
                a = Math.min(b, a + 1);
                seekA();
                updateUrl();
                break;

            case 'b':
                b = Math.max(a, b - 1);
                updateUrl();
                break;

            case 'B':
                b += 1;
                updateUrl();
                break;

            case 'c':
                moveLoop(2);
                return;

            case 'C':
                moveLoop(4);
                return;

            case 'g':
                moveLoop(-2);
                return;

            case 'G':
                moveLoop(-4);
                return;


            case 'r':
                a = 0;
                b = 4;
                seekA();
                updateUrl();
                break;

            case 'R':
                unbindLoop();
                return;

            case 's':
                seekA();
                break;

            case 'l':
                toggleLoop();
                return;

            case '2':
                setLoop(2);
                return;

            case '4':
                setLoop(4);
                return;
        }

        show();
    }, true);

    function initialize() {
        const video = getVideo();

        if (!video) {
            setTimeout(initialize, 200);
            return;
        }

        video.currentTime = a;
        updateUrl();
        show();
    }

    initialize();
})();