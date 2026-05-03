#!/bin/bash
# Extraire les frames de la vidéo (ffmpeg requis)
cd "$(dirname "$0")"

mkdir -p public/frames

for video in public/pessoads.mp4 public/pessoads.webm public/hero-video.webm public/pessora.mp4 pessora.mp4; do
  if [ -f "$video" ]; then
    echo "Vidéo trouvée: $video"
    ffmpeg -i "$video" -vf "fps=12,scale=1920:-1" -q:v 4 public/frames/frame_%04d.jpg
    echo "Frames extraites dans public/frames/ ($(ls public/frames/ 2>/dev/null | wc -l) images)"
    exit 0
  fi
done

echo "Aucune vidéo trouvée. Emplacements vérifiés:"
echo "  - public/pessoads.mp4"
echo "  - public/pessoads.webm"
echo "  - public/hero-video.webm"
echo "  - public/pessora.mp4"
echo "Place ta vidéo dans public/ et relance le script."
exit 1
