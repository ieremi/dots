// ==UserScript==
// @name         YouTube AB Loop
// @namespace    https://github.com/ieremi/dots
// @version      2.5
// @description  YouTube A-B loop
// @match        https://www.youtube.com/watch*
// @match        https://m.youtube.com/watch*
// @updateURL    https://raw.githubusercontent.com/ieremi/dots/master/Userscript/ab-loop.user.js
// @downloadURL  https://raw.githubusercontent.com/ieremi/dots/master/Userscript/ab-loop.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function getVideo() {
        return document.querySelector('video');
    }

    function parseTime(value) {
        if (!value) return null;

        if (/^\d+(?:\.\d+)?s?$/.test(value)) {
            return Number.parseFloat(value);
        }

        const match = value.match(
            /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/
        );

        if (!match) return null;

        const hours = Number(match[1] || 0);
        const minutes = Number(match[2] || 0);
        const seconds = Number(match[3] || 0);

        return hours * 3600 + minutes * 60 + seconds;
    }

    function getInitialBounds() {
        const hashParams = new URLSearchParams(
            location.hash.slice(1)
        );

        const queryParams = new URLSearchParams(
            location.search
        );

        const t = parseTime(queryParams.get('t'));

        const hashMin = hashParams.has('min')
            ? Number(hashParams.get('min'))
            : null;

        const initialMin = Number.isFinite(hashMin)
            ? hashMin
            : Number.isFinite(t)
                ? t
                : 0;

        const min = Math.max(0, initialMin);

        const hashMax = hashParams.has('max')
            ? Number(hashParams.get('max'))
            : null;

        const max = Number.isFinite(hashMax) && hashMax >= min
            ? hashMax
            : null;

        return { min, max };
    }

    let { min, max } = getInitialBounds();

    let a = min;
    let b = max;

    let enabled = b !== null;
    let boundsEnabled = true;
    let currentVideoId = null;

    function clamp(value, lower, upper) {
        return Math.min(
            upper,
            Math.max(lower, value)
        );
    }

    function clampToBounds(value) {
        const lower = boundsEnabled ? min : 0;

        if (boundsEnabled && max !== null) {
            return clamp(value, lower, max);
        }

        return Math.max(lower, value);
    }

    function updateUrl() {
        const url = new URL(location.href);
        const params = new URLSearchParams(
            url.hash.slice(1)
        );

        if (boundsEnabled) {
            params.set('min', min);

            if (max !== null) {
                params.set('max', max);
            } else {
                params.delete('max');
            }
        } else {
            params.delete('min');
            params.delete('max');
        }

        if (enabled && b !== null) {
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
        const loopStatus =
            enabled && b !== null
                ? `A=${a} B=${b}`
                : 'LOOP=OFF';

        let boundsStatus = 'BOUNDS=OFF';

        if (boundsEnabled) {
            boundsStatus = max !== null
                ? `MIN=${min} MAX=${max}`
                : `MIN=${min} MAX=NONE`;
        }

        console.log(
            `[AB LOOP] ${loopStatus} ${boundsStatus}`
        );
    }

    function seekA() {
        const video = getVideo();

        if (video) {
            video.currentTime = a;
        }
    }

    function moveLoop(seconds) {
        if (b === null) return;

        const duration = b - a;
        const lower = boundsEnabled ? min : 0;

        let nextA = a + seconds;

        if (boundsEnabled && max !== null) {
            const upper = Math.max(
                lower,
                max - duration
            );

            nextA = clamp(
                nextA,
                lower,
                upper
            );
        } else {
            nextA = Math.max(lower, nextA);
        }

        a = nextA;
        b = a + duration;

        seekA();
        updateUrl();
        show();
    }

    function setLoop(seconds) {
        const video = getVideo();

        if (!video) return;

        a = clampToBounds(video.currentTime);
        b = a + seconds;

        if (boundsEnabled && max !== null) {
            b = Math.min(b, max);
        }

        enabled = b > a;

        seekA();
        updateUrl();
        show();
    }

    function toggleLoop() {
        if (b === null) {
            enabled = false;
            updateUrl();
            show();
            return;
        }

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
        boundsEnabled = false;

        updateUrl();
        show();
    }

    function resetLoop() {
        a = min;
        b = max;
        enabled = b !== null;

        seekA();
        updateUrl();
        show();
    }

    function roundParameters() {
        min = Math.max(0, Math.round(min));
        a = Math.max(0, Math.round(a));

        if (max !== null) {
            max = Math.max(
                min,
                Math.round(max)
            );
        }

        if (b !== null) {
            b = Math.round(b);
        }

        if (boundsEnabled) {
            a = clampToBounds(a);

            if (b !== null) {
                b = Math.max(a, b);

                if (max !== null) {
                    b = Math.min(b, max);
                }
            }
        } else {
            b = b === null
                ? null
                : Math.max(a, b);
        }

        enabled = enabled && b !== null && b > a;

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

    setInterval(() => {
        const video = getVideo();

        if (!video) return;

        if (boundsEnabled) {
            if (video.currentTime < min) {
                video.currentTime = min;
                return;
            }

            if (
                max !== null &&
                video.currentTime > max
            ) {
                video.currentTime = max;
                return;
            }
        }

        if (
            enabled &&
            b !== null &&
            video.currentTime >= b
        ) {
            video.currentTime = a;
        }
    }, 50);

    document.addEventListener(
        'keydown',
        (event) => {
            if (isTyping(event.target)) return;

            if (
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            ) {
                return;
            }

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
                    a = Math.max(
                        boundsEnabled ? min : 0,
                        a - 1
                    );

                    seekA();
                    updateUrl();
                    break;

                case 'A':
                    a = Math.min(
                        b !== null ? b : Infinity,
                        a + 1
                    );

                    if (
                        boundsEnabled &&
                        max !== null
                    ) {
                        a = Math.min(a, max);
                    }

                    seekA();
                    updateUrl();
                    break;

                case 'b':
                    if (b === null) return;

                    b = Math.max(a, b - 1);

                    enabled = b > a;

                    updateUrl();
                    break;

                case 'B':
                    if (b === null) {
                        b = a + 1;
                    } else {
                        b += 1;
                    }

                    if (
                        boundsEnabled &&
                        max !== null
                    ) {
                        b = Math.min(b, max);
                    }

                    enabled = b > a;

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
        },
        true
    );

    function initialize(force = false) {
        const videoId = new URL(
            location.href
        ).searchParams.get('v');

        if (!videoId) return;

        if (
            !force &&
            videoId === currentVideoId
        ) {
            return;
        }

        const video = getVideo();

        if (!video) {
            setTimeout(
                () => initialize(force),
                200
            );

            return;
        }

        currentVideoId = videoId;

        ({ min, max } = getInitialBounds());

        a = min;
        b = max;

        enabled = b !== null;
        boundsEnabled = true;

        video.currentTime = a;

        updateUrl();
        show();
    }

    document.addEventListener(
        'yt-navigate-finish',
        () => {
            setTimeout(
                () => initialize(true),
                300
            );
        }
    );

    initialize();
})();