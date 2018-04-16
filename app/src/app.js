const Koa = require('koa');
const logger = require('logger');
const koaLogger = require('koa-logger');
const validate = require('koa-validate');
const config = require('config');
const loader = require('loader');
const convert = require('koa-convert');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const ErrorSerializer = require('serializers/error.serializer');
const koaValidate = require('koa-validate');
const koaBody = require('koa-body')({
    multipart: true,
    jsonLimit: '50mb',
    formLimit: '50mb',
    textLimit: '50mb'
});

const app = new Koa();
validate(app);

app.use(convert(koaBody));

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        let error = err;
        try {
            error = JSON.parse(err);
        } catch (e) {
            logger.error('Error parse');
        }
        ctx.status = error.status || 500;
        logger.error(error);
        ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
        if (process.env.NODE_ENV === 'prod' && this.status === 500) {
            ctx.body = 'Unexpected error';
        }
        ctx.response.type = 'application/vnd.api+json';
    }

});

app.use(koaLogger());

koaValidate(app);
loader.loadRoutes(app);

const instance = app.listen(process.env.PORT, () => {
    ctRegisterMicroservice.register({
        info: require('../microservice/register.json'),
        swagger: require('../microservice/public-swagger.json'),
        mode: (process.env.CT_REGISTER_MODE && process.env.CT_REGISTER_MODE === 'auto') ? ctRegisterMicroservice.MODE_AUTOREGISTER : ctRegisterMicroservice.MODE_NORMAL,
        framework: ctRegisterMicroservice.KOA2,
        app,
        logger,
        name: config.get('service.name'),
        ctUrl: process.env.CT_URL,
        url: process.env.LOCAL_URL,
        token: process.env.CT_TOKEN,
        active: true,
    }).then(() => {}, (err) => {
        logger.error(err);
        process.exit(1);
    });
});
logger.info('Server started in ', process.env.PORT);

module.exports = instance;
