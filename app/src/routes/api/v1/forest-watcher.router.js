const logger = require('logger');
const Router = require('koa-router');
const AreasService = require('services/areas.service');
const GeoStoreService = require('services/geostore.service');
const CoverageService = require('services/coverage.service');
const TemplatesService = require('services/template.service');
const moment = require('moment');

const router = new Router({
    prefix: '/forest-watcher',
});


const globalAlerts = [
    {
        slug: 'viirs',
        name: 'VIIRS',
        active: false,
        startDate: '1',
        endDate: '8'
    }
];

class ForestWatcherRouter {

    static getUser(ctx) {
        let user = Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
        if (ctx.request.body.fields) {
            user = Object.assign(user, JSON.parse(ctx.request.body.fields.loggedUser));
        }
        return user;
    }

    static getDatasetsWithActive(datasets = []) {
        if (!datasets.length > 0 || datasets.find(d => d.active)) return datasets;

        datasets[0].active = true;
        return datasets;
    }

    static getDatasetsWithCoverage(datasets = globalAlerts, layers = []) {
        const glad = {
            slug: 'umd_as_it_happens',
            name: 'GLAD',
            active: false,
            startDate: 6,
            endDate: moment().format('YYYYMMDD') // TODO: think a way to standarize with viirs
        };
        const newDatasets = [];

        const areaHasGlad = layers.includes(glad.slug);
        const datasetsHasGlad = datasets.find(dataset => dataset.slug === glad.slug);
        if (areaHasGlad && !datasetsHasGlad) {
            return ForestWatcherRouter.getDatasetsWithActive([glad, ...datasets]);
        }
        return ForestWatcherRouter.getDatasetsWithActive(datasets);
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
                logger.info('Including area coverage');
                const areaPromises = areas.map(area => CoverageService.getCoverage(area.attributes.geostore));
                promises.push(Promise.all(areaPromises));

                if (includes.includes('geostore')) {
                    logger.info('Including area geostores');
                    const areaPromises = areas.map(area => GeoStoreService.getGeostore(area.attributes.geostore));
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
                    const coverageData = data[0];
                    const geoStoreData = data[1];
                    const templatesData = data[2];

                    if (geoStoreData.length) {
                        areas = areas.map((area, index) => {
                            const geostore = geoStoreData[index] || {};
                            const reportTemplate = templatesData[index] || null;
                            const coverage = coverageData[index].layers || [];
                            const datasets = ForestWatcherRouter.getDatasetsWithCoverage(area.datasets, coverage);
                            return {
                                ...area,
                                attributes: {
                                    ...area.attributes,
                                    geostore,
                                    datasets,
                                    coverage,
                                    reportTemplate
                                }
                            }
                        });
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
