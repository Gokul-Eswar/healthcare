import os
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:3000")

        # 1. Verify AI-assisted triage
        page.click('a[data-page="triage"]')
        page.click('#add-patient-button')

        # Fill out the form
        page.fill('input[name="name"]', 'Test Patient')
        page.fill('input[name="age"]', '50')
        page.select_option('select[name="gender"]', 'Male')
        page.fill('input[name="complaint"]', 'Severe headache and dizziness')
        page.fill('input[name="vitals"]', 'BP: 160/100')

        # Submit the form
        page.click('button[type="submit"]')

        # Wait for the new patient to appear in the list
        expect(page.locator('p:has-text("Test Patient")')).to_be_visible()

        # 2. Verify AI-powered scheduling
        page.click('a[data-page="scheduling"]')
        page.click('#generate-schedule-button')

        # Wait for the schedule to be generated and displayed
        expect(page.locator('h3:has-text("Monday")')).to_be_visible()

        # Take a screenshot of the generated schedule
        screenshot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ai_features_verification.png')
        page.screenshot(path=screenshot_path)

        browser.close()
        print(f"Screenshot saved to {screenshot_path}")

if __name__ == "__main__":
    run()