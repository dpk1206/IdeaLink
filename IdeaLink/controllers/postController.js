const path = require("path");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");
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

  try {
    // 게시글 정보 DB에 저장
    const post_id = await postModel.insertPost({
      user_id,
      title,
      summary,
      content,
      category_id,
      transaction_type,
      price,
    });
    console.log("게시글 결과", post_id);
    // 파일 정보 DB에 저장
    const files = req.files;
    if (files && files.length > 0) {
      // 첨부파일 존재 확인
      // Promise.all을 사용하여 파일 배열을 순회
      // 각 파일에 대해 postFileModel.insertFile(file) 비동기 함수를 실행
      // map()은 파일마다 insertFile(file) Promise를 반환하는 배열을 만듭니다.
      // Promise.all은 모든 파일 저장 작업이 완료될 때까지 기다립니다(병렬 처리).
      await Promise.all(
        files.map((file) => postFileModel.insertFile(file))
      ).then(async (insertFileResult) => {
        // promise 마치고 나서 워터마크 처리를 위한 flask 서버에 요청
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

        // 워터마크 처리된 파일을 DB에 저장
        // foreach 반복문으로 배열 순회
        insertFileResult.forEach((result, index) => {
          const insertId = result.insertId;
          const wm_path = wmPathList[index];
          // db insert 메소드
          postFileModel.insertWaterMarkFile(insertId, wm_path);
        });
      });
    }
    // 게시글 상세 페이지로 리다이렉트
    res.redirect(`/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    res.status(500).send("게시글 등록 실패");
  }
};

exports.downloadFile = async (req, res, next) => {
  // DB 파일id로 조회
  const file_id = req.params.file_id;
  const fileInfo = await postFileModel.selectOneFile(file_id);
  console.log("결과", result);
  // 파일 정보가 없는 경우 예외 처리
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
