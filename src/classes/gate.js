import { Camera } from './camera.js'
import axios from 'axios'
import ip from 'ip'
// import { promises } from 'fs';  //! DEBUG

class Gate {

    #cameras = new Map();
    #id;

    constructor({id, cameras}, app, event){
        console.log(`New Gate, id: ${id}`);

        this.#id = id;
        const address = ip.address();

        for(let { host } of cameras){
            if(host.includes(address)) this.#cameras.set(host, new Camera(host, app, event) );
        }
        
    }

    set transaction({ip, value}){
        this.#cameras.get(ip).transaction = value;
    }

    isValidCamera(ip){
        return this.#cameras.has(ip);
    }

    setImage(camera, base64){
        console.log('set image in gate');
        this.#cameras.get(camera).setImage(base64);
    }

}

const getGates = async () => {
    let {data: result} = await axios.get('http://127.0.0.1/rest/api/v1/gates')
    
    //! DEBUG
    // const { readFile } = promises;
    // let result = await JSON.parse(await readFile('./temp/gates.json'));
    //! DEBUG
    const address = ip.address();

    result = JSON.stringify(result);
    result = result. replace(/127.0.0.1/g, address);
    result = JSON.parse(result);

    result = result.map( gate => {
        console.log('cameras', gate['cameras']);
        gate['cameras'] = gate['cameras'].filter(({ip}) => {
            return ip.includes(address);
        });

        return gate;
    });

    return result;
}

const getIPAddress = () => { return ip.address() };

export { Gate, getGates, getIPAddress }

