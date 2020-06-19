import {Canvas} from './drawer.js';

/**
 * define my API to create a Menu
 */
export class MenuApi {
    private table;


    constructor() {
        this.table = document.createElement('table');                   // table that displays the menu
        this.table.setAttribute("id", "contexttable");
        this.table.setAttribute("class", "system");
    }

    /**
     * class to create the color Radio Option
     *
     * @param content
     * @param colorSet
     * @param defaultOption
     */
    static createRadioOption(content:string, colorSet:object, defaultOption?:string){

        //new Canvas().fillColorSelectedShapes(colorSet);
        let radioItem: MenuItem[] = [];
        radioItem.push(new MenuItem(content,null,"titel"));
        for(let key in colorSet){

            radioItem.push(new MenuItem(key,colorSet[key],"radio",content,defaultOption));
            //radioItem.push(new MenuItem('', null, "separator"));
        }
        return radioItem;
    }

    /**
     * Create the new Item to the Menu
     * @param content:  Item label
     * @param listener: the action that is resolved by the item
     * @returns {MenuItem}
     */
    static createItem(content:string, listener){
        return new MenuItem(content, listener, "normalItem");
    }

    /**
     * to trend the MenuItem
     * @returns {MenuItem}
     */
    static createSeparator(){
        return new MenuItem('', null, "separator");
    }

    /**
     * positions the menu in a position in the document
     *
     * @param cursorx
     * @param cursory
     */
    show(cursorx,cursory) {
        this.table.style.display = "block";
        let cl =  this.table.getBoundingClientRect();

        document.body.append(this.table);

        if (cursory + cl.height < innerHeight) {
            this.table.style.top = cursory+"px";
        } else {
            this.table.style.top = (cursory-cl.height)+"px";
        }
        if (cursorx + cl.width < innerWidth) {
            this.table.style.left = cursorx+"px";
        } else {
            this.table.style.left = (cursorx-cl.width)+"px";
        }
    }

    /**
     * set Menue to hide
     */
    hide() {
        this.table.style.display = "none";
    }

    addItems(...items) {
        for(let j=0; j< items.length; j++){
            if(items[j].length === undefined){
                items[j].render(this.table);
            }
            else{
                for (let i=0; i< items[j].length; i++) {
                    items[j][i].render(this.table);
                }
            }

        }

    }

    addItem(item){
        item.render(this.table);
    }

    addItemAt ( item , index){
        item.render(this.table,index);
    }

    removeItem ( item ) {
        this.table.removeChild(item.item);
    }

};

/**
 * this class describes the MenuItem object, which
 * is inserted into the mune in the render function
 */
export class MenuItem {
    private tagInner;
    private item;
    private content;
    private listener;
    private itemTyp;
    private defaultRadio;
    private radioName;


    constructor(content, listener, itemTyp, radioName?, defaultRadio?) {
        this.tagInner = null;
        this.item = null;
        this.content = content;
        this.listener = listener;
        this.itemTyp = itemTyp;
        this.defaultRadio = defaultRadio;
        this.radioName = radioName
    }

    render(menuTree, index) {
        this.item = document.createElement('tr');
        if(this.itemTyp === "separator" ){
            this.tagInner = document.createElement('hr');
            this.tagInner.addEventListener("click", this.listener);
            this.tagInner.appendChild(document.createTextNode(this.content));
            this.item.appendChild(this.tagInner);
        }
        else if(this.itemTyp === "normalItem") {
            this.tagInner = document.createElement('td');
            this.tagInner.addEventListener("click", this.listener);
            this.tagInner.appendChild(document.createTextNode(this.content));
            this.item.appendChild(this.tagInner);
        }
        else if(this.itemTyp === "titel") {
            this.tagInner = document.createElement('th');
            this.tagInner.appendChild(document.createTextNode(this.content));
            this.item.appendChild(this.tagInner);
        }
        else if(this.itemTyp === "radio") {
            let tagLabel = document.createElement("label");
            tagLabel.setAttribute("for",this.content);
            tagLabel.appendChild(document.createTextNode(this.content));
            this.tagInner = document.createElement('input');
            this.tagInner.setAttribute("type", "radio");
            this.tagInner.setAttribute("name", this.radioName);
            this.tagInner.setAttribute("class", this.listener);

            if(this.defaultRadio !== undefined && this.content === this.defaultRadio){
                this.tagInner.setAttribute("checked", "true");
            }

            this.item.appendChild(this.tagInner);
            this.item.appendChild(tagLabel);
        }

        this.tagInner.setAttribute("id", this.content);


        if (index === undefined) {
            menuTree.appendChild(this.item);

        } else (
            menuTree.insertBefore(this.item, menuTree.childNodes[index])
        )
    }
}
