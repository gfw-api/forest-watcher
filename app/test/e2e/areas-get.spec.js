const chai = require('chai');
const nock = require('nock');
const { USERS } = require('./utils/test.constants');

const { getTestServer } = require('./utils/test-server');
const { mockGetUserFromToken } = require('./utils/helpers');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

const requester = getTestServer();

describe('Get areas', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    it('Get all areas without being logged in should return a 401 error', async () => {
        const response = await requester.get(`/api/v1/forest-watcher/area`);

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('Unauthorized');
    });

    it('Get all areas while being logged in should...', async () => {
        mockGetUserFromToken(USERS.USER);

        nock(process.env.CT_URL)
            .get(`/v1/area/fw/${USERS.USER.id}`)
            .reply(200, {
                data: [
                    {
                        type: 'area',
                        id: '5d81f3d93031150014abebd5',
                        attributes: {
                            name: 'Portugal',
                            application: 'rw',
                            userId: USERS.USER.id,
                            createdAt: '2019-09-18T09:07:37.799Z',
                            image: '',
                            datasets: [],
                            use: {},
                            iso: {}
                        }
                    },
                    {
                        type: 'area',
                        attributes: {
                            name: 'Brazil',
                            application: 'rw',
                            geostore: 'd653e4fc0ed07a65b9db9b13477566fe',
                            userId: USERS.USER.id,
                            createdAt: '2019-12-02T14:57:41.332Z',
                            image: '',
                            datasets: [],
                            use: {},
                            iso: {}
                        },
                        id: '5de52665327d630010c3200b'
                    }
                ]
            });

        const geostoreAttributes = {
            geojson: {
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: []
                        }
                    }
                ],
                crs: {},
                type: 'FeatureCollection'
            },
            hash: '713899292fc118a915741728ef84a2a7',
            provider: {},
            areaHa: 9202327.64353375,
            bbox: [
                -31.2681922912597,
                30.0301990509033,
                -6.18914222717285,
                42.1543159484863
            ],
            lock: false,
            info: {
                use: {},
                name: 'Portugal',
                iso: 'PRT'
            }
        };

        nock(process.env.CT_URL)
            .get(`/v1/geostore/d653e4fc0ed07a65b9db9b13477566fe`)
            .reply(200, {
                data: {
                    type: 'geoStore',
                    id: '713899292fc118a915741728ef84a2a7',
                    attributes: geostoreAttributes
                }
            });

        const coverageAttributes = {
            layers: [
                'umd_as_it_happens'
            ]
        };

        nock(process.env.CT_URL)
            .get(`/v1/coverage/intersect?geostore=d653e4fc0ed07a65b9db9b13477566fe&slugs=umd_as_it_happens`)
            .reply(200, {
                data: {
                    type: 'coverages',
                    attributes: coverageAttributes
                }
            });

        const response = await requester
            .get(`/api/v1/forest-watcher/area`)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(1);

        response.body.data[0].should.have.property('type').and.equal('area');
        response.body.data[0].should.have.property('attributes').and.be.an('object');
        response.body.data[0].attributes.should.have.property('geostore').and.deep.equal({ ...geostoreAttributes, id: geostoreAttributes.hash });
        response.body.data[0].attributes.should.have.property('coverage').and.deep.equal(coverageAttributes.layers);

    });
});
