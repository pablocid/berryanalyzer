var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var fs = require('fs');
var Polygon = require('polygon');
var getImageOutline = require('image-outline');
var q = require('q');
var centroid = require('polygon-centroid');

class BerryAnalyzer {

    constructor(id, path, folderPath, resolution) {
        this.resolution = resolution || 700;
        this.id = id;
        this.path = path;
        this.folder = folderPath;

        execSync(`convert ${path} ${this.folder}/${this.id}.png`);
        execSync(`./IMScript ${this.folder}/${id}.png tmp ${id} ${this.resolution}`);
        this.objects = this.getObjects();

        for (var index = 1; index < this.objects.length; index++) {
            var l = this.objects[index];
            l.path = `${this.folder}/${this.id}.${l.id}.object.png`;
            execSync(`./IMSeparateObj ${this.folder}/${this.id}.monochrome.png ${l.position.x} ${l.position.y} ${this.folder} ${this.id} ${l.id}`);
            execSync(`convert ${this.folder}/${this.id}.${l.id}.object.png -fuzz 20 -transparent Black ${this.folder}/${this.id}.${l.id}.object.png`);
        }
    }

    getResult() {
        var qarray = [];

        for (var i = 1; i < this.objects.length; i++) {
            let el = this.objects[i];
            qarray.push(this.getOutLine(el));
        }
        return q.all(qarray).then(x => {
            this.colors = this.getColors();
            this.eraseTmpFiles();
            let ref = this.objects.filter(x => x.isReference)[0]
            if(!ref){ return r}
            this.objects.map(r => {
                r.reference = ref.area;
                return r;
            })
            
            return x;
        });
    }

    getOutLine(el) {
        var deffered = q.defer();
        getImageOutline(`${this.folder}/${this.id}.${el.id}.object.png`, (err, polygon) => {
            if (err) {
                console.log(err);
                deffered.reject(); 
                return; 
            }
            el.polygon = new Polygon(polygon);
            el.fixAngle();
            deffered.resolve();
        });
        return deffered.promise;
    }

    getObjects() {
        return fs
            .readFileSync(`${this.folder}/${this.id}.objects.txt`, 'utf8')
            .split("\n").filter(x => x)
            .map(x => x.trim())
            .map(x => { return x.split(/(\s+)/).map(x => x.trim()).filter(x => x); })
            .map(x => {
                if (!x.legth === 4 || isNaN(parseInt(x[3]))) { return; }
                let cx = parseInt(x[2].split(',')[0]);
                let cy = parseInt(x[2].split(',')[1])
                return {
                    area: x[3],
                    x: cx,
                    y: cy
                }
            })
            .filter(x => x)
            .map((x, i) => new Berry({ x: x.x, y: x.y }, i, x.area));
    }
    getColors(){
        let c =  fs
            .readFileSync(`${this.folder}/${this.id}.dominantcolors.txt`, 'utf8')
            .split("\n").filter(x => x)
            .map(x => x.trim())
            //.map(x => { return x.split(/(\s+)/).map(x => x.trim()).filter(x => x); })
            .map(x => x.substring(x.indexOf('#'),x.indexOf('#')+7))
        c.shift();
        return c;

    }
    eraseTmpFiles() {
        exec(`rm tmp/${this.id}*`);
    }

}

module.exports = BerryAnalyzer;


class Berry {
    constructor(position, id, area) {
        this.position = position;
        this.id = id;
        this._angle;
        this.pixArea = area;
    }

    set reference(value) {
        this.ref = Math.sqrt(value);
    }
    get reference() {
        if (!this.ref) { return 1; }
        return this.ref;
    }

    get angle() { return this._angle; }
    set angle(value) { this._angle = value }
    get rad() { return this._angle * (Math.PI / 180); }

    get polygon() { return this._polygon; }
    set polygon(value) { this._polygon = value }

    get area() {
        if (!this._polygon) { return; }
        let a = this._polygon.area();
        if (a < 0) { a *= -1 }
        return a;
    }
    get width() {
        if (!this._polygon) { return; }
        return this._polygon.aabb().w;
    }
    get height() {
        if (!this._polygon) { return; }
        return this._polygon.aabb().h;
    }
    get centroid() {
        if (!this._polygon) { return; }
        return centroid(this._polygon.toArray().map(p => {
            return {
                x: p[0],
                y: p[1]
            }
        }));
        //return this._polygon.center();
    }
    get propWH() {
        if (!this._polygon) { return; }
        return this.width / this.height;
    }
    get propCentroid() {
        if (!this._polygon) { return; }

        let dCent = this.centroid.y - this._polygon.aabb().y;
        //if ((this.height / 2) < dCent) {dCent = this.height - dCent;}

        let r = dCent / this.height;
        if (r < 0.5) { r = 1 - r; }
        return r;
    }
    get propSqArea() {
        if (!this._polygon) { return; }
        return this.area / (this.width * this.height)
    }
    get propEllipseArea() {
        return this.area / (Math.PI * this.width * this.height / 4)
    }
    get propCircleArea() {
        return this.area / (Math.PI * this.width * this.width / 4);
    }

    get isReference() {
        if (this.propWH <= 1 && this.propWH > 0.999) {
            return true;
        }
        return false;
    }

    get sqArea() {
        return this.width * this.height;
    }

    sqAreaClone(clone) {
        return clone.aabb().w * clone.aabb().h;
    }

    fixAngle() {
        var minArea;
        var mv=0;
        var degree=0;

        var clone = this.polygon.clone();
        for (var e = 0; e < 360; e++) {
            var rad = (Math.PI / 180);

            if (e === 0) { rad = 0 }
            mv+=rad;

            clone.rotate(rad, this.polygon.center());
            let area = this.sqAreaClone(clone);
            if (!minArea) { minArea = area; degree = mv;  }

            if (area < minArea) { minArea = area; }
        }

        this.polygon.rotate(degree, this.polygon.center());
        if (clone.aabb().w > clone.aabb().h) {
            this.polygon.rotate( (Math.PI / 2), this.polygon.center());
        }
    }

    get realWidth() {
        return this.width / this.reference;
    }
    get realHeigth() {
        return this.height / this.reference;
    }

    get realArea (){
        return this.area / Math.pow(this.reference,2)
    }


}