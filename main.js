

var width = getComputedStyle(document.body).getPropertyValue("--grid-width");
var height = getComputedStyle(document.body).getPropertyValue("--grid-height");
var tilesize = getComputedStyle(document.body).getPropertyValue("--tile-size");
var default_opacity = getComputedStyle(document.body).getPropertyValue("--opacity")

console.log("tilesize: " + tilesize);

var grid = new Grid(width,height, document.getElementById("grid-container"), tilesize, tilesize);
var game_manager = new GameManager(grid, document.getElementById("sidebar-container"), default_opacity);
var sidebar = new Sidebar(grid, document.getElementById("control-container"), document.getElementById("info-container"), game_manager);

// register listener to detect change in screen orientation an update tilesize
window.addEventListener("resize", function() {
    console.log("screen changed");
    var tilesize = getComputedStyle(document.body).getPropertyValue("--tile-size");
    grid.on_screen_orientation_change(tilesize, tilesize);
})