import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track isPropietario;
    @track isEmpresa;

    constructor() {
        super();
        this.isPropietario = false;
        this.isEmpresa = false;
    }

    handleClickEmpresa(event) {
        this.isPropietario = false;
        this.isEmpresa = true;
    }

    handleClickPropietario(event) {
        this.isPropietario = true;
        this.isEmpresa = false;
    }
}
