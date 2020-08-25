import express from 'express'

const indexRouter = express.Router();

/* GET home page. */
indexRouter.get('/', function (req, res, next) {
  res.render('index.js', {title: 'Draw app'});
});

// module.exports = indexRouter;

export {indexRouter}