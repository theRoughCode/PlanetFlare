"use strict";
const PUBLISHER_NAME = `${location.hostname}` || "localhost.com:3000"; // Replace with publisher's API gateway. 
const PROTOCOL_PREFIX = 'pfc://';
let remainingTokens = 0; 


/**
 * Ask for new tokens from the publisher. 
 */
const requestTokens = async num => {
    const url = PUBLISHER_NAME;
    const response = await fetch(`http://${url}/get_tokens?num=${num}`);
    return response.json().tokens;
}


/**
 * Retrieve files from candidate providers.
 */
const getResources = async pfcResources => {
    pfcResources.forEach(resourceNode => {
        /** Pass in `remainingTokens.pop()` */
    });
}


const main = async () => {
    /**
     * Scan the skeleton document for files available on PFC. 
     */
    const allResources = document.querySelectorAll('[src],[href],[data]');
    console.log(allResources);
    const pfcResources = [...allResources].filter(node => {
        if (node.getAttribute('src') !== null && node.getAttribute('src').startsWith(PROTOCOL_PREFIX)) {
            return true;
        }
        if (node.getAttribute('href') !== null && node.getAttribute('href').startsWith(PROTCOL_PREFIX)) {
            return true;
        }

        return false;
    });

    remainingTokens = await requestTokens(pfcResources.length);
    getResources(pfcResources);
}

main();
