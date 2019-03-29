class Grid
{
    constructor(n, parent, tile_width, tile_height, ground_color)
    {
        this.n = n;
        this.grid_container_div = null;
        this.tile_width = tile_width;
        this.tile_height = tile_height;
        this.ground_color = ground_color;

        this.won_player = null;
        this.n_complete_subgrids = 0;

        this.parent = parent;

        this.subgrids = []

        console.log("create grid of size " + this.n);

        this.create();
    }

    create()
    {
        this.grid_container_div = document.createElement("div");
        this.grid_container_div.className = "grid-container";
        this.parent.appendChild(this.grid_container_div);

        var x,y;
        for (y = 0; y < this.n; y++)
        {
            var div_row = this.grid_container_div.appendChild(document.createElement("div"));
            var row = [];
            for (x = 0; x < this.n; x++)
            {
                var div_subgrid = div_row.appendChild(document.createElement("div"));
                div_subgrid.className = "subgrid-container";

                row.push(new Subgrid(this.n, x,y,div_subgrid,this.tile_width, this.tile_height, this.ground_color));
                row[x].register_click_callback((i,j,k,l) => this.click_listener(i,j,k,l));

            }

            this.subgrids.push(row);
        }
    }

    register_click_callback(func)
    {
        this.click_callback = func;
    }


    click_listener(sub_x, sub_y, x,y)
    {
        this.check_win(sub_x, sub_y, x, y);
        this.check_complete(sub_x, sub_y, x, y);
        if (this.click_callback != null)
        {
            this.click_callback(sub_x, sub_y, x, y);
        }
    }

    player_change_listener(player)
    {
        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                this.subgrids[y][x].player_change_listener(player);
            }
        }
    }

    is_complete()
    {
        return !(this.n_complete_subgrids < this.n * this.n);
    }

    is_won()
    {
        return this.won_player != null;
    }

    get_won_player()
    {
        return this.won_player;
    }

    check_complete(sub_x, sub_y, x, y)
    {
        if (this.subgrids[sub_y][sub_x].is_won() || this.subgrids[sub_y][sub_x].is_draw())
        {
            this.n_complete_subgrids++;
        }
    }

    check_win(sub_x, sub_y, x,y)
    {
        // check whether the game is won
        console.log("check for win");
        if (this.won_player == null)
        {
            var i;
            var subgrid = this.subgrids[sub_y][sub_x];
            var player = subgrid.cells[y][x].get_activated_player();

            // check column
            var is_col = true;
            for (i = 0; i < this.n; i++)
            {
                if (!this.subgrids[i][sub_x].is_won() || player.get_id() != this.subgrids[i][sub_x].get_won_player().get_id())
                {
                    is_col = false;
                    break;
                }
            }

            // check row
            var is_row = true;
            for (i = 0; i < this.n; i++)
            {
                if (!this.subgrids[sub_y][i].is_won() || player.get_id() != this.subgrids[sub_y][i].get_won_player().get_id())
                {
                    is_row = false;
                    break;
                }
            }

            // check diag:

            // main diag
            var is_main_diag = false;
            if (sub_x == sub_y)
            {
                is_main_diag = true;
                for (i = 0; i < this.n; i++)
                {
                    if (!this.subgrids[i][i].is_won() || player.get_id() != this.subgrids[i][i].get_won_player().get_id())
                    {
                        is_main_diag = false;
                        break;
                    }
                }
            }

            // secundary diag
            var is_sec_diag = false;
            if (sub_x + sub_y == this.n - 1)
            {
                is_sec_diag = true;
                for (i = 0; i < this.n; i++)
                {
                    if (!this.subgrids[i][this.n - i - 1].is_won() || player.get_id() != this.subgrids[i][this.n - i - 1].get_won_player().get_id())
                    {
                        is_sec_diag = false;
                        break;
                    }
                }
            }

            if (is_row || is_col || is_main_diag || is_sec_diag)
            {
                this.won_player = player;
                console.log("game over");
                //this.grid_container_div.style.backgroundColor = player.get_color();
            }
        }
    }

    activate_all()
    {
        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                this.subgrids[y][x].activate_all();
            }
        }
    }

    deactivate_all()
    {
        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                this.subgrids[y][x].deactivate_all();
            }
        }

        this.won_player = null;
        this.n_complete_subgrids = 0;
    }

    block_all()
    {
        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                this.subgrids[y][x].block();
            }
        }
    }

    unblock_all()
    {
        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                this.subgrids[y][x].unblock();
            }
        }
    }

    unblock_all_non_completed()
    {
        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                if (this.subgrids[y][x].is_won() || this.subgrids[y][x].is_draw())
                {
                    continue;
                }
                this.subgrids[y][x].unblock();
            }
        }
    }

    block(x,y)
    {
        this.subgrids[y][x].block();
    }

    unblock(x,y)
    {
        this.subgrids[y][x].unblock();
    }

    on_screen_orientation_change(tile_w,tile_h)
    {
        this.tile_width = tile_w;
        this.tile_h = tile_h;

        var x,y;
        for (y = 0; y < this.n; y++)
        {
            for (x = 0; x < this.n; x++)
            {
                this.subgrids[y][x].on_screen_orientation_change(tile_w, tile_h);
            }
        }
    }
}