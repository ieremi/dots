// ==UserScript==
// @name         YouTube AB Loop
// @namespace    https://github.com/ieremi/dots
// @version      2.6
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

    function parseNumber(value) {
        if (value === null || value === '') {
            return null;
        }

        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function getInitialState() {
        const url = new URL(location.href);
        const hashParams = new URLSearchParams(url.hash.slice(1));

        const t = parseInt(url.searchParams.get('t'), 10);
        const initialMin = Number.isFinite(t) ? t : 0;

        const min = hashParams.has('min')
            ? parseNumber(hashParams.get('min'))
            : initialMin;

        const max = hashParams.has('max')
            ? parseNumber(hashParams.get('max'))
            : null;

        const a = hashParams.has('ss')
            ? parseNumber(hashParams.get('ss'))
            : min;

        const b = hashParams.has('to')
            ? parseNumber(hashParams.get('to'))
            : max;

        return { min, max, a, b };
    }

    let { min, max, a, b } = getInitialState();

    function clamp(value) {
        if (!Number.isFinite(value)) {
            return value;
        }

        if (min !== null) {
            value = Math.max(min, value);
        }

        if (max !== null) {
            value = Math.min(max, value);
        }

        return value;
    }

    function normalizeState() {
        if (min !== null && max !== null && min > max) {
            [min, max] = [max, min];
        }

        if (a !== null) {
            a = clamp(a);
        }

        if (b !== null) {
            b = clamp(b);
        }

        if (a !== null && b !== null && a > b) {
            b = a;
        }
    }

    function setOrDelete(params, name, value) {
        if (value === null) {
            params.delete(name);
        } else {
            params.set(name, String(value));
        }
    }

    function updateUrl() {
        const url = new URL(location.href);
        const params = new URLSearchParams(url.hash.slice(1));

        setOrDelete(params, 'min', min);
        setOrDelete(params, 'max', max);
        setOrDelete(params, 'ss', a);
        setOrDelete(params, 'to', b);

        const hash = params.toString();
        url.hash = hash || '';

        history.replaceState(null, '', url);
    }

    function format(value) {
        return value === null ? '–' : value;
    }

    function show() {
        console.log(
            `[AB LOOP] min=${format(min)} max=${format(max)} ` +
            `A=${format(a)} B=${format(b)}`
        );
    }

    function seek(position) {
        const video = getVideo();

        if (video && Number.isFinite(position)) {
            video.currentTime = clamp(position);
        }
    }

    function seekA() {
        if (a !== null) {
            seek(a);
        }
    }

    function moveLoop(seconds) {
        if (a === null || b === null) {
            return;
        }

        const length = b - a;
        let nextA = a + seconds;
        let nextB = b + seconds;

        if (min !== null && nextA < min) {
            nextA = min;
            nextB = min + length;
        }

        if (max !== null && nextB > max) {
            nextB = max;
            nextA = max - length;
        }

        a = clamp(nextA);
        b = clamp(nextB);

        normalizeState();
        seekA();
        updateUrl();
        show();
    }

    function setLoop(seconds) {
        const video = getVideo();

        if (!video) {
            return;
        }

        a = clamp(video.currentTime);
        b = clamp(a + seconds);

        normalizeState();
        seekA();
        updateUrl();
        show();
    }

    // Reset [a, b] to [min, max].
    function initializeLoop() {
        a = min;
        b = max;

        normalizeState();
        seekA();
        updateUrl();
        show();
    }

    // Set the position range to the current loop range.
    function setPositionRange() {
        if (a === null || b === null) {
            console.log('[AB LOOP] A and B are not set');
            return;
        }

        min = a;
        max = b;

        normalizeState();
        updateUrl();
        show();
    }

    // Unbind the A-B loop.
    function unbindLoop() {
        a = null;
        b = null;

        updateUrl();
        show();
    }

    // Unbind the playback position range.
    function unbindPositionRange() {
        min = null;
        max = null;

        updateUrl();
        show();
    }

    // Round all parameters to the nearest integer.
    function roundParameters() {
        if (min !== null) min = Math.round(min);
        if (max !== null) max = Math.round(max);
        if (a !== null) a = Math.round(a);
        if (b !== null) b = Math.round(b);

        normalizeState();
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

        if (!video) {
            return;
        }

        // Give the A-B loop priority over the position range.
        if (
            a !== null &&
            b !== null &&
            video.currentTime >= b
        ) {
            video.currentTime = a;
            return;
        }

        // Keep the playback position within [min, max].
        if (min !== null && video.currentTime < min) {
            video.currentTime = min;
            return;
        }

        if (max !== null && video.currentTime > max) {
            video.currentTime = max;
            video.pause();
        }
    }, 50);

    document.addEventListener('keydown', (event) => {
        if (isTyping(event.target)) {
            return;
        }

        // Do not intercept shortcuts such as Cmd+C, Ctrl+C, or Cmd+L.
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
            'p',
            'l', 'L',
            'r',
            's',
            '2', '4',
            'z'
        ];

        if (!keys.includes(event.key)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        switch (event.key) {
            case 'a':
                if (a !== null) {
                    a = clamp(a - 1);

                    if (b !== null) {
                        a = Math.min(a, b);
                    }

                    seekA();
                    updateUrl();
                    show();
                }
                return;

            case 'A':
                if (a !== null) {
                    a = clamp(a + 1);

                    if (b !== null) {
                        a = Math.min(a, b);
                    }

                    seekA();
                    updateUrl();
                    show();
                }
                return;

            case 'b':
                if (b !== null) {
                    b = clamp(b - 1);

                    if (a !== null) {
                        b = Math.max(a, b);
                    }

                    updateUrl();
                    show();
                }
                return;

            case 'B':
                if (b !== null) {
                    b = clamp(b + 1);

                    if (a !== null) {
                        b = Math.max(a, b);
                    }

                    updateUrl();
                    show();
                }
                return;

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

            case 'p':
                setPositionRange();
                return;

            case 'l':
                unbindLoop();
                return;

            case 'L':
                unbindPositionRange();
                return;

            case 'r':
                initializeLoop();
                return;

            case 's':
                seekA();
                show();
                return;

            case '2':
                setLoop(2);
                return;

            case '4':
                setLoop(4);
                return;

            case 'z':
                roundParameters();
                return;
        }
    }, true);

    function start() {
        const video = getVideo();

        if (!video) {
            setTimeout(start, 200);
            return;
        }

        normalizeState();
        seekA();
        updateUrl();
        show();
    }

    start();
})();