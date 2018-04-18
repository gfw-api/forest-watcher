const logger = require('logger');
const nock = require('nock');
const request = require('superagent').agent();
const BASE_URL = require('./test.constants').BASE_URL;
require('should');

describe('E2E test', () => {

    before(() => {
        /* Get user areas */
        it('Get fw user areas', async() => {
            let response = null;
            try {
                response = await request.get(`${BASE_URL}/forest-watcher/area`).send();
            } catch (e) {
                logger.error(e);
            }
            response.status.should.equal(200);
            // response.body.should.have.property('data').and.be.a.Array();
            // response.body.should.have.property('links').and.be.a.Object();
        });
    })

    after(() => {});
});
