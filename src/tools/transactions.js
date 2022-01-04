import axios from 'axios'

const finishTransaction = async gateId => {
    let {data} = await axios.post('http://127.0.0.1/rest/wegate/transaction/end', {
        gateId,
        status: 'ok'
    });

    if(data['result'] == 0) return true;
    else return false;
}

const startTransaction = async gateId => {
    let {data} = await axios.post('http://127.0.0.1/rest/wegate/transaction/init', {
        gateId,
        direction: 'in'
    });

    if(data['result'] == 0 ) return true;
    else return false;
}

export { startTransaction, finishTransaction };