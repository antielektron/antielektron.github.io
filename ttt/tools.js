  
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