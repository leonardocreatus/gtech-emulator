import {Tail} from 'tail';

class OCR {
    constructor(event){
        const filename = '/var/log/wegate.log';
        const tail = new Tail(filename);
        
        const ss_plate = ' Plate: ';
        const ss_container = ' Container: ';
 
        tail.on('line', (line) => {

            let indexPlate = line.indexOf(ss_plate);
            let indexContainer = line.indexOf(ss_container);
            if(indexPlate != -1){
                let ss = line.substring(indexPlate + ss_plate.length, line.indexOf(' in'));
                console.log(ss);
                event.emit('plate', ss);
            }else if(indexContainer != -1){
                let ss = line.substring(indexContainer + ss_container.length, line.indexOf(' in'));
                console.log(ss);
                event.emit('container', ss);
            }

        })
    
        tail.on('close', () => {
          console.log('watching stopped');
        })
    
        tail.watch();
    }
}

export { OCR }