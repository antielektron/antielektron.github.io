class Tile
{
    constructor(x,y,w,h, elem, ground_color, div)
    {
        this.x = x;
        this.y = y;

        this.w = w;
        this.h = h;

        // reference to element
        this.elem = elem;
        this.ground_color = ground_color;
        this.div = div;

        this.locked = false;

        this.div.style.transform = "translate( calc( " + x + "*" + w + "), calc(" + y + "*" + h + "))";
        
        this.player = null;

        this.activated_player = null;
        this.reset();
        this.bind();


        this.opacity_off = 0.5;
        this.opacity_select = 0.6;
        this.opacity_on = 1;

    }

    update_css_transform(w,h)
    {
        this.w = w;
        this.h = h;
        this.div.style.transform = "translate( calc( " + this.x + "*" + this.w + "), calc(" + this.y + "*" + this.h + "))";
    }

    register_click_callback(func)
    {
        this.click_callback = func;
    }

    register_unlock_request_callback(func)
    {
        this.unlock_request_callback = func;
    }

    player_change_listener(player)
    {
        this.player = player;
    }

    bind()
    {
        this.elem.addEventListener("mouseenter", c => this.on_mouseenter(c));
        this.elem.addEventListener("mouseleave", c => this.on_mouseleave(c));
        this.elem.addEventListener("mousedown", c => this.on_click(c));

        // TODO: bind player listener
    }

    reset()
    {
        this.elem.style.backgroundColor = this.ground_color;
        this.elem.style.opacity = 1;
        this.deactivate();
    }

    get_is_activated()
    {
        return this.is_activated;
    }

    get_activated_player()
    {
        return this.activated_player;
    }

    lock()
    {
        this.locked = true;
        this.elem.style.opacity = this.opacity_off;
    }

    unlock()
    {
        this.locked = false;
        this.elem.style.opacity = this.opacity_off;
    }

    deactivate()
    {
        this.is_activated = false;
        this.activated_player = null;
        this.elem.style.background = this.ground_color;
        this.elem.style.opacity = this.opacity_off;
        this.elem.style.border = "none";
    }

    activate()
    {  
        this.is_activated = true;
        this.activated_player = this.player;
        this.elem.style.background = this.player.get_color();
        this.elem.style.opacity = this.opacity_on;
        this.elem.style.border = "2px solid rgba(255,255,255,0.3)";
    }

    on_mouseenter()
    {
        if (!this.is_activated && !this.locked)
        {
            this.elem.style.background = this.player.get_color();
            this.elem.style.opacity = this.opacity_select;
            this.elem.style.border = "1px solid rgba(255,255,255,0.3)";
        }
    }

    on_mouseleave()
    {
        if (!this.is_activated && !this.locked)
        {
            this.elem.style.background = this.ground_color;
            if (this.locked)
            {
                this.elem.style.opacity = this.opacity_off;
            }
            else
            {
                this.elem.style.opacity = this.opacity_select;
            }
            this.elem.style.border = "none";
        }
    }

    on_click()
    {
        if  (this.locked)
        {
            // just check whether we can request an unlock. if not we're
            // doing nothing!
            if (!this.unlock_request_callback(this.x, this.y))
            {
                return;
            }
        }

        if (!this.is_activated)
        {
            this.activate();
            this.click_callback(this.x, this.y);
        }
        
    }

}