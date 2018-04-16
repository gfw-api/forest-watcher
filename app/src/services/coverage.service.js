const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const deserializer = require('serializers/deserializer');

class CoverageService {

    static async getCoverage(geostoreId) {
        logger.info('Getting coverage with geostore id', geostoreId);
        const coverage = await ctRegisterMicroservice.requestToMicroservice({
            uri: `/coverage/intersect?geostore=${geostoreId}`,
            method: 'GET',
            json: true
        });
        logger.info('Got coverage', coverage);
        return deserializer(coverage);
    }

}
module.exports = CoverageService;
