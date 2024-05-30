import { beginCell, toNano, Address, TonClient, storeStateInit  } from '@ton/ton';


import express from "express";
import cors from 'cors';

import bodyParser from "body-parser";

const app = express();
const port = 3000;

// Middleware для обробки JSON
app.use(bodyParser.json());

app.use(cors());


app.post('/get-payload', async (req, res) => {

    console.log('req', req.body);

    try {

        const destinationAddress = Address.parse(req.body.address);

        console.log('destinationAddress', destinationAddress);

        const forwardPayload = beginCell()
            .storeUint(0, 32) // 0 opcode means we have a comment
            .storeStringTail('Hello, TON!')
            .endCell();

        const body = beginCell()
            .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
            .storeUint(0, 64) // query id
            .storeCoins(toNano(5)) // jetton amount, amount * 10^9
            .storeAddress(destinationAddress) // TON wallet destination address
            .storeAddress(destinationAddress) // response excess destination
            .storeBit(0) // no custom payload
            .storeCoins(toNano(0.02).toString()) // forward amount (if >0, will send notification message)
            .storeBit(1) // we store forwardPayload as a reference
            .storeRef(forwardPayload)
            .endCell();

        let commission = toNano(0.05);

        res.json({
            status: 'success',
            payload: body.toBoc().toString("base64"),
            commission: commission.toString()
        });
    } catch (error) {
        res.json({ status: 'error', message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
