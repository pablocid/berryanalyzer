var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

//echo grapeone.jpg | convert @- -resize 500 - |  convert - -fuzz 20%% -transparent Black png:- | convert - -resize 1000 outpute.png

var image = fs.createReadStream('./grapeone.jpg');
var writeStream = fs.createWriteStream('./outpute.jpg');

var args = ["-", "-resize", "1000", "-"];

var proc = spawn('convert', args);

//./script/unperspective -a 1.2941176470588236 -d bh -f 30 $FILE $FILE
//var unp = spawn('sh', ['script/unperspective', '-a', '1.2941176470588236', '-d', 'bh', '-f', '30', '-', '-']);

//var unp = spawn('convert', ['-', '-resize', '800', '-']);

//image.pipe(proc.stdin);
//proc.stdout.pipe(unp.stdin);
//unp.stdout.pipe(writeStream);

var uu = spawn('./script/unperspective', ['-', '-']);
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