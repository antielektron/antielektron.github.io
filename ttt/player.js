class Player
{
    constructor(name, r,g,b)
    {
        this.name = name;
        this.r = r;
        this.g = g;
        this.b = b;
        this.id = name;
    }

    set_name(name)
    {
        this.name = name;
        this.id = name; // TODO: distinguish between name and id
    }

    set_color(r,g,b)
    {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    get_name()
    {
        return this.name;
    }

    get_id()
    {
        return this.id;
    }

    get_color()
    {
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    }

    get_color_with_alpha(alpha)
    {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + alpha + ")";
    }

    get_color_values()
    {
        var col = {
            r: this.r,
            g: this.g,
            b: this.b
        };
        return col;
    }


}