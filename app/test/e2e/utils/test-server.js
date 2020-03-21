const nock = require('nock');
const chai = require('chai');
const chaiHttp = require('chai-http');

let requester;

chai.use(chaiHttp);

exports.getTestServer = function getTestServer() {
    if (requester) {
        return requester;
    }

    nock(process.env.CT_URL)
        .post(`/api/v1/microservice`)
        .reply(200);

    const server = require('../../../src/app');
    requester = chai.request(server).keepOpen();

    return requester;
};
