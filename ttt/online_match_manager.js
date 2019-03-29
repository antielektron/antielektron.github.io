class OnlineMatchManager
{
    constructor(grid, info_func, matches_container, control_container, end_button, game_server_connection, match_id, match_state, player_name)
    {
        this.grid = grid;

        this.match_id = match_id;

        this.info_func = info_func;

        this.game_server_connection = game_server_connection;


        this.match_state = match_state;
        this.player_name = player_name

        var player_a = this.match_state.player_a;
        var player_b = this.match_state.player_b;

        this.online_opponent = new Player(player_a == this.player_name ? player_b : player_a, 255,0,0);
        this.local_player = new Player(this.player_name, 0,255,0);

        // create match button in match list:
        this.control_container = control_container;
        this.end_button = end_button;
        this.matches_container = matches_container;

        var tmp = matches_container.create_double_button("" + this.online_opponent.get_name(), "+")

        this.match_button = tmp[1];
        this.match_button_div = tmp[0];
        this.match_button_option = tmp[2];

        if (this.game_server_connection.is_friend(this.online_opponent.get_name()))
        {
            this.match_button_option.disabled = true;
        }
        else
        {
            this.match_button_option.addEventListener("click", () => {
                this.game_server_connection.send_friend_request(this.online_opponent.get_name());
                this.match_button_option.disabled = true;
            });
        }

        this.match_button.addEventListener("click", () => this.open_match());

        if (this.online_opponent.get_name() == this.match_state.active_player)
        {
            this.match_button.className = "infobar-button-red";
        }
        else
        {
            this.match_button.className = "infobar-button-green"
        }

        this.is_closed = false;

    }

    click_listener(sub_x, sub_y, x,y)
    {
        this.grid.block_all();

        this.game_server_connection.send_move(sub_x, sub_y, x, y, this.match_id);

        this.info_func("waiting for " + this.online_opponent.get_name() + "'s move", false);
    }

    on_user_close()
    {

        // send end match message:
        if (!this.match_state.game_over)
        {
            this.game_server_connection.send_end_match(this.match_id);
        }

        if (this.match_button_div != null)
        {
            clearInner(this.match_button_div)
            this.matches_container.container.removeChild(this.match_button_div);
            this.match_button_div = null;
        }
        this.info_func("match is closed");
        this.control_container.hide();
        this.is_closed = true;
        
    }

    remove_match()
    {
        if (this.match_button_div != null)
        {
            clearInner(this.match_button_div);
            this.matches_container.container.removeChild(this.match_button_div);
            this.match_button_div = null;
        }
    }

    update_match_state(match_state)
    {
        this.match_state = match_state;
        
        if (this.online_opponent.get_name() == this.match_state.active_player)
        {
            this.match_button.className = "infobar-button-red";
        }
        else
        {
            this.match_button.className = "infobar-button-green"
        }

        if (this.match_state.active_player == this.local_player.get_name())
        {
            this.game_server_connection.notify("your turn against " + this.online_opponent.get_name());
        }
    }

    on_focus_loose()
    {
        if (this.online_opponent.get_name() == this.match_state.active_player)
        {
            this.match_button.className = "infobar-button-red";
        }
        else
        {
            this.match_button.className = "infobar-button-green"
        }

        this.control_container.clear_background_color();
        this.control_container.update_head("");
    }

    update_button_text()
    {

        if (this.match_state.game_over)
        {
            this.end_button.innerHTML = "Close Match";
            return;
        }

        var contains_move_of_a = false;
        var contains_move_of_b = false;
        var i;
        for (i = 0; i < this.match_state.complete_field.length; i++)
        {
            if (this.match_state.complete_field[i].includes(1))
            {
                contains_move_of_a = true;
            }
            if (this.match_state.complete_field[i].includes(2))
            {
                contains_move_of_b = true;
            }
        }

        if (contains_move_of_a && contains_move_of_b)
        {
            this.end_button.innerHTML = "Abandon Match";
            return;
        }

        if (this.match_state.player_a == this.player_name && !contains_move_of_a)
        {
            this.end_button.innerHTML = "Reject Invite";
            return;
        }

        if (this.match_state.player_b == this.player_name && !contains_move_of_b)
        {
            this.end_button.innerHTML = "Reject Invite";
            return;
        }

        this.end_button.innerHTML = "Close Match";

    }

    open_match()
    {
        this.grid.register_click_callback(null);

        this.grid.deactivate_all();
        this.grid.unblock_all();

        this.match_button.className = "infobar-button-active";

        this.game_server_connection.set_active_match(this.match_id);

        this.control_container.show();

        var complete_field = this.match_state.complete_field;
        var global_field = this.match_state.global_field;

        var sub_x = null;
        var sub_y = null;
        var x = null;
        var y = null;        

        if (this.match_state.last_move != null)
        {
            sub_x = this.match_state.last_move.sub_x;
            sub_y = this.match_state.last_move.sub_y;
            x = this.match_state.last_move.x;
            y = this.match_state.last_move.y;
        }

        var game_over = this.match_state.game_over;
        var player_won = this.match_state.player_won;
        var current_player_name = this.match_state.active_player;

        var player_a = this.match_state.player_a;
        var player_b = this.match_state.player_b;

        console.log(game_over);
        console.log(current_player);

        var FIELD_EMPTY = 0
        var FIELD_USER = player_a == this.player_name ? 1 : 2;
        var FIELD_OPPONENT = player_a == this.player_name ? 2 : 1;
        var FIELD_DRAW = 3

        this.online_opponent = new Player(player_a == this.player_name ? player_b : player_a, 255,0,0);
        this.local_player = new Player(this.player_name, 0,255,0);

        var i,j;
        for(j = 0; j < 9; j++)
        {
            for(i = 0; i < 9; i++)
            {
                var si = Math.floor(i / 3);
                var sj = Math.floor(j / 3);
                if (complete_field[j][i] == FIELD_USER)
                {
                    this.grid.subgrids[sj][si].player_change_listener(this.local_player);
                    this.grid.subgrids[sj][si].cells[j % 3][i % 3].on_click();
                }
                if (complete_field[j][i] == FIELD_OPPONENT)
                {
                    this.grid.subgrids[sj][si].player_change_listener(this.online_opponent);
                    this.grid.subgrids[sj][si].cells[j % 3][i % 3].on_click();
                }
            }
        }

        var control_head = "";
        this.control_container.clear_background_color();

        this.update_button_text();

        this.grid.block_all();
        this.grid.register_click_callback((i,j,k,l) => this.click_listener(i,j,k,l));

        if (game_over && player_won != null)
        {
            if (player_won == this.player_name)
            {
                this.info_func("Congratulation, you won!");
                control_head += "You won!"
                this.control_container.set_background_color(this.local_player.get_color_with_alpha(0.4));

            }
            else
            {
                status_mesage("Game over, you lost!");
                control_head += "You lost";
                this.control_container.set_background_color(this.online_opponent.get_color_with_alpha(0.4));
            }
            this.control_container.update_head(control_head);
            return;
        }
        else if(game_over)
        {
            if (this.grid.is_complete())
            {
                this.info_func("Draw. Everyone looses!");
                control_head += "Draw";
                this.control_container.set_background_color(theme_color_highlight);
            }
            else
            {
                this.info_func("Game was closed by server or opponent");
                control_head += "Game Closed"
                this.control_container.set_background_color(theme_color_highlight);
            }
            this.control_container.update_head(control_head);
            return;
        }

        var current_player = this.player_name == current_player_name ? this.local_player : this.online_opponent;
        this.grid.player_change_listener(current_player);

        
        if (this.player_name == current_player_name)
        {
            
            if (this.match_state.last_move != null)
            {
                if (this.grid.subgrids[y][x].is_won() || this.grid.subgrids[y][x].is_draw())
                {
                    this.grid.unblock_all_non_completed();
                }
                else
                {
                    this.grid.unblock(x,y);
                }
                this.info_func("It's your turn!", false);
                this.control_container.blink(theme_color_highlight);
            }
            else
            {
                this.info_func("It's your turn!", false);
                this.control_container.blink(theme_color_highlight);
                this.grid.unblock_all();
            }
        }
        else
        {
            this.info_func("waiting for " + this.online_opponent.get_name() + "'s move", false);
            this.control_container.blink(theme_color_highlight);
        }

        control_head += "" + current_player_name + "'s move";

        this.control_container.update_head(control_head);

        

    }
}