const logger = require('logger');
const ct = require('ct-register-microservice-node');
const deserializer = require('serializers/deserializer');


class GeostoreService {

    static async getGeostore(geostoreId) {
        logger.info('Getting geostore with id', geostoreId);
        const geostore = await ct.requestToMicroservice({
            uri: `/geostore/${geostoreId}`,
            method: 'GET',
            json: true
        });
        logger.info('Got geostore', geostore);
        return deserializer(geostore);
    }

    static async createGeostore(geojson) {
        const geostore = await ct.requestToMicroservice({
            uri: '/geostore',
            method: 'POST',
            body: {
                geojson,
                lock: true
            },
            json: true
        });
        return deserializer(geostore);
    }

}
module.exports = GeostoreService;
