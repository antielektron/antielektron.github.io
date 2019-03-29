class Sidebar
{
    constructor(grid, control_container, info_container, game_manager)
    {
        this.grid = grid;
        this.control_container = control_container;
        this.info_container = info_container
        this.game_manager = game_manager;

        this.build_controls();
        this.game_manager.register_level_callback(c => this.level_callback_listener(c));
        this.game_manager.register_statustext_callback(c => this.status_callback_listener(c));
        this.bind_events();
    }

    build_controls()
    {
        this.b_start = document.createElement("button");
        this.b_start.className = "control-button";
        this.b_start.appendChild(document.createTextNode("Start")) 

        this.control_container.appendChild(this.b_start);

        this.b_score = document.createElement("button");
        this.b_score.className = "info-button";
        this.t_scoretext = document.createTextNode("Round: ");
        this.b_score.appendChild(this.t_scoretext); 

        this.b_status = document.createElement("button");
        this.b_status.className = "status-button";
        this.t_statustext = document.createTextNode("");
        this.b_status.appendChild(this.t_statustext); 

        this.control_container.appendChild(this.b_start);
        this.info_container.appendChild(this.b_score);
        this.info_container.appendChild(this.b_status);
    }

    bind_events()
    {
        this.b_start.addEventListener("click", c => this.game_manager.restart(c));
    }

    level_callback_listener(level)
    {
        this.t_scoretext.nodeValue = "Round: " + level;
    }

    status_callback_listener(text)
    {
        this.t_statustext.nodeValue = text;
    }
}