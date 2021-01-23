const logger = require('logger');
const { RWAPIMicroservice } = require('rw-api-microservice-node');
const deserializer = require('serializers/deserializer');

class CoverageService {

    static async getCoverage({ geostoreId, slugs }) {
        const uri = `/coverage/intersect?geostore=${geostoreId}${slugs ? `&slugs=${slugs}` : ''}`;
        logger.info('Getting coverage with geostore id and uri', geostoreId, uri);
        try {
            const coverage = await RWAPIMicroservice.requestToMicroservice({
                uri,
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
