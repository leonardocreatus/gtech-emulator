import express from 'express';
import Event from 'events';
import { Server } from 'socket.io'
import http from 'http';

import { Gate, getGates } from "./classes/gate.js";
import { finishTransaction, startTransaction } from './tools/transactions.js';
import { OCR } from './classes/ocr.js';


// const event = new Event();
const app = express();
app.use(express.json({limit: '50mb'}));

const httpServer = http.createServer(app);
const io = new Server(httpServer);

const event = new Event();
new OCR(event, io);

event.on('container', data => io.emit('container', data));
event.on('plate', data => io.emit('plate', data));

let _gates = await getGates();
let gates = new Map();

for(let g of _gates){
    gates.set(Number(g['id']), new Gate(g, app) );
}

app.get('/list', (req, res) => {
    return res.send(_gates);
});

app.post('/transaction/start', async (req, res) => {
    const { body } = req;
    let { gate, camera } = body ;
    gate = Number(gate);

    if( !gate || !gates.get(gate) ) return res.status(401).send('gate not found');
    
    else if( !camera ){
        return res.status(401).send('camera not found');
    }else if(!gates.get(gate).isValidCamera(camera)){
        return res.status(401).send('camera not found');
    }
    
    
    gates.get(gate).transaction = {
        ip: camera,
        value: true
    };

    if(startTransaction(gate)) return res.send();
    else return res.status(401).send('error starting transaction');
})

app.post('/transaction/end', async (req, res) => {
    const { body } = req;
    if( !body['gate'] || !gates.get(body['gate']) ) return res.status(401).send('gate not found');
    else if( !body['camera'] || !gates.get(body['gate']).isValidCamera(body['camera']) ) return res.status(401).send('camera not found');

    let { gate, camera } = body ;
    gate = Number(gate);
    
    gates.get(gate).transaction = {
        ip: camera,
        value: false
    };

    if(finishTransaction(gate)) return res.send();
    else return res.status(401).send('error finishing transaction');
})


app.post('/img', async (req, res) => {
    const { body } = req;
    let { camera, gate, buffer } = body ;
    gate = Number(gate);
    // console.log(gate);
    
    // if( !gate || !gates.get(gate) ) return res.status(401).send('gate not found');
    if(!gate){
        return res.status(401).send('gate not found');
    }else if(!gates.get(gate) ) {
        console.log(gates.get(gate))
        console.log(2);
        return res.status(401).send('gate not found');
    }else if( !camera || !gates.get(gate).isValidCamera(camera)){
        return res.status(401).send('camera not found');
    }

    res.send();

    gates.get(gate).setImage(camera, buffer);
})

httpServer.listen(4022);
