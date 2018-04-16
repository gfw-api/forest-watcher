const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

const deserializer = obj => new Promise((resolve, reject) => {
    new JSONAPIDeserializer({
        keyForAttribute: 'camelCase'
    }).deserialize(obj, (err, data) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(data);
    });
});

module.exports = deserializer;
