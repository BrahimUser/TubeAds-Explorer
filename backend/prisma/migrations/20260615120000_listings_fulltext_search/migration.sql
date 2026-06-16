-- Full-text search index for listing autocomplete (title, category, description).
ALTER TABLE `listings`
  ADD FULLTEXT INDEX `listings_search_fulltext_idx` (`title`, `category`, `description`);
