const DronContract = artifacts.require("TFEDron");
const ParcelaContract = artifacts.require("TFEParcela");
const PaymentsContract = artifacts.require("TFEPayments");

const assert = require("chai").assert;
const TruffleAssert = require('truffle-assertions');

contract("DronContract", accounts => {
	let drones;
	let parcelas;
	let paymentContract;
	let dronUri = 'https://googles.es/1';
	let parcelaUri = 'https://googles.es/2';
	let tokenIdParcela;
	let tokenIdDron;
	let jobId;
	
	beforeEach("Desplegar nuevo contrato Drones", async function() {
        if(!drones)
		{
			drones = await DronContract.deployed();
			console.info("Contrato Dron desplegado");
		}
		if(!parcelas)
		{
			parcelas = await ParcelaContract.deployed();
			console.info("Contrato Dron Parcela");
		}
		if(!drones)
		{
			drones = await DronContract.deployed();
			console.info("Contrato Dron desplegado");
		}
		if(!paymentContract)
		{
			paymentContract = await PaymentsContract.deployed();
			console.info("Contrato Payments desplegado");
		}
	});
	
	describe("Prueba flujo completo", async () => {
		it("Crear nuevo dron", async () => {		
			let txNewDron = await drones.newItem(accounts[1], dronUri, {from: accounts[1]});
			TruffleAssert.eventEmitted(txNewDron, 'Transfer', (ev) => {
				tokenIdDron = ev.tokenId;
				return ev.tokenId == 1;
			});
			let ownerDron = await drones.ownerOf(tokenIdDron, { from: accounts[1] });
      		assert.equal(ownerDron, accounts[1], "La parcela no se ha creado o no tiene el owner correcto");
		});
	
		it("Crear nueva parcela", async () => {	
			
			let txNewParcela = await parcelas.newItem(accounts[2], parcelaUri, {from: accounts[2]});
			TruffleAssert.eventEmitted(txNewParcela, 'Transfer', (ev) => {
				tokenIdParcela = ev.tokenId;
				return ev.tokenId == 1;
			});
			let ownerParcela = await parcelas.ownerOf(tokenIdParcela, { from: accounts[2] });
      		assert.equal(ownerParcela, accounts[2], "La parcela no se ha creado o no tiene el owner correcto");
			// Give tokens the owner when new owner is registered. In this case to simulate I do it on the parcela registration
			var tx = await paymentContract.transfer(accounts[2], 100, {from: accounts[0]});
			TruffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
				return ev.value == 100;
			});
		});

		it("Propietario parcela contratar dron", async () => {		
			//let txContractDron = await drones.addJob(accounts[2], tokenIdParcela, tokenIdDron, parseInt('25') , dronUri, {from: accounts[2]});
			let txContractDron = await drones.addJob(accounts[2], tokenIdParcela, tokenIdDron, parseInt('25'), {from: accounts[2]});
			TruffleAssert.eventEmitted(txContractDron, 'JobPendingApproval', (ev) => {
				jobId = ev.jobId;
				return ev.jobId == 0;
			});
			let jobInfo = await drones.jobs(jobId, { from: accounts[2] });
			assert.equal(jobInfo.approved, false, "El Trabajo NO se ha añadido correctamente");
		});

		it("Propietario parcela raliza el pago", async () => {		
			let txPayment = await paymentContract.transfer(accounts[1], 25, {from: accounts[2]});
			TruffleAssert.eventEmitted(txPayment, 'Transfer', (ev) => {
				return ev.value == 25;
			});
		});

		it("Empresa recibe el pago", async () => {		
			let balanceCompany = await paymentContract.balanceOf(accounts[1], {from: accounts[1]});
			assert.equal(balanceCompany, 25, "La empresa no ha recibido el pago del propietario del dron");
		});

		it("Empresa del Dron asigna el trabajo pendiente al dron y verifica que la parcela está fumigada", async () => {		
			let txApproveJob = await drones.approveJob(jobId, {from: accounts[1]});
			TruffleAssert.eventEmitted(txApproveJob, 'ParcelaFumigada', (ev) => {
				return ev.tokenIdParcela == tokenIdParcela.toString();
			});
		});
	});
});