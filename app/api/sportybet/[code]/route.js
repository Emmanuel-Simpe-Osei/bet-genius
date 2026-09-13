export async function GET(request, { params }) {
  const { code } = params;

  try {
    const response = await fetch(
      `https://www.sportybet.com/api/ng/orders/share/${code}`,
      {
        headers: {
          // A bare "Mozilla/5.0" is an obvious bot signal — no real
          // browser ever sends only that. A full, realistic header set
          // (matching what an actual Chrome browser sends, including a
          // Referer pointing at the real share page) is what usually
          // gets past basic bot-protection like Cloudflare.
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `https://www.sportybet.com/ng/share/${code}`,
          Origin: "https://www.sportybet.com",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: `SportyBet returned status ${response.status}` },
        { status: 400 }
      );
    }

    const data = await response.json();

    const matches =
      data?.data?.outcomes?.map((match) => ({
        eventId: match.eventId,
        homeTeam: match.homeTeamName,
        awayTeam: match.awayTeamName,
        status: match.matchStatus,
        odds: match.markets?.[0]?.outcomes?.[0]?.odds || "N/A",
        marketDesc: match.markets?.[0]?.desc || "",
      })) || [];

    return Response.json({ matches });
  } catch (error) {
    console.error("Error fetching SportyBet data:", error);
    return Response.json({ error: "Failed to load booking" }, { status: 500 });
  }
}
