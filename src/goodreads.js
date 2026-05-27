import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      "book_id",
      "book_image_url",
      "book_small_image_url",
      "book_medium_image_url",
      "book_large_image_url",
      "author_name",
      "user_rating",
      "user_read_at"
    ]
  }
});

const goodreadsBaseUrl = "https://www.goodreads.com";

const normalizeLink = (link) => {
  if (!link) {
    return "#";
  }

  if (link.startsWith("http://") || link.startsWith("https://")) {
    return link;
  }

  return `${goodreadsBaseUrl}${link}`;
};

const toBookSummary = (item) => ({
  title: item.title ?? "Untitled",
  author: item.author_name ?? "",
  link: normalizeLink(item.link),
  imageUrl:
    item.book_large_image_url ||
    item.book_medium_image_url ||
    item.book_image_url ||
    item.book_small_image_url ||
    "",
  rating: Number(item.user_rating ?? 0),
  readAt: item.user_read_at ?? "",
  pubDate: item.pubDate ?? ""
});

const buildShelfUrl = (userId, shelf) =>
  `${goodreadsBaseUrl}/review/list_rss/${userId}?shelf=${encodeURIComponent(shelf)}`;

const buildAllReviewsUrl = (userId) =>
  `${goodreadsBaseUrl}/review/list_rss/${userId}`;

export const fetchGoodreadsData = async (userId, limit = 25) => {
  if (!userId) {
    throw new Error("GOODREADS_USER_ID is missing.");
  }

  const [currentFeed, allReviewsFeed] = await Promise.all([
    parser.parseURL(buildShelfUrl(userId, "currently-reading")),
    parser.parseURL(buildAllReviewsUrl(userId))
  ]);

  const currentBook = currentFeed.items?.[0] ? toBookSummary(currentFeed.items[0]) : null;
  const ratedBooks = (allReviewsFeed.items ?? [])
    .map(toBookSummary)
    .filter((book) => book.rating > 0)
    .slice(0, limit);

  return {
    currentBook,
    ratedBooks
  };
};
