const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const deserializer = require('serializers/deserializer');

class CoverageService {

    static async getCoverage({ geostoreId }) {
        logger.info('Getting coverage with geostore id', geostoreId);
        try {
            const coverage = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/coverage/intersect?geostore=${geostoreId}`, // &slugs=${slugs}&precision=${precision}
                method: 'GET',
                json: true
            });
            logger.info('Got coverage', coverage);
            return deserializer(coverage);
        } catch (e) {
            logger.error('Error while fetching coverage', e);
            throw e;
        }
    }

}
module.exports = CoverageService;
