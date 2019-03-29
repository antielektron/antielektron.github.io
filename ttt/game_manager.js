class GameManager
{
    constructor(grid, game_server_connection)
    {
        this.grid = grid;

        this.dummy_player = new Player("test_player", 0,255,0);

        this.local_player_a = new Player("red player", 255,0,0);
        this.local_player_b = new Player("green player", 0,255,0);
        this.is_local_player_a = false;

        this.remote_player = new Player("you", 0,255,0);
        this.remote_opponent = new Player("remote player", 255,0,0);
        this.remote_is_local_turn = false;

        this.grid.player_change_listener(this.dummy_player);

        // possible modes:
        // -- none
        // -- local
        // -- remote

        this.game_mode = "none";

        this.use_notification = false;

        this.game_server_connection = game_server_connection;
        game_server_connection.set_game_manager(this);

        this.grid.register_click_callback((i,j,k,l) => this.click_listener(i,j,k,l));


    }

    click_listener(sub_x, sub_y, x,y)
    {
        if (this.game_mode == "local")
        {
            // check whether the game is over:
            if (grid.is_won())
            {
                this.status_change_listener("" + grid.get_won_player().get_name() + " has won.", "Game Over")
                this.end_game();
            }
            else if (grid.is_complete())
            {
                this.status_change_listener("Draw. Everybody looses!", "Game Over");
                this.end_game();
            }
            else
            {
                this.toggle_local_player();
                this.grid.block_all()
                this.grid.subgrids[y][x].unblock();
                if (this.grid.subgrids[y][x].is_draw() || this.grid.subgrids[y][x].is_won())
                {
                    this.grid.unblock_all();
                }
            }
        }
        else if(this.game_mode == "remote")
        {

            this.grid.block_all();

            if (this.remote_is_local_turn)
            {
                this.game_server_connection.send_move(sub_x, sub_y, x, y);
            }

            if (grid.is_won())
            {
                if (this.remote_is_local_turn)
                {
                    this.status_change_listener("Congratulation, you won!", "Game Over");
                }
                else
                {
                    this.status_change_listener("You lost!", "Game Over");
                }
                this.end_game();
            }
            else if (grid.is_complete())
            {
                this.status_change_listener("Draw. Everybody looses!", "Game Over");
                this.end_game();
            }

            else
            {
                this.toggle_remote_player();

                if (this.remote_is_local_turn)
                {
                    this.grid.block_all();

                    this.grid.subgrids[y][x].unblock();

                    if (this.grid.subgrids[y][x].is_draw()|| this.grid.subgrids[y][x].is_won())
                    {
                        this.grid.unblock_all();
                    }
                }
            }
            
        }
    }

    register_game_mode_change_listener(func)
    {
        this.game_mode_change_listener = func;
    }

    register_status_change_listener(func)
    {
        this.status_change_listener = func;
    }

    set_game_mode(mode)
    {
        this.game_mode = mode;
        this.game_mode_change_listener(mode);
        console.log("changed gamemode to " + mode);
    }

    start_local_game()
    {
        this.set_game_mode("local");
        this.grid.deactivate_all();
        this.grid.unblock_all();

        this.is_local_player_a = false;

        this.status_change_listener("", "local game")

        this.toggle_local_player();

    }

    register_remote_game(player_name)
    {
        console.log("set player name to: " + player_name);
        if (player_name == "")
        {
            this.status_change_listener("enter your name first!");
            return;
        }
        this.set_game_mode("remote");
        this.grid.deactivate_all();
        this.grid.block_all();

        this.remote_player.set_name(player_name);

        this.status_change_listener("connect to server...");

        this.game_server_connection.connect(() => {
            this.game_server_connection.set_player(this.remote_player);
            this.game_server_connection.register();
        });
    }

    register_response_listener(is_accepted)
    {

        if (this.game_mode != "remote")
        {
            return;
        }

        if (is_accepted)
        {
            this.status_change_listener("Connected. Waiting for matchmaking...");
        }
        else
        {
            this.status_change_listener("could not register for matchmaking. Maybe the name is already in use?");
            this.set_game_mode("none");
            this.grid.deactivate_all();
            this.grid.block_all();

        }
    }
    
    start_game_listener(opponent_name, is_first_move)
    {
        if (this.game_mode != "remote")
        {
            return;
        }

        this.remote_opponent.set_name(opponent_name);
        this.remote_is_local_turn = is_first_move;

        var status_title = "" + this.remote_player.get_name() + " vs. " + opponent_name;

        this.notify("Your game against " + opponent_name + " started");

        if (is_first_move)
        {
            this.grid.deactivate_all();
            this.grid.unblock_all();

            this.grid.player_change_listener(this.remote_player);

            this.status_change_listener("game aginst " + opponent_name + " started. It's your turn", status_title);
        }
        else
        {
            this.grid.deactivate_all();
            this.grid.block_all();

            this.grid.player_change_listener(this.remote_opponent);

            this.status_change_listener("game started, it's " + opponent_name + " turn", status_title);
        }
    }

    move_listener(sub_x, sub_y, x, y)
    {
        if (this.game_mode != "remote" || this.remote_is_local_turn)
        {
            console.log("received unexpected move");
            return;
        }

        this.grid.block_all();
        this.grid.subgrids[sub_y][sub_x].unblock();
        this.grid.subgrids[sub_y][sub_x].cells[y][x].on_click();

    }

    end_game_listener()
    {

        if (this.game_mode != "remote")
        {
            return;
        }

        this.status_change_listener("game was closed by server or opponent", "Game Over");

        this.notify("Game is closed");

        this.end_game();
    }

    toggle_local_player()
    {
        this.is_local_player_a = !this.is_local_player_a;
        var next_player = this.is_local_player_a ? this.local_player_a : this.local_player_b;
        
        this.status_change_listener("" + "it's " + next_player.get_name() + "'s turn...");
        this.grid.player_change_listener(next_player);
    }

    toggle_remote_player()
    {
        this.remote_is_local_turn = !this.remote_is_local_turn;
        if (this.remote_is_local_turn)
        {
            this.status_change_listener("your turn");
            this.grid.player_change_listener(this.remote_player);
            this.notify("it's your turn");
        }
        else
        {
            this.status_change_listener("waiting for " + this.remote_opponent.get_name() + "'s move...");
            this.grid.player_change_listener(this.remote_opponent);
        }
    }

    end_game(clicked_by_local_user = false)
    {
        if (this.game_mode == "remote")
        {
            this.game_server_connection.close();
            if (clicked_by_local_user)
            {
                this.status_change_listener("you closed the game", "Game Over");
            }
        }
        else if (this.game_mode == "local")
        {
            this.status_change_listener("game is closed", "Game Over");
        }
        this.set_game_mode("none");
        this.grid.block_all();
    }

    connection_error_listener()
    {
        this.status_change_listener("connection error", "Game Over");
        this.end_game();
    }

    activate_notifications()
    {
        this.use_notification = true;
    }

    notify(text) {
        
        Notification.requestPermission(function(result) {
            if (result === 'granted') {
                navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(text, {
                        icon: './icon.png',
                        vibrate: [200, 200],
                        tag: "tictactoe-notification"
                    });
                });
            }
        });
      
    }
}