const logger = require('logger');
const AreaNotValid = require('errors/areaNotValid.error');

class AreaValidator {

    static async validateCreation(ctx, next) {
        logger.info('Validating area creation');
        ctx.checkBody('name').notEmpty();
        ctx.checkBody('geojson').notEmpty().isJSON();
        ctx.checkFile('image').notEmpty();
        if (ctx.errors) {
            logger.info('Error validating dataset creation');

            throw new AreaNotValid(ctx.errors);
        }
        await next();
    }

}

module.exports = AreaValidator;
