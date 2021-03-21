import { LightningElement, api, track } from 'lwc';

const URL = '/api/v1/company';
export default class Company extends LightningElement {

    @track showregistrationOk;
    @api showregistration;
    @track companyName;

    constructor() {
        super();
        this.showregistrationOk = false;
    }

    companyRegOk(event){
        this.companyName = JSON.parse(event.detail).companyName;
        this.showregistrationOk = true;
        this.showregistration = false;
    }
}
