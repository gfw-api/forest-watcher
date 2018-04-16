const logger = require('logger');
const Router = require('koa-router');
const AreasService = require('services/areas.service');
const GeoStoreService = require('services/geostore.service');
const CoverageService = require('services/coverage.service');
const TemplatesService = require('services/template.service');
const ErrorSerializer = require('serializers/error.serializer');
const config = require('config');

const router = new Router({
    prefix: '/forest-watcher',
});

class ForestWatcherRouter {

    static getUser(ctx) {
        let user = Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
        if (ctx.request.body.fields) {
            user = Object.assign(user, JSON.parse(ctx.request.body.fields.loggedUser));
        }
        return user;
    }

    static async getUserAreas(ctx) {
        const user = ForestWatcherRouter.getUser(ctx);
        logger.info('User requesting areas', user);
        let areas = [];

        const includes = ctx.query.includes ? ctx.query.includes.split(',') : [];
        logger.info('CONTEXXX', includes);
        if (user && user.id) {
            areas = await AreasService.getUserAreas(user.id);
            logger.info('Got user areas', areas);
            const promises = [];
            if (areas && areas.length) {
                if (includes.includes('geostore')) {
                    logger.info('Including area geostores');
                    const areaPromises = areas.map(area => GeoStoreService.getGeostore(area.attributes.geostore));
                    promises.push(Promise.all(areaPromises));
                } else {
                    promises.push([]);
                }
                if (includes.includes('coverage')) {
                    logger.info('Including area coverage');
                    const areaPromises = areas.map(area => CoverageService.getCoverage(area.attributes.geostore));
                    promises.push(Promise.all(areaPromises));
                } else {
                    promises.push([]);
                }
                if (includes.includes('templates')) {
                    logger.info('Including area templates');
                    const areaPromises = areas.map(area => (
                        area.attributes.templateId
                            ? TemplatesService.getTemplate(area.attributes.templateId)
                            : ''
                    ));
                    promises.push(Promise.all(areaPromises));
                } else {
                    promises.push([]);
                }
                if (promises.length) {
                    const data = await Promise.all(promises);
                    logger.info('DATA', data);
                    const geoStoreData = data[0];
                    const coverageData = data[1];
                    const templatesData = data[2];

                    if (geoStoreData.length) {
                        areas = areas.map((area, index) => ({
                            ...area,
                            attributes: {
                                ...area.attributes,
                                geostore: (geoStoreData && geoStoreData[index]) || {},
                                coverage: (coverageData && coverageData[index].layers) || [],
                                reportTemplate: (templatesData && templatesData[index]) || null
                            }
                        }));
                    }
                }
            }
        }
        ctx.body = {
            data: areas
        };
    }

}

router.get('/areas', ForestWatcherRouter.getUserAreas);

module.exports = router;
