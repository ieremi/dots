// ==UserScript==
// @name         YouTube AB Loop
// @namespace    https://github.com/ieremi/dots
// @version      1.2
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
        const params = new URLSearchParams(location.hash.slice(1));

        const ss = Number(params.get('ss'));
        const to = Number(params.get('to'));

        const a = Number.isFinite(ss) ? ss : 0;
        const b = Number.isFinite(to) ? to : a + 4;

        return { a, b };
    }

    let { a, b } = getRange();

    function updateUrl() {
        const hash = `ss=${a}&to=${b}`;
        history.replaceState(
            null,
            '',
            `${location.pathname}${location.search}#${hash}`
        );
    }

    function show() {
        console.log(`[AB LOOP] A=${a} B=${b}`);
    }

    function seekA() {
        const v = getVideo();
        if (v) {
            v.currentTime = a;
        }
    }

    function moveLoop(seconds) {
        a = Math.max(0, a + seconds);
        b += seconds;

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
        const v = getVideo();
        if (!v) return;

        if (v.currentTime >= b) {
            v.currentTime = a;
        }
    }, 50);

    document.addEventListener('keydown', (e) => {
        if (isTyping(e.target)) return;

        const keys = [
            'a', 'A',
            'b', 'B',
            'c', 'C',
            'r', 'x'
        ];

        if (!keys.includes(e.key)) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        switch (e.key) {
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

            case 'r':
                a = 0;
                b = 4;
                seekA();
                updateUrl();
                break;

            case 'x':
                seekA();
                break;
        }

        show();
    }, true);

    function initialize() {
        const v = getVideo();

        if (!v) {
            setTimeout(initialize, 200);
            return;
        }

        v.currentTime = a;
        updateUrl();
        show();
    }

    initialize();
})();