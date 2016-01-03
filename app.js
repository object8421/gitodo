var express = require('express');
var app = express();
var fs = require('fs'); // this engine requires the fs module
var iconv = require('iconv-lite')
var marked = require('marked')
var router = express.Router();

app.engine('ntl', function (filePath, options, callback) { // define the template engine
  fs.readFile(filePath, function (err, content) {
    if (err) return callback(new Error(err));
    // this is an extremely simple template engine
    var rendered = content.toString().replace('#html#', ''+ options.html +'')
    return callback(null, rendered);
  })
});
app.set('views', './views'); // specify the views directory
app.set('view engine', 'ntl'); // register the template engine

app.use(express.static('public'));

router.param('task_name', function (req, res, next, task_name) {
  // Support local file
  req.task = "./tasks/" + task_name + '.md'
  next()
})

router.route('/tasks/:task_name')
.all(function(req, res, next) {
  // runs for all HTTP verbs first
  // think of it as route specific middleware!
  next();
})
.get(function(req, res, next) {
  console.log(req.task);
  var rs = fs.createReadStream(req.task)
  var data = ""
  var chunks = []
  var size = 0

  rs.on("data", function (chunk) {
    chunks.push(chunk)
    size += chunk.length
  })

  rs.on("end", function () {
    var buf = Buffer.concat(chunks, size)
    var str = iconv.decode(buf, 'utf8')
    res.render('index', {html: marked(str)})
  })
})

app.use(router)

app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
