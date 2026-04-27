function Loader({ label = "Loading", fullscreen = false }) {
  return (
    <div className={fullscreen ? "loader loader--fullscreen" : "loader"}>
      <div className="loader__orb" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export default Loader;
