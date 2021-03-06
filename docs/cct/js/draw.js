/*************************************************************************
 * This file is part of input-overlay
 * github.con/univrsal/input-overlay
 * Copyright 2021 univrsal <uni@vrsal.de>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 2 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *************************************************************************/

var backgroundColor = "#333333";
var lineColor = "#ffffffff";
var darkLineColor = "#555555";

class painter {

    constructor(canvas_id, draw_callback)
    {
        this.scale = 1; // HiDPI support at some point maybe
        this.canvas_id = canvas_id;
        this.coordinate_system = new cs(canvas_id);
        this.draw_callback = draw_callback;
        $(window).on('resize', () => this.resize_canvas());

        requestAnimationFrame(seconds => this.update(seconds)); // start animation
    }

    cs() { return this.coordinate_system; }

    load_image(url)
    {
        return new Promise(r => {
            let i = new Image();
            i.onload = (() => r(i));
            i.src = url;
        });
    }

    get_context() { return $(this.canvas_id)[0].getContext('2d'); }

    fill(w, h, color) { this.rect(0, 0, w, h, color); }

    rect(x, y, w, h, color)
    {
        let context = this.get_context();
        context.beginPath();
        context.rect(x, y, w, h);
        context.fillStyle = color;
        context.fill();
    }

    rect_outline(x, y, w, h, width = 1, color = lineColor)
    {
        let context = this.get_context();
        context.beginPath();
        context.rect(x, y, w, h);
        context.strokeStyle = color;
        context.lineWidth = width;
        context.stroke();
    }

    text(str, x, y, rotate = 0, align = "right", color = lineColor, size = 13, font = "Arial")
    {
        let ctx = this.get_context();
        ctx.save();
        ctx.translate(x, y);
        if (rotate > 0)
            ctx.rotate(rotate * Math.PI / 180);
        ctx.textAlign = align;
        ctx.font = size + "px " + font;
        ctx.fillStyle = color;
        ctx.fillText(str, 0, 0);
        ctx.restore();
    }

    line(x1, y1, x2, y2, width = 2, color = lineColor)
    {
        let ctx = this.get_context();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    image(i, x, y)
    {
        let context = this.get_context();
        context.drawImage(i, x, y);
    }

    image_crop(i, x, y, w, h, cx, cy, cw, ch)
    {
        let context = this.get_context();
        context.drawImage(i, cx, cy, cw, ch, x * this.scale, y * this.scale, w * this.scale, h * this.scale);
    }

    resize_canvas()
    {
        $(this.canvas_id).css({"height": window.innerHeight, "width": window.innerWidth});
        $(this.canvas_id).attr("width", window.innerWidth);
        $(this.canvas_id).attr("height", window.innerHeight);
        this.fill(window.innerWidth, window.innerHeight, backgroundColor);
        this.coordinate_system.resize(this);
        this.get_context().imageSmoothingEnabled = false;
    }

    update(time)
    {
        let c = $(this.canvas_id)[0];
        this.fill(c.width, c.height, backgroundColor);
        this.coordinate_system.draw(this);
        if (this.draw_callback !== null)
            this.draw_callback(this, this.coordinate_system);
        requestAnimationFrame(seconds => this.update(seconds)); // get next frame
    }
};
