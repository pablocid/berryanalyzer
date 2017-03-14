var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var getImageOutline = require('image-outline');
var Polygon = require('polygon');

var simplify = require('simplify-js');

var turf = require('@turf/turf');


var resAnalysis = 300;
var resolution = 2000;
var borderCrop = 10;
var image = 'flame.r1.bayas.jpg';

var command = `convert ${__dirname}/${image} -resize 300  gif:- | convert - -colorspace gray -auto-level -threshold 50% gif:- |  convert -  -flatten -fill none -draw 'color 0,0 floodfill' - | convert - -fill black -opaque white - | convert - -background white -flatten  - | convert - -morphology Close:5 Rectangle -morphology Erode Rectangle -negate -  |  convert - -morphology  Thinning:-1 Edges - | convert - -monochrome - | convert - -morphology HMT LineEnds txt:- | grep "white" `;

var cmd2 = `convert ${__dirname}/${image} -resize 300  gif:- | convert - -colorspace gray -auto-level -threshold 50% gif:- |  convert -  -flatten -fill none -draw 'color 0,0 floodfill' - | convert - -fill black -opaque white output2.png `;

var cmd3 = `convert ${__dirname}/${image} -resize ${resAnalysis}  gif:- | convert - -colorspace gray -auto-level -threshold 50% gif:- |  convert -  -flatten -fill none -draw 'color 0,0 floodfill' - | convert - -fill black -opaque white - | convert - -background white -flatten  - | convert - -morphology Close Rectangle  -negate -  |  convert - -morphology  Thinning:-1 Edges - | convert - -transparent black output2.png`;

exec(cmd3, function(error, stdout, stderr) {
    if (stderr) {
        console.log(stderr);
        return;
    }

    getCoords();
});





function getCoords(stdout) {

    getImageOutline("output2.png", (err, polygon) => {
        if (err) {
            console.log(err);
            return;
        }
        var pol = new Polygon(polygon).toArray().map(x => {
            return {
                x: x[0],
                y: x[1]
            };
        });

        var simp = simplify(pol, 10, true).map(x => [x.x, x.y]);
        var points = simp.map(x => turf.point(x));
        var featCol = turf.featureCollection(points);
        var convHull = turf.convex(featCol);
        var coordsCorns = convHull.geometry.coordinates[0];
        coordsCorns.pop();
        var coordTranspose = coordsCorns.map(x => ScaleLetter(x[0], x[1], resAnalysis, resolution));
        var cd = CoordDest(resolution);
        var correct = coordTranspose.map((x, i) => {
            return `${x[0]},${x[1]} ${cd[i][0]},${cd[i][1]}`;
        }).join(' ');

        console.log(correct); //end simplify

        // 
        var cmd4 = `convert ${__dirname}/${image} -resize ${resolution} -distort Perspective '${correct}' - | convert - -crop +${borderCrop}+${borderCrop} -crop -${borderCrop}-${borderCrop} output.jpg`
        exec(cmd4, function(err, stdout, stderr) {

            if (stderr) {
                console.log(stderr);
                return;
            }
            console.log('OK')
        });

    });
}


/*
var raw = [
    [42, 22],
    [260, 27],
    [150, 150],
    [29, 197],
    [265, 202],
    [266, 200]
];

var features = raw.map(x => turf.point(x));

var fc = turf.featureCollection(features);

var hull = turf.convex(fc);

//var resultFeatures = points.features.concat(hull);

console.log(hull.geometry.coordinates);
console.log(turf.centroid(hull.geometry));


var bbox = turf.bbox(fc);

var bboxPolygon = turf.bboxPolygon(bbox);

console.log(bboxPolygon.geometry.coordinates);
*/

function Scale(a, b, scale, original) {
    var sx = scale;
    var x = (originalx * a) / scalex;
    var y = (originaly * b) / scaley;

    return x + ' , ' + y;
}

function CoordDest(scale) {
    var w = scale;
    var h = Math.round((w * 8.5) / 11);
    var upleft = [0, 0];
    var downleft = [0, h];
    var downright = [w, h];
    var upright = [w, 0];
    return [upleft, downleft, downright, upright];
}


function ScaleLetter(a, b, scale, original) {
    var sx = scale;
    var sy = (sx * 8.5) / 11;
    var ox = original;
    var oy = (ox * 8.5) / 11;

    var x = (ox * a) / sx;
    var y = (oy * b) / sy;

    return [Math.ceil(x), Math.ceil(y)];
}

/*
exec(command, function(error, stdout, stderr) {
    //console.log(stdout);
    console.log(stderr);
    var c = toJson(stdout);

    //console.log(corners(toJson(stdout)));
});

function toJson(s) {
    return s.split('\n').filter(x => x).map(x => x.split(':')[0].split(',').map(x => parseInt(x)));

}

function corners(coords) {
    var upleft = coords[0];
    var upright = coords[0];
    var downleft = coords[0];
    var downright = coords[0];

    var mamX = coords.sort((a, b) => a[0] + b[0]);
    var left = [mamX[0], mamX[1]];


    var right = [];
    for (var e = 0; e < coords.length; e++) {
        var element = coords[e];

    }

    for (var i = 0; i < coords.length; i++) {
        var coord = coords[i];
        if (upleft[0] > coord[0] && upleft[1] > coord[1]) { upleft = coord; }
        if (upright[0] < coord[0] && upright[1] > coord[1]) { upright = coord; }
        if (downright[0] < coord[0] && downright[1] < coord[1]) { downright = coord; }
        if (downleft[0] > coord[0] && downleft[1] < coord[1]) { downleft = coord; }

    }

    return { upleft, upright, downright, downleft };

}
*/

//echo grapeone.jpg | convert @- -resize 500 - |  convert - -fuzz 20%% -transparent Black png:- | convert - -resize 1000 outpute.png

//var image = fs.createReadStream('./grapeone.jpg');
//var writeStream = fs.createWriteStream('./outpute.jpg');

//var args = ["-", "-resize", "1000", "-"];

//var proc = spawn('convert', args);

//./script/unperspective -a 1.2941176470588236 -d bh -f 30 $FILE $FILE
//var unp = spawn('sh', ['script/unperspective', '-a', '1.2941176470588236', '-d', 'bh', '-f', '30', '-', '-']);

//var unp = spawn('convert', ['-', '-resize', '800', '-']);

//image.pipe(proc.stdin);
//proc.stdout.pipe(unp.stdin);
//unp.stdout.pipe(writeStream);

//var uu = spawn('./script/unperspective', ['-', '-']);
/*
image.pipe(proc.stdin);
proc.stdout.pipe(writeStream);

proc.on('exit', function() {
    exec('./script/unperspective -a 1.2941176470588236 -d bh -f 30 output.jpg output.jpg', function(error, stdout, stderr) {
        console.log(stdout);
    });
});
proc.stderr.on('data', function(buf) {
    console.log('[STR] stderr "%s"', String(buf));
});

*/

/*
getImageOutline("output.gif", (err, polygon) => {
            if (err) {
                console.log(err);
                deffered.reject();
                return;
            }
            el.polygon = new Polygon(polygon);
            el.fixAngle();
            deffered.resolve();
        });

        */