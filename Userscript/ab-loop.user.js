// ==UserScript==
// @name         YouTube AB Loop
// @namespace    https://github.com/ieremi/dots
// @version      2.1
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

    function getInitialRange() {
        const hashParams = new URLSearchParams(location.hash.slice(1));
        const queryParams = new URLSearchParams(location.search);

        const t = parseInt(queryParams.get('t'), 10);

        const initialMin = hashParams.has('min')
            ? Number(hashParams.get('min'))
            : hashParams.has('ss')
                ? Number(hashParams.get('ss'))
                : Number.isFinite(t)
                    ? t
                    : 0;

        const min = Number.isFinite(initialMin)
            ? Math.max(0, initialMin)
            : 0;

        const initialMax = hashParams.has('max')
            ? Number(hashParams.get('max'))
            : hashParams.has('to')
                ? Number(hashParams.get('to'))
                : min + 4;

        const max = Number.isFinite(initialMax) && initialMax > min
            ? initialMax
            : min + 4;

        return { min, max };
    }

    let { min, max } = getInitialRange();

    let a = min;
    let b = max;

    let enabled = true;
    let bounded = true;

    function clamp(value, lower, upper) {
        return Math.min(upper, Math.max(lower, value));
    }

    function updateUrl() {
        const url = new URL(location.href);
        const params = new URLSearchParams(url.hash.slice(1));

        if (bounded) {
            params.set('min', min);
            params.set('max', max);
        } else {
            params.delete('min');
            params.delete('max');
        }

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
        const loop = enabled
            ? `A=${a} B=${b}`
            : 'LOOP=OFF';

        const bounds = bounded
            ? `MIN=${min} MAX=${max}`
            : 'BOUNDS=OFF';

        console.log(`[AB LOOP] ${loop} ${bounds}`);
    }

    function seekA() {
        const video = getVideo();

        if (video) {
            video.currentTime = a;
        }
    }

    function moveLoop(seconds) {
        const duration = b - a;

        if (bounded) {
            a = clamp(a + seconds, min, max - duration);
            b = a + duration;
        } else {
            a = Math.max(0, a + seconds);
            b = a + duration;
        }

        seekA();
        updateUrl();
        show();
    }

    function setLoop(seconds) {
        const video = getVideo();

        if (!video) return;

        enabled = true;

        if (bounded) {
            a = clamp(video.currentTime, min, max);
            b = Math.min(max, a + seconds);
        } else {
            a = video.currentTime;
            b = a + seconds;
        }

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

    function unbindLoop() {
        enabled = false;

        updateUrl();
        show();
    }

    function unbindBounds() {
        bounded = false;

        updateUrl();
        show();
    }

    function resetLoop() {
        a = min;
        b = max;
        enabled = true;

        seekA();
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

    function roundParameters() {
        min = Math.round(min);
        max = Math.round(max);
        a = Math.round(a);
        b = Math.round(b);

        min = Math.max(0, min);
        max = Math.max(min, max);

        if (bounded) {
            a = clamp(a, min, max);
            b = clamp(b, a, max);
        } else {
            a = Math.max(0, a);
            b = Math.max(a, b);
        }

        seekA();
        updateUrl();
        show();
    }

    setInterval(() => {
        const video = getVideo();

        if (!video) return;

        if (bounded) {
            if (video.currentTime < min) {
                video.currentTime = min;
            } else if (video.currentTime > max) {
                video.currentTime = max;
            }
        }

        if (enabled && video.currentTime >= b) {
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
            'l', 'L',
            'z',
            '2', '4'
        ];

        if (!keys.includes(event.key)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
            case 'a':
                a = bounded
                    ? Math.max(min, a - 1)
                    : Math.max(0, a - 1);

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
                b = bounded
                    ? Math.min(max, b + 1)
                    : b + 1;

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
                resetLoop();
                return;

            case 'R':
                unbindLoop();
                return;

            case 's':
                seekA();
                break;

            case 'l':
                toggleLoop();
                return;

            case 'L':
                unbindBounds();
                return;

            case 'z':
                roundParameters();
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

        a = min;
        b = max;

        video.currentTime = a;

        updateUrl();
        show();
    }

    initialize();
})();