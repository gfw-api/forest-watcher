const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const deserializer = require('serializers/deserializer');

class TemplateService {

    static async getTemplate(templateId) {
        logger.info('Getting template with id', templateId);
        const template = await ctRegisterMicroservice.requestToMicroservice({
            uri: `/reports/${templateId}`,
            method: 'GET',
            json: true
        });
        logger.info('Got template', template);
        return deserializer(template);
    }

}
module.exports = TemplateService;
