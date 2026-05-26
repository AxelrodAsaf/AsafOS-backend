import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: ["description", "media:content", "media:thumbnail", "enclosure"]
  }
});

const imageFromHtml = (html) => {
  if (!html) {
    return "";
  }

  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? "";
};

const normalizeImageUrl = (url) => {
  if (!url) {
    return "";
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return url;
};

const imageFromItem = (item) =>
  normalizeImageUrl(
    item.enclosure?.url ??
      item["media:content"]?.$.url ??
      item["media:thumbnail"]?.$.url ??
      imageFromHtml(item.content ?? item.contentSnippet ?? item.description ?? "")
  );

export const fetchN12News = async (feedUrl, limit = 10) => {
  if (!feedUrl) {
    throw new Error("N12_RSS_URL is missing.");
  }

  const feed = await parser.parseURL(feedUrl);

  return (feed.items ?? []).slice(0, limit).map((item) => ({
    title: item.title ?? "Untitled article",
    link: item.link ?? "#",
    pubDate: item.pubDate ?? "",
    shortDescription: item.contentSnippet ?? "",
    description: item.content ?? item.description ?? "",
    image: imageFromItem(item)
  }));
};
