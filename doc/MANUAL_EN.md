# kb-storm User Manual

[中文版本](../MANUAL.md) | **English Version**

## Table of Contents

1. [Overview](#overview)
2. [Interface Navigation](#interface-navigation)
3. [Basic Operations](#basic-operations)
   - [Card Operations](#card-operations)
   - [Connection Operations](#connection-operations)
   - [Selection Operations](#selection-operations)
   - [History Operations](#history-operations)
4. [Advanced Features](#advanced-features)
   - [Layout Options](#layout-options)
   - [Import/Export](#importexport)
   - [Free Connection Mode](#free-connection-mode)
   - [Style Customization](#style-customization)
   - [Clipboard Operations](#clipboard-operations)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [FAQ](#faq)
7. [Troubleshooting](#troubleshooting)

## Overview

kb-storm (keyboard storm) is a keyboard-centric mind visualization tool specifically designed to improve the efficiency of thinking and organizing ideas. It combines the advantages of mind maps and whiteboards, allowing you to quickly create and manage content through keyboard shortcuts, reducing distractions from mouse operations. This manual will guide you through using various features of kb-storm, from basic operations to advanced features.

## Interface Navigation

kb-storm's interface is designed to be clean and intuitive, consisting of the following main parts:

- **Top Toolbar**: Contains common operation buttons such as create card, undo/redo, copy/paste, etc.
- **Infinite Canvas Area**: Main workspace for creating and organizing cards
- **Bottom-right Zoom Controls**: Used to adjust the canvas zoom level

### View Operations

- **Zoom Canvas**: Use mouse wheel, or press Ctrl+ +/- keys
- **Reset View**: Press Ctrl+0 to reset canvas zoom and position

## Basic Operations

### Card Operations

#### Creating Cards

- **Using Shortcuts**: Press `Alt+Enter` (default, customizable in shortcut settings)
- **Through Toolbar**: Click the "New Card" button on the toolbar
- **Double-click Canvas**: Double-click on an empty area of the canvas

#### Editing Cards

- **Select and Press Enter**: Select a card and press Enter to enter edit mode
- **Double-click Card**: Double-click a card to directly enter edit mode (currently inactive)
- **Complete Editing**: Press `Ctrl+Enter` or Esc to finish editing

#### Moving Cards

- **Keyboard Arrow Keys**: Use arrow keys to move after selecting a card
- **Large Movement**: Hold `Shift` + arrow keys for large movements
- **Mouse Drag**: Directly drag cards with the mouse
- **Grid Alignment**: Hold Alt key while dragging to align to grid

#### Deleting Cards

- **Delete Key**: Press Delete/Backspace after selecting a card
- **Toolbar Button**: Click the "Delete" button on the toolbar after selecting a card

#### Resizing and Styling

- **Auto Resize**: Card size automatically adjusts when content changes
- **Color Adjustment**: Select card color in the right properties panel
- **Font Adjustment**: Adjust font size and style in the right properties panel

### Connection Operations

#### Creating Connections

1. **Using Keyboard Shortcuts**:
   - Select a card
   - Press `I` to enter connection mode
   - Use arrow keys to select target card
   - Press Enter to confirm connection

2. **Quick Create Connected Card**:
   - Select a card
   - Press `Ctrl+Arrow Key` to create a new card in the specified direction and auto-connect

3. **Free Connection Mode**:
   - Click the "Free Connection" button on the toolbar
   - Press and hold left mouse button on the starting card
   - Drag to the target card
   - Release mouse button to complete connection
   - **Note: Both start and end points must be on cards**

#### Editing Connection Labels

- Select a connection line and press Enter to enter edit mode
- Input label content and press Enter to confirm
- Adjust label style in the right properties panel

#### Deleting Connections

- Select a connection line and press Delete key
- When deleting a card, all related connections are automatically deleted

#### Adjusting Connection Styles

- Select connection line style (solid, dashed, etc.) in the right properties panel
- Adjust connection line color
- Choose connection arrow style (one-way, two-way, no arrow)

### Selection Operations

#### Selecting Cards

- **Directional Selection**: Press Tab+Arrow keys to select cards in specific directions
- **Multi-select**: Hold Ctrl or Shift while clicking multiple cards (currently inactive)
- **Select All**: Press Ctrl+A to select all cards
- **Box Selection**: Press and drag left mouse button in empty area to create selection box

#### Selecting Connection Lines

- **Switch Selection Mode**: Press Tab+Space to switch to connection line selection mode
- **Cycle Selection**: Press Tab in connection line selection mode to cycle through connections
- **Click Selection**: Directly click on connection lines

### History Operations

- **Undo**: Press Ctrl+Z to undo recent operations
- **Redo**: Press Ctrl+Shift+Z or Ctrl+Y to redo undone operations
- **History Records**: System automatically saves your operation history, allowing multiple undo and redo

## Advanced Features

### Import/Export

#### Export Features

kb-storm supports multiple export formats:

1. **Markdown Export**:
   - Click "Export as Markdown" button in toolbar
   - Mind map content is converted to Markdown format
   - Metadata is preserved for future import to restore complete canvas

2. **Mermaid Export**:
   - Click "Export as Mermaid Code" button in toolbar
   - Suitable for use on platforms supporting Mermaid (like GitHub, GitLab)

3. **PNG Image Export**:
   - Click "Export as PNG Image" button in toolbar
   - Save current view as high-quality image

#### Import Features

1. **Markdown Import**:
   - Click "Import Markdown" button in toolbar
   - Paste Markdown content or upload file
   - Supports importing previously exported Markdown files with metadata for complete mind map restoration

2. **Mermaid Import**:
   - Click "Import Mermaid" button in toolbar
   - Paste Mermaid code or upload file
   - Automatically parse and create corresponding cards and connections

### Markdown Import Format

When importing using markdown format, you can use markdown files exported with metadata for complete mind map restoration. You can also directly upload markdown files, but note:

1. Titles are optional
2. Separate cards with "---", which will automatically create related cards after upload
3. Try not to upload complex markdown files

### Free Connection Mode

Free connection mode allows you to directly draw connection lines with the mouse:

1. Click the "Free Connection" button in the toolbar
2. Press and hold left mouse button on the starting card
3. Drag to the ending card
4. Release left mouse button to complete connection

Note: Both start and end points must be on cards and cannot be the same card.

### Style Customization

#### Card Styles

- **Color Themes**: Choose from preset color themes
- **Custom Colors**: Select custom background and text colors for cards
- **Border Styles**: Adjust card border thickness and style
- **Shadow Effects**: Enable or disable card shadows, adjust shadow depth

#### Connection Line Styles

- **Line Styles**: Choose solid, dashed, dotted lines, etc.
- **Line Colors**: Customize connection line colors
- **Arrow Styles**: Select different arrow styles and sizes
- **Curve Types**: Straight lines, curves, polylines, and other connection methods

### Clipboard Operations

#### Copy and Paste

- **Copy Cards**: Press Ctrl+C after selecting cards
- **Cut Cards**: Press Ctrl+X after selecting cards
- **Paste Cards**: Press Ctrl+V to paste previously copied cards
- **Copy Format**: Press Ctrl+Shift+C after selecting cards to copy style only
- **Apply Format**: Press Ctrl+Shift+V after selecting target cards to apply copied style

#### Batch Operations

- **Batch Copy**: Copy after selecting multiple cards
- **Batch Paste**: Paste multiple cards while maintaining relative positions
- **Copy Connection Relationships**: Copy connections between cards together

## Keyboard Shortcuts

kb-storm provides rich keyboard shortcuts, which are key to improving productivity:

You can press Ctrl+K to open the keyboard shortcut settings panel to view and set shortcuts to suit your work habits.

## FAQ

### How do I save my mind map?

kb-storm provides multiple saving methods:
1. Export as Markdown format with complete metadata (recommended)
2. Export as Mermaid flowchart code
3. Export as PNG image
4. Auto-save to local storage

### How do I restore previous mind maps?

Through the "Import Markdown" function, select previously exported Markdown files with metadata to completely restore all cards, connections, and their positions and styles.

### How do I share mind maps between different devices?

Export as Markdown format, then import the file on another device. This ensures all layouts and styles are preserved.
