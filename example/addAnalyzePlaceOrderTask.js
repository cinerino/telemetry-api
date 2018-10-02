const request = require('request-promise-native');

request.post({
    uri: 'http://localhost:8082/organizations/project/cinerino/tasks/analyzePlaceOrder',
    body: {
        data: {
            id: 'id'
        }
    },
    json: true,
    simple: false
}).then((res) => {
    console.log(res);
});
