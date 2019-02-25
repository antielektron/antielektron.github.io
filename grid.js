class Grid
{
    constructor(width, height, grid_container_div, tile_width, tile_height)
    {
        this.width = width;
        this.height = height;

        this.tile_width = tile_width;
        this.tile_height = tile_height;

        this.cells = []

        this.grid_container_div = grid_container_div

        this.create();
    }

    create()
    {
        var x,y;
        for (y = 0; y < this.height; y++)
        {
            var div_row = this.grid_container_div.appendChild(document.createElement("div"));
            var row = [];
            for (x = 0; x < this.width; x++)
            {
                var div_button = div_row.appendChild(document.createElement("div"));
                div_button.className = "grid-tile";
                var button = document.createElement("button");
                button.className = "grid-button";
                div_button.appendChild(button);
                var c =  "rgb(" + Math.round(255 * x / this.width) + ", " + Math.round(255 * y / this.height) + ", " + Math.round(255 * ( 1.0 - x / this.width))+")";
                row.push(new Tile(x,y,this.tile_width,this.tile_height,button,c,div_button));
                row[x].register_click_callback((i,j) => this.click_listener(i,j));
            }
            this.cells.push(row);
        }
    }

    activate_all()
    {
        var x,y;
        for (y = 0; y < this.height; y++)
        {
            for (x = 0; x < this.width; x++)
            {
                this.cells[y][x].activate();
            }
        }
    }

    deactivate_all()
    {
        var x,y;
        for (y = 0; y < this.height; y++)
        {
            for (x = 0; x < this.width; x++)
            {
                this.cells[y][x].deactivate();
            }
        }
    }

    register_click_callback(func)
    {
        this.click_callback = func;
    }

    click_listener(x,y)
    {
        this.click_callback(x,y);
    }

    block()
    {
        var x,y;
        for (y = 0; y < this.height; y++)
        {
            for (x = 0; x < this.width; x++)
            {
                this.cells[y][x].lock();
            }
        }
    }

    unblock()
    {
        var x,y;
        for (y = 0; y < this.height; y++)
        {
            for (x = 0; x < this.width; x++)
            {
                this.cells[y][x].unlock();
            }
        }
    }
}