class Infobar
{
    constructor(parent, css_class)
    {
        this.parent = parent;
        this.container = document.createElement("div");
        this.container.className = css_class;
        this.parent.appendChild(this.container);
    }

    create_infocontainer(head_text = null)
    {
        return new Infocontainer(this.container, head_text);
    }
}