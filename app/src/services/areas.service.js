const logger = require('logger');
const { RWAPIMicroservice } = require('rw-api-microservice-node');
const { createReadStream } = require('fs');
const CoverageService = require('services/coverage.service');
const GeoStoreService = require('services/geostore.service');
const config = require('config');

const ALERTS_SUPPORTED = config.get('alertsSupported');

class AreasService {

    static async getUserAreas(userId) {
        logger.info('Get user areas', userId);
        try {
            const areas = await RWAPIMicroservice.requestToMicroservice({
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
        logger.info('Start area creation with params', { name, userId });
        logger.info('Start area creation with geojson', geojson);
        let geostore;
        let coverage;
        let area;

        try {
            geostore = await GeoStoreService.createGeostore(geojson);
        } catch (e) {
            logger.error('Error while creating geostore', e);
            throw e;
        }
        try {
            const params = {
                geostoreId: geostore.id,
                slugs: ALERTS_SUPPORTED
            };
            coverage = await CoverageService.getCoverage(params);
        } catch (e) {
            logger.error('Error while getting area coverage', e);
            throw e;
        }
        try {
            logger.info('Creating area with geostore and coverage ready');
            area = await RWAPIMicroservice.requestToMicroservice({
                uri: `/area/fw/${userId}`,
                method: 'POST',
                body: {
                    name,
                    geostore: geostore.id,
                    image: createReadStream(image.path)
                }
            });
            logger.info('Area created', area);
            return { geostore, area: area.data, coverage };
        } catch (e) {
            logger.error('Error while creating area with geostore', e);
            throw e;
        }
    }

}
module.exports = AreasService;
