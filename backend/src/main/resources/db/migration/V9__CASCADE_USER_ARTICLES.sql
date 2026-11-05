ALTER TABLE articles DROP CONSTRAINT fk_articles_user_id__id;
ALTER TABLE articles ADD CONSTRAINT fk_articles_user_id__id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE articletags DROP CONSTRAINT fk_articletags_article_id__id;
ALTER TABLE articletags ADD CONSTRAINT fk_articletags_article_id__id FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE articletags DROP CONSTRAINT fk_articletags_tag_id__id;
ALTER TABLE articletags ADD CONSTRAINT fk_articletags_tag_id__id FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE RESTRICT;
