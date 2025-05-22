const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const postController = require("../controllers/postController");
const requireLogin = require("../middleware/requireLogin");

// Multer 셋팅
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../uploads"); // 업로드 파일 저장경로
    // 폴더가 없으면 폴더를 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    // 업로드 파일 저장경로 설정
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 한글 파일명 인코딩 변환
    const encodingName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    // 고유 파일명 생성
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(encodingName); // 확장자 추출
    const baseName = path.basename(encodingName, ext); // 확장자를 제외한 파일명
    const savedName = baseName + "-" + uniqueSuffix + ext; // 서버에 저장될 파일명 완성
    file.encodingName = encodingName; // file 객체에 커스텀 프로퍼티 추가
    cb(null, savedName);
  },
});

// 파일 확장자 필터 정의(프론트 js에서 유효성검사하게 하고 삭제예정)
const fileFilter = (req, file, cb) => {
  // 허용되는 파일 확장자
  const allowedFileTypes = [".jpg", ".jpeg", ".png", ".pdf"];
  // 파일의 확장자와 허용된 확장자를 비교
  if (allowedFileTypes.includes(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type")); // 유효하지 않은 파일 형식
  }
};

// Multer 설정: 사용자 정의 스토리지를 설정하고 파일 크기 제한 및 파일 필터링 적용
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB 크기 제한
  fileFilter: fileFilter,
});
//////////////////////////// 라우팅 시작 ///////////////////////////////

// 게시판 리스트
router.get('/ideas', postController.getPost);

// 아이디어 등록 페이지 이동동
router.get('/submit_idea', requireLogin, function(req, res, next) {
  res.render('submit_idea');
});

// 게시글 등록을 POST 방식으로 처리 (파일 업로드 포함) - JWT 미들웨어 추가
router.post("/submit_idea", upload.array("files", 5), postController.createPost);

// 답글 제출
router.post("/submit_answer", upload.array("files", 5), postController.createAnswer);

// 게시물상세
router.get('/idea_detail', requireLogin, postController.ideaDetail);

// 파일 다운로드
router.get("/download/:file_id", postController.downloadFile);

// 댓글 작성
router.post("/add_comment", requireLogin, postController.addComment);
// 댓글 조회
router.get("/get_comments", postController.getComments);
// 댓글 수정 
router.put("/edit_comment", requireLogin, postController.editComment);
// 댓글 삭제 
router.delete("/delete_comment", requireLogin, postController.removeComment);
// 추천
router.post("/like", requireLogin, postController.likePost);
// 추천 여부 확인
router.get("/like_status", requireLogin, postController.getLikeStatus);
//인기,최신 게시글
router.get("/recent_posts", postController.getRecentPosts);
router.get("/popular_posts", postController.getPopularPosts);


module.exports = router;
