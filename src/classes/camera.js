import {Buffer} from 'buffer';
import sizeOf from 'image-size'
import sharp from 'sharp'
import { blackImage } from './../tools/black_image.js'
import {URL} from 'url'

const proportion = 3;

class Camera {
    #ip;
    #transaction = false;
    #image; 
    #black ;
    #hasImage = false;
    #count = 0;
    #last;

    constructor(ip, app){
        console.log(`New Camera, host: ${ip}`);
        this.#ip = ip;
        console.log(ip);
        const url = new URL('http://' + ip );
        
        app.get(url['pathname'], async (req, res) => {
            // console.log(url['pathname'])
            const image = this.image;
            if(image == undefined) return res.send();

            res.writeHead(200, {
                'Host': this.host,
                'Content-Type': 'image/jpeg',
                'Content-Length': image.length
            });

            return res.end(image, 'binary');
        })
    }


    async setImage(base64){
        console.log('set image in camera');
        const binary = Buffer.from(base64, 'base64');
        console.log('converting to binary');
        const {width, height} = sizeOf(binary);
        console.log('sizeOf');
        // console.log('black', this.#black);
        try{
            const buffer = Buffer.from(blackImage, 'base64');
            console.log(`set buffer black to width: ${width}, height: ${height}`);
            this.#black = await sharp(buffer)
                                .rotate()
                                .resize(width, height)
                                .toBuffer();
        }catch(error){
            console.log(error);
        }

        console.log('sharp');
        this.#image = binary;
        this.#hasImage = true;
    }


    set transaction(value){
        if(!value){
            this.#hasImage = false;
            this.#black = undefined;
            this.#image = undefined;
            this.#count = 0;
            this.#last = undefined;
        }

        this.#transaction = value;
    }

    get host(){
        return this.#ip;
    }

    get image() {
        if(this.#hasImage && this.#transaction){

            // const file = this.#count > ( proportion - 1 ) ? this.#black : this.#image;
            // this.#count = (this.#count + 1 ) % proportion;
            let file = this.#image;
            if(!this.#last || (Date.now() - this.#last > 1000 )){
                file = this.#black;
                this.#last = new Date();
            }

            return file;

        }else return undefined;
    }
}

export { Camera }