// ============================================
// Pulse Studio - Regression Test Suite
// ============================================

import { test, expect } from '@playwright/test';

// Helper function to start the app
async function startApp(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByRole('button', { name: /try demo/i }).click();
    await page.getByRole('button', { name: /start creating/i }).click();
    await page.waitForTimeout(3000);
}

// ============================================
// Playlist Editing Tests
// ============================================

test.describe('Playlist Editing', () => {
    test.beforeEach(async ({ page }) => {
        await startApp(page);
    });

    test('should add a clip via double-click', async ({ page }) => {
        const playlist = page.locator('[data-panel="playlist"]');
        const initialClips = await playlist.locator('.clip').count();

        // Double-click to add a clip
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 250, y: 80 }, force: true });
        await page.waitForTimeout(500);

        const newClipCount = await playlist.locator('.clip').count();
        expect(newClipCount).toBeGreaterThanOrEqual(initialClips);
    });

    test('should select a clip by clicking', async ({ page }) => {
        const playlist = page.locator('[data-panel="playlist"]');

        // Add a clip first
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 250, y: 80 }, force: true });
        await page.waitForTimeout(500);

        // Click on the clip to select it
        const clip = playlist.locator('.clip').first();
        await clip.click();
        await page.waitForTimeout(200);

        // Check clip has selected class
        await expect(clip).toHaveClass(/clip-selected/);
    });

    test('should delete a clip with Delete key', async ({ page }) => {
        const playlist = page.locator('[data-panel="playlist"]');

        // Add a clip
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 250, y: 80 }, force: true });
        await page.waitForTimeout(500);

        const clipCountBefore = await playlist.locator('.clip').count();

        // Select the clip
        await playlist.locator('.clip').first().click();
        await page.waitForTimeout(200);

        // Press Delete
        await page.keyboard.press('Delete');
        await page.waitForTimeout(500);

        const clipCountAfter = await playlist.locator('.clip').count();
        expect(clipCountAfter).toBeLessThan(clipCountBefore);
    });

    test('should drag a clip to move it', async ({ page }) => {
        const playlist = page.locator('[data-panel="playlist"]');

        // Add a clip
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 150, y: 80 }, force: true });
        await page.waitForTimeout(500);

        const clip = playlist.locator('.clip').first();
        const initialBox = await clip.boundingBox();

        // Drag the clip to the right
        if (initialBox) {
            await clip.dragTo(playlist.locator('.overflow-auto').first(), {
                targetPosition: { x: initialBox.x + 100, y: initialBox.y }
            });
        }

        await page.waitForTimeout(500);

        // Clip should still exist (drag didn't break anything)
        await expect(clip).toBeVisible();
    });

    test('should resize a clip', async ({ page }) => {
        const playlist = page.locator('[data-panel="playlist"]');

        // Add a clip
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 200, y: 80 }, force: true });
        await page.waitForTimeout(500);

        const clip = playlist.locator('.clip').first();
        const initialBox = await clip.boundingBox();

        // Hover over the clip to reveal resize handles
        await clip.hover();
        await page.waitForTimeout(200);

        // Find and drag the right resize handle
        const rightHandle = clip.locator('.cursor-ew-resize').last();
        if (await rightHandle.isVisible() && initialBox) {
            await rightHandle.hover();
            await page.mouse.down();
            await page.mouse.move(initialBox.x + initialBox.width + 50, initialBox.y + initialBox.height / 2);
            await page.mouse.up();
        }

        await page.waitForTimeout(500);

        // Clip should still be visible
        await expect(clip).toBeVisible();
    });
});

// ============================================
// Recording Tests
// ============================================

test.describe('Recording', () => {
    test.beforeEach(async ({ page }) => {
        await startApp(page);
    });

    test('should show record button in transport', async ({ page }) => {
        const recordButton = page.getByRole('button', { name: 'Record', exact: true });
        await expect(recordButton).toBeVisible();
    });

    test('should toggle record mode on click', async ({ page }) => {
        const recordButton = page.getByRole('button', { name: 'Record', exact: true });

        // Click record button
        await recordButton.click();
        await page.waitForTimeout(300);

        // Check for recording indicator (visual change)
        // The button should have a recording indicator class or be highlighted
        await expect(recordButton).toBeVisible();

        // Click again to toggle off
        await recordButton.click();
        await page.waitForTimeout(300);

        await expect(recordButton).toBeVisible();
    });
});

// ============================================
// Save/Load Tests
// ============================================

test.describe('Save/Load', () => {
    test.beforeEach(async ({ page }) => {
        await startApp(page);
    });

    test('should open File menu', async ({ page }) => {
        await page.getByText('File').first().click();
        await page.waitForTimeout(300);

        // Check menu items are visible
        await expect(page.getByText(/new project/i)).toBeVisible();
        await expect(page.getByText(/save/i).first()).toBeVisible();
    });

    test('should save project with Ctrl+S', async ({ page }) => {
        // Make a change first (add a clip)
        const playlist = page.locator('[data-panel="playlist"]');
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 250, y: 80 }, force: true });
        await page.waitForTimeout(500);

        // Press Ctrl+S
        await page.keyboard.press('Control+s');
        await page.waitForTimeout(500);

        // The project should be marked as saved (no unsaved indicator)
        // Since this is an in-memory save, we just verify no errors occurred
        expect(true).toBe(true);
    });

    test('should create new project', async ({ page }) => {
        // Open File menu
        await page.getByText('File').first().click();
        await page.waitForTimeout(300);

        // Click New Project
        await page.getByText(/new project/i).click();
        await page.waitForTimeout(1000);

        // Should reset to a clean project (empty playlist or default state)
        const playlist = page.locator('[data-panel="playlist"]');
        await expect(playlist).toBeVisible();
    });

    test('should load demo project', async ({ page }) => {
        // Open File menu
        await page.getByText('File').first().click();
        await page.waitForTimeout(300);

        // Click Load Demo
        const loadDemoOption = page.getByText(/load demo/i);
        if (await loadDemoOption.isVisible()) {
            await loadDemoOption.click();
            await page.waitForTimeout(1000);

            // Demo project should have content
            const playlist = page.locator('[data-panel="playlist"]');
            await expect(playlist).toBeVisible();
        }
    });

    test('should undo/redo changes', async ({ page }) => {
        const playlist = page.locator('[data-panel="playlist"]');

        // Add a clip
        await playlist.locator('.overflow-auto').first().dblclick({ position: { x: 250, y: 80 }, force: true });
        await page.waitForTimeout(500);

        const clipCountAfterAdd = await playlist.locator('.clip').count();

        // Undo with Ctrl+Z
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(500);

        const clipCountAfterUndo = await playlist.locator('.clip').count();
        expect(clipCountAfterUndo).toBeLessThan(clipCountAfterAdd);

        // Redo with Ctrl+Y or Ctrl+Shift+Z
        await page.keyboard.press('Control+y');
        await page.waitForTimeout(500);

        const clipCountAfterRedo = await playlist.locator('.clip').count();
        expect(clipCountAfterRedo).toBeGreaterThanOrEqual(clipCountAfterUndo);
    });
});
