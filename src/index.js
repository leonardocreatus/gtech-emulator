import express from 'express';
import Event from 'events';
import { Server } from 'socket.io'
import http from 'http';

import { Gate, getGates, getIPAddress } from "./classes/gate.js";
import { finishTransaction, startTransaction } from './tools/transactions.js';
import { OCR } from './classes/ocr.js';

import axios from 'axios';

/*
    ! CONFERIR SE ESTÁ COM AWAIT NA FUNÇÃO GET GATES NO ARQUIVO GATE.JS
*/

// const event = new Event();
const app = express();
app.use(express.json({limit: '50mb'}));

const httpServer = http.createServer(app);
const io = new Server(httpServer);

const event = new Event();
new OCR(event, io);

io.on('connection', socket => console.log('Socket Conectado'));

event.on('container', data => io.emit('container', data));
event.on('plate', data => io.emit('plate', data));

let _gates = await getGates();
let gates = new Map();

for(let g of _gates){
    gates.set(Number(g['id']), new Gate(g, app) );
}

console.log('Gates', gates);

for (const [key, value] of gates.entries()) {
    // console.log(key, value);
    console.log(`GateID: ${key}, Object: ${value}`);
    try {
        console.log(`isValid 10.10.14.112:4022/plate: ${value.isValidCamera('10.10.14.112:4022/plate')}`);
    }catch(error){
        console.log(`isValid Error: ${error}`);
    }
    
}

// console.log('isValid', gates.get(123456).isValidCamera("10.17.1.34"));

app.get('/list', (req, res) => {
    return res.send(_gates);
});

app.get('/gates', (req, res) => {
    _gates.forEach(({cameras, name}) => console.log(`name: ${name}, cameras: ${cameras.host}`));
    return res.send(_gates);
});

app.post('/login', async (req, res) => {
    try {
        const {user, pass} = req['body'];
        const buff = Buffer.from(`${user}:${pass}`);
        const basicAuth = `Basic ${buff.toString('base64')}`;
        console.log('encode:', basicAuth);
        const result = await axios.get('http://127.0.0.1/rest/api/v1/login/validation', {headers: { 'Authorization' : basicAuth}});
        // console.log('login result', result);
        res.send();
    }catch(error){
        console.log('error in login', error);
        return res.status(400).send("Acesso inválido");
    }
})

app.post('/transaction/start', async (req, res) => {
    const { body } = req;
    let { gate, camera } = body ;
    gate = Number(gate);
    console.log(`Transaction Start -- Gate: ${gate}, Camera: ${camera}`);
    if( !gate || !gates.get(gate) ) return res.status(401).send('gate not found');
    
    else if( !camera ){
        console.log(`Transaction Start Error: Camera Not Found, !Camera`);
        return res.status(401).send('camera not found');
    }else if(!gates.get(gate).isValidCamera(camera)){
        console.log(`Transaction Start Error: Camera Not Found, !isValidCamera`);
        return res.status(401).send('camera not found');
    }
    
    
    gates.get(gate).transaction = {
        ip: camera,
        value: true
    };

    if(await startTransaction(gate)) return res.send();
    else return res.status(401).send('error starting transaction');
})

app.post('/transaction/end', async (req, res) => {
    const { body } = req;
    console.log('Transaction End Receive:', body);
    console.log('Gates', gates);
    if( !body['gate'] || !gates.get(Number(body['gate'])) ){
        console.log('Gate not found');
        return res.status(401).send('gate not found');
    } else if( !body['camera'] || !gates.get(Number(body['gate'])).isValidCamera(body['camera']) ){
        console.log('Camera not found');
        return res.status(401).send('camera not found');
    }

    let { gate, camera } = body ;
    console.log(`Transaction End -- Gate: ${gate}, Camera: ${camera}`);
    gate = Number(gate);
    
    gates.get(gate).transaction = {
        ip: camera,
        value: false
    };

    if(await finishTransaction(gate)) return res.send();
    else return res.status(401).send('error finishing transaction');
})


app.post('/img', async (req, res) => {
    const { body } = req;
    let { camera, gate, buffer } = body ;
    gate = Number(gate);

    if(!gate){
        return res.status(401).send('gate not found');
    }else if(!gates.get(gate) ) {
        console.log(gates.get(gate))
        return res.status(401).send('gate not found');
    }else if( !camera || !gates.get(gate).isValidCamera(camera)){
        return res.status(401).send('camera not found');
    }

    res.send();

    gates.get(gate).setImage(camera, buffer);
})

httpServer.listen(4022);
