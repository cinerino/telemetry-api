const request = require('request-promise-native');

request.post({
    uri: 'http://localhost:8082/organizations/project/cinerino/tasks/analyzePlaceOrder',
    body: {
        data: {
            "transaction": {
                "id": "5bb9a6ee25b3b742f0c14798"
            }
        }
    },
    json: true,
    simple: false
}).then((res) => {
    console.log(res);
}).catch(console.error);
