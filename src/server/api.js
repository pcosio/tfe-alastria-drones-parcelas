// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const bodyParser = require('body-parser');
const IPFS = require('ipfs-mini');
const web3 = require('./alastria.js');
//var cors = require('cors');

const app = express();
app.use(helmet());
app.use(compression());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;
const ipfs = new IPFS({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
const ipfsUri = 'https://ipfs.infura.io/ipfs/';

const options = {
    type: 'json',
    limit: 10000000,
  };
/*var corsOptions = {
    origin: 'http://localhost'
  }*/

app.use(bodyParser.text(options));

app.get('/api/v1/endpoint', (req, res) => {
    res.json({ success: true });
});

app.listen(PORT, () =>
    console.log(
        `✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`
    )
);

app.post('/api/v1/ifps/metadata', async (req, res) => {
    console.log(req.body);
    //res.setHeader('Content-Type', 'application/json');
    var uri;
    var data = req.body;
    console.log('data ' + data);
    
    //First - generate JSON - save to IPFS
    await ipfs.add(data).then(hash => {
        console.log('https://ipfs.infura.io/ipfs/'+hash);
        uri = 'https://ipfs.infura.io/ipfs/' + hash;
    }).catch(error => res.status(400).send('Error saving json to Infura: ' + error));
    //uri = ipfsUri + 'QmeHkEcnBgSh6nz4n322KhMMRAdWpBVgTSokZZXHxB2LWn';
    //create new account for the company
    /*await web3.newCompany(pass)
    .then(result => publicAdress = result)
    .catch(console.error)
    */
    //create new Dron ERC721
    console.log('uri -> ' + uri);
    var responseData = {
        uri: uri
    }
    res.send(responseData);
});

app.post('/api/v1/ipfs/dron/check', async (req, res) => {
    console.log('Dron check: ' + req.body);
    var jsonMetadata;
    ipfs.cat(JSON.parse(req.body).hash)
    .then(result => {
        console.log('Parcela: ' + result);
        jsonMetadata = JSON.parse(result);
        if(! (JSON.parse(req.body).parcelaHmax > jsonMetadata.dronHmax)){
            res.sendStatus(400);
        }else if(! (JSON.parse(req.body).parcelaHmin < jsonMetadata.dronHmin)){
            res.sendStatus(400);
        }else if(jsonMetadata.pesticidas.hasOwnProperty(JSON.parse(req.body).pesticida)){
            if(! jsonMetadata.pesticidas[JSON.parse(req.body).pesticida]){
                res.sendStatus(400);
            }else{
                res.status(200).send(jsonMetadata);
            }
        }
    }).catch(error => {
        res.sendStatus(400);
    })
});

app.post('/api/v1/ipfs/parcela', async (req, res) => {
    var jsonMetadata;
    ipfs.cat(JSON.parse(req.body).hash)
    .then(result => {
        res.send(result);
    }).catch(error => {
        res.sendStatus(400);
    })
});

app.post('/api/v1/transfer', async (req, res) => {
    console.log('Dron check: ' + req.body);
    await web3.newOwner(JSON.parse(req.body).ownerAddress)
    .catch(error => {
        console.error(error);
        res.sendStatus(400);
    })
    res.sendStatus(200);
});
