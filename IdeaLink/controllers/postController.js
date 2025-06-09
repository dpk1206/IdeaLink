const path = require("path");
const postModel = require("../models/postModel");
const postFileModel = require("../models/postFileModel");
const postlogModel = require("../models/postlogModel");
const bookmarkModel = require("../models/bookmarkModel");
const answerModel = require("../models/answerModel");
const commentModel = require("../models/commentModel");
const likeModel = require("../models/likeModel");
const userModel = require("../models/userModel"); 
const axios = require("axios");

// 파일 유형 필터용 확장자 정의
const DOCUMENT_TYPES = [".pdf", ".doc", ".docx", ".hwp"];
const IMAGE_TYPES = [".png", ".jpg", ".jpeg", ".gif"];

// ✅ 게시글 등록 + 파일 저장 + 워터마크 처리
exports.createPost = async (req, res, next) => {
  const {
    user_id,
    title,
    summary,
    content,
    category_id,
    status,
    price,
  } = req.body;
  const parsedCategoryId = Array.isArray(category_id)
    ? category_id[0]
    : category_id;

  try {
    // 1. 게시글 저장
    const post_id = await postModel.insertPost({
      user_id,
      title,
      summary,
      content,
      category_id: parsedCategoryId,
      status,
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
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
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
    const cookieName = `viewed_${post_id},${req.user.user_id}`;
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

    const post = postInfo[0];

    // 3. 거래완료된 글 열람 권한 확인
    if (post.status === '거래완료') {
      const currentUserId = req.user?.user_id;
      const isSeller = currentUserId === post.user_id;
      const isBuyer = await userModel.hasUserPurchased(currentUserId, post_id);

      if (!isSeller && !isBuyer) {
        return res.status(403).render("access_denied", {
          message: "이 게시물은 거래가 완료되어 열람할 수 없습니다.",
        });
      }
    }

    // 4. 조회 로그 기록
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await postlogModel.createLog({
      post_id,
      user_id: req.user?.user_id || null,
      post_log_event: "VIEW_POST",
      post_log_ip: clientIp,
    });

    // 5. 답글 + 첨부파일 조회
    const answerInfo = await answerModel.selectAnswer(post_id);
    if (answerInfo && answerInfo.length > 0) {
      await Promise.all(
        answerInfo.map(async (answer) => {
          const files = await postFileModel.selectDetailFile(answer.answer_id, "answer");
          if (files && files.length > 0) answer.files = files;
        })
      );
    }

    // 6. 유저 포인트 포함된 정보 병합
    let user = req.user;
    if (user) {
      const pointRow = await userModel.getUserPoint(user.user_id); // { point: 1234 }
      user = { ...user, ...pointRow };
    }

    // 7. 최종 렌더링
    res.render("idea_detail", {
      postInfo: post,
      files: files.length > 0 ? files : null,
      answerInfo: answerInfo || null,
      bookmark: await bookmarkModel.isBookmarked(req.user?.user_id, post_id),
      user // ✅ point 포함된 user 객체 전달
    });
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
    const answer_id = await answerModel.insertAnswer({
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
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
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
    const status = req.query.status || null;
    const keyword = req.query.keyword || null;
    const search_type = req.query.search_type || null;
    const sort_type = req.query.sort || "recent";

    // 2. 파일 유형 분류
    let fileTypes = null;
    if (file_filter) {
      const splitTypes = file_filter.split(","); // 다중 선택 가능
      fileTypes = splitTypes.flatMap((type) => {
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
      status: status === "all" ? null : status,
      limit,
      offset,
      keyword,
      search_type,
      sort_type,
    };

    // 4. 데이터 조회
    const [posts, totalCount, mainCategoryMap, subCategoryMap] =
      await Promise.all([
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
      selectedTransactionType: status || "all",
      status,
      searchType: req.query.search_type || "title",
      keyword: req.query.keyword || "",
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

//추천
exports.likePost = async (req, res) => {
  const { post_id } = req.body;
  const user_id = req.user.user_id;

  const alreadyLiked = await likeModel.hasUserLiked(user_id, post_id);
  if (alreadyLiked) {
    return res.status(400).json({ error: "이미 추천하셨습니다." });
  }

  await likeModel.saveLike(user_id, post_id);
  const count = await likeModel.getLikeCount(post_id);

  res.json({ like_count: count });
};

//추천여부
exports.getLikeStatus = async (req, res) => {
  const { post_id } = req.query;
  const user_id = req.user.user_id;

  try {
    const liked = await likeModel.hasUserLiked(user_id, post_id);
    const likeCount = await likeModel.getLikeCount(post_id);

    res.json({ liked, like_count: likeCount });
  } catch (err) {
    console.error("좋아요 상태 확인 오류:", err);
    res.status(500).json({ error: "상태 확인 실패" });
  }
};

exports.purchaseIdea = async (req, res) => {
  const { post_id } = req.body;
  const user_id = req.user.user_id;

  try {
    console.log("구매 요청:", { post_id, user_id });

    const post = await postModel.getPostPrice(post_id);
    if (!post) {
      console.log("게시물 없음");
      return res.status(404).json({ error: "해당 게시물이 없습니다." });
    }

    const seller_id = post.user_id;

    const user = await userModel.getUserPoint(user_id);
    if (!user) {
      console.log("유저 없음");
      return res.status(404).json({ error: "사용자 정보를 찾을 수 없습니다." });
    }

    if (user.point < post.price) {
      console.log("포인트 부족");
      return res.status(400).json({ error: "포인트가 부족합니다." });
    }

    console.log("포인트 차감 중...");
    await userModel.deductPointFromUser(user_id, post.price);

    console.log("구매자 포인트 로그 삽입 중...");
    await userModel.insertPointLog(user_id, "use", post.price, `아이디어 구매 - post_id: ${post_id}`);

    console.log("판매자 포인트 적립 중...");
    await userModel.addPointToUser(seller_id, post.price);

    console.log("판매자 포인트 로그 삽입 중...");
    await userModel.insertPointLog(seller_id, "charge", post.price, `아이디어 판매 - post_id: ${post_id}`);

    console.log("글 상태 '거래완료'로 변경 중...");
    await postModel.updatePostStatus(post_id, "거래완료");

    console.log("구매 완료");
    return res.json({ success: true });

  } catch (err) {
    console.error("구매 오류:", err);
    return res.status(500).json({ error: "서버 오류 발생" });
  }
};
