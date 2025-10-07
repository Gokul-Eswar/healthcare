import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the index.html file
        # The script is in jules-scratch/verification, so we need to go up two levels
        # and then into the 'public' directory.
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Construct the path to index.html relative to the script's location
        file_path = os.path.join(current_dir, '..', '..', 'public', 'index.html')
        # Normalize the path to resolve '..'
        abs_path = os.path.normpath(file_path)

        # Use a file:// URL to open the local HTML file
        page.goto(f'file://{abs_path}')

        # Wait for the page to load by checking for a known element
        page.wait_for_selector('h1:has-text("Mycare health")')

        # Take a screenshot
        screenshot_path = os.path.join(current_dir, 'verification.png')
        page.screenshot(path=screenshot_path)

        browser.close()
        print(f"Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    run()