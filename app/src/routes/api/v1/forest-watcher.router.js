const logger = require('logger');
const Router = require('koa-router');
const AreasService = require('services/areas.service');
const GeoStoreService = require('services/geostore.service');
const CoverageService = require('services/coverage.service');
const TemplatesService = require('services/template.service');
const AreaValidator = require('validators/area.validator');
const moment = require('moment');
const config = require('config');

const ALERTS_SUPPORTED = config.get('alertsSupported');

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

    static async buildAreasResponse(areas = [], { geostoreObj, coverageObj } = {}) {
        const areasWithGeostore = areas.filter(area => area.attributes.geostore);

        const promises = [Promise.all(areasWithGeostore.map(area => (area.attributes.templateId
            ? TemplatesService.getTemplate(area.attributes.templateId)
            : null
        )))];

        if (!geostoreObj) {
            promises.push(Promise.all(areasWithGeostore.map(area => GeoStoreService.getGeostore(area.attributes.geostore))));
        }
        if (!coverageObj) {
            promises.push(Promise.all(areasWithGeostore.map((area) => {
                const params = {
                    geostoreId: area.attributes.geostore,
                    slugs: ALERTS_SUPPORTED
                };
                return CoverageService.getCoverage(params);
            })));
        }
        try {
            const data = await Promise.all(promises);
            const [templatesData, geostoreData, coverageData] = data;

            return areasWithGeostore.map((area, index) => {
                const geostore = geostoreObj || (geostoreData[index] || {});
                const reportTemplate = templatesData[index] || null;
                const coverage = coverageData[index] ? coverageData[index].layers : [];
                const datasets = ForestWatcherRouter.getDatasetsWithCoverage(area.attributes.datasets, coverage);
                return {
                    ...area,
                    attributes: {
                        ...area.attributes,
                        geostore,
                        datasets,
                        coverage,
                        reportTemplate
                    }
                };
            });
        } catch (e) {
            logger.error('Error while fetching coverage, templates, geostore', e);
            throw e;
        }

    }

    static getUser(ctx) {
        return Object.assign({}, ctx.request.query.loggedUser ? JSON.parse(ctx.request.query.loggedUser) : {}, ctx.request.body.loggedUser);
    }

    static getDatasetsWithActive(datasets = []) {
        if (!datasets.length > 0 || datasets.find(d => d.active)) return datasets;

        datasets[0].active = true;
        return datasets;
    }

    static getDatasetsWithCoverage(list, layers = []) {
        const datasets = (!list || list.length === 0) ? globalAlerts : list;
        logger.info('Parsing area datasets with datasets', datasets);
        logger.info('With coverage', layers);
        const glad = {
            slug: 'umd_as_it_happens',
            name: 'GLAD',
            active: false,
            startDate: 6,
            endDate: moment().format('YYYYMMDD')
        };

        const areaHasGlad = layers.includes(glad.slug);
        const datasetsHasGlad = datasets.find(dataset => dataset.slug === glad.slug);
        if (areaHasGlad && !datasetsHasGlad) {
            return ForestWatcherRouter.getDatasetsWithActive([glad, ...datasets]);
        }
        return ForestWatcherRouter.getDatasetsWithActive(datasets);
    }

    static async getUserAreas(ctx) {
        const user = ForestWatcherRouter.getUser(ctx);
        let data = [];
        if (user && user.id) {
            try {
                const areas = await AreasService.getUserAreas(user.id);
                try {
                    data = await ForestWatcherRouter.buildAreasResponse(areas);
                } catch (e) {
                    ctx.throw(e.status, 'Error while retrieving area\'s geostore, template, and coverage');
                }
            } catch (e) {
                ctx.throw(e.status, 'Error while retrieving area');
            }
        }
        ctx.body = {
            data
        };
    }

    static async createArea(ctx) {
        const user = ForestWatcherRouter.getUser(ctx);
        const { geojson, name } = ctx.request.body.fields || {};
        const { image } = ctx.request.body.files;
        let data = null;
        if (user && user.id) {
            try {
                const { area, geostore, coverage } = await AreasService.createAreaWithGeostore({
                    name,
                    image
                }, JSON.parse(geojson), user.id);
                logger.info('Created area', area, geostore, coverage);
                try {
                    [data] = await ForestWatcherRouter.buildAreasResponse([area], { geostore, coverage });
                } catch (e) {
                    logger.error(e);
                    ctx.throw(e.status, 'Error while retrieving area\'s template');
                }
            } catch (e) {
                logger.error(e);
                ctx.throw(e.status, 'Error while creating area');
            }
        }
        ctx.body = {
            data
        };
    }

}

const isAuthenticatedMiddleware = async (ctx, next) => {
    logger.info(`Verifying if user is authenticated`);
    const { query, body } = ctx.request;

    const user = { ...(query.loggedUser ? JSON.parse(query.loggedUser) : {}), ...body.loggedUser };

    if (!user || !user.id) {
        ctx.throw(401, 'Unauthorized');
        return;
    }
    await next();
};

router.get('/area', isAuthenticatedMiddleware, ForestWatcherRouter.getUserAreas);
router.post('/area', isAuthenticatedMiddleware, AreaValidator.validateCreation, ForestWatcherRouter.createArea);

module.exports = router;
