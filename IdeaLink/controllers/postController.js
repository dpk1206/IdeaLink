const path = require("path");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");
const postlogModel = require("../models/postlogModel");
const axios = require("axios");

// 파일 유형 필터용 확장자 정의
const DOCUMENT_TYPES = [".pdf", ".doc", ".docx", ".hwp"];
const IMAGE_TYPES = [".png", ".jpg", ".jpeg", ".gif"];


// ✅ 게시글 등록 + 파일 저장 + 워터마크 처리
exports.createPost = async (req, res, next) => {
  const { user_id, title, summary, content, category_id, transaction_type, price } = req.body;
  const parsedCategoryId = Array.isArray(category_id) ? category_id[0] : category_id;

  try {
    // 1. 게시글 저장
    const post_id = await postModel.insertPost({
      user_id,
      title,
      summary,
      content,
      category_id: parsedCategoryId,
      transaction_type,
      price,
    });

    console.log("리턴된 post_id:", post_id);

    // 2. 첨부파일 저장 및 워터마크 요청
    const files = req.files;
    if (files && files.length > 0) {
      const insertFileResult = await Promise.all(
        files.map((file) => postFileModel.insertFile(file, post_id, "post"))
      );

      const options = {
        method: "GET",
        url: "http://localhost:5000/watermark",
        data: { files },
        headers: { "Content-Type": "application/json" },
      };

      const result = await axios(options);
      const wmPathList = result.data.wm_path;

      // 3. 워터마크 경로 저장
      insertFileResult.forEach((result, index) => {
        const insertId = result.insertId;
        const wm_path = wmPathList[index];
        postFileModel.insertWaterMarkFile(insertId, wm_path);
      });
    }

    // 4. 게시글 등록 로그 기록
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id,
      post_log_event: "CREATE_POST",
      post_log_ip: clientIp,
    });

    // 5. 상세 페이지로 리다이렉트
    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    res.status(500).send("게시글 등록 실패");
  }
};


// 게시글 상세조회 + 첨부파일 + 답글 + 조회수 증가
exports.ideaDetail = async (req, res, next) => {
  const post_id = req.query.post_id || req.param("post_id");
  console.log("ideaDetail() → 받은 post_id:", post_id);

  if (!post_id) return next(new Error("post_id가 없습니다."));

  try {
    // 1. 중복 조회 방지용 쿠키
    const cookieName = `viewed_${post_id}`;
    if (!req.cookies[cookieName]) {
      await postModel.increaseViewCount(post_id);
      res.cookie(cookieName, true, { maxAge: 1000 * 60 * 60 });
    }

    // 2. 게시글 및 첨부파일 조회
    const postInfo = await postModel.selectOnePost(post_id);
    const files = await postFileModel.selectDetailFile(post_id, "post");

    if (postInfo.length === 0) {
      const err = new Error("해당 게시글을 찾을 수 없습니다.");
      err.status = 404;
      return next(err);
    }

    // 3. 조회 로그 기록
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id: req.session?.user_id || null,
      post_log_event: "VIEW_POST",
      post_log_ip: clientIp,
    });

    // 4. 답글 + 답글 첨부파일 조회
    const result = {
      postInfo: postInfo[0],
      files: files.length > 0 ? files : null,
    };

    const answerInfo = await postModel.selectAnswer(post_id);
    if (answerInfo && answerInfo.length > 0) {
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

    // 5. 최종 렌더링
    console.log("최종 데이터:", result);
    res.render("idea_detail", result);
  } catch (err) {
    next(err);
  }
};


// ✅ 파일 다운로드 처리 (워터마크된 파일 기준)
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


