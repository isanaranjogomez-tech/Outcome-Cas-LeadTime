#!/usr/bin/env bash
# Quality check on the exported file itself, not on the project.
set -euo pipefail
F="${1:-out/MUNCAS_PALABRAS_FINAL.mp4}"
OUT="${2:-/tmp/qc-palabras}"
mkdir -p "$OUT"

echo "── container ──────────────────────────────────────────"
ffprobe -v error -show_entries \
  "format=duration,bit_rate,size:stream=index,codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels,bit_rate" \
  -of default=nw=1 "$F"

echo
echo "── loudness (EBU R128) ────────────────────────────────"
ffmpeg -nostdin -hide_banner -nostats -i "$F" -vn \
  -af "loudnorm=I=-14:TP=-1:LRA=9:print_format=summary" -f null - 2>&1 | tail -12

echo
echo "── black / frozen frames ──────────────────────────────"
ffmpeg -nostdin -hide_banner -nostats -i "$F" \
  -vf "blackdetect=d=0.05:pic_th=0.98" -an -f null - 2>&1 | grep -i blackdetect || echo "none"

echo
echo "── silence ────────────────────────────────────────────"
ffmpeg -nostdin -hide_banner -nostats -i "$F" \
  -af "silencedetect=n=-45dB:d=0.9" -vn -f null - 2>&1 | grep -i silence_ || echo "none"

echo
echo "── contact sheet ──────────────────────────────────────"
ffmpeg -nostdin -y -hide_banner -loglevel error -i "$F" \
  -vf "fps=1/4,scale=216:-1,tile=6x3" "$OUT/sheet.png"
echo "$OUT/sheet.png"
