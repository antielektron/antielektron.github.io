class Tile
{
    constructor(x,y,w,h, elem, color, div)
    {
        this.x = x;
        this.y = y;

        this.w = w;
        this.h = h;

        // reference to element
        this.elem = elem;
        this.color = color;
        this.div = div;

        this.locked = false;

        this.div.style.transform = "translate( calc( " + x + "*" + w + "), calc(" + y + "*" + h + "))";

        this.reset();
        this.bind();

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

    bind()
    {
        this.elem.addEventListener("mouseenter", c => this.on_mouseenter(c));
        this.elem.addEventListener("mouseleave", c => this.on_mouseleave(c));
        this.elem.addEventListener("mousedown", c => this.on_click(c));
    }

    reset()
    {
        this.elem.style.backgroundColor = this.color;
        this.elem.style.opacity = 1;
        this.deactivate();
    }

    lock()
    {
        this.locked = true;
    }

    unlock()
    {
        this.locked = false;
    }

    deactivate()
    {
        this.is_activated = false;
        this.elem.style.opacity = 0.3;
        this.elem.style.border = "none";
    }

    activate()
    {
        this.is_activated = true;
        this.elem.style.opacity = 1.0;
        this.elem.style.border = "2px solid rgba(255,255,255,0.3)";
    }

    on_mouseenter()
    {
        if (!this.is_activated && !this.locked)
        {
            this.elem.style.opacity = 0.7;
            this.elem.style.border = "1px solid rgba(255,255,255,0.3)";
        }
    }

    on_mouseleave()
    {
        if (!this.is_activated && !this.locked)
        {
            this.elem.style.opacity = 0.3;
            this.elem.style.border = "none";
        }
    }

    on_click()
    {
        if  (this.locked)
        {
            if (!this.unlock_request_callback(this.x, this.y))
            {
                return;
            }
        }

        var active_before = this.is_activated;
        this.activate();
        if (!active_before)
        {
            this.click_callback(this.x, this.y);
        }
        
    }

}