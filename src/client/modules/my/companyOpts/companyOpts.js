import { LightningElement, track } from 'lwc';
import getWeb3 from '../../../index';
import TFEDron from "../../../../../build/contracts/TFEDron.json";

const URL = 'api/v1/ifps/metadata';

export default class CompanyOpts extends LightningElement {
    @track newCompany;
    @track existentCompany;
    @track showList;
    @track showListJobs;
    @track newDron;
    @track drones = [];
    @track jobs = [];
    //@track responseService;
    web3;
    instance;
    newCompanyAddres;
    publicAddress;
    companyPass;
    password;
    companyName;

    async initWeb3(){
        try {
            // Get network provider and web3 instance.
            this.web3 = await getWeb3();
          
            // Get the contract instance.
            const networkId = await this.web3.eth.net.getId();
            const deployedNetwork = TFEDron.networks[networkId];
            this.instance = new this.web3.eth.Contract(
                TFEDron.abi,
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
        this.newCompany = false;
        this.existentCompany = false;
        this.initWeb3();
        
    }

    optionSelected(event){
        this.showList = false;
        this.drones = [];
        this.newDron = false;
        console.log('option: ' + event.currentTarget.value);
        (event.currentTarget.value === 'newCompanyOpt')?this.newCompany=true:this.newCompany=false;
        (event.currentTarget.value === 'notNewCompanyOpt')?this.existentCompany=true:this.existentCompany=false;
    }

    async createCompany(event){
        event.preventDefault();
        let metadataUri;
        let password = this.template.querySelectorAll('input')[1].value;
        let data = {
            companyName: this.template.querySelectorAll('input')[0].value,
            dronHmax: parseInt(this.template.querySelectorAll('input')[2].value),
            dronHmin: parseInt(this.template.querySelectorAll('input')[3].value),
            coste: parseInt(this.template.querySelectorAll('input')[4].value),
            pesticidas: {
                pesticidaA: this.template.querySelectorAll('input')[5].checked,
                pesticidaB: this.template.querySelectorAll('input')[6].checked,
                pesticidaC: this.template.querySelectorAll('input')[7].checked,
                pesticidaD: this.template.querySelectorAll('input')[8].checked,
                pesticidaE: this.template.querySelectorAll('input')[9].checked
            }
        }
        if(! (data.companyName || data.dronHmax || data.dronHmin)){
            alert('Please fill out all required fields');
            return ;
        }
        //create new account for the company
        await this.web3.eth.personal.newAccount(password)
        .then(address => {
            alert(`Cuenta creada para empresa: ${address}`);
            this.newCompanyAddres = address;   
        }).catch(error => {
            throw new Error(`Error saving metadata JSON to IPFS: ${error}`)
        })
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
        //unlock account
        await this.web3.eth.personal.unlockAccount(this.newCompanyAddres, password, 100)
        .then(result => console.log('Account unlocked'))
        .catch(error => {
            alert(`Error unlocking account: ${error}`);
            throw new Error(`Error unlocking account: ${error}`)
        })
        //create new Dron
        await this.instance.methods.newItem(this.newCompanyAddres, metadataUri).estimateGas({ from:this.newCompanyAddres })
        .then(result => {
            this.instance.methods.newItem(this.newCompanyAddres, metadataUri).send({ from:this.newCompanyAddres, gas: parseInt(result)
             })
            .then(result => {
                alert(`Dron registrado!!. Trx receipt: ${result.transactionHash}`);
                this.newCompany = false;
                this.existentCompany = false;
                /*const navigateEvent = new CustomEvent('regcompanyok', {
                    detail: JSON.stringify(data)
                });
                this.dispatchEvent(navigateEvent);*/
            })
            .catch(error => {
                console.error(`Error creating Dron registry on Alastria: ${error}`);
                alert(`Error creating Dron registry on Alastria: ${error}`);
                //throw new Error(`Error creating Dron registry on Alastria: ${error}`)
                this.newCompany = false;
                this.existentCompany = false;
            })
        })
        .catch(error => {
            console.error(`Error estimating gas for creating Dron registry on Alastria: ${error}`);
            alert(`Error estimating gas for creating Dron registry on Alastria: ${error}`);
            throw new Error(`Error estimating gas for creating Dron registry on Alastria: ${error}`)
        })
    }

    async getDrones(event){
        try{
            if(! this.template.querySelectorAll('input')[0].value){
                if(! this.publicAddress){
                    alert('Please fill out all required fields');
                    return ;
                }else{
                    this.publicAddress = this.template.querySelectorAll('input')[0].value;
                }
            }else{
                this.publicAddress = this.template.querySelectorAll('input')[0].value;
            }
        }catch(error){
            //alert('Public address: ' + this.publicAddress);
            //console.error(error);
            //do nothing all it's ok
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
        this.existentCompany = false;
        this.showList = true;
        //this.drones = [];
        // First get total number of Drones
        let totalSupply = 0;
        try{
            totalSupply = await this.instance.methods.totalSupply().call({ from: this.publicAddress }).catch(error => {
                console.error(`Error getting Dron totalSupply on Alastria: ${error}`);
                alert(`Error getting Dron totalSupply on Alastria: ${error}`);
                return ;
             })
        }catch(error){
            alert(`Error getting Dron totalSupply on Alastria: ${error}`);
            this.newCompany = false;
            this.existentCompany = false;
            this.showList = false;
            return ;
        }
        let tokenId;
        let tokenUri;
        if(parseInt(totalSupply) == 0){
            this.drones = [];
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
                this.drones.push({id:tokenId,uri:tokenUri});
            } 
        }
        if(tokenUri){
            //get company
            await fetch(tokenUri, {redirect: 'follow'})
            .then(r => {
                return r.json();
            }).then(data => {
                console.log('data ' + JSON.stringify(data));
                this.companyName = data.companyName;            
            }).catch(error => {
                console.error('Error', error);
                throw new Error(`Error saving metadata JSON to IPFS: ${error}`);
            })
        }else{
            alert('Empresa sin drones');
            this.newCompany = false;
            this.existentCompany = false;
            this.showList = false;
            this.drones = [];
            this.newDron = false;
        }

    }

    handleDronClick(event) {
        const index = event.currentTarget.dataset.index;
        window.open(this.drones[index].uri,"Dron Metadata");
    }

    async handleNewDron(event) {
        if(! this.template.querySelectorAll('input')[0].value){
            alert('La contraseña es obligatoria!!');
            this.existentCompany = false;
            this.showList = true;
            return '';
        }
        this.password = this.template.querySelectorAll('input')[0].value;
        //unlock account
        await this.web3.eth.personal.unlockAccount(this.publicAddress, this.password, 200)
        .then(result => {
            this.password = '';
            this.showList = false;
            this.newDron = true;
        })
        .catch(error => {
            alert(`Error unlocking account: ${error}`);
            //throw new Error(`Error unlocking account: ${error}`)
            this.showList = true;
            this.newDron = false;
            return '';
        })
        
    }

    async createDron(event) {
        event.preventDefault();
        let metadataUri;
        let data = {
            companyName: this.companyName,
            dronHmax: parseInt(this.template.querySelectorAll('input')[0].value),
            dronHmin: parseInt(this.template.querySelectorAll('input')[1].value),
            coste: parseInt(this.template.querySelectorAll('input')[2].value),
            pesticidas: {
                pesticidaA: this.template.querySelectorAll('input')[3].checked,
                pesticidaB: this.template.querySelectorAll('input')[4].checked,
                pesticidaC: this.template.querySelectorAll('input')[5].checked,
                pesticidaD: this.template.querySelectorAll('input')[6].checked,
                pesticidaE: this.template.querySelectorAll('input')[7].checked
            }
        }
        if(! (data.dronHmax || data.dronHmin)){
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
        //create new Dron
        await this.instance.methods.newItem(this.publicAddress, metadataUri).estimateGas({ from:this.publicAddress })
        .then(result => {
            this.instance.methods.newItem(this.publicAddress, metadataUri).send({ from:this.publicAddress, gas: parseInt(result)
             })
            .then(result => {
                alert(`Dron registrado!! Trx receipt: ${result.transactionHash}`);
                this.newDron = false;
                this.showList = true;
                this.drones = [];
                this.getDrones();
                /*const navigateEvent = new CustomEvent('regcompanyok', {
                    detail: JSON.stringify(data)
                });
                this.dispatchEvent(navigateEvent);*/
            })
            .catch(error => {
                console.error(`Error creating Dron registry on Alastria: ${error}`);
                alert(`Error creating Dron registry on Alastria: ${error}`);
                throw new Error(`Error creating Dron registry on Alastria: ${error}`)
            })
        })
        .catch(error => {
            console.error(`Error estimating gas for creating Dron registry on Alastria: ${error}`);
            alert(`Error estimating gas for creating Dron registry on Alastria: ${error}`);
            throw new Error(`Error estimating gas for creating Dron registry on Alastria: ${error}`)
        })
        this.newDron = false;
        this.showList = false;
    }

    async handlePendingJobsDron(event) {
        this.jobs = [];
        this.showList = false;
        if(! this.template.querySelectorAll('input')[0].value){
            alert('La contraseña es obligatoria');
            this.existentCompany = false;
            this.showList = true;
            return '';
        }
        this.password = this.template.querySelectorAll('input')[0].value;
        //unlock account
        await this.web3.eth.personal.unlockAccount(this.publicAddress, this.password, 300)
        .then(this.password = '')
        .catch(error => {
            alert(`Error unlocking account: ${error}`);
            //throw new Error(`Error unlocking account: ${error}`)
            return '';
        })
        this.showListJobs = true;
        //contract Dron call method jobIndex
        let totalJobs = 0;
        try{
            totalJobs = await this.instance.methods.jobIndex().call({ from: this.publicAddress }).catch(error => {
                console.error(`Error getting Dron jobIndex on Alastria: ${error}`);
                alert(`Error onteniendo el numero total de Jobs: ${error}`);
                return ;
             })
        }catch(error){
            alert(`Error onteniendo el numero total de Jobs: ${error}`);
            this.newCompany = false;
            this.existentCompany = false;
            this.showListJobs = false;
            return ;
        }

        let jobData;
        let tokenOwner;
        if(parseInt(totalJobs) == 0){
            this.jobs = [];
        }else{
            for (let i = 0; i < parseInt(totalJobs); i++) {
                jobData = await this.instance.methods.jobs(i).call({ from: this.publicAddress })
                .catch(error => {
                    console.error(`Error getting Dron job on Alastria: ${error}`);
                    alert(`Error onteniendo los datos de un job: ${error}`);
                    return ;
                })
                console.log('jobData: ' + JSON.stringify(jobData));
                tokenOwner = await this.instance.methods.ownerOf(jobData.tokenIdDron).call({ from: this.publicAddress })
                .catch(error => {
                    console.error(`Error getting Dron job on Alastria: ${error}`);
                    alert(`Error onteniendo los datos de un job: ${error}`);
                    return ;
                })
                if((tokenOwner === this.publicAddress) && (! jobData.approved)){
                    this.jobs.push({
                        id:i,
                        from: jobData.from,
                        tokenIdParcela: jobData.tokenIdParcela,
                        tokenIdDron: jobData.tokenIdDron,
                        cost: jobData.cost
                    });
                }
            } 
        }
        if(this.jobs.length > 0){
            this.showList = false;
        }else{
            alert('No hay trabajos pendientes de asignar');
            this.showListJobs = false;
            this.showList = true;
        }
        
    }

    async handleJobClick(event) {
        const index = event.currentTarget.dataset.index;
        let jobId = this.jobs[index].id;

        // approve Job
        await this.instance.methods.approveJob(parseInt(jobId)).estimateGas({ from:this.publicAddress })
        .then(result => {
            this.instance.methods.approveJob(parseInt(jobId)).send({ from:this.publicAddress, gas: parseInt(result)
             })
            .then(result => {
                let parcelaFumigada = result.events.ParcelaFumigada.returnValues.tokenIdParcela;
                if(parcelaFumigada){
                    //send to api to make the transfer from owner to the company -> amount: dron.cost

                    alert('Se asignado correctamente el trabajo al Dron');
                    alert('Dron finalizó el trabajo. Parcela Fumigada!');
                    this.showListJobs = false;
                    this.showList = true;
                }else{
                    alert('La parcela no ha sido fumigada.\nContacte con el administrador de la plataforma');
                }
            })
            .catch(error => {
                console.error(`Error asignando trabajo (aprobar job) a un DRON: ${error}`);
                alert(`Error asignando trabajo (aprobar job) a un DRON: ${error}`);
                throw new Error(`Error asignando trabajo (aprobar job) a un DRON: ${error}`)
            })
        })
        .catch(error => {
            console.error(`Error estimando gas para asignar trabajo (aprobar job) a un DRON: ${error}`);
            alert(`Error estimando gas para asignar trabajo (aprobar job) a un DRON: ${error}`);
        })
        
    }
}
