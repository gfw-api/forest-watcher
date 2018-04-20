const logger = require('logger');
const ct = require('ct-register-microservice-node');
const { createReadStream } = require('fs');
const GeoStoreService = require('services/geostore.service');

class AreasService {

    static async getUserAreas(userId) {
        logger.info('Get user areas', userId);
        try {
            const areas = await ct.requestToMicroservice({
                uri: `/area/fw/${userId}`,
                method: 'GET',
                json: true
            });
            logger.info('User areas', areas);
            return areas && areas.data;
        } catch (e) {
            logger.error('Error while fetching areas', e);
            throw e;
        }
    }

    static async createAreaWithGeostore({ name, image }, geojson, userId) {
        logger.info('Create area with geostore');
        let geostore;
        let area;

        try {
            geostore = await GeoStoreService.createGeostore(geojson);
        } catch (e) {
            logger.error('Error while creating geostore', e);
            throw e;
        }
        try {
            area = await ct.requestToMicroservice({
                uri: `/area/fw/${userId}`,
                method: 'POST',
                formData: {
                    name,
                    geostore: geostore.id,
                    image: createReadStream(image.path)
                }
            });
            return { geostore, area: JSON.parse(area) };
        } catch (e) {
            logger.error('Error while creating area with geostore', e);
            throw e;
        }
    }

}
module.exports = AreasService;
