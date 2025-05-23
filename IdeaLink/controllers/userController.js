const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");

// 내가 작성한 게시글 + 답글 + 댓글(예정) 조회
exports.mypage = async (req, res, next) => {
  const user_id = req.user.user_id || null;

  if (!user_id) return next(new Error("user_id가 없습니다."));

  try {
    const myPosts = await postModel.selectMyPost(user_id); // 내가 작성한 게시글
    const myAnswers = await postModel.selectMyAnswer(user_id); // 내가 작성한 답글
    // const myComments = await postModel.selectMyComment(user_id); // 내가 작성한 댓글
    const result ={
      myPosts: myPosts || null,
      myAnswers: myAnswers || null,
      // myComments: myComments || null,
    }
    // 5. 최종 렌더링
    console.log("최종 데이터:", result);
    res.render("mypage", result);
  } catch (err) {
    next(err);
  }
};
