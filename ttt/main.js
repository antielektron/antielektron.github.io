var style = getComputedStyle(document.body);
var n = style.getPropertyValue("--tictactoe_n");
var tilesize = style.getPropertyValue("--tile-size");
var default_opacity = style.getPropertyValue("--opacity");
var ground_color = style.getPropertyValue("--ground-color");
var main_container = document.getElementById("main-container");


var main_menu = new Infobar(main_container, "infobar-container");
var grid = new Grid(n, main_container, tilesize, tilesize, ground_color);
var sub_menu = new Infobar(main_container, "infobar-container");


// fill containers with buttons and containers:

// empty dummy container on top (to force other containers to be at the bottom)
dummy_main = main_menu.create_infocontainer();
dummy_sub = sub_menu.create_infocontainer();

// start container:
create_game_container = main_menu.create_infocontainer("Start Local Game");
b_local_game = create_game_container.create_button("Local Game");



// register container:
register_container = main_menu.create_infocontainer("Login to play online");
i_register_username = register_container.create_input("username");
i_register_pw = register_container.create_input("password", true);
b_register = register_container.create_button("register/login");
//register_container.create_label("(creates new account for a new username)");

// logout TODO: rename container:
logout_container = main_menu.create_infocontainer("Logged in as: ");
b_logout = logout_container.create_button("Logout");
b_show_highscores = logout_container.create_button("Highscores");

highscore_container = main_menu.create_infocontainer("Highscores");
b_close_highscores = highscore_container.create_button("Close Highscores");
l_highscores = highscore_container.create_label("...");
l_highscores.style.textAlign = "left"


// fill subcontainer:
match_slot_container = sub_menu.create_infocontainer("Running Matches<br>(click to open)");


// match control:
match_control = sub_menu.create_infocontainer(" -- vs. --");
b_end_game = match_control.create_button("Close Match");



// search match:
search_match_container = sub_menu.create_infocontainer("Create Online Match");
b_match_search = search_match_container.create_button("random match");
search_match_container.create_label("invite player by name:");
l_match_op = search_match_container.create_input("player name");
b_match_invite = search_match_container.create_button("invite player");

search_match_container.create_label("Invite friends:")



//status:
status_container = main_menu.create_infocontainer("Status");
l_status = status_container.create_label("");



// global vars:

game_manager = null;

logged_in = false;

// connection stuff:

var connection = null;
var session_id = null;


// cookies:
function get_cookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function set_cookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function check_cookie(cname) {
    var tmp = get_cookie(cname);
    if (tmp != "") {
        return true;
    }
    return false;
}

status_message = function(text, blink = true)
{
    l_status.innerHTML = text;
    if (blink)
    {
        status_container.blink("rgba(126,87,194, 0.5)");
    }
}

status_error = function(text, blink=true)
{
    l_status.innerHTML = text;
    if (blink)
    {
        status_container.blink("rgba(128,0,0,0.5");
    }
}



status_message("select gamemode. click <br> <a href=https://en.wikipedia.org/wiki/Ultimate_tic-tac-toe#Rules>[here]</a> for the rules!");


// global funcs:

disable_all_containers = function()
{
    create_game_container.hide();
    register_container.hide();
    logout_container.hide();
    match_slot_container.hide();
    search_match_container.hide();
    match_control.hide();
    status_container.hide();
    highscore_container.hide();

    dummy_main.hide();
    dummy_sub.hide();
}


end_local_game = function()
{
    disable_all_containers();
    create_game_container.show();
    status_container.show();
    if (logged_in)
    {
        logout_container.show();
        search_match_container.show();
        match_slot_container.show();
    }
    else
    {
        register_container.show();
    }
    
    game_manager = null;
}

on_close_click = function() {
    if (game_manager != null)
    {
        game_manager.end_game();
        end_local_game();
    }
    else if (connection != null)
    {
        connection.on_close_click();
        match_control.hide();
    }
}


start_local_game = function()
{
    console.log("clicked");
    disable_all_containers();
    match_control.show();
    dummy_main.show();
    dummy_sub.show();

    status_container.show();

    b_end_game.innerHTML="Close Match";

    game_manager = new LocalMatchManager(grid, l_status, match_control, end_local_game);

}


// connection stuff:

login_callback = function()
{
    logged_in = true;
    if (game_manager != null)
    {
        game_manager.end_game();
        
    }
    end_local_game();
    logout_container.update_head("logged in as: " + connection.player.get_name());
    //logout_container.blink("rgba(128,128,128,0.5)");

    set_cookie("sessionid", connection.session_id, 30);

}

logout = function()
{
    logged_in = false;
    if (connection != null)
    {

        connection.close();
        if (check_cookie("sessionid"))
        {
            // delete session:
            session_id = get_cookie("sessionid");
            set_cookie("sessionid", session_id, -100);
            session_id = null;
        }

    }

    connection = null;
    grid.unblock_all();
    grid.deactivate_all();
    grid.block_all();
    end_local_game();
}

reconnect = function()
{
    if (check_cookie("sessionid"))
    {
        session_id = get_cookie("sessionid");
        if (connection != null)
        {
            connection.close();
        }
        connection = new WebsocketConnection(server_url, server_port, grid, status_message, status_error, match_slot_container, match_control, b_end_game, logout_container, search_match_container, login_callback, on_connection_error);
        connection.reconnect(session_id);
    }
}

on_connection_error = function()
{
    connection = null;
    logout();
}

login = function(){

    if (connection != null)
    {
        connection.close();
    }
    connection = new WebsocketConnection(server_url, server_port, grid, status_message, status_error, match_slot_container, match_control, b_end_game, logout_container, search_match_container, login_callback, on_connection_error);
    connection.connect(i_register_username.value.toLowerCase(), i_register_pw.value);
}

search_match = function()
{
    if (connection != null)
    {
        connection.send_match_request(null);
    }
}

invite_player = function()
{
    if (connection != null)
    {
        if (l_match_op.value == "")
        {
            status_error("choose your opponent first!");
        }
        else
        {
            connection.send_match_request(l_match_op.value);
        }
    }
}

show_highscores = function()
{
    l_highscores.innerHTML = "";
    var new_text = "";
    if (connection != null)
    {
        if (connection.top_names != null && connection.top_elos != null)
        {
            var n = connection.top_names.length;
            var i;
            for (i = 0; i < n; i++)
            {
                name = connection.top_names[i];
                if (name.length > 10)
                {
                    name=name.substring(0,10) + "…";
                }
                new_text += "\#" + (i+1) + ": " + name + " [" + connection.top_elos[i] + "]<br>";
            }

            l_highscores.innerHTML = new_text;
        }
    }

    logout_container.hide();
    highscore_container.show();
}

close_highscores = function()
{
    highscore_container.hide();
    logout_container.show();
}



// initiate stuff and connect events:

end_local_game();


b_local_game.addEventListener("click", start_local_game);
b_end_game.addEventListener("click", on_close_click);
b_register.addEventListener("click", login);
b_logout.addEventListener("click", logout);

b_match_search.addEventListener("click", search_match);
b_match_invite.addEventListener("click", invite_player);

b_show_highscores.addEventListener("click", show_highscores);
b_close_highscores.addEventListener("click", close_highscores);


reconnect();

// register resize event:

window.addEventListener("resize", function() {
    var tilesize = getComputedStyle(document.body).getPropertyValue("--tile-size");
    grid.on_screen_orientation_change(tilesize, tilesize);
});

window.onload = function() { 
    window.onfocus = function() {
        if (session_id != null && connection == null)
        {
            reconnect();
        }
    };
};

