const express = require('express');
const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { createBrotliCompress } = require('zlib');
const Post = require('../models/post');

const router = express.Router();

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  }
  catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:id/followcancel', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.removeFollowing(parseInt(req.params.id, 10));
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// profiles 폴더 확인 후, 존재하지 않으면 생성
try {
  fs.readdirSync('profiles');
} catch (error) {
  console.error('profiles 폴더가 없어 profiles 폴더를 생성합니다.');
  fs.mkdirSync('profiles');
}

// 프로필 이미지 라우터 구현
const profile = multer({
  storage: multer.diskStorage({ // 이미지 서버에 저장되도록 함
    destination(req, file, cb) { // 저장경로와 파일명 명시
      cb(null, 'profiles/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 파일 최대 용량(byte)
});

// 이미지 업로드 위한 api
// profile의 single 메소드는 하나의 이미지를 업로드 하기 위해 사용함
// POST user/profile 요청
router.post('/profile', isLoggedIn, profile.single('img'), (req, res) => {
  console.log(req.file);
  res.json({ url: `/profile/${req.file.filename}` }); // 저장된 파일에 대한 정보
});

const profile2 = multer();
// POST user/ 요청
router.post('/', isLoggedIn, profile2.none(), async (req, res, next) => { // 업로드(프사 변경) 요청?
  try {
    console.log('업로드 클릭');
    console.log(req.user);
    const user = await User.update({
      profile: req.body.url,
    },
    {
      where:
      {
        id: req.user.id,
      }
    }
    );
    const post = await Post.update({ // 해당 id의 profile 변경(posts 테이블)
      profile: req.body.url,
    },
    {
      where:
      {
        UserId: req.user.id,
      }
    }
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
