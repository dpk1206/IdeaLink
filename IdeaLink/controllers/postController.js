const path = require("path");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");
const postlogModel = require("../models/postlogModel");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// 게시글 등록 및 파일 처리
exports.createPost = async (req, res, next) => {
  // JWT 토큰에서 user_id 추출
  const token = req.headers.authorization?.split(" ")[1]; // 'Bearer 토큰'에서 토큰만 추출
  let user_id;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user_id = decoded.user_id; // JWT에서 user_id 추출
    } catch (err) {
      console.error("JWT 토큰 인증 오류:", err);
      return res.status(401).send("인증 실패. 다시 로그인해주세요.");
    }
  } else {
    return res.status(401).send("로그인 필요");
  }

  const { title, summary, content, category_id, transaction_type, price } = req.body;
  const parsedCategoryId = Array.isArray(category_id) ? category_id[0] : category_id;

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
        files.map((file) => postFileModel.insertFile(file, post_id))
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
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id,
      post_log_event: "CREATE_POST",
      post_log_ip: clientIp,
    });

    // 리다이렉트
    res.redirect(`/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    res.status(500).send("게시글 등록 실패");
  }
};

exports.downloadFile = async (req, res, next) => {
  const file_id = req.params.file_id;
  const fileInfo = await postFileModel.selectOneFile(file_id);
  console.log("결과", fileInfo);

  if (!fileInfo) {
    return res.status(404).send("파일 정보를 찾을 수 없습니다.");
  }

  const { file_path, original_name } = fileInfo;

  res.download(file_path, original_name, (err) => {
    if (err) {
      res.status(404).send("파일을 찾을 수 없습니다.");
    }
  });
};
