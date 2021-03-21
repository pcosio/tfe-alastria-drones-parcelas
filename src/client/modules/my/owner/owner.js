import { LightningElement, track } from 'lwc';
import getWeb3 from '../../../index';
import TFEParcela from "../../../../../build/contracts/TFEParcela.json";
import TFEDron from "../../../../../build/contracts/TFEDron.json";
import TFEPayments from "../../../../../build/contracts/TFEPayments.json";
import { resolveConfig } from 'prettier';

const URL = 'api/v1/ifps/metadata';
const URLinitialTransfer = 'api/v1/transfer';
const URLPARCELA = '/api/v1/ipfs/parcela';
const URLCHECKCONDITIONS = '/api/v1/ipfs/dron/check';
export default class Owner extends LightningElement {
    @track newOwner;
    @track existentOwner;
    @track showList;
    @track showListDrones;
    @track newParcela;
    @track parcelas = [];
    @track drones = [];

    web3;
    instance;
    newOwnerAddres;
    publicAddress;
    ownerPass;
    password;
    ownerName;
    instanceDron;
    deployedNetworkDron;
    tokenIdParcela;

    async initWeb3(){
        try {
            // Get network provider and web3 instance.
            this.web3 = await getWeb3();
          
            // Get the contract instance.
            const networkId = await this.web3.eth.net.getId();
            const deployedNetwork = TFEParcela.networks[networkId];
            this.instance = new this.web3.eth.Contract(
                TFEParcela.abi,
              deployedNetwork && deployedNetwork.address,
            );
          } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
              `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    }
    constructor() {
        super();
        this.newOwner = false;
        this.existentOwner = false;
        this.showListDrones = false;
        this.initWeb3();
        
    }

    optionOwnerSelected(event){
        this.showList = false;
        this.parcelas = [];
        this.newParcela = false;
        this.showListDrones = false;
        console.log('option: ' + event.currentTarget.value);
        (event.currentTarget.value === 'newOwnerOpt')?this.newOwner=true:this.newOwner=false;
        (event.currentTarget.value === 'notNewOwnerOpt')?this.existentOwner=true:this.existentOwner=false;
    }

    async createOwner(event){
        event.preventDefault();
        let metadataUri;
        let password = this.template.querySelectorAll('input')[1].value; 
        let data = {
            ownerName: this.template.querySelectorAll('input')[0].value,
            parcelaHmax: parseInt(this.template.querySelectorAll('input')[2].value),
            parcelaHmin: parseInt(this.template.querySelectorAll('input')[3].value),
            pesticidas: {
                pesticidaA: this.template.querySelectorAll('input')[4].checked,
                pesticidaB: this.template.querySelectorAll('input')[5].checked,
                pesticidaC: this.template.querySelectorAll('input')[6].checked,
                pesticidaD: this.template.querySelectorAll('input')[7].checked,
                pesticidaE: this.template.querySelectorAll('input')[8].checked
            }
        }
        if(! (data.ownerName || data.parcelaHmax || data.parcelaHmin)){
            alert('Please fill out all required fields');
            return ;
        }
        let controlPesticida = false;
        if(data.pesticidas.pesticidaA){
            controlPesticida = true;
        }
        if(data.pesticidas.pesticidaB){
            if(controlPesticida){
                alert('Sólo se admite un pesticida');
                return ;
            }else{
                controlPesticida = true
            }
        }
        if(data.pesticidas.pesticidaC){
            if(controlPesticida){
                alert('Sólo se admite un pesticida');
                return ;
            }else{
                controlPesticida = true
            }
        }
        if(data.pesticidas.pesticidaD){
            if(controlPesticida){
                alert('Sólo se admite un pesticida');
                return ;
            }else{
                controlPesticida = true
            }
        }
        if(data.pesticidas.pesticidaE){
            if(controlPesticida){
                alert('Sólo se admite un pesticida');
                return ;
            }else{
                controlPesticida = true
            }
        }
        if(!(data.pesticidas.pesticidaA || data.pesticidas.pesticidaB || data.pesticidas.pesticidaC || data.pesticidas.pesticidaD || data.pesticidas.pesticidaE)){
            alert('Seleccione al menos un pesticida');
            return ;
        }
        //create new account for the company
        await this.web3.eth.personal.newAccount(password)
        .then(address => {
            alert(`Cuenta propietario creada: ${address}`);
            this.newOwnerAddres = address;   
        }).catch(error => {
            throw new Error(`Error creating owner account: ${error}`)
        })
        //save JSON to IPFS torugh backend (nodejs express)
        await fetch(URL, {
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'},
            mode: 'cors',
            body: JSON.stringify(data)
        }).then(r => {
            return r.json();
        }).then(dataParsed => {
            console.log('metadata uri ' + dataParsed);
            console.log('metadata uri ' + JSON.stringify(dataParsed));
            metadataUri = dataParsed.uri;            
        }).catch(error => {
            console.error('Error', error);
            throw new Error(`Error saving metadata JSON to IPFS: ${error}`);
        })
        console.log('metadata uri ' + metadataUri);
        //unlock account
        await this.web3.eth.personal.unlockAccount(this.newOwnerAddres, password, 100)
        .then(result => console.log('Account unlocked'))
        .catch(error => {
            alert(`Error unlocking account: ${error}`);
            throw new Error(`Error unlocking account: ${error}`)
        })
        //create new Parcela
        var errorControl = false;
        let gas;
        await this.instance.methods.newItem(this.newOwnerAddres, metadataUri).estimateGas({ from:this.newOwnerAddres })
        .then(result => gas = result)
        .catch(error => {
            console.error(`Error estimating gas for creating Dron registry on Alastria: ${error}`);
            alert(`Error estimating gas for creating Dron registry on Alastria: ${error}`);
            this.newOwner = false;
            this.existentOwner = false;
            errorControl = true;
        })
        await this.instance.methods.newItem(this.newOwnerAddres, metadataUri).send({ from:this.newOwnerAddres, gas: parseInt(gas)
        })
       .then(result => {
           alert(`Parcela registrada. Trx receipt: ${result.transactionHash}`);
           this.newOwner = false;
           this.existentOwner = false;
           /*const navigateEvent = new CustomEvent('regcompanyok', {
               detail: JSON.stringify(data)
           });
           this.dispatchEvent(navigateEvent);*/
       })
       .catch(error => {
           console.error(`Error creando Parcela en Alastria: ${error}`);
           alert(`Error creando Parcela en Alastria: ${error}`);
           //throw new Error(`Error creating Dron registry on Alastria: ${error}`)
           this.newOwner = false;
           this.existentOwner = false;
           errorControl = true;
       })
        if(errorControl){
            return;
        }
         //give 100 tokens to the new company
         await fetch(URLinitialTransfer, {
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'},
            mode: 'cors',
            body: JSON.stringify({ownerAddress: this.newOwnerAddres})    
        }).catch(error => {
            console.error('Error', error);
            throw new Error(`Error in transfer token function: ${error}`);
        })
    }

    async getParcelas(event){
        try{
            if((! this.template.querySelectorAll('input')[0].value) || (! this.template.querySelectorAll('input')[1].value) ){
                if((! this.publicAddress) || (! this.password)){
                    alert('Please fill out all required fields');
                    return ;
                }else{
                    this.publicAddress = this.template.querySelectorAll('input')[0].value;
                    this.password = this.template.querySelectorAll('input')[1].value;
                }
            }else{
                this.publicAddress = this.template.querySelectorAll('input')[0].value;
                this.password = this.template.querySelectorAll('input')[1].value;
            }
        }catch(error){
            //alert('Public address: ' + this.publicAddress);
            // do nothing continue
        }
        
        //this.companyPass = this.template.querySelectorAll('input')[1].value;
        
        // First - unlock Account
        /*await this.web3.eth.personal.unlockAccount(publicAddress, companyPass, 100)
        .then(result => console.log('Account unlocked'))
        .catch(error => {
            alert(`Error unlocking account: ${error}`);
            throw new Error(`Error unlocking account: ${error}`)
        })*/
        
        //
        this.existentOwner = false;
        this.showList = true;
        //this.drones = [];
        // First get total number of Drones
        let totalSupply = 0;
        try{
            totalSupply = await this.instance.methods.totalSupply().call({ from: this.publicAddress }).catch(error => {
                console.error(`Error getting Dron totalSupply on Alastria: ${error}`);
                alert(`Error getting Parcela totalSupply on Alastria: ${error}`);
                return ;
             })
        }catch(error){
            alert(`Error getting Parcela totalSupply on Alastria: ${error}`);
            this.newOwner = false;
            this.existentOwner = false;
            this.showList = false;
            return ;
        }
        let tokenId;
        let tokenUri;
        if(parseInt(totalSupply) == 0){
            this.parcelas = [];
        }else{
            for (let i = 0; i < parseInt(totalSupply); i++) {
                let noTokenId = false;
                tokenId = await this.instance.methods.tokenOfOwnerByIndex(this.publicAddress, i).call({ from: this.publicAddress })
                .catch(error => {
                    noTokenId = true;
                })
                if(noTokenId){
                    continue;
                }
                tokenUri = await this.instance.methods.tokenURI(tokenId).call()
                .catch(error => {
                    console.error(`Error getting Dron tokenURI on Alastria: ${error}`);
                    alert(`Error getting Dron tokenURI on Alastria: ${error}`);
                    throw new Error(`Error getting Dron tokenURI on Alastria: ${error}`)
                })
                this.parcelas.push({id:tokenId,uri:tokenUri});
            } 
        }
        if(tokenUri){
            //get ownerName
            await fetch(tokenUri, {redirect: 'follow'})
            .then(r => {
                return r.json();
            }).then(data => {
                console.log('data ' + JSON.stringify(data));
                this.ownerName = data.ownerName;            
            }).catch(error => {
                console.error('Error', error);
                throw new Error(`Error fetching metadata JSON to IPFS: ${error}`);
            })
        }else{
            alert('Propietario sin parcelas');
            this.newOwner = false;
            this.existentOwner = false;
            this.showList = false;
            this.parcelas = [];
            this.newParcela = false;
        }
        
    }

    handleParcelaClick(event) {
        const index = event.currentTarget.dataset.index;
        window.open(this.parcelas[index].uri,"Parcela Metadata");
    }

    async handleListDrones(event) {
        this.drones = [];
        var parcelaHmax;
        var parcelaHmin;
        var pesticida;
        const index = event.currentTarget.dataset.index;
        //get parcela token ID
        console.log('Token ID: ' + this.parcelas[index].id);
        this.tokenIdParcela = this.parcelas[index].id;
        //get metadata parcela, get hmax, hmin and pesticida supported
        await fetch(URLPARCELA, {
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'},
            mode: 'cors',
            body: JSON.stringify({hash: this.parcelas[index].uri.split('/').pop()})
        }).then(r => {
            return r.json();
        }).then(data => {
            console.log('data ' + JSON.stringify(data));
            parcelaHmax = data.parcelaHmax;
            parcelaHmin = data.parcelaHmin;
            Object.entries(data.pesticidas).forEach(([key ,value]) => {
                if(value){
                    pesticida = key;
                }
            });
        }).catch(error => {
            console.error('Error', error);
            throw new Error(`Error fetching metadata to IPFS: ${error}`);
        })

        //listar drones y filtrar
        try {
            // Get network provider and web3 instance.
            this.web3 = await getWeb3();
          
            // Get the contract instance.
            const networkId = await this.web3.eth.net.getId();
            this.deployedNetworkDron = TFEDron.networks[networkId];
            this.instanceDron = new this.web3.eth.Contract(
                TFEDron.abi,
                this.deployedNetworkDron && this.deployedNetworkDron.address,
            );
        } catch (error) { 
            // Catch any errors for any of the above operations.
            alert(`Failed to load web3, accounts, or contract.\nCheck console for details`);
            console.error(error);
        }
        let totalSupply = 0;
        try{
            totalSupply = await this.instanceDron.methods.totalSupply().call({ from: this.publicAddress }).catch(error => {
                console.error(`Error getting Dron totalSupply on Alastria: ${error}`);
                alert(`Error getting Dron totalSupply on Alastria: ${error}`);
                return ;
             })
        }catch(error){
            alert(`Error getting Dron totalSupply on Alastria: ${error}`);
            this.newOwner = false;
            this.existentOwner = false;
            this.showList = false;
            return ;
        }
        this.showList = false;
        var tokenId;
        var tokenUri;
        if(parseInt(totalSupply) == 0){
            this.drones = [];
            alert('No hay drones disponibles');
            this.showListDrones = false;
        }else{
            for (let i = 0; i < parseInt(totalSupply); i++) {
                tokenId = await this.instanceDron.methods.tokenByIndex(i).call({ from: this.publicAddress })
                .catch(error => {
                    console.error(`Error getting Dron tokenId on Alastria: ${error}`);
                    alert(`Error getting Dron tokenId on Alastria: ${error}`);
                    return ;
                })
                tokenUri = await this.instanceDron.methods.tokenURI(tokenId).call()
                .catch(error => {
                    console.error(`Error getting Dron tokenURI on Alastria: ${error}`);
                    alert(`Error getting Dron tokenURI on Alastria: ${error}`);
                    return ;
                })
                let check = false;
                await fetch(URLCHECKCONDITIONS, {
                    method: 'POST',
                    headers:{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'},
                    mode: 'cors',
                    body: JSON.stringify({hash: tokenUri.split('/').pop(), parcelaHmax:parcelaHmax, parcelaHmin:parcelaHmin, pesticida:pesticida})
                }).then(r => {
                    if(r.status === 200){
                        check = true;
                        return r.json();  
                    }else{
                        check = false;
                    }
                }).then(jsonMetadata => {
                    if(check){
                        console.log('jsonMetadata ' + JSON.stringify(jsonMetadata));
                        this.drones.push({id:tokenId,uri:tokenUri,coste:jsonMetadata.coste});
                        this.showListDrones = true;
                    }
                }).catch(error => {
                    console.error('Error', error);
                    return ;
                })
            }
            if(this.drones.length == 0){
                alert('No hay drones disponibles');
                this.showListDrones = false;
            }
        }
    }

    async handleContratarDronClick(event) {

        //request to a dron job
        const index = event.currentTarget.dataset.index;
        console.log('Token ID: ' + this.drones[index].id);
        let instancePayments;

        //send trx to approve TFEDron Contract to make a transfer from the owner of Parcela to the owner of the Dron
        //method approve(spender, value)         
        try {
            // Get network provider and web3 instance.
            this.web3 = await getWeb3();
          
            // Get the contract instance.
            const networkId = await this.web3.eth.net.getId();
            const deployedNetworkPayments = TFEPayments.networks[networkId];
            instancePayments = new this.web3.eth.Contract(
                TFEPayments.abi,
                deployedNetworkPayments && deployedNetworkPayments.address,
            );
        } catch (error) { 
            // Catch any errors for any of the above operations.
            alert(`Failed to load web3, accounts, or contract.\nCheck console for details`);
            console.error(error);
        }
        //unlock account
        await this.web3.eth.personal.unlockAccount(this.publicAddress, this.password, 200).then(result => {

        }).catch(error => {
            alert(`Error unlocking account: ${error}`);
            //throw new Error(`Error unlocking account: ${error}`)
            this.showList = true;
            this.newParcela = false;
            return '';
        })

        // I cannnot do this because I can't make transfer in Alastria inside a contract make a call to another contract
        /*let estimatedGas;
        await instancePayments.methods.approve(this.deployedNetworkDron.address, this.drones[index].coste).estimateGas({ from:this.publicAddress })
            .then(result => estimatedGas = result)
            .catch(error => {
                alert(`Error approving Transfer TokenPayments on Alastria: ${error}`);
                return '';
            })
        await instancePayments.methods.approve(this.deployedNetworkDron.address, this.drones[index].coste).send({ from: this.publicAddress, gas: parseInt(estimatedGas)})
            .then(result => {
                alert('El propietario ha aprobado que el contrato del Dron pueda realizar un transfer por el valor del coste del Dron, una vez a la empresa haya asignado el trabajo al Dron')
            })
            .catch(error => {
                alert(`Error approving Transfer TokenPayments on Alastria: ${error}`);
                return '';
            })*/

        //verify that contractParcela.ownerOf(_tokenIdParcela) == this.publicAddress
        await this.instance.methods.ownerOf(this.tokenIdParcela).call({ from: this.publicAddress })
        .then(result => {
            if(result === this.publicAddress){
                alert('Validacion propietario de parcela es que el que envia la transacción -> OK');
            }else{
                alert('Validacion propietario de parcela es que el que envia la transacción -> KO');
                this.showList = false;
                this.newParcela = false;
                return;
            }
        })
        .catch(error => {
            console.error(`Error getting Dron tokenId on Alastria: ${error}`);
            alert(`Error getting Dron tokenId on Alastria: ${error}`);
            return ;
        })

        let estimatedGas;
        //get dron company
        let company = await this.instanceDron.methods.ownerOf(this.drones[index].id).call({ from: this.publicAddress })
        .catch(error => {
            console.error(`Error getting Dron owner on Alastria: ${error}`);
            alert(`Error getting Dron tokenId on Alastria: ${error}`);
            return ;
        })

        //make payment from owner to company , amount cost Dron
        await instancePayments.methods.transfer(company, this.drones[index].coste).estimateGas({ from:this.publicAddress })
            .then(result => estimatedGas = result)
            .catch(error => {
                alert(`Error estimando gas transferencia on Alastria: ${error}`);
                this.showList = true;
                this.newParcela = false;
                return '';
            })
        await instancePayments.methods.transfer(company, this.drones[index].coste).send({ from: this.publicAddress, gas: parseInt(estimatedGas)})
            .then(result => {
                alert('Se ha realizado el pago correctamente de ' + this.drones[index].coste + ' tokens a la empresa del Dron')
            })
            .catch(error => {
                alert(`Error realizando el pago: ${error}`);
                this.showList = true;
                this.newParcela = false;
                return '';
            })
        //call dron contract -> create PendingJob -> addJob function
        //await this.instanceDron.methods.addJob(this.publicAddress, this.tokenIdParcela, this.drones[index].id, this.drones[index].coste, this.drones[index].uri).estimateGas({ from:this.publicAddress })
		await this.instanceDron.methods.addJob(this.publicAddress, this.tokenIdParcela, this.drones[index].id, this.drones[index].coste).estimateGas({ from:this.publicAddress })
        .then(result => estimatedGas = result)
        .catch(error => {
            alert(`Error creando el Job para Dron pendiente de Aprobacion on Alastria: ${error}`);
            return '';
        })
        //await this.instanceDron.methods.addJob(this.publicAddress, this.tokenIdParcela, this.drones[index].id, this.drones[index].coste, this.drones[index].uri).send({ from:this.publicAddress, gas: parseInt(estimatedGas) })
		await this.instanceDron.methods.addJob(this.publicAddress, this.tokenIdParcela, this.drones[index].id, this.drones[index].coste).send({ from:this.publicAddress, gas: parseInt(estimatedGas) })
        .then(result => {
            alert('Job pendiente de aprobación creado ' + result.events.JobPendingApproval.returnValues.jobId);
            //alert('Job pendiente de aprobación creado');
            console.log('Job pendiente de aprobacion creado: ' + JSON.stringify(result));
        })
        .catch(error => {
            alert(`Error creando el Job para Dron pendiente de Aprobacion on Alastria: ${error}`);
            return '';
        })

        

    }

    async handleNewParcela(event) {
        if(! this.password){
            alert('password is required!!');
            return '';
        }
        //this.password = this.template.querySelectorAll('input')[0].value;
        //unlock account
        await this.web3.eth.personal.unlockAccount(this.publicAddress, this.password, 200)
        .then(result => {
            this.password = '';
            this.showList = false;
            this.newParcela = true;
        })
        .catch(error => {
            alert(`Error unlocking account: ${error}`);
            //throw new Error(`Error unlocking account: ${error}`)
            this.showList = true;
            this.newParcela = false;
            return '';
        })
        
    }

    async createParcela(event) {
        event.preventDefault();
        let metadataUri;
        let data = {
            ownerName: this.ownerName,
            parcelaHmax: parseInt(this.template.querySelectorAll('input')[0].value),
            parcelaHmin: parseInt(this.template.querySelectorAll('input')[1].value),
            pesticidas: {
                pesticidaA: this.template.querySelectorAll('input')[2].checked,
                pesticidaB: this.template.querySelectorAll('input')[3].checked,
                pesticidaC: this.template.querySelectorAll('input')[4].checked,
                pesticidaD: this.template.querySelectorAll('input')[5].checked,
                pesticidaE: this.template.querySelectorAll('input')[6].checked
            }
        }
        if(! (data.parcelaHmax || data.parcelaHmin)){
            alert('Please fill out all required fields');
            return ;
        }
          
        //save JSON to IPFS torugh backend (nodejs express)
        await fetch(URL, {
            method: 'POST',
            headers:{'Content-Type':'application/json', 'Access-Control-Allow-Origin': '*'},
            mode: 'cors',
            body: JSON.stringify(data)
        }).then(r => {
            return r.json();
        }).then(data => {
            console.log('data ' + JSON.stringify(data));
            metadataUri = data.uri;            
        }).catch(error => {
            console.error('Error', error);
            throw new Error(`Error saving metadata JSON to IPFS: ${error}`);
        })
        //create new Parcela
        await this.instance.methods.newItem(this.publicAddress, metadataUri).estimateGas({ from:this.publicAddress })
        .then(result => {
            this.instance.methods.newItem(this.publicAddress, metadataUri).send({ from:this.publicAddress, gas: parseInt(result)
             })
            .then(result => {
                alert(`Parcela registrada. Trx receipt: ${result.transactionHash}`);
                this.newParcela = false;
                this.showList = true;
                this.parcelas = [];
                this.getParcelas();
                /*const navigateEvent = new CustomEvent('regcompanyok', {
                    detail: JSON.stringify(data)
                });
                this.dispatchEvent(navigateEvent);*/
            })
            .catch(error => {
                console.error(`Error creating Parcela registry on Alastria: ${error}`);
                alert(`Error creating Parcela registry on Alastria: ${error}`);
                throw new Error(`Error creating Parcela registry on Alastria: ${error}`)
            })
        })
        .catch(error => {
            console.error(`Error estimating gas for creating Parcela registry on Alastria: ${error}`);
            alert(`Error estimating gas for creating Parcela registry on Alastria: ${error}`);
            throw new Error(`Error estimating gas for creating Parcela registry on Alastria: ${error}`)
        })
        this.newParcela = false;
        this.showList = false;
    }
}
