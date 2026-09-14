export async function GET(request, { params }) {
  const { code } = await params;

  try {
    const response = await fetch(
      `https://www.sportybet.com/api/ng/orders/share/${code}`,
      {
        headers: {
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

    // Team names + odds come from SportyBet (odds feed the auto-total,
    // which admin can still edit). Match status is deliberately
    // excluded — that's exclusively admin-set, never scraped.
    const matches =
      data?.data?.outcomes?.map((match) => ({
        eventId: match.eventId,
        homeTeam: match.homeTeamName,
        awayTeam: match.awayTeamName,
        odds: match.markets?.[0]?.outcomes?.[0]?.odds || "N/A",
      })) || [];

    return Response.json({ matches });
  } catch (error) {
    console.error("Error fetching SportyBet data:", error);
    return Response.json({ error: "Failed to load booking" }, { status: 500 });
  }
}
