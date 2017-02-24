'use strict';
var execSync = require('child_process').execSync;
var IndexModel = require('../models/index');
var BA = require('../models/BerryAnalyzer');
var FA = require('../services/fixAngle');

var exec = require('child_process').exec;
var fs =
    module.exports = function(router) {

        var model = new IndexModel();

        router.get('/', function(req, res) {


            res.render('index', model);


        });
        router.post('/upload-image', function(req, res) {
            var date = new Date();
            var analysis = new BA(date.getTime(), req.files.picture.path, 'tmp', 1200);

            analysis.getResult().then(uu => {
                res.status(200).json({
                    colors: analysis.colors,
                    objects: analysis.objects.map(x => {
                        return {
                            pos: x.position,
                            identifier: x.id,
                            angle: x.angle,
                            propWH: x.propWH,
                            propSqArea: x.propSqArea,
                            propCentroid: x.propCentroid,
                            propEllipseArea: x.propEllipseArea,
                            propCircleArea: x.propCircleArea,
                            realWidth: x.realWidth,
                            realHeigth: x.realHeigth,
                            realArea: x.realArea,
                            isReference: x.isReference
                        }
                    })
                });
            });


        });

        router.get('/takepicture', function(req, res) {
            execSync(`raspistill --timeout 1 -o ${__dirname}/hola.jpg `);
            res.sendFile(`${__dirname}/hola.jpg`);
            //res.status(200).json({ area: objeto.polygon.area(), p: objeto.polygon.aabb() });

        });

        router.get('/test', function(req, res) {
            var objeto = new FA('tmp/1486755533624.11.object.png');

            objeto.getOutLine().then(x => {
                res.status(200).json({ area: objeto.polygon.area(), p: objeto.polygon.aabb() });
            });

        });

    };