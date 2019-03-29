  
function clear(node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild);
    }
    node.parentNode.removeChild(node);
}

function clearInner(node) {
    while (node.hasChildNodes()) {
        clear(node.firstChild);
    }
}


// encoding helper (found here: https://stackoverflow.com/a/2794366)
function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}