// ✅ 답글 등록 + 파일 첨부 + 워터마크 처리
exports.createAnswer = async (req, res, next) => {
  const { post_id, answer_user_id, title, content } = req.body;

  try {
    // 1. 답글 저장
    const answer_id = await postModel.insertAnswer({
      post_id,
      answer_user_id,
      title,
      content,
    });

    // 2. 파일 처리 + 워터마크
    const files = req.files;
    if (files && files.length > 0) {
      const insertFileResult = await Promise.all(
        files.map((file) => postFileModel.insertFile(file, answer_id, "answer"))
      );

      const options = {
        method: "GET",
        url: "http://localhost:5000/watermark",
        data: { files },
        headers: { "Content-Type": "application/json" },
      };

      const result = await axios(options);
      const wmPathList = result.data.wm_path;

      insertFileResult.forEach((result, index) => {
        const insertId = result.insertId;
        const wm_path = wmPathList[index];
        postFileModel.insertWaterMarkFile(insertId, wm_path);
      });
    }

    // 3. 로그 저장
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id: answer_user_id,
      post_log_event: "CREATE_ANSWER",
      post_log_ip: clientIp,
    });

    // 4. 리다이렉트
    res.redirect(`/post/idea_detail?post_id=${post_id}`);
  } catch (err) {
    console.error("답글 등록 오류:", err);
    next(err);
  }
};


// ✅ 게시글 목록 조회 + 필터 처리
exports.getPost = async (req, res) => {
  try {
    // 1. 파라미터 추출
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sub_id = req.query.sub_id ? parseInt(req.query.sub_id) : null;
    const main_id = req.query.main_id ? parseInt(req.query.main_id) : null;
    const file_filter = req.query.file_type || null;
    const transaction_type = req.query.transaction_type || null;
    const keyword = req.query.keyword || null;
    const search_type = req.query.search_type || null;
    const sort_type = req.query.sort || 'recent';

    // 2. 파일 유형 분류
    let fileTypes = null;
    if (file_filter) {
      const splitTypes = file_filter.split(','); // 다중 선택 가능
      fileTypes = splitTypes.flatMap(type => {
        if (type === "문서") return DOCUMENT_TYPES;
        if (type === "이미지") return IMAGE_TYPES;
        return [];
      });
    }

    // 3. 필터 구성
    const filter = {
      sub_id: Number.isInteger(sub_id) ? sub_id : null,
      main_id: Number.isInteger(main_id) ? main_id : null,
      fileTypes,
      transaction_type: transaction_type === "all" ? null : transaction_type,
      limit,
      offset,
      keyword,
      search_type,
      sort_type,
    };

    // 4. 데이터 조회
    const [posts, totalCount, mainCategoryMap, subCategoryMap] = await Promise.all([
      postModel.getFilteredPosts(filter),
      postModel.getFilteredPostCount(filter),
      postModel.getMainCategoryMap(),
      postModel.getSubCategoryMap(),
    ]);

    // 5. 페이지 렌더링
    const totalPages = Math.ceil(totalCount / limit);
    res.render("ideas", {
      posts,
      currentPage: page,
      totalPages,
      limit,
      mainCategoryMap: mainCategoryMap || {},
      subCategoryMap: subCategoryMap || {},
      selectedTransactionType: transaction_type || 'all',
      transaction_type,
      searchType: req.query.search_type || 'title',
      keyword: req.query.keyword || '',
      main_id,
      sub_id,
      file_type: file_filter,
      sort_type,
    });
  } catch (err) {
    console.error("Error occurred while fetching posts:", err);
    res.status(500).send("서버 오류");
  }
};

// 최근 게시글 N개 조회
exports.getRecentPosts = async (req, res) => {
  try {
    const recentPosts = await postModel.getRecentPosts(); // 최신순 5개 정도
    res.json(recentPosts);
  } catch (err) {
    console.error("최근 게시글 조회 실패:", err);
    res.status(500).send("서버 오류");
  }
};

// 인기 게시글 N개 조회
exports.getPopularPosts = async (req, res) => {
  try {
    const popularPosts = await postModel.getPopularPosts(); // 조회수 순 5개 정도
    res.json(popularPosts);
  } catch (err) {
    console.error("인기 게시글 조회 실패:", err);
    res.status(500).send("서버 오류");
  }
};
