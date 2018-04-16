const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class AreasService {

    static async getUserAreas(userId) {
        logger.info('Get user areas', userId);
        const areas = await ctRegisterMicroservice.requestToMicroservice({
            uri: `/area/fw/${userId}`,
            method: 'GET',
            json: true
        });
        logger.info('User areas', areas);
        return areas && areas.data;
    }

}
module.exports = AreasService;
