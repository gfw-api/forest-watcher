const logger = require('logger');
const ct = require('ct-register-microservice-node');
const { createReadStream } = require('fs');
const GeoStoreService = require('services/geostore.service');

class AreasService {

    static async getUserAreas(userId) {
        logger.info('Get user areas', userId);
        const areas = await ct.requestToMicroservice({
            uri: `/area/fw/${userId}`,
            method: 'GET',
            json: true
        });
        logger.info('User areas', areas);
        return areas && areas.data;
    }

    static async createAreaWithGeostore({ name, image }, geojson, userId) {
        logger.info('Create area with geostore');
        const geostore = await GeoStoreService.createGeostore(geojson);
        const area = await ct.requestToMicroservice({
            uri: `/area/fw/${userId}`,
            method: 'POST',
            formData: {
                name,
                geostore: geostore.id,
                image: createReadStream(image.path)
            }
        });
        return { geostore, area: JSON.parse(area) };
    }

}
module.exports = AreasService;
