function EmptyState({ title, description, action }) {
  return (
    <section className="empty-state-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </section>
  );
}

export default EmptyState;
