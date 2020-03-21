/* eslint-disable import/no-dynamic-require */
const fs = require('fs');

const routersPath = `${__dirname}/routes`;
const logger = require('logger');
const mount = require('koa-mount');

/**
 * Load routers
 */
module.exports = (() => {

    const loadAPI = (app, path, pathApi) => {
        const routesFiles = fs.readdirSync(path);
        let existIndexRouter = false;
        routesFiles.forEach((file) => {
            const newPath = path ? (`${path}/${file}`) : file;
            const stat = fs.statSync(newPath);
            if (!stat.isDirectory()) {
                if (file.lastIndexOf('.router.js') !== -1) {
                    if (file === 'index.router.js') {
                        existIndexRouter = true;
                    } else {
                        logger.debug('Loading route %s, in path %s', newPath, pathApi);
                        if (pathApi) {
                            app.use(mount(pathApi, require(newPath).middleware()));
                        } else {
                            app.use(require(newPath).middleware());
                        }
                    }
                }
            } else {
                // is folder
                const newPathAPI = pathApi ? (`${pathApi}/${file}`) : `/${file}`;
                loadAPI(app, newPath, newPathAPI);
            }
        });
        if (existIndexRouter) {
            // load indexRouter when finish other Router
            const newPath = path ? (`${path}/indexRouter.js`) : 'indexRouter.js';
            logger.debug('Loading route %s, in path %s', newPath, pathApi);
            if (pathApi) {
                app.use(mount(pathApi, require(newPath).middleware()));
            } else {
                app.use(require(newPath).middleware());
            }
        }
    };

    const loadRoutes = (app) => {
        logger.debug('Loading routes...');
        loadAPI(app, routersPath);
        logger.debug('Loaded routes correctly!');
    };

    return {
        loadRoutes
    };

})();
