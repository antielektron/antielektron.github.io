class GameManager
{
    constructor(grid, sidebar_div)
    {
        this.grid = grid;
        this.sidebar_div = sidebar_div;
        this.level = 0;
        this.blocked = false;
        this.default_opacity = default_opacity;
        this.n_selected = 0;
        this.timeout_id;
        this.in_show_mode = false;

        this.grid.register_click_callback((i,j) => this.click_listener(i,j));
        this.grid.register_unlock_request_callback((i,j) => this.unlock_request_listener(i,j));
    }

    register_level_callback(func)
    {
        this.level_callback = func;
        func(0);
    }

    register_statustext_callback(func)
    {
        this.status_callback = func;
        func("click 'start' to begin a new game");
    }

    click_listener(x,y)
    {
        var i = this.coords2index(y,x); //TODO: change index order

        if (this.level <= 0)
        {
            //we're not ingame
            return;
        }

        if (this.active_cells.includes(i))
        {
            this.n_selected++;
            if (this.n_selected == this.level)
            {
                this.on_level_up();
            }
        }
        else
        {
            this.on_game_over();
        }
    }

    unlock_request_listener(x,y)
    {
        if (this.level > 0 && this.in_show_mode)
        {
            clearTimeout(this.timeout_id);
            this.end_show_sequence();
            return true;
        }
        return false;
    }

    restart()
    {
        if (!this.blocked)
        {
            this.sidebar_div.style.backgroundColor = "rgba(0,255,0," + this.default_opacity + ")";
            this.level = 0;
            this.level_callback(0);
            this.grid.deactivate_all();
            this.inactive_cells = [];
            var i = 0;
            for(i = 0; i < this.grid.width * this.grid.height; i++)
            {
                this.inactive_cells.push(i);
            }
            this.active_cells = [];
            this.on_level_up();
        }
    }

    create_new_sequence()
    {
        // get one cell randomly
        var i = Math.floor(Math.random()*this.inactive_cells.length);
        var item = this.inactive_cells[i];
        this.inactive_cells.splice(i, 1);

        this.active_cells.push(item);
    }

    show_sequence()
    {
        this.status_callback("memorize new sequence");
        this.grid.deactivate_all();
        var i;
        for (i=0; i < this.active_cells.length; i++)
        {
            var coords = this.index2coord(this.active_cells[i]);
            var x = coords[1];
            var y = coords[0];

            this.grid.cells[y][x].activate();
        }
        var time = this.level * 300 + 2000;
        this.in_show_mode = true;
        this.timeout_id = setTimeout(c => this.end_show_sequence(c), time);
    }

    end_show_sequence()
    {
        this.status_callback("it's your turn, reproduce the sequence!");
        this.sidebar_div.style.backgroundColor = "rgba(0,0,0," + this.default_opacity + ")";
        this.grid.deactivate_all();
        this.unblock();
        this.in_show_mode = false;
    }

    on_level_up()
    {
        if (this.level >= this.grid.width * this.grid.height)
        {
            this.on_win();
            return;
        }
        this.block();
        this.sidebar_div.style.backgroundColor = "rgba(0,255,0," + this.default_opacity + ")";
        this.level++;
        this.n_selected = 0;
        this.level_callback(this.level);
        this.create_new_sequence();
        this.show_sequence();
    }

    on_game_over()
    {
        // activate all correct cells:
        this.grid.deactivate_all();
        var i;
        for (i=0; i < this.active_cells.length; i++)
        {
            var coords = this.index2coord(this.active_cells[i]);
            var x = coords[1];
            var y = coords[0];

            this.grid.cells[y][x].activate();
        }

        this.status_callback("Game Over. Won rounds: " + (this.level - 1));
        this.sidebar_div.style.backgroundColor = "rgba(255,0,0," + this.default_opacity + ")";
        this.level = 0;
        this.n_selected = 0;
    }

    on_win()
    {
        this.status_callback("Congratulation, You Won");
        this.sidebar_div.style.backgroundColor = "rgba(0,255,0," + this.default_opacity + ")";
        this.level = 0;
        this.n_selected = 0;
    }

    block()
    {
        this.blocked = true;
        this.grid.block();
    }

    unblock()
    {
        this.grid.unblock();
        this.blocked = false;
    }

    index2coord(i)
    {
        var x = i % this.grid.width;
        var y = Math.floor(i / this.grid.width);
        var result = [y,x];
        return result;
    }

    coords2index(y,x)
    {
        return y * this.grid.width + x;
    }
}