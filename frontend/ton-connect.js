
let destinationAddress = '';


const jettonWalletContract = 'EQCyDhcASwIm8-eVVTzMEESYAeQ7ettasfuGXUG1tkDwVJbc';

$(document).ready(async function(){

    let addressField =  $('#destinationAddress');

    $('.pay-item').hide();

    destinationAddress =  addressField.val();

    addressField.on('change',function(){
        destinationAddress = $(this).val();
    })

    $('#ton_btn').on('click',function(){
        payTON();
    })

    $('#lky_btn').on('click',function(){
        payLKY();
    })

    window.addEventListener('ton-connect-transaction-signed', (event) => {
        log('signed');
    });

    window.addEventListener('ton-connect-transaction-signing-failed', (event) => {
        log('signing-failed');
    });

    window.addEventListener('ton-connect-transaction-sent-for-signature', (event) => {
        log('sent-for-signature');
    });
});

let i=0;
function log(message){
    i++;
    let div = $('<div></div>').html(i+': '+message);
    $('#log_div').prepend(div);
}

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    buttonRootId: 'ton-connect',
    manifestUrl: 'https://tnl.prgss.dev/tonconnect-manifest.json'
});

const unsubscribe = tonConnectUI.onStatusChange(wallet => {
    if ( ! wallet) {
        return;
    }
    console.log('onStatusChange');
    if(wallet.account.address){
        $('.pay-item').show();
        log('connected address: ' + wallet.account.address);
    }
});

async function payTON(){
    if(destinationAddress === ''){
        alert('Need Enter Destination Wallet Address');
        return;
    }

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 720,
        messages: [
            {
                network: "1",
                address: destinationAddress,  // sender jetton wallet
                amount: '1000000'
            }
        ]
    }

    try {
        const result = tonConnectUI.sendTransaction(transaction, {
            modals: [
                'before'
            ],
            notifications: [
                'before',
                'success',
                'error'
            ]
        });

        const someTxData = await tonConnectUI.getTransaction(result.boc);
        log('Transaction was sent successfully' + someTxData);
    } catch (e) {
        console.log('Unknown error happened', e);
    }
}

async function payLKY(){
    if(destinationAddress === ''){
        alert('Need Enter Destination Wallet Address');
        return;
    }

    $.ajax({
        type: "POST",
        url: 'http://localhost:3000/get-payload',
        data: JSON.stringify({ address: destinationAddress}),
        contentType: "application/json",
        dataType: "json",
        success: async function(data){
            if(data.payload){
                console.log('data', data);
                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 360,
                    messages: [
                        {
                            network: "1",
                            address: jettonWalletContract,  // sender jetton wallet
                            amount: 0,         // for commission fees, excess will be returned
                            payload: data.payload // payload with jetton transfer and comment body
                        }
                    ]
                }

                try {
                    const result = tonConnectUI.sendTransaction(transaction, {
                        modals: ['before'],
                        notifications: ['before', 'success', 'error']
                    });

                    const someTxData = await tonConnectUI.getTransaction(result.boc);
                    log('Transaction was sent successfully ' + someTxData);
                } catch (e) {
                    console.log('Unknown error happened', e);
                }
            }
        }
    });
}