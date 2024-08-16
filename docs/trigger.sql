-- 새 일기 작성시 친구들에게 알림
DELIMITER $$
CREATE TRIGGER after_diary_insert
AFTER INSERT ON diary
FOR EACH ROW
BEGIN
    INSERT INTO notification (content, user_id, diary_id, category)
    SELECT 
        CONCAT((SELECT nickname FROM user WHERE id = NEW.user_id), '님이 새로 일기를 작성했습니다.'),
        CASE 
            WHEN NEW.user_id = m.received_user_id THEN m.requested_user_id
            ELSE m.received_user_id
        END,
        NEW.id,
        'diary'
    FROM mate m
    WHERE (NEW.user_id = m.requested_user_id OR NEW.user_id = m.received_user_id) 
      AND m.status = 'accepted';
END$$

-- 일기에 댓글이 달린 경우 작성자에게 알림
DELIMITER $$
CREATE TRIGGER after_comment_insert
AFTER INSERT ON comment
FOR EACH ROW
BEGIN
    INSERT INTO notification (content, user_id, diary_id, category)
    VALUES (
        CONCAT((SELECT nickname FROM user WHERE id = NEW.writter_user_id), '님이 일기에 댓글을 작성했습니다.'),
        (SELECT user_id FROM diary WHERE id = NEW.diary_id),
        NEW.diary_id,
        'diary'
    );
END$$

-- 일기에 좋아요 수가 증가한 경우 작성자에게 알림
DELIMITER $$
CREATE TRIGGER after_likes_update
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    INSERT INTO notification (content, user_id, diary_id, category)
    VALUES (
        CONCAT((SELECT nickname FROM user WHERE id = NEW.user_id), '님이 회원님의 일기를 좋아합니다.'),
        (SELECT user_id FROM diary WHERE id = NEW.diary_id),
        NEW.diary_id,
        'diary'
    );
END$$

-- 멘션했을때 멘션 대상자에게 알림
DELIMITER $$
CREATE TRIGGER after_mention_insert
AFTER INSERT ON comment
FOR EACH ROW
BEGIN
    IF NEW.mentioned_user_id IS NOT NULL THEN
        INSERT INTO notification (content, user_id, diary_id, category)
        VALUES (
            CONCAT((SELECT nickname FROM user WHERE id = NEW.writter_user_id), '님이 회원님을 멘션했습니다.'),
            NEW.mentioned_user_id,
            NEW.diary_id,
            'diary'
        );
    END IF;
END$$

-- 친구 요청이 생성된 경우 친구 요청을 받은 사용자에게 알림
DELIMITER $$
CREATE TRIGGER after_mate_insert
AFTER INSERT ON mate
FOR EACH ROW
BEGIN
    INSERT INTO notification (content, user_id, category)
    VALUES (
        CONCAT((SELECT nickname FROM user WHERE id = NEW.requested_user_id), '님이 회원님에게 친구요청 했습니다.'), 
        NEW.received_user_id, 
        'mate'
    );
END$$

-- 친구 요청이 수락된 경우 친구 요청을 보낸 사용자에게 알림
DELIMITER $$
CREATE TRIGGER after_mate_update
AFTER UPDATE ON mate
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status AND NEW.status = 'accepted' THEN
        INSERT INTO notification (content, user_id, category)
        VALUES (
            CONCAT((SELECT nickname FROM user WHERE id = NEW.received_user_id), '님이 회원님과 친구가 되었습니다.'),
            NEW.requested_user_id,
            'mate'
        );
    END IF;
END$$

-- 친구 요청이 거절된 경우 친구 요청을 보낸 사용자에게 알림
DELIMITER $$
CREATE TRIGGER after_mate_delete
AFTER DELETE ON mate
FOR EACH ROW
BEGIN
    INSERT INTO notification (content, user_id, category)
    VALUES (
        CONCAT((SELECT nickname FROM user WHERE id = OLD.received_user_id), '님이 회원님의 친구요청을 거절했습니다.'),
        OLD.requested_user_id,
        'mate'
    );
END$$
