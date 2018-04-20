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

    static async buildAreasResponse(areas = [], geostoreObj) {
        const promises = [
            Promise.all(areas.map(area => CoverageService.getCoverage(area.attributes.geostore))),
            Promise.all(areas.map(area => (area.attributes.templateId
                ? TemplatesService.getTemplate(area.attributes.templateId)
                : null
            )))
        ];

        if (!geostoreObj) {
            promises.push(Promise.all(areas.map(area => GeoStoreService.getGeostore(area.attributes.geostore))));
        }
        try {
            const data = await Promise.all(promises);
            const [coverageData, templatesData, geostoreData] = data;

            return areas.map((area, index) => {
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
        const { geojson, name } = ctx.request.body.fields;
        const { image } = ctx.request.body.files;
        let data = null;
        if (user && user.id) {
            try {
                const { area, geostore } = await AreasService.createAreaWithGeostore({ name, image }, JSON.parse(geojson), user.id);
                logger.info('Created area', area);
                try {
                    [data] = await ForestWatcherRouter.buildAreasResponse([area.data], geostore);
                } catch (e) {
                    await AreasService.deleteArea(area.id);
                    logger.error(e);
                    ctx.throw(e.status, 'Error while retrieving area\'s template and coverage');
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

router.get('/area', ForestWatcherRouter.getUserAreas);
router.post('/area', ForestWatcherRouter.createArea);

module.exports = router;
