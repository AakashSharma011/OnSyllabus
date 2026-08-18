import { useEffect, useRef, useState } from "react";

let apiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  });
  return apiPromise;
}

export default function VideoPlayer({ resource }) {
  const containerRef = useRef(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let destroyed = false;
    let player = null;
    setBlocked(false);

    if (!resource.youtube_video_id) {
      setBlocked(true);
      return;
    }

    loadYouTubeApi().then(() => {
      if (destroyed) return;
      player = new window.YT.Player(containerRef.current, {
        videoId: resource.youtube_video_id,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onError: () => {
            setBlocked(true);
            window.open(resource.url, "_blank", "noopener,noreferrer");
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (player && player.destroy) player.destroy();
    };
  }, [resource]);

  if (blocked) {
    return (
      <div className="player-fallback">
        <p>This video can't be played here — opening it on YouTube instead.</p>
        <a className="link-muted" href={resource.url} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
      </div>
    );
  }

  return (
    <div className="video-player-frame">
      <div key={resource.id} ref={containerRef} />
    </div>
  );
}