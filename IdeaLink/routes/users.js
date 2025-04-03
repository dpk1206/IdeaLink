var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 테스트 aaa
router.get('/aaa', function(req, res, next) {
  res.render('aaa', { title: 'Express' });
});

module.exports = router;
