import argparse
import os
import json
import numpy as np
import cv2

from utils.video_utils import read_video, save_video
from tracker.tracker import Tracker
from team_assigner.team_assigner import TeamAssigner
from player_ball_assigner.player_ball_assigner import PlayerBallAssigner

def main():
    parser = argparse.ArgumentParser(description="Process a football video and extract telemetry.")
    parser.add_argument("--video", required=True, help="Path to input video")
    parser.add_argument("--output-dir", required=True, help="Directory to save output files")
    
    args = parser.parse_args()

    input_video_path = args.video
    output_dir = args.output_dir

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    video_name = os.path.basename(input_video_path)
    output_video_path = os.path.join(output_dir, f"annotated_{video_name}")
    telemetry_path = os.path.join(output_dir, "telemetry.json")

    print(f"Reading video from {input_video_path}...")
    video_frames = read_video(input_video_path)

    # Note: Use yolo11l.pt instead of models/best.pt
    print("Initializing tracker...")
    tracker = Tracker('yolo11l.pt')

    print("Tracking objects...")
    # Do not read from stub in production CLI unless specified, we run inference
    tracks = tracker.get_object_tracks(video_frames, read_from_stub=False)

    print("Interpolating ball positions...")
    tracks['ball'] = tracker.interpolate_ball_positions(tracks['ball'])

    print("Assigning teams...")
    team_assigner = TeamAssigner()
    team_assigner.assign_team_color(video_frames[0], tracks['players'][0])

    for frame_num, player_track in enumerate(tracks['players']):
        for player_id, track in player_track.items():
            team = team_assigner.get_player_team(video_frames[frame_num], track['bbox'], player_id)
            tracks['players'][frame_num][player_id]['team'] = team
            tracks['players'][frame_num][player_id]['team_color'] = team_assigner.team_colors[team]

    print("Assigning ball possession...")
    player_assigner = PlayerBallAssigner()
    team_ball_control = []
    
    # TODO: Conectar detección automática de acciones (TFM) aquí o en un módulo posterior
    
    for frame_num, player_track in enumerate(tracks['players']):
        ball_bbox = tracks['ball'][frame_num][1]['bbox'] if 1 in tracks['ball'][frame_num] else None
        
        if ball_bbox:
            assigned_player = player_assigner.assign_ball_to_player(player_track, ball_bbox)
        else:
            assigned_player = -1

        if assigned_player != -1:
            tracks['players'][frame_num][assigned_player]['has_ball'] = True
            team_ball_control.append(tracks['players'][frame_num][assigned_player]['team'])
        else:
            if len(team_ball_control) > 0:
                team_ball_control.append(team_ball_control[-1])
            else:
                team_ball_control.append(None)
                
    team_ball_control_arr = np.array([t for t in team_ball_control if t is not None])

    print("Drawing annotations...")
    output_video_frames = tracker.draw_annotations(video_frames, tracks, team_ball_control)

    print(f"Saving annotated video to {output_video_path}...")
    save_video(output_video_frames, output_video_path)

    print("Calculating possession telemetry...")
    unique_teams = np.unique(team_ball_control_arr)
    possession_stats = {}
    total_frames = len(team_ball_control_arr)
    for t in unique_teams:
        if t is not None:
            frames_t = np.sum(team_ball_control_arr == t)
            possession_stats[str(t)] = (int(frames_t) / int(total_frames)) * 100 if total_frames > 0 else 0

    telemetry_data = {
        "possession": possession_stats,
        "total_frames": int(total_frames),
        # We can add full tracking data here in the future if we want frontend to draw it
        # "tracks": tracks 
    }

    print(f"Saving telemetry to {telemetry_path}...")
    with open(telemetry_path, 'w', encoding='utf-8') as f:
        json.dump(telemetry_data, f, indent=4)

    print("Done!")

if __name__ == '__main__':
    main()
