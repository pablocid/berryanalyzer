var fs = require('fs');
var Polygon = require('polygon');
var getImageOutline = require('image-outline');
var q = require('q');
var JIMP = require('jimp');

class FixAngle {

    constructor(url) {
        this.url = url;
    }

    calculate (){
        for (var e = 0; e < 360; e++) {
            var rad = (Math.PI / 180);

            if (e === 0) { rad = 0 }

            this.polygon.rotate(rad, this.polygon.center());
            let rect = this.rectagleArea();
            if (!minArea) { minArea = rect.area; horizontal = rect.isHorizontal() }

            if (rect.area < minArea) {
                angle = e
                minArea = rect.area;
                inclinacion = rad;
                horizontal = rect.isHorizontal()
            }
        }
    }

    rectagleArea() {
        let xmin = false, xmax = false, ymin = false, ymax = false;
        let center = this.polygon.center();
        let area = this.polygon.area();

        for (var i = 0; i < this.polygon.length; i++) {
            let curr = this.polygon.point(i)
            if (!xmin) { xmin = curr.x }
            if (!xmax) { xmax = curr.x }
            if (!ymin) { ymin = curr.y }
            if (!ymax) { ymax = curr.y }

            if (curr.x < xmin) { xmin = curr.x }
            if (curr.x > xmax) { xmax = curr.x }
            if (curr.y < ymin) { ymin = curr.y }
            if (curr.y > ymax) { ymax = curr.y }
        }

        return {
            area: (xmax - xmin) * (ymax - ymin),
            areaPolygon: area,
            width: (xmax - xmin),
            height: (ymax - ymin),
            proportion: (ymax - ymin) / (xmax - xmin),
            propCentroid: function () {
                if (center.y < (ymax - ymin) / 2) {
                    return ((ymax - ymin) - center.y) / (ymax - ymin);
                }
                return center.y / (ymax - ymin)
            },
            isHorizontal: function () {
                if ((xmax - xmin) > (ymax - ymin)) { return true } else { return false; }
            }
        };

    }

    getOutLine() {
        var deffered = q.defer();
        getImageOutline(this.url, (err, p) => {
            if (err) { deffered.reject(); return; }
            this.polygon = new Polygon(p);
            deffered.resolve();
        });
        return deffered.promise;
    }
}



module.exports = FixAngle;