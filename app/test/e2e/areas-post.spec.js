const chai = require('chai');
const nock = require('nock');
const { USERS } = require('./utils/test.constants');

const { getTestServer } = require('./utils/test-server');
const { mockGetUserFromToken } = require('./utils/helpers');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

const requester = getTestServer();

describe('Create area', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    it('Create an area without being logged in should return a 401 error', async () => {
        const response = await requester.post(`/api/v1/forest-watcher/area`);

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('Unauthorized');
    });

    it('Create an area while being logged without a name value should return an error', async () => {
        mockGetUserFromToken(USERS.USER);

        const response = await requester
            .post(`/api/v1/forest-watcher/area`)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('- name: name can not be empty. - geojson: geojson can not be empty. - ');
    });

    it('Create an area while being logged without a geojson value should return an error', async () => {
        mockGetUserFromToken(USERS.USER);

        const response = await requester
            .post(`/api/v1/forest-watcher/area`)
            .field('name', 'TestArea')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('- geojson: geojson can not be empty. - image: file image can not be a empty file. - ');
    });

    it('Create an area while being logged without a valid geojson value should return an error', async () => {
        mockGetUserFromToken(USERS.USER);

        const response = await requester
            .post(`/api/v1/forest-watcher/area`)
            .field('name', 'TestArea')
            .field('geojson', 'potato')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('- geojson: geojson is not a json format. - image: file image can not be a empty file. - ');
    });

    it('Create an area while being logged without an "image" file value should return an error', async () => {
        mockGetUserFromToken(USERS.USER);

        const response = await requester
            .post(`/api/v1/forest-watcher/area`)
            .field('name', 'TestArea')
            .field('geojson', '{}')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('- image: file image can not be a empty file. - ');
    });

    it('Create an area while being logged without a valid "image" file should return an error', async () => {
        mockGetUserFromToken(USERS.USER);

        const response = await requester
            .post(`/api/v1/forest-watcher/area`)
            .field('name', 'TestArea')
            .field('geojson', '{}')
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array');
        response.body.errors[0].should.have.property('detail').and.equal('- image: file image can not be a empty file. - ');
    });

    it('Create an area while being logged with the correct data should return the created area (happy case)', async () => {
        mockGetUserFromToken(USERS.USER);

        const geojson = '{"type":"Polygon","coordinates":[[[80.57519943543053,9.48478783138593],[80.56375534418066,9.473895081628044],[80.57608635341853,9.466049831323232],[80.58481247244907,9.477507223783533],[80.57519943543053,9.48478783138593]]]}';

        const geostoreAttributes = {
            geojson: {
                crs: {},
                type: 'FeatureCollection',
                features: [
                    {
                        geometry: {
                            coordinates: [
                                [
                                    [
                                        80.575199435,
                                        9.484787831
                                    ],
                                    [
                                        80.563755344,
                                        9.473895082
                                    ],
                                    [
                                        80.576086353,
                                        9.466049831
                                    ],
                                    [
                                        80.584812472,
                                        9.477507224
                                    ],
                                    [
                                        80.575199435,
                                        9.484787831
                                    ]
                                ]
                            ],
                            type: 'Polygon'
                        },
                        type: 'Feature',
                        properties: null
                    }
                ]
            },
            hash: '6d6ca469dda60164c31ba5b3181aa254',
            provider: {},
            areaHa: 243.09756747971508,
            bbox: [
                80.563755344,
                9.466049831,
                80.584812472,
                9.484787831
            ],
            lock: true,
            info: {
                use: {}
            },
            id: '6d6ca469dda60164c31ba5b3181aa254'
        };

        nock(process.env.CT_URL)
            .post('/v1/geostore', {
                geojson: {
                    type: 'Polygon',
                    coordinates: [[[80.57519943543053, 9.48478783138593], [80.56375534418066, 9.473895081628044], [80.57608635341853, 9.466049831323232], [80.58481247244907, 9.477507223783533], [80.57519943543053, 9.48478783138593]]]
                },
                lock: true
            })
            .reply(200, {
                data: {
                    type: 'geoStore',
                    id: '6d6ca469dda60164c31ba5b3181aa254',
                    attributes: {
                        geojson: {
                            crs: {},
                            type: 'FeatureCollection',
                            features: [{
                                geometry: {
                                    coordinates: [[[80.575199435, 9.484787831], [80.563755344, 9.473895082], [80.576086353, 9.466049831], [80.584812472, 9.477507224], [80.575199435, 9.484787831]]],
                                    type: 'Polygon'
                                },
                                type: 'Feature',
                                properties: null
                            }]
                        },
                        hash: '6d6ca469dda60164c31ba5b3181aa254',
                        provider: {},
                        areaHa: 243.09756747971508,
                        bbox: [80.563755344, 9.466049831, 80.584812472, 9.484787831],
                        lock: true,
                        info: { use: {} }
                    }
                }
            });

        nock(process.env.CT_URL)
            .get('/v1/coverage/intersect')
            .query({ geostore: '6d6ca469dda60164c31ba5b3181aa254', slugs: 'umd_as_it_happens' })
            .reply(200, { data: { type: 'coverages', attributes: { layers: ['umd_as_it_happens'] } } });

        nock(process.env.CT_URL)
            .post(`/v1/area/fw/${USERS.USER.id}`, (body) => {
                const expectedBody = {
                    name: 'TestArea',
                    geostore: '6d6ca469dda60164c31ba5b3181aa254'
                };

                body.should.have.property('name').and.equal(expectedBody.name);
                body.should.have.property('geostore').and.equal(expectedBody.geostore);
                body.should.have.property('image').and.be.an('object');
                return body.name === expectedBody.name && body.geostore === expectedBody.geostore;
            })
            .reply(200, {
                data: {
                    type: 'area',
                    id: '603f93a13826d00fbb47ecc0',
                    attributes: {
                        name: 'name',
                        application: 'fw',
                        geostore: '6d6ca469dda60164c31ba5b3181aa254',
                        userId: USERS.USER.id,
                        createdAt: '2021-03-03T13:48:17.298Z',
                        updatedAt: '2021-03-03T13:48:17.298Z',
                        image: '',
                        datasets: [],
                        use: {},
                        iso: {}
                    }
                }
            });

        nock(process.env.CT_URL)
            .get('/v1/geostore/6d6ca469dda60164c31ba5b3181aa254')
            .reply(200, {
                data: {
                    type: 'geoStore',
                    id: '6d6ca469dda60164c31ba5b3181aa254',
                    attributes: geostoreAttributes
                }
            });

        nock(process.env.CT_URL)
            .get('/v1/coverage/intersect')
            .query({ geostore: '6d6ca469dda60164c31ba5b3181aa254', slugs: 'umd_as_it_happens' })
            .reply(200, {
                data: { type: 'coverages', attributes: { layers: ['umd_as_it_happens'] } }
            });


        const filename = 'image.png';

        const fileData = Buffer.from('TestFileContent', 'utf8');

        const response = await requester
            .post(`/api/v1/forest-watcher/area`)
            .field('name', 'TestArea')
            .field('geojson', geojson)
            .attach('image', fileData, filename)
            .set('Authorization', `Bearer abcd`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('object');

        response.body.data.should.have.property('type').and.equal('area');
        response.body.data.should.have.property('attributes').and.be.an('object');
        response.body.data.attributes.should.have.property('geostore').and.deep.equal({
            ...geostoreAttributes,
            id: geostoreAttributes.hash
        });
        response.body.data.attributes.should.have.property('coverage').and.deep.equal([
            'umd_as_it_happens'
        ]);

    });
});
