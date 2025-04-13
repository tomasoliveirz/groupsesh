#!/usr/bin/env python
"""
Script to compile all translation files.
Run this after updating .po files to generate the .mo files that Flask-Babel uses.
"""

import os
import subprocess
import sys

def compile_translations():
    """Compile all translation files in the translations directory."""
    print("Compiling translation files...")
    
    # Check if pybabel is available
    try:
        subprocess.run(['pybabel', '--version'], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: pybabel command not found. Please make sure Flask-Babel is installed.")
        print("Run: pip install Flask-Babel")
        return False
    
    # Compile translations
    try:
        result = subprocess.run(
            ['pybabel', 'compile', '-d', 'translations', '--statistics'],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        
        # Print statistics
        print("Translation compilation complete!")
        
        # Verify .mo files were created
        verify_mo_files()
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error during translation compilation:")
        print(e.stderr)
        return False

def verify_mo_files():
    """Verify that .mo files exist for each language."""
    print("\nVerifying compiled translation files:")
    
    languages = [
        'en', 'de', 'es', 'fr', 'it', 'pt_PT', 'pt_BR'
    ]
    
    all_valid = True
    for lang in languages:
        mo_path = os.path.join('translations', lang, 'LC_MESSAGES', 'messages.mo')
        
        if os.path.exists(mo_path):
            file_size = os.path.getsize(mo_path)
            print(f"✓ {lang}: OK (size: {file_size} bytes)")
        else:
            print(f"✗ {lang}: MISSING")
            all_valid = False
    
    if all_valid:
        print("\nAll translation files are compiled correctly.")
    else:
        print("\nSome translation files are missing. Check the output above.")

if __name__ == "__main__":
    if not compile_translations():
        sys.exit(1)