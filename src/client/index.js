import '@lwc/synthetic-shadow';
import { createElement } from 'lwc';
import MyApp from 'my/app';
import Web3 from 'web3';

const app = createElement('my-app', { is: MyApp });
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#main').appendChild(app);

const PORT = '7545';
const HOST = '127.0.0.1';

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    //window.addEventListener("load", async () => {
      // Modern dapp browsers...
      /*if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const provider = new Web3.providers.HttpProvider(
          "http://127.0.0.1:8545"
        );
        const web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3);
      }*/
      console.log('http://' + HOST + ':' + PORT);
      const provider = new Web3.providers.HttpProvider(
        'http://' + HOST + ':' + PORT
      );
      const web3 = new Web3(provider);
      /*const web3Events = new Web3('ws://127.0.0.1:7545');
      let topicJobPending = web3.utils.soliditySha3('JobPendingApproval(uint256,uint256,address)');
      let topicParcelaFumigada = web3.utils.soliditySha3('ParcelaFumigada(uint256)');
      let topics = [];
      topics.push(topicJobPending);
      topics.push(topicParcelaFumigada);
      const subscription = web3Events.eth.subscribe('logs', {topics: topics}, function(error, result){
        if (!error){
          if(topics.indexOf(topicJobPending)){
            alert('Trabajo pendiente de aprobación:\n' + result);
          }
          if(topics.indexOf(topicParcelaFumigada)){
            alert('Parcela fumigada:\n' + result);
          }
          alert('Evento desconocido: ' + result);
        }
    });*/

      resolve(web3);
    //});
  });

export default getWeb3;