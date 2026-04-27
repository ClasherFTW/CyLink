function SkeletonRows({ count = 4 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="skeleton-row" />
      ))}
    </div>
  );
}

export default SkeletonRows;
