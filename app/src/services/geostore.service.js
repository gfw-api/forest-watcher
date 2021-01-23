const logger = require('logger');
const { RWAPIMicroservice } = require('rw-api-microservice-node');
const deserializer = require('serializers/deserializer');


class GeostoreService {

    static async getGeostore(geostoreId) {
        logger.info('Getting geostore with id', geostoreId);
        try {
            const geostore = await RWAPIMicroservice.requestToMicroservice({
                uri: `/geostore/${geostoreId}`,
                method: 'GET',
                json: true
            });
            logger.info('Got geostore', geostore);
            return deserializer(geostore);
        } catch (e) {
            logger.error('Error while fetching geostore', e);
            throw e;
        }
    }

    static async createGeostore(geojson) {
        try {
            const geostore = await RWAPIMicroservice.requestToMicroservice({
                uri: '/geostore',
                method: 'POST',
                body: {
                    geojson,
                    lock: true
                },
                json: true
            });
            return deserializer(geostore);
        } catch (e) {
            logger.error('Error while creating geostore', e);
            throw e;
        }
    }

}
module.exports = GeostoreService;
