#!/usr/bin/env python3
"""
MuseTalk wrapper for lip sync functionality
"""
import os
import sys
import subprocess
import argparse
import tempfile
import shutil
import yaml

def create_inference_config(video_path, audio_path, output_path):
    """
    Create a temporary inference configuration file for MuseTalk
    """
    config = {
        'video_path': video_path,
        'audio_path': audio_path,
        'bbox_shift': 0,
        'result_dir': os.path.dirname(output_path)
    }
    
    config_path = tempfile.mktemp(suffix='.yaml')
    with open(config_path, 'w') as f:
        yaml.dump(config, f)
    
    return config_path

def run_lip_sync(video_path, audio_path, output_path):
    """
    Run lip sync using MuseTalk
    
    Args:
        video_path: Path to the input video
        audio_path: Path to the audio file
        output_path: Path where the output video should be saved
    """
    try:
        # Change to MuseTalk directory
        musetalk_path = os.environ.get('MUSETALK_PATH', '/opt/musetalk')
        os.chdir(musetalk_path)
        
        # Create temporary config file
        config_path = create_inference_config(video_path, audio_path, output_path)
        
        # Construct MuseTalk command
        cmd = [
            'python', '-m', 'scripts.inference',
            '--inference_config', config_path,
            '--result_dir', os.path.dirname(output_path)
        ]
        
        print(f"Running MuseTalk command: {' '.join(cmd)}")
        
        # Run the command
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        print("MuseTalk completed successfully")
        print(f"Output: {result.stdout}")
        
        if result.stderr:
            print(f"Warnings: {result.stderr}")
        
        # Clean up temporary config
        if os.path.exists(config_path):
            os.remove(config_path)
            
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"MuseTalk failed with error: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False
    except Exception as e:
        print(f"Unexpected error in MuseTalk: {e}")
        return False
    finally:
        # Clean up temporary config file
        if 'config_path' in locals() and os.path.exists(config_path):
            os.remove(config_path)

def main():
    parser = argparse.ArgumentParser(description='MuseTalk wrapper for lip sync')
    parser.add_argument('--video', required=True, help='Path to input video')
    parser.add_argument('--audio', required=True, help='Path to audio file')
    parser.add_argument('--output', required=True, help='Path to output video')
    
    args = parser.parse_args()
    
    # Verify input files exist
    if not os.path.exists(args.video):
        print(f"Error: Input video not found: {args.video}")
        sys.exit(1)
        
    if not os.path.exists(args.audio):
        print(f"Error: Audio file not found: {args.audio}")
        sys.exit(1)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Run lip sync
    success = run_lip_sync(args.video, args.audio, args.output)
    
    if success:
        print(f"Lip sync completed successfully: {args.output}")
        sys.exit(0)
    else:
        print("Lip sync failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 