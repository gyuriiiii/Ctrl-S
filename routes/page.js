const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

router.use((req, res, next) => {
  //전역변수
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  res.locals.likerIdList = req.post
  next();
});

router.get('/profile', isLoggedIn, async(req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      where: {
        UserId: req.user.dataValues.id
      },
      order: [['createdAt', 'DESC']],
    });

    console.log("레큐유저는?",req.user.dataValues.id)
    res.render('profile', {
      title: 'Profile - prj-name',
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
  //res.render('profile', { title: 'Profile - prj-name' });
})

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: 'Join to - prj-name' });
});

router.get('/twit', isLoggedIn, (req, res) => {
  res.render('twit', { title: 'twit to - prj-name' });
});

router.get('/closeModal',(req ,res) => {
  res.render('closeModal',{ title: 'twit to - prj-name'});
});


// 메인 페이지(게시글)
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        attributes: ['id', 'nick'],
      },{
        model: User,
        attributes : ['id', 'nick'],
        as : 'Liker',
      }],
      order: [['createdAt', 'DESC']],
    });
    res.render('main', {
      title: 'prj-name',
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{
         model: User },{
          model: User,
          attributes : ['id', 'nick'],
          as : 'Liker',
        }
        ] });
    }

    return res.render('main', {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
