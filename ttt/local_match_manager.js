class LocalMatchManager
{
    constructor(grid, status_label, control_container)
    {
        this.grid = grid;
        this.status_label = status_label;

        this.control_container = control_container;

        this.control_container.show();
        this.control_container.clear_background_color();
        this.control_container.update_head("local game");

        this.local_player_a = new Player("red player", 255,0,0);
        this.local_player_b = new Player("green player", 0,255,0);
        this.is_local_player_a = false;

        this.grid.register_click_callback((i,j,k,l) => this.click_listener(i,j,k,l));

        this.grid.deactivate_all();
        this.grid.unblock_all();


        this.toggle_local_player();
    }

    click_listener(sub_x, sub_y, x,y)
    {
        // check whether the game is over:
        if (this.grid.is_won())
        {
            this.status_label.innerHTML = "" + this.grid.get_won_player().get_name() + " has won.";
            this.control_container.update_head("" + this.grid.get_won_player().get_name() + " won");
            this.control_container.set_background_color(this.grid.get_won_player().get_color_with_alpha(0.4));
        }
        else if (this.grid.is_complete())
        {
            this.status_label.innerHTML = "Draw. Everybody looses!";
            this.control_container.update_head("Draw");
            this.control_container.set_background_color(theme_color_highlight);

        }
        else
        {
            this.toggle_local_player();
            this.grid.block_all()
            if (this.grid.subgrids[y][x].is_draw() || this.grid.subgrids[y][x].is_won())
            {
                this.grid.unblock_all_non_completed();
            }
            else
            {
                this.grid.subgrids[y][x].unblock();
            }
        }
    }

    toggle_local_player()
    {
        this.is_local_player_a = !this.is_local_player_a;
        var next_player = this.is_local_player_a ? this.local_player_a : this.local_player_b;
        
        this.status_label.innerHTML = "" + "it's " + next_player.get_name() + "'s turn...";
        this.control_container.update_head("" + next_player.get_name() + "'s move");
        this.control_container.blink(theme_color_highlight);
        this.grid.player_change_listener(next_player);
    }

    end_game(closed_by_player = true)
    {
        if (closed_by_player)
        {
            this.status_label.innerHTML = "Game Over. Game Closed";
        }
        this.grid.block_all();
    }

    
}