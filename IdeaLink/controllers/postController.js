const multer = require('multer');
const path = require('path');
const postModel = require('../models/postModel');
const postFileModel = require('../models/postFileModel');

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 최대 파일 크기 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('파일 형식은 이미지(JPG, PNG) 또는 PDF만 허용됩니다.'));
    }
    cb(null, true);
  }
});

exports.uploadFiles = (req, res, next) => {
  upload.array('files')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// 게시글 등록 및 파일 처리
exports.createPost = async (req, res, next) => {
  const { user_id, title, summary, content, category_id, transaction_type, price } = req.body;
  const files = req.files;

  try {
    // 게시글 정보 DB에 저장
    const post = await postModel.insertPost({ user_id, title, summary, content, category_id, transaction_type, price });

    // 파일 정보 DB에 저장
    if (files && files.length > 0) {
      for (let file of files) {
        await postFileModel.insertPostFile({
          post_id: post.insertId, //이부분 isertId 왜 쓰는지??? post.post_id아닌가??
          user_id: req.body.user_id,
          file_type: file.mimetype,
          file_path: file.path
        });
      }
    }

    // 게시글 상세 페이지로 리다이렉트
    res.redirect(`/post/${post.insertId}`);
  } catch (err) {
    console.error('게시글 등록 오류:', err);
    res.status(500).send('게시글 등록 실패');
  }
};
