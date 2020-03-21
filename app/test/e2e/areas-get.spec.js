/* eslint-disable no-unused-vars,no-undef */
const chai = require('chai');

const { getTestServer } = require('./utils/test-server');

chai.should();

const requester = getTestServer();

describe('Get areas tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    // TODO: this probably should return an error, as this endpoint is useless without a login
    it('Get all areas without being logged in should return a 200 and no data', async () => {
        const response = await requester.get(`/api/v1/forest-watcher/area`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });
});
