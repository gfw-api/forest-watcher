const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const deserializer = require('serializers/deserializer');


class GeostoreService {

    static async getGeostore(geostoreId) {
        logger.info('Getting geostore with id', geostoreId);
        const geostore = await ctRegisterMicroservice.requestToMicroservice({
            uri: `/geostore/${geostoreId}`,
            method: 'GET',
            json: true
        });
        logger.info('Got geostore', geostore);
        return deserializer(geostore);
    }

}
module.exports = GeostoreService;
