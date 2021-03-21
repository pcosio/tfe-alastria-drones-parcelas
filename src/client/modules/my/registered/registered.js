import { LightningElement, api } from 'lwc';

export default class Registered extends LightningElement {

    @api companyname;

    constructor() {
        super();
        
    }

    connectedCallback() {
        //this.template.querySelectorAll('myModal').modal('show');
        alert ("Alert Message: " + this.companyname);
    }

}
