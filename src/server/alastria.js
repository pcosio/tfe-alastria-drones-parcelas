const TFEPayment = require('../../build/contracts/TFEPayments.json');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://' + process.env.HOST_NETWORK + ':' + process.env.PORT_NETWORK));
const AMOUNT_ADDRESS = process.env.AMOUNT_ADDRESS;
const ACCOUNT_CREATION = process.env.ACCOUNT_CREATION;

module.exports =  {
    newOwner: async (ownerAddress) => {
      //return new Promise((resolve, reject) => {
          // Get the contract instance.
          var networkId;
          var deployedNetwork;
          var instance;
          await web3.eth.net.getId().then(result => {
            networkId = result;
          })
          deployedNetwork = TFEPayment.networks[networkId];
          instance = new web3.eth.Contract(
            TFEPayment.abi,
            deployedNetwork && deployedNetwork.address,
          );
          console.log('*** ' + ownerAddress);
          console.log('*** ' + instance.methods);
          console.log('*** ' + deployedNetwork.address);
          console.log('*** ' + parseInt(AMOUNT_ADDRESS));
          /*await instance.methods.transfer(ownerAddress, parseInt(AMOUNT_ADDRESS)).estimateGas({ from:ACCOUNT_CREATION })
          .then(result => {
            console.log('result estimage gas: ' + result);
            instance.methods.transfer(ownerAddress, parseInt(AMOUNT_ADDRESS)).send({ from:ACCOUNT_CREATION, gas: parseInt(result)
            })
            .catch(error => {
              console.error('---- 1 ' + error);
              throw new Error(error);
            })
          })
          .catch(error => {
            console.error('---- 2 ' + error);
            throw new Error(error);
          })*/
          await instance.methods.transfer(ownerAddress, parseInt(AMOUNT_ADDRESS)).send({ from: ACCOUNT_CREATION })
          .then('transfer OK')
          .catch(error => {
            console.error('---- 1 ' + error);
            throw new Error(error);
          })
        //});
    },



    /*newDron: async (data, account, password) => {
      return new Promise((resolve, reject) => {
        //unlock account
        web3.eth.personal.unlockAccount(account, password, 120)
        .then(console.log('Account unlocked!'))
        .catch(error => reject(error))


        resolve(true);
      });
    }*/
};