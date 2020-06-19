let menu = null;
let canvas = document.getElementById('canvas');
canvas.addEventListener('click', addItem, false);
canvas.addEventListener('mousemove', showCoords, false);

function getCumulativeOffset(element) {
  let {x, y} = element.getBoundingClientRect();
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

function Menu(menuID) {
  this.m = document.createElement('ul');
  this.m.setAttribute('id', menuID);
  this.m.setAttribute('class', 'menu');
  // this.m.style.display = 'none';
  this.addItems = function (...itemizes) {
    for (let i = 0; i < itemizes.length; i++) {
      itemizes[i].render(this.m);
    }
  };

  this.show = function (x, y) {
    this.m.style.top = y + 'px';
    this.m.style.left = x + 'px';
    this.m.style.display = 'block';
    console.log("Menu Position: ", this.m.style.left, this.m.style.top);
  };

  this.hide = function () {
    this.m.style.display = 'none';
  };

  this.addItemAt = function (newItem, pos) {
    newItem.render(this.m, pos);
  };

  this.removeItem = function (item) {
    console.log('Zu löschende Menüeintrage remove ', item);
    this.m.removeChild(item.entry);
  };

  // Das brauchen wir nicht mehrs
  // this.addItem = function (separator) {
  //   separator.render(this.m)
  // };
}

function MenuEntry(entryType, entryName, entryFucntion) {
  this.entry = null;
  this.entryType = entryType;
  this.entryName = entryName;
  this.function = entryFucntion;

  this.render = function (eltern, pos) {
    this.entry = document.createElement(this.entryType);
    // check if separator
    if (this.entryName !== '') {
      this.entry.setAttribute('id', this.entryName);
      this.entry.appendChild(document.createTextNode(this.entryName));
    }
    if (pos === undefined) {
      eltern.appendChild(this.entry);
    } else {
      eltern.insertBefore(this.entry, eltern.childNodes[pos]);
      console.log('Menueintag ', this.entry, ' in der Position: ', pos,
          ' hinzugefügt');
    }
  };

  this.listener = function () {
    this.entry.addEventListener('click', this.function);
  };
}

function Factory() {
  this.createMenu = function (menuID) {
    return new Menu(menuID);
  };

  this.createItem = function (itemname, entryType, handler) {
    let entry_type = typeof entryType !== 'string' ? 'li' : entryType; // LI as defaults
    return new MenuEntry(entry_type, itemname, handler,);
  };

  this.createSeparator = function (handler) {
    return new MenuEntry('hr', '', handler);
  }
}

function setupContextMenu(factory, main_menu_name) {
  // Menu instansieren
  let menu = factory.createMenu(main_menu_name);
  // Menueinträge hinzufügen

  const separators = [factory.createSeparator(), factory.createSeparator(),
    factory.createSeparator()];
  const colors = ['black', 'green', 'red', 'yellow', 'white', 'brown'];
  let menus = [];
  for (let i = 0; i < colors.length; i++) {
    menus.push(factory.createItem(colors[i], 'li', setCanvasColour));
  }
  // Menu Konfiguration
  menus.forEach(e => {
    menu.addItems(e);
    e.listener();
  });
  for (let i = 0; i < separators.length; i++) {
    menu.addItemAt(separators[i], 2 * i + 2 + i);
  }
  // menu.removeItem(menus[0]);
  console.log("Menu: ", menu);
  return menu;
}

function setCanvasColour(ev) {
  // menu.hide();
  canvas.style.backgroundColor = ev.target.id;
}

function showmenu(ev) {
  //Stoppt der richtige Rechtklick Menu
  ev.preventDefault();

  // Menu nur in Canvas
  // let a = getMouseCoord(ev);
  // let x = a.x;
  // let y = a.y;
  // menu.show(x, y);

  //menu nicht nur im Canvas anzeigen
  // let a = document.body.getBoundingClientRect();
  // let x = ev.clientX - a.left;
  // let y = ev.clientY - a.top;
  // menu.show(x, y);

  // menu in ganze Datein
  menu.show(ev.clientX, ev.clientY);
}

menu = setupContextMenu(new Factory(), 'menu');
document.body.appendChild(menu.m);

// //   canvas.addEventListener('contextmenu',  showmenu, false);
document.addEventListener('contextmenu', showmenu, false);
//   canvas.addEventListener('mouseleave', hidemenu, false);
menu.m.addEventListener('mouseleave', hidemenu, false);

function hidemenu() {
  menu.hide();
}

console.log("Canvas offset: ", canvas.getBoundingClientRect(),
    getCumulativeOffset(canvas));

