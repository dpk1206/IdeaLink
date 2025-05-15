const path = require("path");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");
const postlogModel = require("../models/postlogModel");
const axios = require("axios");

// 게시글 등록 및 파일 처리
exports.createPost = async (req, res, next) => {
  const {
    user_id,
    title,
    summary,
    content,
    category_id,
    transaction_type,
    price,
  } = req.body;
  const parsedCategoryId = Array.isArray(category_id)
    ? category_id[0]
    : category_id;

  try {
    // 게시글 정보 DB에 저장
    const post_id = await postModel.insertPost({
      user_id,
      title,
      summary,
      content,
      category_id: parsedCategoryId,
      transaction_type,
      price,
    });
    console.log("게시글 결과", post_id);

    // 파일 처리
    const files = req.files;
    if (files && files.length > 0) {
      // 파일 정보 DB에 저장
      const insertFileResult = await Promise.all(
        files.map((file) => postFileModel.insertFile(file, post_id, "post"))
      );

      // 워터마크 처리 요청 (Flask 서버)
      const options = {
        method: "GET",
        url: "http://localhost:5000/watermark",
        data: {
          files: files,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };

      const result = await axios(options);
      const wmPathList = result.data.wm_path;
      console.log(insertFileResult);
      console.log(wmPathList);

      // 워터마크된 파일 경로 저장
      insertFileResult.forEach((result, index) => {
        const insertId = result.insertId;
        const wm_path = wmPathList[index];
        postFileModel.insertWaterMarkFile(insertId, wm_path);
      });
    }

    // 게시글 등록 로그 저장
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id,
      post_log_event: "CREATE_POST",
      post_log_ip: clientIp,
    });

    // 리다이렉트
    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    res.status(500).send("게시글 등록 실패");
  }
};

// 게시글 상세 컨트롤러
exports.ideaDetail = async (req, res, next) => {
  // DB 파일id로 조회
  const post_id = req.param("post_id");
  if (!post_id) next(new Error("post_id가 없습니다."));
  try {
    const postInfo = await postModel.selectOnePost(post_id); // 게시물 조회
    // 조회 결과가 없으면 404 에러 처리
    if (postInfo.length == 0) {
      const err = new Error("해당 게시글을 찾을 수 없습니다.");
      err.status = 404;
      return next(err);
    }
    const result = {
      // resposne 할 정보
      postInfo: postInfo[0],
    };

    const files = await postFileModel.selectDetailFile(post_id, "post"); // 게시물 첨부파일조회
    if (files && files.length > 0) {
      result.files = files;
    } else {
      result.files = null;
    }

    const answerInfo = await postModel.selectAnswer(post_id); // 해당 답글조회
    if (answerInfo && answerInfo.length > 0) {
      // 모든 답글에 대해 첨부파일을 병렬 조회
      await Promise.all(
        answerInfo.map(async (answer) => {
          const files = await postFileModel.selectDetailFile(answer.answer_id, "answer");
          if (files && files.length > 0) {
            answer.files = files;
          }
        })
      );
      result.answerInfo = answerInfo;
    } else {
      result.answerInfo = null;
    }

    // console.log("최종 데이터:", result);
    res.render("idea_detail", result);
  } catch (err) {
    next(err);
  }
};

exports.downloadFile = async (req, res, next) => {
  const file_id = req.params.file_id;
  const fileInfo = await postFileModel.selectOneFile(file_id);
  console.log("결과", fileInfo);

  if (!fileInfo) {
    return res.status(404).send("파일 정보를 찾을 수 없습니다.");
  }

  const { watermarked_path, original_name } = fileInfo;

  res.download(watermarked_path, original_name, (err) => {
    if (err) {
      res.status(404).send("파일을 찾을 수 없습니다.");
    }
  });
};

// 답글 등록 및 파일 처리
exports.createAnswer = async (req, res, next) => {
  const { post_id, answer_user_id, title, content } = req.body;

  try {
    // 게시글 정보 DB에 저장
    const answer_id = await postModel.insertAnswer({
      post_id,
      answer_user_id,
      title,
      content,
    });

    // 파일 처리
    const files = req.files;
    if (files && files.length > 0) {
      // 파일 정보 DB에 저장
      const insertFileResult = await Promise.all(
        files.map((file) => postFileModel.insertFile(file, answer_id, "answer"))
      );

      // 워터마크 처리 요청 (Flask 서버)
      const options = {
        method: "GET",
        url: "http://localhost:5000/watermark",
        data: {
          files: files,
        },
        headers: {
          "Content-Type": "application/json",
        },
      };

      const result = await axios(options);
      const wmPathList = result.data.wm_path;
      console.log(insertFileResult);
      console.log(wmPathList);

      // 워터마크된 파일 경로 저장
      insertFileResult.forEach((result, index) => {
        const insertId = result.insertId;
        const wm_path = wmPathList[index];
        postFileModel.insertWaterMarkFile(insertId, wm_path);
      });
    }

    // 게시글 등록 로그 저장
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id: answer_user_id,
      post_log_event: "CREATE_ANSWER",
      post_log_ip: clientIp,
    });

    // 리다이렉트
    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("답글 등록 오류:", err);
    next(err);
  }
};
