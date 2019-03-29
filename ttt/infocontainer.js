class Infocontainer
{
    constructor(parent, heading_text=null)
    {
        this.parent = parent;
        this.container = document.createElement("div");
        this.container.className = "info-container";
        this.parent.appendChild(this.container);
        this.head_elem = null;
        this.timeout_id = null;

        if (heading_text != null)
        {
            this.head_elem = document.createElement("label");
            this.head_elem.className = "infobar-head-label";
            this.head_elem.innerHTML = heading_text;
            this.container.appendChild(this.head_elem);
        }

    }

    update_head(text)
    {
        if (this.head_elem == null)
        {
            console.warn("cannot update head text");
            return;
        }
        this.head_elem.innerHTML = text;
    }

    set_background_color(color)
    {
        this.container.style.backgroundColor = color;
    }

    clear_background_color()
    {
        this.container.style.backgroundColor = null;
    }

    blink(color, time = 500)
    {
        this.set_background_color(color);
        this.timeout_id = setTimeout(c => this.clear_background_color(), time);

    }

    create_button(text)
    {
        var b = document.createElement("button");
        b.className = "infobar-button";
        b.innerHTML = text;
        this.container.appendChild(b)
        return b;
    }

    create_input(placeholder, pw=false)
    {
        var i = document.createElement("input");
        i.className = "infobar-input";
        i.placeholder = placeholder;
        i.type = pw ? "password" : "text"; 

        this.container.appendChild(i);
        return i;
    }

    create_label(text)
    {
        var l = document.createElement("label");
        l.className = "infobar-label";
        l.innerHTML = text;
        this.container.appendChild(l);
        return l;
    }

    create_double_button(text, option, left_width = "80%", right_width = "20%")
    {
        var div = document.createElement("div");
        div.className = "option-button-container";
        var b1 = document.createElement("button");
        var b2 = document.createElement("button");

        b1.style.width = "10%";

        b1.className = "infobar-button";
        b2.className = "infobar-button";

        b1.style.width = left_width;
        b2.style.width = right_width;

        b2.style.marginLeft = "2%";
        b1.style.marginTop = "1%";
        b2.style.marginTop = "1%";
        b1.style.marginBottom = "1%";
        b2.style.marginBottom = "1%";

        b1.innerHTML = "<span>" + text + "</span>"
        b2.appendChild(document.createTextNode(option));

        div.appendChild(b1);
        div.appendChild(b2);

        this.container.appendChild(div);

        return [div, b1,b2];
    }

    hide()
    {
        this.container.style.display = "none";
    }

    show()
    {
        this.container.style.display = "inline-block";
    }
}