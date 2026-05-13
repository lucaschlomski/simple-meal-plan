const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /b/

Sitemap: https://simple-meal-plan.com/sitemap.xml
`;

export const onRequestGet: PagesFunction = async () => {
  return new Response(ROBOTS_TXT, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  });
};
