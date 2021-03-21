var TFEDron = artifacts.require('./TFEDron');
var TFEParcela = artifacts.require('./TFEParcela');
var TFEPayments = artifacts.require('./TFEPayments');

module.exports = async function (deployer, network, accounts) {
    /*await deployer.deploy(TFEParcela, 'TFEParcela', 'TFEP', { from: accounts[0] });
    await deployer.deploy(TFEPayments, 'TFEPayments', 'TFPay', 0, 10000, { from: accounts[0] });
    console.log('TFEPayments.address: ' + TFEPayments.address);
    console.log('TFEParcela.address: ' + TFEParcela.address);
    await deployer.deploy(TFEDron, 'TFEDron', 'TFED', TFEPayments.address, TFEParcela.address, { from: accounts[0] });*/

    deployer.deploy(TFEParcela, 'TFEParcela', 'TFEP')
    .then(function() {
        console.log('PARCELA Contract deployed -> ' + TFEParcela.address);
        return deployer.deploy(TFEPayments, 'TFEPayments', 'TFPay', 0, 10000)
        .then(() => {
            console.log('PAYMENTS Contract deployed -> ' + TFEPayments.address);
            return deployer.deploy(TFEDron, 'TFEDron', 'TFED')
            .then(() => {
                console.log('DRON Contract deployed -> ' + TFEDron.address);
            })
        });
    });
};