def extract_video_id(youtube_url: str) -> str | None:
    """Pulls the video id out of common YouTube URL formats."""
    if "v=" in youtube_url:
        return youtube_url.split("v=")[1].split("&")[0]
    if "youtu.be/" in youtube_url:
        return youtube_url.split("youtu.be/")[1].split("?")[0]
    return None


def thumbnail_url(video_id: str, quality: str = "hqdefault") -> str:
    return f"https://img.youtube.com/vi/{video_id}/{quality}.jpg"