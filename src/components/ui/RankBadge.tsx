interface RankBadgeProps {
  isRanked: boolean;
  position?: number | null;
}

export default function RankBadge({ isRanked, position }: RankBadgeProps) {
  if (!isRanked) {
    return <span className="badge-error">Not Ranked</span>;
  }
  return (
    <span className="badge-success">
      {position ? `#${position}` : "Mentioned"}
    </span>
  );
}
