let canvas = document.getElementById('drawArea');
canvas.addEventListener('click', addItem, false);
canvas.addEventListener('mousemove', showCoords, false);
function getCumulativeOffset(element) {
    let { x, y } = element.getBoundingClientRect();
    let top = 0, left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);
    return {
        top: top,
        left: left
    };
}
function getMouseCoords(event) {
    let a = getCumulativeOffset(canvas);
    let x = event.clientX - a.left;
    let y = event.clientY - a.top;
    return "(x, y) =(" + x + ", " + y + ")  ";
}
function showCoords(event) {
    document.getElementById("demo").innerHTML = "Mouse Position:"
        + getMouseCoords(event);
}
function addItem(event) {
    let ol = document.getElementById("pointList");
    let point = getMouseCoords(event);
    let li = document.createElement("li");
    li.setAttribute('id', point);
    li.appendChild(document.createTextNode(point));
    ol.appendChild(li);
}
export class Menu {
    constructor(menuID) {
        this.m = document.createElement('ul');
        this.m.setAttribute('id', menuID);
        this.m.setAttribute('class', 'menu');
    }
    addItems(...itemizes) {
        for (let i = 0; i < itemizes.length; i++) {
            itemizes[i].render(this.m);
        }
    }
    ;
    show(x, y) {
        this.m.style.top = y + 'px';
        this.m.style.left = x + 'px';
        this.m.style.display = 'block';
        // console.log("Menu Position: ", this.m.style.left, this.m.style.top);
    }
    ;
    hide() {
        this.m.style.display = 'none';
    }
    ;
    addItemAt(newItem, pos) {
        newItem.render(this.m, pos);
    }
    ;
    removeItem(item) {
        // console.log('Zu löschende Menüeintrage remove ', item);
        this.m.removeChild(item.entry);
    }
    ;
}
export class MenuEntry {
    constructor(entryType, entryName, entryFunction, select) {
        this.entry = null;
        this.select = select;
        this.entryType = entryType;
        this.entryName = entryName;
        this.function = entryFunction;
    }
    render(eltern, pos) {
        this.entry = document.createElement(this.entryType);
        // check if separator
        let label = null;
        if (this.entryType === 'input') {
            let [name, color] = this.entryName.split(" ");
            this.entry.setAttribute('type', 'radio');
            this.entry.setAttribute('id', color);
            this.entry.setAttribute('name', name);
            if (color.toLocaleLowerCase() === 'transparent')
                this.entry.setAttribute('value', undefined);
            else
                this.entry.setAttribute('value', color.toLocaleLowerCase());
            if (this.select) {
                // console.log("checked: ", this.entry);
                this.entry.setAttribute("checked", "true");
            }
            label = document.createElement("label");
            label.setAttribute("for", color);
            label.appendChild(document.createTextNode(color));
            // console.log('checker: ', this.entry, name, color, this.entryName);
        }
        else if (this.entryName !== '') {
            this.entry.setAttribute('id', this.entryName);
            this.entry.appendChild(document.createTextNode(this.entryName));
        }
        if (pos === undefined) {
            eltern.appendChild(this.entry);
            if (label !== null) {
                eltern.appendChild(label);
                eltern.appendChild(document.createElement('br'));
            }
        }
        else {
            eltern.insertBefore(this.entry, eltern.childNodes[pos]);
            if (label !== null) {
                eltern.insertBefore(label, eltern.childNodes[pos + 1]);
                eltern.insertBefore(document.createElement('br'), eltern.childNodes[pos + 2]);
            }
        }
    }
    listener(eventTypes = "click") {
        // console.log("La function:  ", this.function);
        this.entry.addEventListener(eventTypes, this.function);
    }
}
export class menuApi {
    createMenu(menuID) {
        return new Menu(menuID);
    }
    ;
    createItem(itemname, entryType, handler, select, ok) {
        let entry_type;
        if (typeof entryType !== 'string') {
            entry_type = 'li';
        }
        else {
            entry_type = entryType;
        } // LI as defaults
        // if (ok)
        //     console.log('le entry: ', typeof entryType, ' gkfdnfknfkd');
        return new MenuEntry(entry_type, itemname, handler, select);
    }
    ;
    createSeparator(handler) {
        return new MenuEntry('hr', '', handler);
    }
    createRadioOption(type, colors, color) {
        console.log('type: ', type);
        console.log('colors: ', colors);
        console.log('color: ', color);
        // let entries = this.createMenu(type);
        let entries = [];
        entries.push(this.createItem(type, null, null));
        for (let colorsKey in colors) {
            // console.log('color i: ', colorsKey, typeof colorsKey);
            let test = null;
            // console.log('color checked 1: ', color, colorsKey, colors[colorsKey]);
            if (colorsKey === color) {
                // console.log('color checked: ', color);
                test = this.createItem(type + " " + colors[colorsKey], 'input', null, true);
            }
            else {
                test = this.createItem(type + " " + colors[colorsKey], 'input', null);
            }
            // entries.addItems(test);
            entries.push(test);
        }
        // console.log('Entries: ', entries);
        return entries;
    }
}
export class setupContextMenu {
    constructor(factory, main_menu_name) {
        // Menu instansieren
        let menu = factory.createMenu(main_menu_name);
        // Menueinträge hinzufügen
        let radioOption = factory.createRadioOption("Hintergrundfarbe", { "green": "Green", "red": "Red", "yellow": 'Yellow', "transparent": 'Transparent' }, "red");
        let radioOption1 = factory.createRadioOption("Randfarbe", { "blue": 'Blue', "black": 'Black', "orange": 'Orange' }, "blue");
        const separators = [factory.createSeparator(), factory.createSeparator(), factory.createSeparator()];
        const deleteEntry = factory.createItem('Delete', 'li', null);
        const z_plus = factory.createItem('+Z', 'li', null);
        const z_minus = factory.createItem('-Z', 'li', null);
        // Menu Konfiguration
        menu.addItems(...radioOption);
        menu.addItems(separators[0]);
        menu.addItems(...radioOption1);
        menu.addItems(separators[1]);
        menu.addItems(deleteEntry);
        menu.addItems(separators[2]);
        menu.addItems(z_minus, z_plus);
        radioOption.splice(0, 1);
        radioOption1.splice(0, 1);
        let menusCopy = [...radioOption, deleteEntry, ...radioOption1, z_minus, z_plus];
        // menu.removeItem(menus[0]);
        // console.log("Menu: ", menu);
        this.menu = menu;
        this.entries = menusCopy;
        this.menuEntries = {
            "Hintergrund": radioOption,
            "Delete": deleteEntry,
            "Randfarbe": radioOption1,
            "Z": [z_minus, z_plus]
        };
        console.log('grobe check: ', menusCopy.length, menu.m.childNodes);
    }
}
function setCanvasColour(ev) {
    // menu.hide();
    canvas.style.backgroundColor = ev.target.id;
    console.log('Canvas color: ', canvas.style.backgroundColor);
}
let setup = null;
setup = new setupContextMenu(new menuApi(), 'menu');
document.body.appendChild(setup.menu.m);
// //   canvas.addEventListener('contextmenu',  showmenu, false);
// document.addEventListener('contextmenu', ev => {
//     ev.preventDefault();
//     setup.menu.show(ev.clientX, ev.clientY);
// }, false);
setup.menu.m.addEventListener('mouseleave', (ev => setup.menu.hide()), false);
// console.log("Canvas offset: ", canvas.getBoundingClientRect(), getCumulativeOffset(canvas));
export { setup };
//# sourceMappingURL=script.js.map