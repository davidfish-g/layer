#!/usr/bin/env python3
"""
FaceFusion wrapper for face swapping functionality
"""
import os
import sys
import subprocess
import argparse
import tempfile
import shutil

def run_face_swap(source_image_path, target_video_path, output_path):
    """
    Run face swap using FaceFusion
    
    Args:
        source_image_path: Path to the face image to swap
        target_video_path: Path to the target video
        output_path: Path where the output video should be saved
    """
    try:
        # Change to FaceFusion directory
        facefusion_path = os.environ.get('FACEFUSION_PATH', '/opt/facefusion')
        os.chdir(facefusion_path)
        
        # Construct FaceFusion command
        cmd = [
            'python', 'facefusion.py',
            'run',
            '--source', source_image_path,
            '--target', target_video_path,
            '--output', output_path,
            '--headless'
        ]
        
        print(f"Running FaceFusion command: {' '.join(cmd)}")
        
        # Run the command
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        print("FaceFusion completed successfully")
        print(f"Output: {result.stdout}")
        
        if result.stderr:
            print(f"Warnings: {result.stderr}")
            
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"FaceFusion failed with error: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False
    except Exception as e:
        print(f"Unexpected error in FaceFusion: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='FaceFusion wrapper for face swapping')
    parser.add_argument('--source', required=True, help='Path to source face image')
    parser.add_argument('--target', required=True, help='Path to target video')
    parser.add_argument('--output', required=True, help='Path to output video')
    
    args = parser.parse_args()
    
    # Verify input files exist
    if not os.path.exists(args.source):
        print(f"Error: Source image not found: {args.source}")
        sys.exit(1)
        
    if not os.path.exists(args.target):
        print(f"Error: Target video not found: {args.target}")
        sys.exit(1)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Run face swap
    success = run_face_swap(args.source, args.target, args.output)
    
    if success and os.path.exists(args.output):
        print(f"Face swap completed successfully: {args.output}")
        sys.exit(0)
    else:
        print("Face swap failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 