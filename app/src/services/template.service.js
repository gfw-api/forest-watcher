const logger = require('logger');
const { RWAPIMicroservice } = require('rw-api-microservice-node');
const deserializer = require('serializers/deserializer');

class TemplateService {

    static async getTemplate(templateId) {
        logger.info('Getting template with id', templateId);
        try {
            const template = await RWAPIMicroservice.requestToMicroservice({
                uri: `/reports/${templateId}`,
                method: 'GET',
                json: true
            });
            logger.info('Got template', template);
            return deserializer(template);
        } catch (e) {
            logger.error('Error while fetching template', e);
            throw e;
        }
    }

}
module.exports = TemplateService;
