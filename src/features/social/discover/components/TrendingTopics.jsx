import { Link } from "react-router-dom";

import { ROUTES } from "../../../../app/config/routes";
import { formatCompactNumber } from "../../../../utils/formatNumber";
import { trendingTopics } from "../../feed/data/mock";

export default function TrendingTopics() {
  return (
    <section aria-labelledby="trending-heading">
      <h2 id="trending-heading" className="px-1 text-base font-bold text-ink">
        Trending now
      </h2>

      <ul className="mt-2">
        {trendingTopics.map(({ tag, posts }) => (
          <li key={tag}>
            <Link
              to={`${ROUTES.explore}?q=${encodeURIComponent(`#${tag}`)}`}
              className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-raised"
            >
              <p className="text-sm font-semibold text-ink">#{tag}</p>
              <p className="text-[13px] text-ink-soft">
                {formatCompactNumber(posts)} posts
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
