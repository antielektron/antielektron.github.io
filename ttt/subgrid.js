class Subgrid {
    constructor(n, sub_x, sub_y, subgrid_container_div, tile_width, tile_height, ground_color) {
        this.n = n;
        this.subgrid_container_div = subgrid_container_div;
        this.tile_height = tile_height;
        this.tile_width = tile_width;

        this.cells = [];
        this.won_player = null;
        this.draw = false;
        this.clicked_fields = 0;

        this.sub_x = sub_x;
        this.sub_y = sub_y;

        this.ground_color = ground_color;

        this.bgcolor = null;

        this.create();
        this.block();

        console.log("new subgrid created");
    }

    create() {
        var x, y;
        for (y = 0; y < this.n; y++) {
            var div_row = this.subgrid_container_div.appendChild(document.createElement("div"));
            var row = [];
            for (x = 0; x < this.n; x++) {
                var div_button = div_row.appendChild(document.createElement("div"));
                div_button.className = "grid-tile";
                var button = document.createElement("button");
                button.className = "grid-button";
                div_button.appendChild(button);

                var b_x = x;
                var b_y = y;
                var b_w = this.tile_width;
                var b_h = this.tile_height;

                row.push(new Tile(b_x, b_y, b_w, b_h, button, this.ground_color, div_button));

                row[x].register_click_callback((i, j) => this.click_listener(i, j));
                row[x].register_unlock_request_callback((i, j) => this.unlock_request_listener(i, j));

            }
            this.cells.push(row);
        }
    }

    register_click_callback(func) {
        this.click_callback = func;
    }

    click_listener(x, y) {

        this.check_win(x, y);
        this.clicked_fields++;
        this.check_draw();

        this.click_callback(this.sub_x, this.sub_y, x, y);
    }

    player_change_listener(player) {
        var x, y;
        for (y = 0; y < this.n; y++) {
            for (x = 0; x < this.n; x++) {
                this.cells[y][x].player_change_listener(player);
            }
        }
    }

    unlock_request_listener(x, y) {
        // TODO: unused so far

        //return this.unlock_request_callback(x,y);
        return false;
    }

    is_won() {
        return this.won_player != null;
    }

    is_draw() {
        return this.draw;
    }

    get_won_player() {
        return this.won_player;
    }

    check_win(x, y) {
        // check whether this subfield is won

        if (this.won_player == null) {
            var i;
            var player = this.cells[y][x].get_activated_player();

            // check column
            var is_col = true;
            for (i = 0; i < this.n; i++) {
                if (!this.cells[i][x].get_is_activated() || player.get_id() != this.cells[i][x].get_activated_player().get_id()) {
                    is_col = false;
                    break;
                }
            }

            // check row
            var is_row = true;
            for (i = 0; i < this.n; i++) {
                if (!this.cells[y][i].get_is_activated() || player.get_id() != this.cells[y][i].get_activated_player().get_id()) {
                    is_row = false;
                    break;
                }
            }

            // check diag:

            // main diag
            var is_main_diag = false;
            if (x == y) {
                is_main_diag = true;
                for (i = 0; i < this.n; i++) {
                    if (!this.cells[i][i].get_is_activated() || player.get_id() != this.cells[i][i].get_activated_player().get_id()) {
                        is_main_diag = false;
                        break;
                    }
                }
            }

            // secundary diag
            var is_sec_diag = false;
            if (x + y == this.n - 1) {
                is_sec_diag = true;
                for (i = 0; i < this.n; i++) {
                    if (!this.cells[i][this.n - i - 1].get_is_activated() || player.get_id() != this.cells[i][this.n - i - 1].get_activated_player().get_id()) {
                        is_sec_diag = false;
                        break;
                    }
                }
            }

            if (is_row || is_col || is_main_diag || is_sec_diag) {
                this.won_player = player;
                this.bgcolor = player.get_color_values();
            }
        }
    }

    check_draw() {
        this.draw = (!(this.clicked_fields < this.n * this.n));
    }

    activate_all() {
        var x, y;
        for (y = 0; y < this.n; y++) {
            for (x = 0; x < this.n; x++) {
                this.cells[y][x].activate();
            }
        }
    }

    deactivate_all() {
        var x, y;
        for (y = 0; y < this.n; y++) {
            for (x = 0; x < this.n; x++) {
                this.cells[y][x].deactivate();
            }
        }
        this.won_player = null;
        this.draw = false;
        this.clicked_fields = 0;
        this.subgrid_container_div.style.backgroundColor = ""; // reset to css color
    }

    block() {
        var x, y;
        for (y = 0; y < this.n; y++) {
            for (x = 0; x < this.n; x++) {
                this.cells[y][x].lock();
            }
        }
        this.subgrid_container_div.className = "subgrid-container";
        if (this.is_won())
        {
            var c = this.bgcolor;
            this.subgrid_container_div.style.backgroundColor = "rgba(" + c.r + "," + c.g + "," + c.b + ", 0.2)";
        }
    }

    unblock() {
        var x, y;
        for (y = 0; y < this.n; y++) {
            for (x = 0; x < this.n; x++) {
                this.cells[y][x].unlock();
            }
        }
        this.subgrid_container_div.className = "subgrid-container-activated";
        if (this.is_won())
        {
            var c = this.bgcolor;
            this.subgrid_container_div.style.backgroundColor = "rgba(" + c.r + "," + c.g + "," + c.b + ", 0.4)";
        }
    }

    on_screen_orientation_change(tile_w, tile_h) {
        this.tile_width = tile_w;
        this.tile_h = tile_h;

        var x, y;
        for (y = 0; y < this.n; y++) {
            for (x = 0; x < this.n; x++) {
                this.cells[y][x].update_css_transform(tile_w, tile_h);
            }
        }
    }
}