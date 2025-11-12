# Flow Builder User Guide

Welcome to the Flow Builder! This guide will help you use all the features effectively.

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Your First Flow](#creating-your-first-flow)
3. [Import & Export Flows](#import--export-flows)
4. [Uploading Media Files](#uploading-media-files)
5. [Canvas Navigation](#canvas-navigation)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is Flow Builder?
Flow Builder is a visual tool for creating automated WhatsApp message flows. You can:
- Design conversation flows with drag-and-drop
- Add media (images, videos, audio, documents)
- Create conditional logic
- Export and share your flows
- Import flows from other users

### System Requirements
- **Browser**: Chrome 90+, Firefox 88+, or Safari 14+
- **Internet**: Required for file uploads
- **Account**: Login required to save flows to database

---

## Creating Your First Flow

### Step 1: Add Nodes to Canvas
1. Look at the **left sidebar** - you'll see different node types
2. **Drag a node** from the sidebar onto the canvas
3. **Drop it** wherever you want

**Available Node Types**:
- 📩 **On Message**: Triggers when a message is received
- 💬 **Send Message**: Sends a text message
- 📸 **Send Media**: Sends images, videos, documents, or audio
- ❓ **Ask Question**: Prompts user for input
- ⏰ **Delay**: Waits before continuing
- 🔀 **Condition**: Creates branching logic
- And many more!

### Step 2: Configure Nodes
1. **Click on any node** on the canvas
2. A **configuration panel** appears on the right
3. Fill in the required information
4. The node updates automatically

### Step 3: Name Your Flow
1. Click on **"Untitled Flow"** at the top
2. Type your flow name
3. Select a category from the dropdown

### Step 4: Save Your Flow
1. Click the **blue "Save Flow"** button in the top right
2. Wait for confirmation message
3. Your flow is now saved to the database!

---

## Import & Export Flows

### Exporting a Flow

**Purpose**: Save your flow as a file to share with others or back up

**Steps**:
1. Click the **"Export"** button in the top toolbar
2. A JSON file will download automatically
3. File name format: `FlowName_timestamp.json`
4. You'll see a confirmation with node count

**What Gets Exported**:
- ✅ Flow name and category
- ✅ All nodes and their configurations
- ✅ Node positions on canvas
- ✅ Current zoom level
- ✅ Timestamp and version info

**Important Notes**:
- ⚠️ You must have at least one node to export
- ⚠️ Export creates a snapshot at that moment
- ✅ Files are typically 1-50 KB in size

### Importing a Flow

**Purpose**: Load a flow from a JSON file

**Steps**:
1. Click the **"Import"** button in the top toolbar
2. Select your JSON file from your computer
3. Wait for the processing message
4. Your flow appears on the canvas!

**What Happens During Import**:
- ✅ File is validated for correct format
- ✅ Nodes are reconstructed on canvas
- ✅ Flow gets a new unique name (with "_copy_date")
- ✅ You can continue editing immediately

**Import Rules**:
- 📁 Only `.json` files are accepted
- 📏 Maximum file size: 10 MB
- 🔄 Both v1.0 and v2.0 formats supported
- ✨ Automatically fixes missing node positions

**Troubleshooting Import**:
| Problem | Solution |
|---------|----------|
| "Invalid file type" | Make sure file ends with `.json` |
| "File too large" | Flow files should be under 10MB |
| "Invalid JSON format" | File may be corrupted, try exporting again |
| "No valid nodes found" | File may be from incompatible version |

---

## Uploading Media Files

### Overview
You can upload images, videos, audio files, and documents to use in your flows.

### How to Upload Media

**Method 1: Click to Upload**
1. Open a **Send Media** node configuration
2. Select your **media type** (Image, Video, Audio, or Document)
3. **Click anywhere** in the dashed upload box
4. Choose your file from the picker
5. Wait for upload to complete

**Method 2: Drag and Drop**
1. Open a **Send Media** node configuration
2. Select your **media type**
3. **Drag your file** from your computer
4. **Drop it** into the dashed upload box
5. Upload begins automatically!

**Visual Feedback**:
- 🟦 Blue background when hovering
- 🟧 Orange border when dragging over
- 📊 Progress bar shows upload status
- ✅ Success message when complete

### Supported File Types

#### Images
- **Formats**: JPG, JPEG, PNG, GIF, SVG, WEBP
- **Max Size**: 5 MB
- **Best Use**: Profile pictures, products, infographics

#### Videos
- **Formats**: MP4, 3GP, MOV, AVI
- **Max Size**: 16 MB
- **Best Use**: Product demos, tutorials, announcements

#### Audio
- **Formats**: MP3, OGG, AAC, AMR, WAV
- **Max Size**: 16 MB
- **Best Use**: Voice messages, music, podcasts

#### Documents
- **Formats**: PDF, DOC, DOCX, XLS, XLSX, TXT
- **Max Size**: 100 MB
- **Best Use**: Manuals, price lists, contracts

### Alternative: Media URL
Instead of uploading, you can provide a direct URL:
1. Scroll past the upload area
2. Find the **"Media URL"** field
3. Paste a publicly accessible URL
4. Add an optional caption

**URL Requirements**:
- ✅ Must start with `https://`
- ✅ Must be publicly accessible
- ✅ Should point directly to the media file

### Troubleshooting Upload

| Problem | Solution |
|---------|----------|
| "File too large" | Compress your file or choose a smaller one |
| "Invalid file type" | Check the supported formats list above |
| "Upload failed" | Check your internet connection |
| "Bucket not found" | Contact system administrator |

---

## Canvas Navigation

### Bottom Toolbar Controls

At the bottom of the canvas, you'll find powerful navigation tools:

```
[📍 Info] | [➖ Zoom Out] [100%] [➕ Zoom In] | [⟲ Reset] | [💡 Hints]
```

#### Node Counter
- Shows how many nodes are on your canvas
- Updates in real-time as you add/remove nodes

#### Zoom Controls

**Zoom Out Button (➖)**
- Click to zoom out by 10%
- Minimum zoom: 30%
- Tooltip: "Zoom Out (Ctrl + Scroll Down)"

**Zoom Percentage Display**
- Shows current zoom level (e.g., "100%")
- **Click it** to instantly reset to 100%
- Updates as you zoom

**Zoom In Button (➕)**
- Click to zoom in by 10%
- Maximum zoom: 300%
- Tooltip: "Zoom In (Ctrl + Scroll Up)"

**Reset Pan Button (⟲)**
- Click to center your canvas view
- Useful when you've panned far away

### Keyboard Shortcuts

#### Zooming
- **Ctrl + Scroll Up**: Zoom in
- **Ctrl + Scroll Down**: Zoom out
- Works smoothly with mouse or trackpad

#### Panning (Moving the Canvas)
- **Ctrl + Left Click + Drag**: Pan the canvas
- **Shift + Left Click + Drag**: Pan the canvas (alternative)
- Move large flows easily without scrolling

### Tips for Navigation

**Working with Large Flows**:
1. Zoom out to see the whole flow (30%-50%)
2. Use Ctrl+Click to pan around
3. Zoom in on specific areas to edit (150%-200%)

**Finding Lost Nodes**:
1. Click the Reset Pan button
2. Zoom out to 50%
3. Look for your nodes near the center

**Smooth Zooming**:
- Hold Ctrl and scroll gradually for smooth zoom
- Click the percentage display for instant reset
- Use button clicks for precise 10% increments

---

## Advanced Features

### Node Duplication
1. Click the **copy icon** on any node
2. A duplicate appears nearby
3. Drag it to your desired position

### Node Deletion
1. Click the **trash icon** on any node
2. Node is removed immediately
3. Connections are also removed

### Fullscreen Mode
1. Click the **fullscreen icon** in top toolbar
2. Canvas expands to full screen
3. Press ESC or click icon again to exit

---

## Best Practices

### Organizing Your Flow
- 📍 Space nodes evenly (300px apart works well)
- 🎨 Group related nodes together
- ➡️ Flow left-to-right or top-to-bottom
- 🏷️ Use clear, descriptive names

### Before Exporting
- ✅ Test your flow configuration
- ✅ Give it a meaningful name
- ✅ Add a category for easy finding
- ✅ Check all nodes are configured

### Media Upload Tips
- 📁 Organize files in folders before uploading
- 🖼️ Use compressed images to save space
- 🎬 Keep videos under 10MB when possible
- 📝 Add captions to clarify media purpose

---

## Troubleshooting

### General Issues

**Canvas is blank**
- Check if you're logged in
- Try refreshing the page
- Clear browser cache

**Nodes won't drag**
- Make sure you're clicking on the node itself
- Try clicking and holding for 1 second before dragging
- Check if another node is selected

**Changes not saving**
- Look for the "Saving..." indicator
- Check your internet connection
- Make sure you're logged in

**Zoom is too sensitive**
- Use button clicks instead of scroll
- Scroll more slowly with Ctrl held
- Reset zoom to 100% and start over

### Performance Issues

**Canvas is laggy**
- Reduce zoom level
- Close other browser tabs
- Reload the page
- Check if you have 50+ nodes (consider splitting into multiple flows)

**Upload is slow**
- Check your internet speed
- Try compressing your file
- Use URL method instead for large files

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| **Ctrl + Scroll** | Zoom in/out |
| **Ctrl + Click + Drag** | Pan canvas |
| **Shift + Click + Drag** | Pan canvas (alternative) |
| **ESC** | Exit fullscreen |

---

## Getting Help

### Error Messages
All error messages in Flow Builder are designed to be clear and actionable. Read them carefully - they usually tell you exactly what to fix!

### Contact Support
If you encounter an issue not covered in this guide:
1. Check the browser console (F12) for errors
2. Take a screenshot of the issue
3. Note what you were doing when it happened
4. Contact your system administrator

---

## Tips from Power Users

💡 **"I export my flows weekly as backup!"** - Sarah M.

💡 **"Drag-and-drop for uploads saves so much time"** - James T.

💡 **"Ctrl+Scroll zoom is a game changer for big flows"** - Maria R.

💡 **"I keep my flows under 20 nodes for better performance"** - David K.

💡 **"Reset pan button saves me when I get lost"** - Emma L.

---

## Quick Start Checklist

**Your First 5 Minutes**:
- [ ] Drag a node onto the canvas
- [ ] Click it to open configuration
- [ ] Name your flow
- [ ] Try zooming in and out
- [ ] Save your flow

**Getting Comfortable**:
- [ ] Import a sample flow
- [ ] Upload a test image
- [ ] Use Ctrl+Click to pan around
- [ ] Export your flow
- [ ] Try keyboard shortcuts

**Becoming a Pro**:
- [ ] Create a 10+ node flow
- [ ] Use drag-and-drop upload
- [ ] Master zoom shortcuts
- [ ] Share exported flows with team
- [ ] Organize flows by category

---

## Conclusion

You're now ready to build amazing flows! Remember:
- 🎯 Start simple and add complexity gradually
- 💾 Save and export regularly
- 🔄 Use import to learn from others
- 🎨 Keep your canvas organized
- ⌨️ Master keyboard shortcuts for speed

Happy flow building! 🚀
