// ==UserScript==
// @name         linkedin-job-filter
// @namespace    http://tampermonkey.net/
// @version      6.8
// @description  Filters German-language jobs with ultra-precise regex that requires both 'm' and 'w' within the same brackets.
// @author       Qimin Zhang (Co-authored with Gemini)
// @match        https://www.linkedin.com/jobs/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * CONFIGURATION
     * Keywords and visual settings
     */
    const CONFIG = {
        germanKeywords: [
            'werkstudent', 'praktikum', 'buchhalter', 'steuer', 'prüfung',
            'assistent', 'vertrieb', 'berater', 'leitung', 'leiter',
            'kaufmann', 'kauffrau', 'aushilfe', 'mitarbeiter', 'dozent',
            'betriebswirtschaft', 'finanz', 'personal', 'organisation', 'recht',
            'verwaltung', 'audit', 'beratung', 'unterstützung', 'buchhaltung',
            'kennzahlen', 'wesen', 'bereich', 'abteilung', 'tätigkeit', 'verantwortung'
        ],
        opacityValue: '0.4', // Transparency for filtered jobs
        grayscaleValue: '60%',
        scanInterval: 600 // Scan every 600ms
    };

    /**
     * CORE FILTER LOGIC
     */
    const runFilter = () => {
        // Target all possible job card containers on LinkedIn
        const jobCards = document.querySelectorAll(`
            .jobs-search-results-list__list-item,
            .job-card-container,
            [data-occludable-job-id]
        `);

        jobCards.forEach(card => {
            const titleEl = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title, strong');
            if (!titleEl) return;

            const titleText = titleEl.innerText.toLowerCase();

            // Logic A: German Industry Keywords
            const isGermanKeyword = CONFIG.germanKeywords.some(key => titleText.includes(key));

            /**
             * Logic B: Ultra-Strict Gender Tag Detection
             * Only matches if 'm' and 'w' both exist WITHIN the same set of delimiters.
             * This prevents accidental matches where 'm' is in the title and 'w' is in the company name.
             */
            const isGermanGenderTag = /[\(\[\/\|][^)\|\s]*m[^)\|\s]*w[^)\|\s]*[\)\]\/\|]/i.test(titleText) ||
                                      /[\(\[\/\|][^)\|\s]*w[^)\|\s]*m[^)\|\s]*[\)\]\/\|]/i.test(titleText);

            // Logic C: Explicit Exemptions for International/English Roles
            // We keep (f/m/x) or titles with "english" bright
            const isEnglishExemption = titleText.includes('english') ||
                                       titleText.includes('f/m/x') ||
                                       titleText.includes('m/f/d');

            // Logic D: German-specific character detection (ä, ö, ü, ß)
            const hasGermanChars = /[äöüß]/i.test(titleText);

            // DECISION ENGINE
            const shouldDim = (isGermanKeyword || (isGermanGenderTag && !isEnglishExemption)) || hasGermanChars;

            if (shouldDim) {
                card.style.opacity = CONFIG.opacityValue;
                card.style.filter = `grayscale(${CONFIG.grayscaleValue})`;
            } else {
                // Reset styles for English roles
                card.style.opacity = '1';
                card.style.filter = 'none';
            }
        });
    };

    /**
     * INITIALIZATION
     */
    const init = () => {
        // Use MutationObserver to handle infinite scrolling
        const observer = new MutationObserver(runFilter);
        observer.observe(document.body, { childList: true, subtree: true });

        // Polling fallback to ensure consistency
        setInterval(runFilter, CONFIG.scanInterval);

        runFilter();
        console.log("LinkedIn English-Job Filter 6.8: Ultra-Precision Mode Active");
    };

    // Run script after page is fully loaded
    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();