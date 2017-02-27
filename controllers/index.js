var execSync = require('child_process').execSync;
var IndexModel = require('../models/index');
var BA = require('../models/BerryAnalyzer');
var FA = require('../services/fixAngle');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

module.exports = function(router) {

    var model = new IndexModel();

    router.get('/', function(req, res) {


        res.render('index', model);


    });

    function cors(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    }
    router.get('/picture', cors, function(req, res) {


        res.render('picture');


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
    });

    router.get('/tomafoto', cors, function(req, res) {
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        var args = ["--nopreview", "--timeout", "1", "-o", "-"];

        var keys = Object.keys(req.query);
        console.log(keys);

        if (keys.length) {
            for (var i = 0; i < keys.length; i++) {
                var el = keys[i];
                if (el === 'resize') { continue; }
                args.push('--' + el);
                if (req.query[el] !== '') {
                    args.push(req.query[el]);
                }
            }
        }

        console.log(args);

        var still = spawn('raspistill', args);

        if (req.query.resize) {
            console.log('resizing ...');
            var convert = spawn('convert', ['-', '-resize', req.query.resize, '-']);
            still.stdout.pipe(convert.stdin);
            convert.stdout.pipe(res);
        } else {
            console.log(' no resizing ...');
            still.stdout.pipe(res);
        }

    });

    router.get('/test', function(req, res) {
        var objeto = new FA('tmp/1486755533624.11.object.png');

        objeto.getOutLine().then(x => {
            res.status(200).json({ area: objeto.polygon.area(), p: objeto.polygon.aabb() });
        });

    });

};