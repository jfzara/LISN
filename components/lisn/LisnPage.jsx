// /components/lisn/LisnPage.jsx

import HeaderBlock from "./HeaderBlock";
import VerdictBlock from "./VerdictBlock";
import ScoreBlock from "./ScoreBlock";
import BadgesBlock from "./BadgesBlock";
import RegimeBlock from "./RegimeBlock";
import DimensionsBlock from "./DimensionsBlock";
import EditorialBlock from "./EditorialBlock";
import DeepBlock from "./DeepBlock";

export default function LisnPage({ data }) {
  if (!data) return null;

  return (
    <div className="lisn-layout">
      <HeaderBlock entity={data.entity} meta={data.meta} />

      <div className="lisn-main-grid">
        <div className="lisn-main-column">
          <VerdictBlock verdict={data.verdict} />

          {data.editorial?.short && (
            <EditorialBlock
              title="Lecture"
              text={data.editorial.short}
            />
          )}

          {data.regime && <RegimeBlock regime={data.regime} />}

          {data.score && <DimensionsBlock score={data.score} />}

          {data.editorial?.structural && (
            <EditorialBlock
              title="Lecture structurale"
              text={data.editorial.structural}
            />
          )}

          {data.meta?.mode === "deep" && data.deep && (
            <DeepBlock deep={data.deep} />
          )}
        </div>

        <div className="lisn-side-column">
          {data.score?.global && (
            <ScoreBlock score={data.score.global} />
          )}
          {data.badges && <BadgesBlock badges={data.badges} />}
        </div>
      </div>
    </div>
  );
}