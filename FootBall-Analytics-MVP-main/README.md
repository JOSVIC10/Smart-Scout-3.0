# ⚽ Football Analytics MVP (Powered by YOLO11)

A state-of-the-art computer vision system that analyzes football matches in real-time. Built with the cutting-edge **YOLO11** model, this project performs player tracking, jersey color clustering, and advanced ball possession analysis with occlusion handling.

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python&logoColor=white)
![YOLO11](https://img.shields.io/badge/Model-YOLO11_Large-brightgreen.svg?style=for-the-badge)
![OpenCV](https://img.shields.io/badge/Computer_Vision-OpenCV-orange.svg?style=for-the-badge&logo=opencv&logoColor=white)
![NumPy](https://img.shields.io/badge/Data-NumPy-013243.svg?style=for-the-badge&logo=numpy&logoColor=white)

</div>

---

## 🎞️ Input vs Output

Witness the transformation from raw footage to actionable analytics.

### 1. Raw Input Footage
*Original broadcast video used for inference.*

https://github.com/user-attachments/assets/c13d529e-6fd7-45f5-a305-d5034d39e424

### 2. AI-Processed Output
*Real-time analysis featuring player tracking, team assignment, and possession stats.*

https://github.com/user-attachments/assets/388a236e-f0c5-4f43-b970-582174178a0a

---

## 🚀 Key Modules

This repository is architected with modularity in mind, separating detection, assignment, and analysis logic:

### 1. 🕵️ Advanced Tracking (`/tracker`)
-   **Engine:** Utilizes **YOLO11 Large (`yolo11l.pt`)** for industry-leading detection accuracy.
-   **Function:** Detects players, referees, and the ball, implementing ID persistence to track entities across frames.

### 2. 👕 Team Assignment (`/team_assigner`)
-   **Algorithm:** Uses **K-Means Clustering** (Color Quantization) on player bounding boxes.
-   **Logic:** Automatically separates players into two distinct teams based on jersey pixel histograms, ensuring accurate team attribution even in dynamic lighting.

### 3. ⚽ Ball Possession & Interpolation (`/player_ball_assigner`)
-   **Possession Logic:** Calculates spatial proximity between players and the ball to assign "control" dynamically.
-   **Interpolation Engine:** Handles critical edge cases where the ball is occluded by players. It mathematically interpolates the ball's missing coordinates to maintain a smooth, unbroken trajectory.

---
## 📂 Project Structure

```text
FootBall-Analytics-MVP/
├── player_ball_assigner/   # Logic for ball possession & interpolation
├── team_assigner/          # K-Means clustering for team separation
├── tracker/                # YOLO11 tracking implementation
├── utils/                  # Helper functions for video I/O
├── main.py                 # Original execution script
├── process_video.py        # CLI Service for Smart Scout Integration
├── proj.py                 # Development & testing script
├── yolo11l.pt              # YOLO11 Large model weights
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation

---
## 💻 How to Run (CLI Service)

This module has been adapted to run as an independent CLI service for **Smart Scout 3.0**. 

### 1. Setup Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download Weights
Ensure `yolo11l.pt` is placed in the root of this folder. The script will use it for tracking.

### 3. Run Inference
```bash
python process_video.py --video path/to/your/video.mp4 --output-dir results/
```
The script will output two files in the `results/` folder:
- `annotated_video.mp4`: The video with bounding boxes and trails.
- `telemetry.json`: The analytics data (total possession %, frames analyzed).

### ⚠️ Limitations
- **Processing Time:** This pipeline runs inference **offline**. Processing a video may take longer than the video's actual duration depending on hardware.
- **Hardware Requirements:** It is highly recommended to run this on a machine with a **dedicated GPU** (CUDA support) for reasonable processing times. Running on CPU will be extremely slow.
